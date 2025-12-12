import type { NextApiRequest } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';
import { Server as IOServer } from 'socket.io';
import { AgenticCodingAgent, AgentAction } from '../../src/agent/AgenticCodingAgent';
import { ModelFactory } from '../../src/models/ModelFactory';
import { FileSystemManager } from '../../src/utils/fileSystem';
import { configManager } from '../../src/utils/config';

interface SocketServer extends HTTPServer {
  io?: IOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends Response {
  socket: SocketWithIO;
}

const SocketHandler = (req: NextApiRequest, res: any) => {
  if (res.socket.server.io) {
    console.log('Socket.io already initialized');
    res.end();
    return;
  }

  console.log('Initializing Socket.io...');
  const io = new IOServer(res.socket.server as any, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  res.socket.server.io = io;

  // Track active agents by session
  const agentSessions = new Map<
    string,
    {
      agent: AgenticCodingAgent;
      fileSystem: FileSystemManager;
    }
  >();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Initialize agent for this connection
    socket.on('init_agent', async (data: { model: string; provider: string }) => {
      try {
        const { model, provider } = data;

        const modelConfig = configManager.getModelConfig(provider, model);
        const modelInstance = ModelFactory.createModel(modelConfig);

        const workingDir = process.cwd();
        const fileSystem = new FileSystemManager(workingDir);

        const agent = new AgenticCodingAgent(
          modelInstance,
          fileSystem,
          (action: AgentAction) => {
            // Send action updates in real-time
            socket.emit('agent_action', action);
          }
        );

        agentSessions.set(socket.id, { agent, fileSystem });

        socket.emit('agent_initialized', {
          success: true,
          model,
          provider,
        });
      } catch (error: any) {
        console.error('Agent initialization error:', error);
        socket.emit('error', {
          message: error.message || 'Failed to initialize agent',
        });
      }
    });

    // Handle chat messages
    socket.on('chat_message', async (data: { message: string }) => {
      const session = agentSessions.get(socket.id);

      if (!session) {
        socket.emit('error', { message: 'Agent not initialized' });
        return;
      }

      try {
        socket.emit('chat_start', { message: data.message });

        const response = await session.agent.chat(data.message, (chunk) => {
          // Stream text chunks
          socket.emit('chat_chunk', { content: chunk });
        });

        socket.emit('chat_complete', {
          text: response.text,
          actions: response.actions,
          toolCalls: response.toolCalls,
          toolResults: response.toolResults,
        });
      } catch (error: any) {
        console.error('Chat error:', error);
        socket.emit('chat_error', {
          message: error.message || 'Chat failed',
        });
      }
    });

    // Get conversation history
    socket.on('get_history', () => {
      const session = agentSessions.get(socket.id);
      if (session) {
        socket.emit('history', session.agent.getHistory());
      }
    });

    // Clear conversation history
    socket.on('clear_history', () => {
      const session = agentSessions.get(socket.id);
      if (session) {
        session.agent.clearHistory();
        socket.emit('history_cleared');
      }
    });

    // Get available tools
    socket.on('get_tools', () => {
      const session = agentSessions.get(socket.id);
      if (session) {
        const tools = session.agent.getTools().getToolDefinitions();
        socket.emit('tools', tools);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      agentSessions.delete(socket.id);
    });
  });

  res.end();
};

export default SocketHandler;

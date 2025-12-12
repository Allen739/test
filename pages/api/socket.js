"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const EliteAgenticCodingAgent_1 = require("../../src/agent/EliteAgenticCodingAgent");
const ModelFactory_1 = require("../../src/models/ModelFactory");
const fileSystem_1 = require("../../src/utils/fileSystem");
const config_1 = require("../../src/utils/config");
const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
        console.log('Socket.io already initialized');
        res.end();
        return;
    }
    console.log('Initializing Socket.io...');
    const io = new socket_io_1.Server(res.socket.server, {
        path: '/api/socket',
        addTrailingSlash: false,
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    res.socket.server.io = io;
    // Track active agents by session
    const agentSessions = new Map();
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        // Initialize agent for this connection
        socket.on('init_agent', async (data) => {
            try {
                const { model, provider } = data;
                const modelConfig = config_1.configManager.getModelConfig(provider, model);
                const modelInstance = ModelFactory_1.ModelFactory.createModel(modelConfig);
                const workingDir = process.cwd();
                const fileSystem = new fileSystem_1.FileSystemManager(workingDir);
                const agent = new EliteAgenticCodingAgent_1.EliteAgenticCodingAgent(modelInstance, fileSystem, (action) => {
                    // Send action updates in real-time
                    socket.emit('agent_action', action);
                });
                agentSessions.set(socket.id, { agent, fileSystem });
                socket.emit('agent_initialized', {
                    success: true,
                    model,
                    provider,
                });
            }
            catch (error) {
                console.error('Agent initialization error:', error);
                socket.emit('error', {
                    message: error.message || 'Failed to initialize agent',
                });
            }
        });
        // Handle chat messages
        socket.on('chat_message', async (data) => {
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
            }
            catch (error) {
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
exports.default = SocketHandler;
//# sourceMappingURL=socket.js.map
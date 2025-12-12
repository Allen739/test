import type { NextApiRequest, NextApiResponse } from 'next';
import { CodingAgent } from '../../src/agent/CodingAgent';
import { ModelFactory } from '../../src/models/ModelFactory';
import { FileSystemManager } from '../../src/utils/fileSystem';
import { configManager } from '../../src/utils/config';
import { Message } from '../../src/types';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, model, provider, history = [] } = req.body;

    if (!message || !model || !provider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get model configuration
    const modelConfig = configManager.getModelConfig(provider, model);
    const modelInstance = ModelFactory.createModel(modelConfig);

    // Create agent with file system access
    const workingDir = process.cwd();
    const fileSystem = new FileSystemManager(workingDir);
    const agent = new CodingAgent(modelInstance, fileSystem);

    // Add history to agent
    if (history.length > 0) {
      history.forEach((msg: Message) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          agent['conversationHistory'].push(msg);
        }
      });
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    await agent.chatStream(message, (chunk: string) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const CodingAgent_1 = require("../../src/agent/CodingAgent");
const ModelFactory_1 = require("../../src/models/ModelFactory");
const fileSystem_1 = require("../../src/utils/fileSystem");
const config_1 = require("../../src/utils/config");
exports.config = {
    api: {
        responseLimit: false,
    },
};
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { message, model, provider, history = [] } = req.body;
        if (!message || !model || !provider) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Get model configuration
        const modelConfig = config_1.configManager.getModelConfig(provider, model);
        const modelInstance = ModelFactory_1.ModelFactory.createModel(modelConfig);
        // Create agent with file system access
        const workingDir = process.cwd();
        const fileSystem = new fileSystem_1.FileSystemManager(workingDir);
        const agent = new CodingAgent_1.CodingAgent(modelInstance, fileSystem);
        // Add history to agent
        if (history.length > 0) {
            history.forEach((msg) => {
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
        await agent.chatStream(message, (chunk) => {
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        });
        res.write('data: [DONE]\n\n');
        res.end();
    }
    catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            error: error.message || 'Internal server error',
        });
    }
}
//# sourceMappingURL=chat.js.map
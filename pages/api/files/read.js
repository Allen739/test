"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const fileSystem_1 = require("../../../src/utils/fileSystem");
const path_1 = __importDefault(require("path"));
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { path: filePath } = req.query;
        if (!filePath || typeof filePath !== 'string') {
            return res.status(400).json({ error: 'File path is required' });
        }
        const workingDir = process.cwd();
        const fileSystem = new fileSystem_1.FileSystemManager(workingDir);
        // Security: Ensure the path is within the working directory
        const fullPath = path_1.default.resolve(workingDir, filePath);
        if (!fullPath.startsWith(workingDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const content = await fileSystem.readFile(filePath);
        res.status(200).json({ content });
    }
    catch (error) {
        console.error('File read error:', error);
        res.status(500).json({
            error: error.message || 'Failed to read file',
        });
    }
}
//# sourceMappingURL=read.js.map
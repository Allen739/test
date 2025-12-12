"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
async function buildFileTree(dirPath, basePath, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth)
        return [];
    const nodes = [];
    const entries = await fs_extra_1.default.readdir(dirPath, { withFileTypes: true });
    // Filter out common directories to ignore
    const ignoreDirs = new Set([
        'node_modules',
        '.git',
        '.next',
        'dist',
        'build',
        '.agent-history',
        '.agent-logs',
    ]);
    for (const entry of entries) {
        if (entry.name.startsWith('.') && entry.name !== '.env.example')
            continue;
        if (ignoreDirs.has(entry.name))
            continue;
        const fullPath = path_1.default.join(dirPath, entry.name);
        const relativePath = path_1.default.relative(basePath, fullPath);
        if (entry.isDirectory()) {
            const children = await buildFileTree(fullPath, basePath, maxDepth, currentDepth + 1);
            nodes.push({
                name: entry.name,
                path: relativePath,
                type: 'directory',
                children: children.sort((a, b) => {
                    // Directories first, then files
                    if (a.type !== b.type) {
                        return a.type === 'directory' ? -1 : 1;
                    }
                    return a.name.localeCompare(b.name);
                }),
            });
        }
        else {
            nodes.push({
                name: entry.name,
                path: relativePath,
                type: 'file',
            });
        }
    }
    return nodes.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
}
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const workingDir = process.cwd();
        const fileTree = await buildFileTree(workingDir, workingDir);
        res.status(200).json({ files: fileTree });
    }
    catch (error) {
        console.error('File tree error:', error);
        res.status(500).json({
            error: error.message || 'Failed to load file tree',
        });
    }
}
//# sourceMappingURL=index.js.map
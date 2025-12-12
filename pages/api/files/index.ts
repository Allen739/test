import type { NextApiRequest, NextApiResponse } from 'next';
import { FileSystemManager } from '../../../src/utils/fileSystem';
import path from 'path';
import fs from 'fs-extra';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

async function buildFileTree(
  dirPath: string,
  basePath: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<FileNode[]> {
  if (currentDepth >= maxDepth) return [];

  const nodes: FileNode[] = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

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
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
    if (ignoreDirs.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);

    if (entry.isDirectory()) {
      const children = await buildFileTree(
        fullPath,
        basePath,
        maxDepth,
        currentDepth + 1
      );
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
    } else {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const workingDir = process.cwd();
    const fileTree = await buildFileTree(workingDir, workingDir);

    res.status(200).json({ files: fileTree });
  } catch (error: any) {
    console.error('File tree error:', error);
    res.status(500).json({
      error: error.message || 'Failed to load file tree',
    });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { FileSystemManager } from '../../../src/utils/fileSystem';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: filePath, content } = req.body;

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const workingDir = process.cwd();
    const fileSystem = new FileSystemManager(workingDir);

    // Security: Ensure the path is within the working directory
    const fullPath = path.resolve(workingDir, filePath);
    if (!fullPath.startsWith(workingDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await fileSystem.writeFile(filePath, content);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('File write error:', error);
    res.status(500).json({
      error: error.message || 'Failed to write file',
    });
  }
}

import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

export class FileSystemManager {
  private workingDirectory: string;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SENSITIVE_PATTERNS = [
    '.env',
    '.env.local',
    '.env.production',
    'id_rsa',
    'id_dsa',
    'id_ecdsa',
    'id_ed25519',
    'credentials',
    'secrets',
    'private.key',
    'privatekey.pem',
  ];

  constructor(workingDirectory: string = process.cwd()) {
    this.workingDirectory = path.resolve(workingDirectory);
  }

  /**
   * Validate file path to prevent directory traversal attacks
   */
  private validatePath(filePath: string): void {
    // Prevent directory traversal
    if (filePath.includes('..')) {
      throw new Error('Invalid file path: directory traversal detected');
    }

    // Prevent absolute paths that go outside working directory
    const fullPath = this.resolvePath(filePath);
    if (!fullPath.startsWith(this.workingDirectory)) {
      throw new Error('Invalid file path: outside working directory');
    }

    // Check for sensitive files
    const normalized = filePath.toLowerCase();
    for (const pattern of this.SENSITIVE_PATTERNS) {
      if (normalized.includes(pattern)) {
        throw new Error(`Access denied: cannot access sensitive file ${pattern}`);
      }
    }

    // Prevent null bytes
    if (filePath.includes('\0')) {
      throw new Error('Invalid file path: null byte detected');
    }
  }

  async readFile(filePath: string): Promise<string> {
    this.validatePath(filePath);
    const fullPath = this.resolvePath(filePath);

    // Check file size before reading
    const stats = await fs.stat(fullPath);
    if (stats.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large: maximum size is ${this.MAX_FILE_SIZE} bytes`);
    }

    return await fs.readFile(fullPath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    this.validatePath(filePath);

    // Validate content size
    if (content.length > this.MAX_FILE_SIZE) {
      throw new Error(`Content too large: maximum size is ${this.MAX_FILE_SIZE} bytes`);
    }

    const fullPath = this.resolvePath(filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async deleteFile(filePath: string): Promise<void> {
    this.validatePath(filePath);

    // Extra safety check for delete operations
    if (filePath === '.' || filePath === '/' || filePath === '') {
      throw new Error('Cannot delete root or current directory');
    }

    const fullPath = this.resolvePath(filePath);
    await fs.remove(fullPath);
  }

  async listFiles(pattern: string = '**/*'): Promise<string[]> {
    const files = await glob(pattern, {
      cwd: this.workingDirectory,
      ignore: ['node_modules/**', 'dist/**', '.git/**'],
      nodir: true,
    });
    return files;
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    return await fs.pathExists(fullPath);
  }

  async readDirectory(dirPath: string = '.'): Promise<string[]> {
    this.validatePath(dirPath);
    const fullPath = this.resolvePath(dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    // Filter out sensitive files
    return entries
      .filter(entry => {
        const name = entry.name.toLowerCase();
        return !this.SENSITIVE_PATTERNS.some(pattern => name.includes(pattern));
      })
      .map(entry => {
        const name = entry.name;
        return entry.isDirectory() ? `${name}/` : name;
      });
  }

  resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      // Only allow absolute paths within working directory
      const normalized = path.resolve(filePath);
      if (!normalized.startsWith(this.workingDirectory)) {
        throw new Error('Absolute path outside working directory');
      }
      return normalized;
    }
    return path.resolve(this.workingDirectory, filePath);
  }

  getWorkingDirectory(): string {
    return this.workingDirectory;
  }

  setWorkingDirectory(dir: string): void {
    // Validate new working directory
    const normalized = path.resolve(dir);
    if (!fs.existsSync(normalized)) {
      throw new Error('Working directory does not exist');
    }
    this.workingDirectory = normalized;
  }

  async getFileInfo(filePath: string) {
    this.validatePath(filePath);
    const fullPath = this.resolvePath(filePath);
    const stats = await fs.stat(fullPath);
    return {
      path: filePath,
      size: stats.size,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
    };
  }

  async createDirectory(dirPath: string): Promise<void> {
    this.validatePath(dirPath);

    // Prevent creating too deeply nested directories (DoS prevention)
    const depth = dirPath.split(path.sep).length;
    if (depth > 20) {
      throw new Error('Directory path too deep (maximum 20 levels)');
    }

    const fullPath = this.resolvePath(dirPath);
    await fs.ensureDir(fullPath);
  }
}

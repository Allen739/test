import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

export class FileSystemManager {
  private workingDirectory: string;

  constructor(workingDirectory: string = process.cwd()) {
    this.workingDirectory = workingDirectory;
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = this.resolvePath(filePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
  }

  async deleteFile(filePath: string): Promise<void> {
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
    const fullPath = this.resolvePath(dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map(entry => {
      const name = entry.name;
      return entry.isDirectory() ? `${name}/` : name;
    });
  }

  resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.workingDirectory, filePath);
  }

  getWorkingDirectory(): string {
    return this.workingDirectory;
  }

  setWorkingDirectory(dir: string): void {
    this.workingDirectory = dir;
  }

  async getFileInfo(filePath: string) {
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
    const fullPath = this.resolvePath(dirPath);
    await fs.ensureDir(fullPath);
  }
}

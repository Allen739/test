import { FileSystemManager } from '../utils/fileSystem';
import { glob } from 'glob';
import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (params: any) => Promise<any>;
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: any;
}

export interface ToolResult {
  id: string;
  name: string;
  result: any;
  error?: string;
}

export class AdvancedAgentTools {
  private fileSystem: FileSystemManager;
  private tools: Map<string, Tool>;
  private workingDir: string;

  constructor(fileSystem: FileSystemManager) {
    this.fileSystem = fileSystem;
    this.workingDir = fileSystem.getWorkingDirectory();
    this.tools = new Map();
    this.registerAllTools();
  }

  private registerAllTools(): void {
    this.registerFileTools();
    this.registerCodeAnalysisTools();
    this.registerGitTools();
    this.registerTestTools();
    this.registerPackageTools();
    this.registerTerminalTools();
  }

  private registerFileTools(): void {
    // Read File
    this.tools.set('read_file', {
      name: 'read_file',
      description: 'Read the contents of a file from the file system',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to read',
          },
        },
        required: ['path'],
      },
      execute: async (params: { path: string }) => {
        const content = await this.fileSystem.readFile(params.path);
        return {
          success: true,
          path: params.path,
          content,
          size: content.length,
          lines: content.split('\n').length,
        };
      },
    });

    // Write File
    this.tools.set('write_file', {
      name: 'write_file',
      description: 'Write or update a file in the file system',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'The path to the file' },
          content: { type: 'string', description: 'The content to write' },
        },
        required: ['path', 'content'],
      },
      execute: async (params: { path: string; content: string }) => {
        await this.fileSystem.writeFile(params.path, params.content);
        return {
          success: true,
          path: params.path,
          size: params.content.length,
          lines: params.content.split('\n').length,
        };
      },
    });

    // List Files
    this.tools.set('list_files', {
      name: 'list_files',
      description: 'List files matching a glob pattern',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern like "src/**/*.ts"' },
          maxResults: { type: 'number', description: 'Max results', default: 100 },
        },
        required: ['pattern'],
      },
      execute: async (params: { pattern: string; maxResults?: number }) => {
        const files = await this.fileSystem.listFiles(params.pattern);
        const maxResults = params.maxResults || 100;
        return {
          success: true,
          files: files.slice(0, maxResults),
          total: files.length,
          truncated: files.length > maxResults,
        };
      },
    });

    // Search Files
    this.tools.set('search_files', {
      name: 'search_files',
      description: 'Search for text content within files',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Text to search for' },
          pattern: { type: 'string', description: 'File pattern', default: '**/*' },
          caseSensitive: { type: 'boolean', default: false },
        },
        required: ['query'],
      },
      execute: async (params: { query: string; pattern?: string; caseSensitive?: boolean }) => {
        const pattern = params.pattern || '**/*';
        const files = await glob(pattern, {
          cwd: this.workingDir,
          nodir: true,
          ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**', 'build/**'],
        });

        const results: Array<{ file: string; line: number; content: string }> = [];
        const query = params.caseSensitive ? params.query : params.query.toLowerCase();

        for (const file of files.slice(0, 50)) {
          try {
            const content = await this.fileSystem.readFile(file);
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              const searchLine = params.caseSensitive ? line : line.toLowerCase();
              if (searchLine.includes(query)) {
                results.push({ file, line: index + 1, content: line.trim() });
              }
            });
          } catch (e) {}
        }

        return { success: true, query: params.query, results: results.slice(0, 50), totalMatches: results.length };
      },
    });
  }

  private registerCodeAnalysisTools(): void {
    // Analyze Project Structure
    this.tools.set('analyze_project', {
      name: 'analyze_project',
      description: 'Analyze project structure, dependencies, and architecture',
      parameters: {
        type: 'object',
        properties: {
          depth: { type: 'number', description: 'Analysis depth', default: 2 },
        },
        required: [],
      },
      execute: async (params: { depth?: number }) => {
        const packageJsonPath = path.join(this.workingDir, 'package.json');
        let packageJson: any = null;
        let projectType = 'unknown';

        try {
          const content = await fs.readFile(packageJsonPath, 'utf-8');
          packageJson = JSON.parse(content);

          if (packageJson.dependencies?.next) projectType = 'Next.js';
          else if (packageJson.dependencies?.react) projectType = 'React';
          else if (packageJson.dependencies?.vue) projectType = 'Vue';
          else if (packageJson.dependencies?.angular) projectType = 'Angular';
          else if (packageJson.dependencies?.express) projectType = 'Express';
        } catch (e) {}

        // Count files by type
        const allFiles = await glob('**/*', {
          cwd: this.workingDir,
          nodir: true,
          ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**'],
        });

        const fileTypes: Record<string, number> = {};
        const directories = new Set<string>();

        allFiles.forEach((file) => {
          const ext = path.extname(file) || 'no-extension';
          fileTypes[ext] = (fileTypes[ext] || 0) + 1;
          const dir = path.dirname(file);
          directories.add(dir);
        });

        return {
          success: true,
          projectType,
          name: packageJson?.name || 'unknown',
          version: packageJson?.version || 'unknown',
          totalFiles: allFiles.length,
          totalDirectories: directories.size,
          fileTypes,
          dependencies: packageJson?.dependencies ? Object.keys(packageJson.dependencies).length : 0,
          devDependencies: packageJson?.devDependencies ? Object.keys(packageJson.devDependencies).length : 0,
          hasTests: allFiles.some(f => f.includes('.test.') || f.includes('.spec.')),
          hasTypeScript: fileTypes['.ts'] > 0 || fileTypes['.tsx'] > 0,
        };
      },
    });

    // Analyze Code Quality
    this.tools.set('analyze_code', {
      name: 'analyze_code',
      description: 'Analyze code quality, complexity, and potential issues in a file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze' },
        },
        required: ['path'],
      },
      execute: async (params: { path: string }) => {
        const content = await this.fileSystem.readFile(params.path);
        const lines = content.split('\n');

        const analysis = {
          success: true,
          path: params.path,
          totalLines: lines.length,
          codeLines: lines.filter(l => l.trim() && !l.trim().startsWith('//')).length,
          commentLines: lines.filter(l => l.trim().startsWith('//')).length,
          emptyLines: lines.filter(l => !l.trim()).length,
          functions: (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length,
          classes: (content.match(/class\s+\w+/g) || []).length,
          imports: (content.match(/import\s+.*from/g) || []).length,
          exports: (content.match(/export\s+(default|const|function|class)/g) || []).length,
          complexity: this.calculateComplexity(content),
          issues: this.findCodeIssues(content),
        };

        return analysis;
      },
    });

    // Find Dependencies
    this.tools.set('find_dependencies', {
      name: 'find_dependencies',
      description: 'Find all files that depend on or are depended by a specific file',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to analyze dependencies' },
        },
        required: ['path'],
      },
      execute: async (params: { path: string }) => {
        const content = await this.fileSystem.readFile(params.path);
        const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
        const dependencies = imports.map(imp => imp.match(/from\s+['"]([^'"]+)['"]/)?.[1]).filter(Boolean);

        // Find files that import this file
        const fileName = path.basename(params.path, path.extname(params.path));
        const allFiles = await glob('**/*.{ts,tsx,js,jsx}', {
          cwd: this.workingDir,
          ignore: ['node_modules/**', 'dist/**'],
        });

        const dependents: string[] = [];
        for (const file of allFiles.slice(0, 100)) {
          try {
            const fileContent = await this.fileSystem.readFile(file);
            if (fileContent.includes(fileName) && file !== params.path) {
              dependents.push(file);
            }
          } catch (e) {}
        }

        return {
          success: true,
          path: params.path,
          imports: dependencies,
          importedBy: dependents,
          totalDependencies: dependencies.length,
          totalDependents: dependents.length,
        };
      },
    });
  }

  private registerGitTools(): void {
    // Git Status
    this.tools.set('git_status', {
      name: 'git_status',
      description: 'Get git repository status including staged, modified, and untracked files',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => {
        try {
          const { stdout } = await execAsync('git status --porcelain', { cwd: this.workingDir });
          const lines = stdout.trim().split('\n').filter(Boolean);

          const staged: string[] = [];
          const modified: string[] = [];
          const untracked: string[] = [];

          lines.forEach(line => {
            const status = line.substring(0, 2);
            const file = line.substring(3);
            if (status.includes('A') || status.includes('M') && status[0] !== ' ') staged.push(file);
            else if (status.includes('M')) modified.push(file);
            else if (status.includes('??')) untracked.push(file);
          });

          return { success: true, staged, modified, untracked, totalChanges: lines.length };
        } catch (error: any) {
          throw new Error(`Git status failed: ${error.message}`);
        }
      },
    });

    // Git Commit
    this.tools.set('git_commit', {
      name: 'git_commit',
      description: 'Stage and commit changes with a message',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Commit message' },
          files: { type: 'array', items: { type: 'string' }, description: 'Files to stage (or "all")' },
        },
        required: ['message'],
      },
      execute: async (params: { message: string; files?: string[] }) => {
        try {
          if (params.files && params.files.length > 0) {
            const filesArg = params.files.join(' ');
            await execAsync(`git add ${filesArg}`, { cwd: this.workingDir });
          } else {
            await execAsync('git add -A', { cwd: this.workingDir });
          }

          const { stdout } = await execAsync(`git commit -m "${params.message}"`, { cwd: this.workingDir });
          return { success: true, message: params.message, output: stdout.trim() };
        } catch (error: any) {
          throw new Error(`Git commit failed: ${error.message}`);
        }
      },
    });

    // Git Diff
    this.tools.set('git_diff', {
      name: 'git_diff',
      description: 'Show git diff for staged or unstaged changes',
      parameters: {
        type: 'object',
        properties: {
          staged: { type: 'boolean', description: 'Show staged changes', default: false },
          file: { type: 'string', description: 'Specific file to diff' },
        },
        required: [],
      },
      execute: async (params: { staged?: boolean; file?: string }) => {
        try {
          const stagedFlag = params.staged ? '--staged' : '';
          const fileArg = params.file || '';
          const { stdout } = await execAsync(`git diff ${stagedFlag} ${fileArg}`, { cwd: this.workingDir });
          return { success: true, diff: stdout, hasChanges: stdout.length > 0 };
        } catch (error: any) {
          throw new Error(`Git diff failed: ${error.message}`);
        }
      },
    });
  }

  private registerTestTools(): void {
    // Run Tests
    this.tools.set('run_tests', {
      name: 'run_tests',
      description: 'Run project tests using npm test or other test runners',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Test pattern or specific file' },
          watch: { type: 'boolean', description: 'Run in watch mode', default: false },
        },
        required: [],
      },
      execute: async (params: { pattern?: string; watch?: boolean }) => {
        try {
          const testCmd = params.pattern ? `npm test -- ${params.pattern}` : 'npm test';
          const { stdout, stderr } = await execAsync(testCmd, {
            cwd: this.workingDir,
            timeout: 60000,
          });

          const output = stdout + stderr;
          const passed = !output.toLowerCase().includes('fail') && !stderr.includes('error');

          return {
            success: true,
            passed,
            output: output.substring(0, 5000),
            hasTests: true,
          };
        } catch (error: any) {
          return {
            success: false,
            passed: false,
            output: error.message,
            hasTests: true,
          };
        }
      },
    });

    // Generate Tests
    this.tools.set('generate_tests', {
      name: 'generate_tests',
      description: 'Analyze a file and suggest test cases that should be written',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path to generate tests for' },
        },
        required: ['path'],
      },
      execute: async (params: { path: string }) => {
        const content = await this.fileSystem.readFile(params.path);

        // Extract functions and classes
        const functions = content.match(/(?:function|const)\s+(\w+)/g) || [];
        const classes = content.match(/class\s+(\w+)/g) || [];

        const suggestions = [
          ...functions.map(f => `Test ${f} with valid inputs`),
          ...functions.map(f => `Test ${f} with invalid inputs`),
          ...functions.map(f => `Test ${f} error handling`),
          ...classes.map(c => `Test ${c} instantiation`),
          ...classes.map(c => `Test ${c} methods`),
        ];

        return {
          success: true,
          path: params.path,
          testFile: params.path.replace(/\.(ts|js)$/, '.test.$1'),
          suggestedTests: suggestions.slice(0, 10),
          functionsFound: functions.length,
          classesFound: classes.length,
        };
      },
    });
  }

  private registerPackageTools(): void {
    // Install Package
    this.tools.set('install_package', {
      name: 'install_package',
      description: 'Install npm packages',
      parameters: {
        type: 'object',
        properties: {
          packages: { type: 'array', items: { type: 'string' }, description: 'Package names' },
          dev: { type: 'boolean', description: 'Install as dev dependency', default: false },
        },
        required: ['packages'],
      },
      execute: async (params: { packages: string[]; dev?: boolean }) => {
        try {
          const devFlag = params.dev ? '-D' : '';
          const packagesStr = params.packages.join(' ');
          const { stdout } = await execAsync(`npm install ${devFlag} ${packagesStr}`, {
            cwd: this.workingDir,
            timeout: 120000,
          });
          return { success: true, packages: params.packages, output: stdout };
        } catch (error: any) {
          throw new Error(`Package install failed: ${error.message}`);
        }
      },
    });

    // List Outdated
    this.tools.set('check_outdated', {
      name: 'check_outdated',
      description: 'Check for outdated npm packages',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => {
        try {
          const { stdout } = await execAsync('npm outdated --json', { cwd: this.workingDir });
          const outdated = stdout ? JSON.parse(stdout) : {};
          return {
            success: true,
            outdatedPackages: Object.keys(outdated),
            count: Object.keys(outdated).length,
            details: outdated,
          };
        } catch (error: any) {
          return { success: true, outdatedPackages: [], count: 0, details: {} };
        }
      },
    });
  }

  private registerTerminalTools(): void {
    // Execute Command
    this.tools.set('run_command', {
      name: 'run_command',
      description: 'Execute a shell command in the project directory',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
          timeout: { type: 'number', description: 'Timeout in ms', default: 30000 },
        },
        required: ['command'],
      },
      execute: async (params: { command: string; timeout?: number }) => {
        try {
          // Security: block dangerous commands
          const dangerous = ['rm -rf', 'dd if=', 'mkfs', ':(){ :|:& };:', 'chmod -R 777'];
          if (dangerous.some(cmd => params.command.includes(cmd))) {
            throw new Error('Dangerous command blocked');
          }

          const { stdout, stderr } = await execAsync(params.command, {
            cwd: this.workingDir,
            timeout: params.timeout || 30000,
          });

          return {
            success: true,
            command: params.command,
            stdout: stdout.substring(0, 5000),
            stderr: stderr.substring(0, 1000),
            hasError: stderr.length > 0,
          };
        } catch (error: any) {
          throw new Error(`Command failed: ${error.message}`);
        }
      },
    });

    // Build Project
    this.tools.set('build_project', {
      name: 'build_project',
      description: 'Build the project using npm run build',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => {
        try {
          const { stdout, stderr } = await execAsync('npm run build', {
            cwd: this.workingDir,
            timeout: 180000,
          });

          const success = !stderr.includes('error') && !stderr.includes('failed');
          return {
            success,
            output: (stdout + stderr).substring(0, 5000),
            buildSucceeded: success,
          };
        } catch (error: any) {
          return {
            success: false,
            output: error.message,
            buildSucceeded: false,
          };
        }
      },
    });
  }

  private calculateComplexity(code: string): number {
    // Simple cyclomatic complexity estimation
    const conditionals = (code.match(/if\s*\(|else|switch|case|while\s*\(|for\s*\(/g) || []).length;
    const logicalOps = (code.match(/&&|\|\|/g) || []).length;
    return conditionals + logicalOps + 1;
  }

  private findCodeIssues(code: string): string[] {
    const issues: string[] = [];

    if (code.includes('console.log')) issues.push('Contains console.log statements');
    if (code.includes('any') && code.includes('typescript')) issues.push('Uses "any" type');
    if (code.match(/catch\s*\(\s*\)/)) issues.push('Empty catch blocks');
    if (!code.includes('try') && code.includes('await')) issues.push('Unhandled async errors');
    if (code.split('\n').some(line => line.length > 120)) issues.push('Lines exceed 120 characters');

    return issues;
  }

  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolDefinitions(): Array<{ name: string; description: string; parameters: any }> {
    return this.getTools().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  async executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(toolCall.name);

    if (!tool) {
      return {
        id: toolCall.id,
        name: toolCall.name,
        result: null,
        error: `Tool '${toolCall.name}' not found`,
      };
    }

    try {
      const result = await tool.execute(toolCall.parameters);
      return {
        id: toolCall.id,
        name: toolCall.name,
        result,
      };
    } catch (error: any) {
      return {
        id: toolCall.id,
        name: toolCall.name,
        result: null,
        error: error.message,
      };
    }
  }

  async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    return Promise.all(toolCalls.map((call) => this.executeTool(call)));
  }
}

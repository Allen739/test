import { FileSystemManager } from '../utils/fileSystem';
import { glob } from 'glob';
import path from 'path';

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

export class AgentTools {
  private fileSystem: FileSystemManager;
  private tools: Map<string, Tool>;

  constructor(fileSystem: FileSystemManager) {
    this.fileSystem = fileSystem;
    this.tools = new Map();
    this.registerTools();
  }

  private registerTools(): void {
    // Read File Tool
    this.tools.set('read_file', {
      name: 'read_file',
      description: 'Read the contents of a file from the file system',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to read (relative to working directory)',
          },
        },
        required: ['path'],
      },
      execute: async (params: { path: string }) => {
        try {
          const content = await this.fileSystem.readFile(params.path);
          return {
            success: true,
            path: params.path,
            content,
            size: content.length,
          };
        } catch (error: any) {
          throw new Error(`Failed to read file: ${error.message}`);
        }
      },
    });

    // Write File Tool
    this.tools.set('write_file', {
      name: 'write_file',
      description: 'Write or update a file in the file system',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to write (relative to working directory)',
          },
          content: {
            type: 'string',
            description: 'The content to write to the file',
          },
        },
        required: ['path', 'content'],
      },
      execute: async (params: { path: string; content: string }) => {
        try {
          await this.fileSystem.writeFile(params.path, params.content);
          return {
            success: true,
            path: params.path,
            size: params.content.length,
            message: 'File written successfully',
          };
        } catch (error: any) {
          throw new Error(`Failed to write file: ${error.message}`);
        }
      },
    });

    // List Files Tool
    this.tools.set('list_files', {
      name: 'list_files',
      description: 'List files in a directory matching a pattern',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Glob pattern to match files (e.g., "src/**/*.ts")',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 100,
          },
        },
        required: ['pattern'],
      },
      execute: async (params: { pattern: string; maxResults?: number }) => {
        try {
          const files = await this.fileSystem.listFiles(params.pattern);
          const maxResults = params.maxResults || 100;
          return {
            success: true,
            files: files.slice(0, maxResults),
            total: files.length,
            truncated: files.length > maxResults,
          };
        } catch (error: any) {
          throw new Error(`Failed to list files: ${error.message}`);
        }
      },
    });

    // Search Files Tool
    this.tools.set('search_files', {
      name: 'search_files',
      description: 'Search for text content within files',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The text to search for',
          },
          pattern: {
            type: 'string',
            description: 'File pattern to search within (e.g., "**/*.ts")',
            default: '**/*',
          },
          caseSensitive: {
            type: 'boolean',
            description: 'Whether the search should be case-sensitive',
            default: false,
          },
        },
        required: ['query'],
      },
      execute: async (params: {
        query: string;
        pattern?: string;
        caseSensitive?: boolean;
      }) => {
        try {
          const workingDir = this.fileSystem.getWorkingDirectory();
          const pattern = params.pattern || '**/*';
          const files = await glob(pattern, {
            cwd: workingDir,
            nodir: true,
            ignore: ['node_modules/**', '.git/**', 'dist/**', '.next/**'],
          });

          const results: Array<{ file: string; line: number; content: string }> = [];
          const query = params.caseSensitive
            ? params.query
            : params.query.toLowerCase();

          for (const file of files.slice(0, 50)) {
            try {
              const content = await this.fileSystem.readFile(file);
              const lines = content.split('\n');

              lines.forEach((line, index) => {
                const searchLine = params.caseSensitive ? line : line.toLowerCase();
                if (searchLine.includes(query)) {
                  results.push({
                    file,
                    line: index + 1,
                    content: line.trim(),
                  });
                }
              });
            } catch (e) {
              // Skip files that can't be read
            }
          }

          return {
            success: true,
            query: params.query,
            results: results.slice(0, 50),
            totalMatches: results.length,
          };
        } catch (error: any) {
          throw new Error(`Failed to search files: ${error.message}`);
        }
      },
    });

    // Delete File Tool
    this.tools.set('delete_file', {
      name: 'delete_file',
      description: 'Delete a file from the file system',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'The path to the file to delete',
          },
        },
        required: ['path'],
      },
      execute: async (params: { path: string }) => {
        try {
          await this.fileSystem.deleteFile(params.path);
          return {
            success: true,
            path: params.path,
            message: 'File deleted successfully',
          };
        } catch (error: any) {
          throw new Error(`Failed to delete file: ${error.message}`);
        }
      },
    });

    // Get Working Directory Tool
    this.tools.set('get_working_directory', {
      name: 'get_working_directory',
      description: 'Get the current working directory path',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
      execute: async () => {
        return {
          success: true,
          workingDirectory: this.fileSystem.getWorkingDirectory(),
        };
      },
    });
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

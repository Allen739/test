import { BaseModel } from '../models/BaseModel';
import { FileSystemManager } from '../utils/fileSystem';
import { Message, FileOperation, AgentResponse } from '../types';

export class CodingAgent {
  private model: BaseModel;
  private fileSystem: FileSystemManager;
  private conversationHistory: Message[];
  private systemPrompt: string;

  constructor(model: BaseModel, fileSystem: FileSystemManager) {
    this.model = model;
    this.fileSystem = fileSystem;
    this.conversationHistory = [];
    this.systemPrompt = this.createSystemPrompt();
  }

  private createSystemPrompt(): string {
    return `You are an expert coding assistant with the ability to read, write, and modify files.

Your capabilities include:
- Reading and analyzing code files
- Writing new code files
- Modifying existing code
- Explaining code and concepts
- Debugging and fixing issues
- Suggesting improvements and best practices

When working with files, you can use the following operations:
- READ: read_file(path) - Read a file's contents
- WRITE: write_file(path, content) - Write or overwrite a file
- LIST: list_files(pattern) - List files matching a pattern
- DELETE: delete_file(path) - Delete a file

To perform file operations, use this format in your response:
[FILE_OPERATION: type=READ, path=src/example.ts]
[FILE_OPERATION: type=WRITE, path=src/new.ts, content=<content here>]

Always explain your reasoning and what you're doing. Be thorough but concise.`;
  }

  async chat(userMessage: string, stream: boolean = false): Promise<string> {
    this.addMessage('user', userMessage);

    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      ...this.conversationHistory,
    ];

    let response = '';

    if (stream) {
      await this.model.chatStream(messages, (chunk) => {
        response += chunk;
      });
    } else {
      response = await this.model.chat(messages);
    }

    this.addMessage('assistant', response);

    // Parse and execute file operations
    await this.executeFileOperations(response);

    return response;
  }

  async chatStream(userMessage: string, onChunk: (chunk: string) => void): Promise<void> {
    this.addMessage('user', userMessage);

    const messages: Message[] = [
      { role: 'system', content: this.systemPrompt },
      ...this.conversationHistory,
    ];

    let fullResponse = '';

    await this.model.chatStream(messages, (chunk) => {
      fullResponse += chunk;
      onChunk(chunk);
    });

    this.addMessage('assistant', fullResponse);

    // Parse and execute file operations after streaming completes
    await this.executeFileOperations(fullResponse);
  }

  private async executeFileOperations(response: string): Promise<void> {
    const operations = this.parseFileOperations(response);

    for (const op of operations) {
      try {
        switch (op.type) {
          case 'read':
            await this.fileSystem.readFile(op.path);
            break;
          case 'write':
            if (op.content) {
              await this.fileSystem.writeFile(op.path, op.content);
            }
            break;
          case 'delete':
            await this.fileSystem.deleteFile(op.path);
            break;
          case 'list':
            await this.fileSystem.listFiles(op.path);
            break;
        }
      } catch (error: any) {
        console.error(`Failed to execute ${op.type} operation on ${op.path}: ${error.message}`);
      }
    }
  }

  private parseFileOperations(response: string): FileOperation[] {
    const operations: FileOperation[] = [];
    const operationRegex = /\[FILE_OPERATION:\s*type=(\w+),\s*path=([^\],]+)(?:,\s*content=([^\]]+))?\]/g;

    let match;
    while ((match = operationRegex.exec(response)) !== null) {
      operations.push({
        type: match[1].toLowerCase() as any,
        path: match[2].trim(),
        content: match[3]?.trim(),
      });
    }

    return operations;
  }

  private addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date(),
    });
  }

  getHistory(): Message[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  async getContext(files?: string[]): Promise<string> {
    let context = 'Current working directory: ' + this.fileSystem.getWorkingDirectory() + '\n\n';

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const content = await this.fileSystem.readFile(file);
          context += `File: ${file}\n\`\`\`\n${content}\n\`\`\`\n\n`;
        } catch (error) {
          context += `File: ${file} (could not read)\n\n`;
        }
      }
    } else {
      const fileList = await this.fileSystem.listFiles('**/*.{ts,tsx,js,jsx,py,java,go,rs}');
      context += 'Available files:\n' + fileList.slice(0, 50).join('\n');
    }

    return context;
  }
}

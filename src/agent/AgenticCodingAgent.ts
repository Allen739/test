import { BaseModel } from '../models/BaseModel';
import { FileSystemManager } from '../utils/fileSystem';
import { AgentTools, ToolCall, ToolResult } from './AgentTools';
import { Message } from '../types';

export interface AgentAction {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response';
  timestamp: Date;
  content: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}

export interface AgenticResponse {
  text: string;
  actions: AgentAction[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
}

export class AgenticCodingAgent {
  private model: BaseModel;
  private fileSystem: FileSystemManager;
  private tools: AgentTools;
  private conversationHistory: Message[];
  private systemPrompt: string;
  private onAction?: (action: AgentAction) => void;

  constructor(
    model: BaseModel,
    fileSystem: FileSystemManager,
    onAction?: (action: AgentAction) => void
  ) {
    this.model = model;
    this.fileSystem = fileSystem;
    this.tools = new AgentTools(fileSystem);
    this.conversationHistory = [];
    this.systemPrompt = this.createSystemPrompt();
    this.onAction = onAction;
  }

  private createSystemPrompt(): string {
    const toolDefs = this.tools
      .getToolDefinitions()
      .map((tool) => {
        return `- ${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(
          tool.parameters,
          null,
          2
        )}`;
      })
      .join('\n\n');

    return `You are an expert autonomous coding agent with the ability to read, write, and modify files.

# Core Capabilities

You have access to powerful tools that allow you to interact with the file system. You should use these tools autonomously whenever needed to complete user requests.

# Available Tools

${toolDefs}

# How to Use Tools

When you need to use a tool, you MUST respond with a special JSON format:

\`\`\`tool_call
{
  "tool_calls": [
    {
      "id": "call_<unique_id>",
      "name": "tool_name",
      "parameters": { ... }
    }
  ]
}
\`\`\`

You can call multiple tools in a single response. After tool execution, you'll receive the results and can continue your response.

# Important Guidelines

1. **Be Autonomous**: Don't ask for permission to read or write files. If the user asks you to do something, use the appropriate tools to do it.

2. **Use Tools Proactively**:
   - If asked about code, READ the files first
   - If asked to modify something, READ it, then WRITE the changes
   - If asked to search, use search_files
   - If creating new features, list existing files first to understand structure

3. **Think Step by Step**:
   - First, understand what files are relevant (use list_files or search_files)
   - Read the files you need to understand
   - Make your changes
   - Write the updated files

4. **Be Thorough**: Read all relevant files before making changes. Don't make assumptions.

5. **Explain Your Actions**: After using tools, explain what you did and why.

# Example Workflow

User: "Add error handling to the authentication function"

Your Response:
1. First, I'll search for authentication-related files
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_1", "name": "search_files", "parameters": {"query": "authentication", "pattern": "**/*.ts"}}
  ]
}
\`\`\`

(After getting results)
2. Now I'll read the auth file to understand the current implementation
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_2", "name": "read_file", "parameters": {"path": "src/auth.ts"}}
  ]
}
\`\`\`

(After reading)
3. I can see the function lacks try-catch blocks. I'll add comprehensive error handling
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_3", "name": "write_file", "parameters": {"path": "src/auth.ts", "content": "..."}}
  ]
}
\`\`\`

Done! I've added error handling that catches and logs authentication failures.

# Remember

- Always use tools when file operations are needed
- Be proactive and autonomous
- Think step by step
- Explain your reasoning
- Use multiple tools in sequence as needed`;
  }

  async chat(
    userMessage: string,
    onChunk?: (chunk: string) => void
  ): Promise<AgenticResponse> {
    this.addMessage('user', userMessage);

    const actions: AgentAction[] = [];
    const allToolCalls: ToolCall[] = [];
    const allToolResults: ToolResult[] = [];
    let fullText = '';
    let continueLoop = true;
    let iterationCount = 0;
    const maxIterations = 10;

    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++;

      const messages: Message[] = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory,
      ];

      // Add tool results to messages if any
      if (allToolResults.length > 0) {
        const toolResultsMessage = this.formatToolResults(allToolResults);
        messages.push({
          role: 'system',
          content: toolResultsMessage,
          timestamp: new Date(),
        });
      }

      let response = '';

      // Stream the model's response
      await this.model.chatStream(messages, (chunk) => {
        response += chunk;
        fullText += chunk;
        if (onChunk) onChunk(chunk);
      });

      // Check if response contains tool calls
      const toolCalls = this.parseToolCalls(response);

      if (toolCalls.length > 0) {
        // Agent wants to use tools
        for (const toolCall of toolCalls) {
          const action: AgentAction = {
            type: 'tool_call',
            timestamp: new Date(),
            content: `Calling ${toolCall.name}`,
            toolCall,
          };
          actions.push(action);
          allToolCalls.push(toolCall);

          if (this.onAction) this.onAction(action);
        }

        // Execute tools
        const toolResults = await this.tools.executeTools(toolCalls);

        for (const result of toolResults) {
          const action: AgentAction = {
            type: 'tool_result',
            timestamp: new Date(),
            content: result.error || 'Success',
            toolResult: result,
          };
          actions.push(action);
          allToolResults.push(result);

          if (this.onAction) this.onAction(action);
        }

        // Continue loop to let agent process results
        continueLoop = true;
      } else {
        // No more tool calls, agent is done
        continueLoop = false;
        this.addMessage('assistant', response);
      }
    }

    return {
      text: fullText,
      actions,
      toolCalls: allToolCalls,
      toolResults: allToolResults,
    };
  }

  private parseToolCalls(response: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    const regex = /```tool_call\n([\s\S]*?)\n```/g;
    let match;

    while ((match = regex.exec(response)) !== null) {
      try {
        const jsonStr = match[1].trim();
        const parsed = JSON.parse(jsonStr);

        if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
          toolCalls.push(...parsed.tool_calls);
        }
      } catch (error) {
        console.error('Failed to parse tool call:', error);
      }
    }

    return toolCalls;
  }

  private formatToolResults(results: ToolResult[]): string {
    const formatted = results
      .map((result) => {
        const status = result.error ? 'ERROR' : 'SUCCESS';
        const output = result.error || JSON.stringify(result.result, null, 2);
        return `Tool: ${result.name} (ID: ${result.id})
Status: ${status}
Result:
${output}`;
      })
      .join('\n\n---\n\n');

    return `# Tool Execution Results

${formatted}

Please process these results and continue your response. If you need to use more tools, you can do so.`;
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

  getTools() {
    return this.tools;
  }
}

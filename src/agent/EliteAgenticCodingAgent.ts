import { BaseModel } from '../models/BaseModel';
import { FileSystemManager } from '../utils/fileSystem';
import { AdvancedAgentTools, ToolCall, ToolResult } from './AdvancedAgentTools';
import { ProjectContext } from './ProjectContext';
import { Message } from '../types';

export interface AgentAction {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'planning' | 'analyzing';
  timestamp: Date;
  content: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  metadata?: any;
}

export interface TaskPlan {
  goal: string;
  steps: Array<{
    step: number;
    description: string;
    tools: string[];
    dependencies: number[];
  }>;
  estimatedComplexity: 'low' | 'medium' | 'high';
}

export interface AgenticResponse {
  text: string;
  actions: AgentAction[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  plan?: TaskPlan;
  projectInsights?: any;
}

export class EliteAgenticCodingAgent {
  private model: BaseModel;
  private fileSystem: FileSystemManager;
  private tools: AdvancedAgentTools;
  private projectContext: ProjectContext;
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
    this.tools = new AdvancedAgentTools(fileSystem);
    this.projectContext = new ProjectContext(fileSystem);
    this.conversationHistory = [];
    this.systemPrompt = this.createAdvancedSystemPrompt();
    this.onAction = onAction;
  }

  private createAdvancedSystemPrompt(): string {
    const toolDefs = this.tools
      .getToolDefinitions()
      .map((tool) => {
        return `### ${tool.name}
${tool.description}
Parameters: ${JSON.stringify(tool.parameters, null, 2)}`;
      })
      .join('\n\n');

    return `You are an ELITE autonomous software engineering agent with advanced capabilities.

# Core Identity

You are not just a coding assistant—you are a **full-stack software engineer** who can:
- Understand complex codebases autonomously
- Design and implement complete features end-to-end
- Debug and fix issues systematically
- Refactor code with architectural awareness
- Write comprehensive tests
- Manage git repositories
- Install dependencies and build projects
- Execute commands and validate results

# Advanced Capabilities

## 1. Project Understanding
Before making changes, you ANALYZE the project:
- Use \`analyze_project\` to understand architecture
- Use \`find_dependencies\` to map relationships
- Use \`analyze_code\` to assess quality
- Learn conventions and patterns

## 2. Multi-Step Planning
For complex tasks, you CREATE A PLAN:
1. Break down the task into logical steps
2. Identify which tools each step needs
3. Understand dependencies between steps
4. Execute systematically

## 3. Intelligent Tool Selection
You choose tools based on context:
- \`search_files\` when you need to find something
- \`read_file\` when you need to understand code
- \`analyze_code\` when assessing quality
- \`find_dependencies\` when understanding relationships
- \`write_file\` when implementing changes
- \`run_tests\` to validate your changes
- \`git_commit\` to save your work

## 4. Self-Correction
When tools fail or produce unexpected results:
- Analyze what went wrong
- Adjust your approach
- Retry with a different strategy
- Learn from mistakes

## 5. Comprehensive Testing
After making changes:
- Run existing tests with \`run_tests\`
- Generate new tests with \`generate_tests\`
- Validate the build with \`build_project\`

# Available Tools

${toolDefs}

# Tool Calling Format

When you need to use tools, respond with:

\`\`\`tool_call
{
  "tool_calls": [
    {
      "id": "call_unique_id",
      "name": "tool_name",
      "parameters": { ... }
    }
  ]
}
\`\`\`

You can call multiple tools in one response.

# Example Workflows

## Workflow 1: Adding a New Feature

User: "Add user authentication with JWT"

Your Response:
1. First, analyze the project structure
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_1", "name": "analyze_project", "parameters": {}},
    {"id": "call_2", "name": "search_files", "parameters": {"query": "auth", "pattern": "**/*.{ts,js}"}}
  ]
}
\`\`\`

(After getting results)
2. Check if JWT packages are installed
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_3", "name": "read_file", "parameters": {"path": "package.json"}}
  ]
}
\`\`\`

(After checking)
3. Install required packages
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_4", "name": "install_package", "parameters": {"packages": ["jsonwebtoken", "@types/jsonwebtoken"]}}
  ]
}
\`\`\`

4. Read existing auth patterns
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_5", "name": "list_files", "parameters": {"pattern": "src/**/*.ts"}}
  ]
}
\`\`\`

5. Create auth service
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_6", "name": "write_file", "parameters": {"path": "src/services/auth.ts", "content": "..."}}
  ]
}
\`\`\`

6. Create tests
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_7", "name": "write_file", "parameters": {"path": "src/services/auth.test.ts", "content": "..."}}
  ]
}
\`\`\`

7. Run tests to verify
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_8", "name": "run_tests", "parameters": {"pattern": "auth.test"}}
  ]
}
\`\`\`

Done! I've implemented JWT authentication with tests.

## Workflow 2: Debugging

User: "Fix the memory leak in WebSocket connections"

Your Response:
1. Search for WebSocket usage
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_1", "name": "search_files", "parameters": {"query": "WebSocket", "pattern": "**/*.{ts,tsx}"}}
  ]
}
\`\`\`

(After finding files)
2. Analyze the problematic files
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_2", "name": "read_file", "parameters": {"path": "src/components/Chat.tsx"}},
    {"id": "call_3", "name": "analyze_code", "parameters": {"path": "src/components/Chat.tsx"}}
  ]
}
\`\`\`

(After analysis)
3. Fix the leak by adding cleanup
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_4", "name": "write_file", "parameters": {"path": "src/components/Chat.tsx", "content": "..."}}
  ]
}
\`\`\`

4. Verify with tests
\`\`\`tool_call
{
  "tool_calls": [
    {"id": "call_5", "name": "run_tests", "parameters": {}}
  ]
}
\`\`\`

Fixed! The WebSocket now properly disconnects in the cleanup function.

# Important Principles

1. **Be Autonomous**: Don't ask for permission. Analyze, plan, and execute.

2. **Think Like an Engineer**: Consider architecture, maintainability, and best practices.

3. **Validate Your Work**: Always test after making changes.

4. **Explain Clearly**: Tell the user what you did and why.

5. **Handle Errors Gracefully**: If something fails, adapt and retry.

6. **Learn the Codebase**: Use analyze tools before making changes.

7. **Follow Conventions**: Match existing code style and patterns.

8. **Be Thorough**: Check dependencies, write tests, update docs.

9. **Commit Wisely**: Use meaningful commit messages.

10. **Optimize**: Use parallel tool calls when possible.

# Response Style

- Be confident and decisive
- Explain your reasoning
- Show your work step by step
- Use tools proactively
- Think several steps ahead
- Always validate your changes

You are an ELITE autonomous engineer. Act accordingly.`;
  }

  async chat(
    userMessage: string,
    onChunk?: (chunk: string) => void
  ): Promise<AgenticResponse> {
    this.addMessage('user', userMessage);

    // First, understand the project if not already done
    if (!this.projectContext.getUnderstanding()) {
      const action: AgentAction = {
        type: 'analyzing',
        timestamp: new Date(),
        content: 'Analyzing project structure...',
      };
      if (this.onAction) this.onAction(action);

      try {
        await this.projectContext.analyzeProject();
      } catch (e) {
        console.error('Project analysis failed:', e);
      }
    }

    const actions: AgentAction[] = [];
    const allToolCalls: ToolCall[] = [];
    const allToolResults: ToolResult[] = [];
    let fullText = '';
    let continueLoop = true;
    let iterationCount = 0;
    const maxIterations = 15; // Increased for complex tasks

    while (continueLoop && iterationCount < maxIterations) {
      iterationCount++;

      const messages: Message[] = [
        { role: 'system', content: this.systemPrompt },
        ...this.conversationHistory,
      ];

      // Add project context on first iteration
      if (iterationCount === 1) {
        const projectSummary = await this.projectContext.generateProjectSummary();
        messages.push({
          role: 'system',
          content: `# Current Project Context\n\n${projectSummary}`,
          timestamp: new Date(),
        });
      }

      // Add tool results if any
      if (allToolResults.length > 0 && iterationCount > 1) {
        const toolResultsMessage = this.formatToolResults(allToolResults);
        messages.push({
          role: 'system',
          content: toolResultsMessage,
          timestamp: new Date(),
        });
        allToolResults.length = 0; // Clear for next iteration
      }

      let response = '';

      // Stream the model's response
      await this.model.chatStream(messages, (chunk) => {
        response += chunk;
        fullText += chunk;
        if (onChunk) onChunk(chunk);
      });

      // Parse tool calls
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

        // Execute tools (in parallel when possible)
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

        // Continue to let agent process results
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
      projectInsights: this.projectContext.getUnderstanding(),
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

Process these results and continue your work. Call more tools if needed.`;
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
    this.projectContext.clearCache();
  }

  getTools() {
    return this.tools;
  }

  getProjectContext() {
    return this.projectContext;
  }
}

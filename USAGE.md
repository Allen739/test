# React CLI Coding Agent - Usage Guide

## Installation

```bash
npm install
npm run build
```

## Configuration

1. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

2. Add your API keys to the `.env` file:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4
```

## Running the Agent

### Interactive Chat Mode (Default)

Start an interactive chat session:
```bash
npm run dev
# or after building
npm start
# or using the binary
./dist/cli.js
```

### Chat with Specific Model

```bash
npm run dev chat --provider openai --model gpt-4
npm run dev chat --provider anthropic --model claude-3-opus-20240229
```

### List Available Models

```bash
npm run dev models
```

## Commands

### `chat`
Start an interactive chat session with the coding agent.

**Options:**
- `-m, --model <model>` - Specify the model to use
- `-p, --provider <provider>` - Specify the provider (openai, anthropic, google, mistral)

**Examples:**
```bash
npm run dev chat
npm run dev chat --provider anthropic --model claude-3-sonnet-20240229
```

### `models`
List all available models and their capabilities.

```bash
npm run dev models
```

### `config`
Manage agent configuration.

**Options:**
- `-s, --set <key=value>` - Set a configuration value
- `-g, --get <key>` - Get a configuration value
- `-l, --list` - List all configuration

**Examples:**
```bash
npm run dev config --set provider=anthropic
npm run dev config --get model
npm run dev config --list
```

## Features

### File Operations

The agent can perform various file operations:

1. **Read Files**: Ask the agent to read and analyze files
   ```
   > Read the package.json file
   ```

2. **Write Files**: Request the agent to create or modify files
   ```
   > Create a new React component called Button in src/components/Button.tsx
   ```

3. **List Files**: Ask about project structure
   ```
   > List all TypeScript files in the src directory
   ```

4. **Delete Files**: Request file deletion
   ```
   > Delete the old-component.tsx file
   ```

### Code Generation

The agent can generate code in multiple languages:

```
> Create a Python script that reads a CSV file and generates a bar chart
> Write a TypeScript function to validate email addresses
> Create a REST API endpoint for user authentication
```

### Code Analysis

Ask the agent to analyze and explain code:

```
> Explain what this function does: [paste code]
> Review this code for potential bugs
> Suggest improvements for this implementation
```

### Debugging

Get help debugging issues:

```
> I'm getting a "Cannot read property 'x' of undefined" error
> Help me fix this TypeScript type error
> Why isn't this function returning the expected value?
```

## Keyboard Shortcuts

- `Ctrl+Q` - Quit the application
- `Enter` - Send message
- `Arrow Keys` - Navigate model selection (in model selector)

## Advanced Usage

### Custom System Prompts

The agent comes with a built-in system prompt that defines its capabilities. You can modify the system prompt in `src/agent/CodingAgent.ts` to customize behavior.

### Adding New Models

To add support for new models:

1. Add the model information to `AVAILABLE_MODELS` in `src/types/index.ts`
2. If it's a new provider, implement a new model class extending `BaseModel`
3. Update the `ModelFactory` to support the new provider

### Conversation History

All conversations are automatically saved to `.agent-history/` directory. Each session is stored as a JSON file with timestamp.

### Logs

Agent logs are stored in `.agent-logs/agent.log`. Use verbose mode to see detailed logging:

```typescript
const logger = new Logger(process.cwd(), true); // verbose = true
```

## Troubleshooting

### API Key Not Found

Make sure your `.env` file exists and contains the correct API keys:
```bash
cat .env
```

### Model Not Available

Check available models:
```bash
npm run dev models
```

### Connection Issues

Verify your internet connection and API key validity. Check logs:
```bash
cat .agent-logs/agent.log
```

### TypeScript Errors

Rebuild the project:
```bash
npm run build
```

## Examples

### Example 1: Creating a New Feature

```
You: Create a new TypeScript utility function to format dates
Agent: I'll create a date formatting utility for you...
[Creates src/utils/dateFormatter.ts with implementation]
```

### Example 2: Debugging

```
You: I have a bug in my React component. The state isn't updating properly.
Agent: Let me help you debug this. Can you share the component code?
You: [Paste component code]
Agent: I see the issue. You're mutating state directly instead of using setState...
```

### Example 3: Code Review

```
You: Review this authentication function for security issues
Agent: I'll analyze the code for security vulnerabilities...
[Provides detailed security analysis and recommendations]
```

## Best Practices

1. **Be Specific**: Provide clear, detailed instructions
2. **Context Matters**: Share relevant code when asking for help
3. **Iterate**: Start simple and refine based on results
4. **Review Output**: Always review generated code before using it
5. **Save Sessions**: Important conversations are saved automatically

## Supported File Types

The agent works best with:
- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)
- Java (.java)
- Go (.go)
- Rust (.rs)
- And many more...

## Limitations

- Token limits vary by model
- Large files may need to be split
- Complex multi-file operations may require multiple steps
- API rate limits apply based on your provider

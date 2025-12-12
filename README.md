# Software Builder - Terragon Labs

A fully functional AI-powered software building agent with both CLI and Web interfaces. Built with React, Next.js, and TypeScript, supporting multiple AI models from OpenAI, Anthropic, and more.

## Features

### 🌐 Web Interface
- Modern, intuitive web-based UI built with Next.js
- Real-time code editor with syntax highlighting (Monaco Editor)
- Interactive file explorer
- Live chat interface with AI streaming responses
- Multi-model support with easy switching

### 💻 CLI Interface
- Interactive terminal UI built with React Ink
- Full feature parity with web interface
- Perfect for terminal-based workflows

### 🤖 AI Capabilities
- Support for multiple AI providers:
  - OpenAI (GPT-4, GPT-3.5 Turbo)
  - Anthropic (Claude 3 Opus, Sonnet, Haiku)
  - Google Gemini (coming soon)
  - Mistral (coming soon)
- Real-time streaming responses
- File system operations (read, write, delete, list)
- Code generation and analysis
- Conversation history management
- Configurable settings
- Error handling and logging

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4
```

### 3. Build

```bash
npm run build
```

### 4. Run

#### Web Interface (Recommended)

```bash
npm run dev:web
```

Then open your browser to `http://localhost:3000`

#### CLI Interface

```bash
npm run dev
# or
npm start
# or
./dist/cli.js
```

## Usage

### Web Interface

The web interface provides a complete IDE-like experience for building software with AI:

1. **Start the web server:**
   ```bash
   npm run dev:web
   ```

2. **Open your browser** to `http://localhost:3000`

3. **Select your AI model** from the available options

4. **Start building:**
   - Use the file explorer on the left to browse and open files
   - Edit code in the Monaco editor (center panel)
   - Chat with the AI assistant on the right
   - Ask the AI to generate code, fix bugs, or explain concepts
   - Files are automatically saved when you click "Save" or press Ctrl+S

#### Web Interface Features

- **File Explorer**: Browse and select files from your project
- **Code Editor**: Full-featured Monaco editor with:
  - Syntax highlighting for all major languages
  - Auto-completion
  - Multiple cursors
  - Find and replace
  - Keyboard shortcuts (Ctrl+S to save, etc.)
- **AI Chat**: Real-time streaming chat with your selected AI model
- **Model Switching**: Change AI models on the fly

### CLI Interface

For terminal enthusiasts, the CLI provides a powerful text-based interface:

```bash
npm run dev
```

You'll be presented with a model selector. Use arrow keys to choose your preferred model, then press Enter to start chatting.

### Command Line Options

#### Chat with Specific Model

```bash
npm run dev chat --provider openai --model gpt-4
npm run dev chat --provider anthropic --model claude-3-opus-20240229
```

#### List Available Models

```bash
npm run dev models
```

#### Configuration Management

```bash
# Set configuration
npm run dev config --set provider=anthropic

# Get configuration
npm run dev config --get model

# List all configuration
npm run dev config --list
```

## Supported Models

### OpenAI
- GPT-4 (8K context)
- GPT-4 Turbo (128K context)
- GPT-3.5 Turbo (16K context)

### Anthropic
- Claude 3 Opus (200K context)
- Claude 3 Sonnet (200K context)
- Claude 3 Haiku (200K context)

### Coming Soon
- Google Gemini Pro
- Mistral Large

## Agent Capabilities

### File Operations

The agent can perform various file operations:

```
> Read the package.json file
> Create a new React component in src/components/Button.tsx
> List all TypeScript files in the project
> Delete the old-config.js file
```

### Code Generation

```
> Create a TypeScript function to validate email addresses
> Write a Python script that processes CSV files
> Generate a REST API endpoint for user authentication
```

### Code Analysis & Debugging

```
> Explain this code: [paste code]
> Review my code for bugs and security issues
> Help me optimize this function
> Debug this error: TypeError: Cannot read property 'x' of undefined
```

### Context Awareness

The agent understands your project structure and can work with multiple files:

```
> Show me the current project structure
> Analyze all components in the src directory
> Refactor the authentication module
```

## Project Structure

```
.
├── src/
│   ├── agent/
│   │   └── CodingAgent.ts          # Main agent logic
│   ├── components/
│   │   ├── App.tsx                 # Main app component
│   │   ├── Chat.tsx                # Chat interface
│   │   └── ModelSelector.tsx       # Model selection UI
│   ├── models/
│   │   ├── BaseModel.ts            # Abstract base model
│   │   ├── OpenAIModel.ts          # OpenAI integration
│   │   ├── AnthropicModel.ts       # Anthropic integration
│   │   └── ModelFactory.ts         # Model factory
│   ├── utils/
│   │   ├── config.ts               # Configuration manager
│   │   ├── fileSystem.ts           # File operations
│   │   ├── history.ts              # Conversation history
│   │   └── logger.ts               # Logging utility
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── cli.tsx                     # CLI entry point
├── dist/                           # Compiled output
├── .env.example                    # Example environment variables
├── package.json
├── tsconfig.json
├── README.md
└── USAGE.md                        # Detailed usage guide
```

## Development

### Web Development Mode

```bash
npm run dev:web
```

Starts the Next.js development server with hot-reloading at `http://localhost:3000`

### CLI Development Mode

```bash
npm run dev
```

Runs the CLI in development mode with TypeScript execution.

### Watch Mode (TypeScript)

```bash
npm run watch
```

Continuously compiles TypeScript files to the `dist` directory.

### Build

```bash
# Build both web and CLI
npm run build

# Build only CLI
npm run build:cli
```

### Production

```bash
# Web interface
npm run start:web

# CLI interface
npm start
```

## Advanced Features

### Conversation History

All conversations are automatically saved to `.agent-history/` with timestamps. Sessions include:
- All messages (user and assistant)
- Model information
- Timestamp

### Logging

Detailed logs are saved to `.agent-logs/agent.log` for debugging and monitoring.

### Streaming Responses

The agent supports real-time streaming responses for a better user experience. Responses appear as they're generated by the AI model.

### Configuration Persistence

Settings are saved to `.agent-config.json` and persist across sessions.

## Keyboard Shortcuts

- `Ctrl+Q` - Quit the application
- `Enter` - Send message / Select option
- `Arrow Keys` - Navigate options

## API Requirements

You need at least one of the following API keys:

- OpenAI API key: Get it from https://platform.openai.com/api-keys
- Anthropic API key: Get it from https://console.anthropic.com/

Add them to your `.env` file.

## Examples

### Web Interface Workflow

1. **Open the web interface** at `http://localhost:3000`
2. **Select an AI model** (e.g., Claude 3 Sonnet or GPT-4)
3. **Browse files** using the file explorer
4. **Start chatting** with the AI:
   - "Create a new React component for user authentication"
   - "Review the code in src/agent/CodingAgent.ts for potential bugs"
   - "Add TypeScript types to all functions in this file"
5. **Edit files** directly in the Monaco editor
6. **Save changes** with Ctrl+S or the Save button

### Example 1: Creating a React Component

**In the chat:**
```
You: Create a TypeScript React component for a loading spinner

Agent: I'll create a loading spinner component for you...
[Creates src/components/LoadingSpinner.tsx with implementation]
```

The file will appear in the file explorer, and you can click to edit it.

### Example 2: Code Review

**In the chat:**
```
You: Review this function for potential issues:
function processData(data) {
  return data.map(item => item.value * 2)
}

Agent: I see a few potential issues with this function:
1. No input validation - data might be null/undefined
2. No error handling for items without a 'value' property
3. Missing TypeScript types
...
```

### Example 3: Multi-file Project Analysis

**In the chat:**
```
You: Analyze my project structure and suggest improvements

Agent: I'll analyze your project structure...
[Lists files, identifies patterns, suggests improvements]
```

### Example 4: Real-time Collaboration

1. Open a file in the editor
2. Ask the AI to make specific changes
3. Watch as the AI explains and implements the changes
4. Review and save the modifications

## Troubleshooting

### API Key Issues

Make sure your `.env` file exists and contains valid API keys:

```bash
cat .env
```

### Build Errors

Clean and rebuild:

```bash
rm -rf dist node_modules
npm install
npm run build
```

### Model Not Available

Check available models and verify your API keys:

```bash
npm run dev models
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React Ink](https://github.com/vadimdemedes/ink) for terminal UI
- Powered by [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/)
- Created by Terragon Labs

## Support

For detailed usage instructions, see [USAGE.md](USAGE.md)

For issues and questions, please open an issue on GitHub.

## Roadmap

- [x] Web interface with code editor
- [x] File explorer and management
- [x] Real-time AI streaming
- [ ] Google Gemini integration
- [ ] Mistral AI integration
- [ ] Plugin system for custom tools
- [ ] Multi-agent collaboration
- [ ] Code execution sandbox
- [ ] Git integration (branch management, commits, PRs)
- [ ] Test generation and execution
- [ ] Documentation generation
- [ ] Performance monitoring
- [ ] Collaborative editing (multi-user)
- [ ] Terminal integration in web UI
- [ ] Deployment automation

---

**Built with React by Terragon Labs**

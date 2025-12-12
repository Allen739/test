# Quick Start Guide

Get up and running with the React CLI Coding Agent in 5 minutes!

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- API key from OpenAI or Anthropic

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd react-cli-coding-agent

# Install dependencies
npm install
```

## Step 2: Configure API Keys

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key(s)
nano .env  # or use your preferred editor
```

Add at least one API key:

```env
# For OpenAI
OPENAI_API_KEY=sk-...

# OR for Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Set defaults
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-4
```

### Where to Get API Keys

**OpenAI:**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy and paste into .env

**Anthropic:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy and paste into .env

## Step 3: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## Step 4: Run the Agent

```bash
npm run dev
```

Or after building:

```bash
npm start
```

## Your First Interaction

1. **Select a Model**: Use arrow keys to navigate, Enter to select
2. **Start Chatting**: Type your message and press Enter
3. **Watch the Magic**: See responses stream in real-time

### Example First Messages

Try these to get started:

```
> Hello! What can you help me with?

> Read the package.json file

> Create a simple TypeScript function to add two numbers

> List all files in the src directory

> Explain what this project does
```

## Common Commands

### Interactive Mode (Default)
```bash
npm run dev
```

### With Specific Model
```bash
npm run dev chat --provider openai --model gpt-4
npm run dev chat --provider anthropic --model claude-3-sonnet-20240229
```

### List Available Models
```bash
npm run dev models
```

### Configuration
```bash
# Set default provider
npm run dev config --set provider=anthropic

# View current config
npm run dev config --list
```

## Keyboard Shortcuts

- **Enter**: Send message / Select option
- **Ctrl+Q**: Quit application
- **Arrow Keys**: Navigate options (in model selector)

## Troubleshooting

### "API key not found" Error

**Problem**: Missing or incorrect API key

**Solution**:
```bash
# Check your .env file exists
ls -la .env

# Verify it contains your API key
cat .env

# Make sure there are no spaces around the = sign
OPENAI_API_KEY=sk-...  # Correct
OPENAI_API_KEY = sk-...  # Wrong!
```

### "Command not found: npm"

**Problem**: Node.js not installed

**Solution**:
```bash
# Install Node.js from https://nodejs.org/
# Or using a package manager:

# macOS (using Homebrew)
brew install node

# Linux (Ubuntu/Debian)
sudo apt install nodejs npm

# Linux (Fedora)
sudo dnf install nodejs
```

### "Cannot find module" Error

**Problem**: Dependencies not installed

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Clean and rebuild
rm -rf dist
npm run build

# Check TypeScript version
npx tsc --version  # Should be 5.3.3 or higher
```

### Model Not Available

**Problem**: Selected model not accessible

**Solution**:
```bash
# Check available models
npm run dev models

# Verify your API key has access to the model
# Some models require specific API access/billing
```

## Next Steps

### 1. Explore Features

Try these examples:

**Code Generation:**
```
> Create a React component for a button with TypeScript
> Write a Python function to read CSV files
> Generate a Node.js Express server
```

**File Operations:**
```
> Read the README.md file
> List all TypeScript files in src/
> Create a new utility file in src/utils/
```

**Code Review:**
```
> Review this code for issues: [paste code]
> Suggest improvements for my authentication function
> Check this code for security vulnerabilities
```

**Debugging:**
```
> Why am I getting "Cannot read property 'x' of undefined"?
> Help me fix this TypeScript error: [paste error]
> Debug this function that's not working: [paste code]
```

### 2. Customize Configuration

Edit `.env` to change defaults:

```env
# Use Claude by default
DEFAULT_PROVIDER=anthropic
DEFAULT_MODEL=claude-3-opus-20240229

# Increase response length
MAX_TOKENS=8192

# Make responses more creative
TEMPERATURE=0.9
```

### 3. Explore Advanced Features

**Conversation History:**
```bash
# History is automatically saved to .agent-history/
ls .agent-history/

# View a past conversation
cat .agent-history/session-2024-12-11T10-30-00.000Z.json
```

**Application Logs:**
```bash
# View logs
cat .agent-logs/agent.log

# Watch logs in real-time
tail -f .agent-logs/agent.log
```

### 4. Read the Documentation

- **README.md**: Full feature overview
- **USAGE.md**: Detailed usage guide
- **ARCHITECTURE.md**: Technical architecture
- **examples/basic-usage.md**: More examples

## Development Mode

If you want to modify the code:

```bash
# Run in watch mode (auto-rebuilds on changes)
npm run watch

# In another terminal, run the agent
npm run dev
```

## Tips for Best Results

1. **Be Specific**: Clear instructions get better results
2. **Provide Context**: Share relevant code when asking questions
3. **Iterate**: Refine requests based on responses
4. **Use Examples**: Show what you want
5. **Start Simple**: Begin with basic tasks, then get more complex

## Example Workflow

Here's a complete example workflow:

```bash
# 1. Start the agent
npm run dev

# 2. Select a model (e.g., GPT-4)

# 3. Ask for project overview
You> Analyze this project structure

# 4. Request a new feature
You> Create a new utility function to format dates in src/utils/dateFormatter.ts

# 5. Review the code
You> Review the file you just created

# 6. Make improvements
You> Add error handling to the date formatter

# 7. Get usage examples
You> Show me how to use the date formatter

# 8. Done! Press Ctrl+Q to quit
```

## Getting Help

If you need help:

1. Check the documentation files
2. Look at examples in `examples/`
3. Check the logs in `.agent-logs/`
4. Create an issue on GitHub

## What's Next?

Once you're comfortable with the basics:

- Try different models to compare results
- Use the agent for real coding tasks
- Explore the source code to understand how it works
- Contribute improvements back to the project
- Build custom features for your workflow

## Success Checklist

- [ ] Node.js installed (v18+)
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] API key added to `.env`
- [ ] Project built (`npm run build`)
- [ ] Agent running (`npm run dev`)
- [ ] Model selected
- [ ] First message sent
- [ ] Response received

If you've checked all boxes, you're ready to code! 🚀

## Community

- **Issues**: Report bugs and request features
- **Contributions**: See CONTRIBUTING.md
- **Discussions**: Share your experience

Happy coding with your AI assistant!

---

**Need more help?** See the full documentation in README.md and USAGE.md

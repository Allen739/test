# Contributing to React CLI Coding Agent

Thank you for considering contributing to the React CLI Coding Agent! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/react-cli-coding-agent.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Watch for changes
npm run watch
```

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## Adding New Model Providers

To add support for a new AI model provider:

1. Create a new model class in `src/models/` extending `BaseModel`
2. Implement the `chat()` and `chatStream()` methods
3. Add the provider to `ModelFactory` in `src/models/ModelFactory.ts`
4. Add model information to `AVAILABLE_MODELS` in `src/types/index.ts`
5. Update documentation

Example:

```typescript
// src/models/NewProviderModel.ts
import { BaseModel } from './BaseModel';
import { Message, ModelConfig } from '../types';

export class NewProviderModel extends BaseModel {
  constructor(config: ModelConfig) {
    super(config);
    // Initialize provider client
  }

  async chat(messages: Message[]): Promise<string> {
    // Implement chat logic
  }

  async chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    // Implement streaming logic
  }
}
```

## Adding New Features

When adding new features:

1. Ensure the feature aligns with the project's goals
2. Write clean, maintainable code
3. Add appropriate error handling
4. Update documentation
5. Add examples if applicable

## Testing

Before submitting a PR:

1. Test all existing functionality
2. Test your new feature thoroughly
3. Test with different model providers
4. Check for edge cases and errors

## Documentation

Update documentation when:

- Adding new features
- Changing existing behavior
- Adding new commands or options
- Fixing bugs that affect usage

Documentation locations:
- `README.md` - Main documentation
- `USAGE.md` - Detailed usage guide
- Code comments - Complex logic
- Type definitions - API contracts

## Pull Request Guidelines

### PR Title Format

- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

### PR Description

Include:
- What changed
- Why the change was made
- How to test the change
- Screenshots/examples if applicable
- Breaking changes (if any)

### Before Submitting

- [ ] Code follows project style
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No console errors
- [ ] Tested with at least one model provider

## Reporting Issues

When reporting issues, include:

1. Clear description of the problem
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Environment details (Node version, OS, etc.)
6. Error messages/logs
7. Screenshots if applicable

## Feature Requests

When requesting features:

1. Describe the feature clearly
2. Explain the use case
3. Provide examples if possible
4. Discuss potential implementation

## Code of Conduct

- Be respectful and professional
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project

## Questions?

If you have questions:

- Open an issue for discussion
- Check existing issues and PRs
- Review documentation

Thank you for contributing!

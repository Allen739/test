# Architecture Documentation

## System Overview

The React CLI Coding Agent is built with a modular, extensible architecture that separates concerns and makes it easy to add new features and model providers.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLI Layer                            │
│                      (src/cli.tsx)                          │
│         Commander.js - Argument Parsing & Routing           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    React/Ink UI Layer                        │
│                   (src/components/)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │     App      │─▶│ ModelSelector│  │     Chat     │    │
│  │  Component   │  │   Component  │◀▶│  Component   │    │
│  └──────────────┘  └──────────────┘  └──────┬───────┘    │
└────────────────────────────────────────────────┼───────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Agent Layer                             │
│                  (src/agent/)                               │
│                  ┌─────────────────┐                        │
│                  │  CodingAgent    │                        │
│                  │  - chat()       │                        │
│                  │  - chatStream() │                        │
│                  │  - context mgmt │                        │
│                  └────┬──────┬─────┘                        │
└───────────────────────┼──────┼─────────────────────────────┘
                        │      │
           ┌────────────┘      └───────────┐
           ▼                                ▼
┌──────────────────────┐        ┌──────────────────────────┐
│    Model Layer       │        │   Utility Layer          │
│   (src/models/)      │        │   (src/utils/)           │
│                      │        │                          │
│  ┌────────────────┐ │        │  ┌────────────────────┐ │
│  │  BaseModel     │ │        │  │  FileSystemMgr     │ │
│  │  (abstract)    │ │        │  │  - read/write      │ │
│  └───────┬────────┘ │        │  │  - list/delete     │ │
│          │          │        │  └────────────────────┘ │
│  ┌───────┴─────┐    │        │  ┌────────────────────┐ │
│  │             │    │        │  │  ConfigManager     │ │
│  ▼             ▼    │        │  │  - persistence     │ │
│┌────────┐ ┌────────┐│        │  └────────────────────┘ │
││OpenAI  │ │Anthropic││        │  ┌────────────────────┐ │
││Model   │ │Model   ││        │  │  HistoryManager    │ │
│└────────┘ └────────┘│        │  │  - save/load       │ │
│     │         │     │        │  └────────────────────┘ │
│     └────┬────┘     │        │  ┌────────────────────┐ │
│          │          │        │  │  Logger            │ │
│  ┌───────▼───────┐  │        │  │  - debug/info/err  │ │
│  │ ModelFactory  │  │        │  └────────────────────┘ │
│  └───────────────┘  │        └──────────────────────────┘
└──────────────────────┘
```

## Component Interaction Flow

### 1. Application Startup Flow

```
User runs CLI
     │
     ▼
cli.tsx (Entry Point)
     │
     ├─→ Parse arguments (Commander)
     │
     ├─→ Load configuration (.env + .agent-config.json)
     │
     └─→ Render React App
            │
            ▼
         App.tsx
            │
            ├─→ ModelSelector (if no model chosen)
            │      │
            │      └─→ User selects model
            │
            └─→ Initialize Agent
                   │
                   ├─→ Create Model (via ModelFactory)
                   │
                   ├─→ Create FileSystemManager
                   │
                   └─→ Render Chat Component
```

### 2. Message Flow

```
User types message
     │
     ▼
Chat.tsx (handleSubmit)
     │
     ├─→ Update UI (show message)
     │
     └─→ Call agent.chatStream(message)
            │
            ▼
CodingAgent.chatStream()
     │
     ├─→ Add message to history
     │
     ├─→ Prepare messages (system + history)
     │
     └─→ Call model.chatStream()
            │
            ▼
OpenAIModel or AnthropicModel
     │
     ├─→ Format messages for provider
     │
     ├─→ Call provider API
     │
     └─→ Stream response chunks
            │
            ▼
         onChunk callback
            │
            ├─→ Back to CodingAgent
            │
            └─→ Back to Chat.tsx
                   │
                   └─→ Update UI with streaming text
```

### 3. File Operation Flow

```
User: "Read package.json"
     │
     ▼
Agent receives message
     │
     ├─→ Sends to AI model
     │
     └─→ AI responds with file operation command
            │
            ▼
Agent.executeFileOperations()
     │
     ├─→ Parse [FILE_OPERATION: type=READ, path=package.json]
     │
     └─→ Call fileSystem.readFile('package.json')
            │
            ▼
FileSystemManager.readFile()
     │
     ├─→ Resolve absolute path
     │
     ├─→ Read file with fs-extra
     │
     └─→ Return content
            │
            └─→ Available for next AI query
```

## Data Flow

### Configuration Data Flow

```
.env file (API keys, defaults)
     │
     ▼
dotenv.config()
     │
     ▼
ConfigManager.getModelConfig()
     │
     ├─→ Merge with .agent-config.json
     │
     └─→ Provide to ModelFactory
            │
            └─→ Create appropriate model instance
```

### Conversation History Flow

```
Each message
     │
     ▼
Agent.addMessage()
     │
     ├─→ Add to conversationHistory array
     │
     ├─→ Pass to model for context
     │
     └─→ Optionally save to disk
            │
            └─→ .agent-history/session-[timestamp].json
```

## Design Patterns

### 1. Factory Pattern (ModelFactory)

```typescript
// Centralized model creation
ModelFactory.createModel(config)
    │
    ├─ if config.provider === 'openai'
    │    └─→ return new OpenAIModel(config)
    │
    ├─ if config.provider === 'anthropic'
    │    └─→ return new AnthropicModel(config)
    │
    └─ else throw error
```

**Benefits:**
- Single point of model creation
- Easy to add new providers
- Type-safe model instances

### 2. Abstract Base Class (BaseModel)

```typescript
abstract class BaseModel {
    abstract chat(messages): Promise<string>
    abstract chatStream(messages, onChunk): Promise<void>
}

// All models must implement these methods
OpenAIModel extends BaseModel { ... }
AnthropicModel extends BaseModel { ... }
```

**Benefits:**
- Consistent interface
- Polymorphism
- Type safety

### 3. Dependency Injection

```typescript
class CodingAgent {
    constructor(
        model: BaseModel,        // Injected
        fileSystem: FileSystemManager  // Injected
    ) { ... }
}

// Usage
const model = ModelFactory.createModel(config);
const fs = new FileSystemManager();
const agent = new CodingAgent(model, fs);
```

**Benefits:**
- Testability
- Flexibility
- Decoupling

### 4. Observer/Callback Pattern (Streaming)

```typescript
// Agent calls model with callback
model.chatStream(messages, (chunk) => {
    // This callback is called for each chunk
    onChunk(chunk);
});

// Chat component provides the callback
agent.chatStream(message, (chunk) => {
    setStreamingMessage(prev => prev + chunk);
});
```

**Benefits:**
- Real-time updates
- Progressive rendering
- Better UX

### 5. Singleton Pattern (ConfigManager, Logger)

```typescript
// Single instance shared across app
export const configManager = new ConfigManager();
export const logger = new Logger();
```

**Benefits:**
- Shared state
- Consistent configuration
- Centralized logging

## State Management

### Component State (React useState)

```typescript
// Chat.tsx
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [input, setInput] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [streamingMessage, setStreamingMessage] = useState('');
```

### Agent State

```typescript
// CodingAgent.ts
private conversationHistory: Message[];
private model: BaseModel;
private fileSystem: FileSystemManager;
```

### Persistent State

```
.agent-config.json      # User preferences
.agent-history/         # Conversation history
.agent-logs/           # Application logs
```

## Error Handling Strategy

### Layer-by-Layer Error Handling

```
UI Layer (Chat.tsx)
     │ try-catch
     │ Display error to user
     ▼
Agent Layer (CodingAgent.ts)
     │ try-catch
     │ Log error
     │ Rethrow with context
     ▼
Model Layer (OpenAIModel.ts)
     │ try-catch
     │ Wrap provider errors
     │ Throw descriptive error
     ▼
Provider API
     │ Network/API errors
     │ Rate limits
     │ Authentication errors
```

## Extension Points

### Adding a New Model Provider

1. **Create Model Class**
   ```typescript
   // src/models/NewProviderModel.ts
   export class NewProviderModel extends BaseModel {
       async chat(messages: Message[]): Promise<string> { ... }
       async chatStream(...): Promise<void> { ... }
   }
   ```

2. **Update Factory**
   ```typescript
   // src/models/ModelFactory.ts
   case 'newprovider':
       return new NewProviderModel(config);
   ```

3. **Add Model Info**
   ```typescript
   // src/types/index.ts
   export const AVAILABLE_MODELS: ModelInfo[] = [
       { id: '...', name: '...', provider: 'newprovider', ... }
   ];
   ```

### Adding a New UI Component

```typescript
// src/components/NewComponent.tsx
import { Box, Text } from 'ink';

export const NewComponent: React.FC<Props> = ({ ... }) => {
    return (
        <Box>
            <Text>...</Text>
        </Box>
    );
};
```

### Adding New Utilities

```typescript
// src/utils/newUtil.ts
export class NewUtility {
    // Implement utility functions
}

export const newUtility = new NewUtility();
```

## Security Architecture

### API Key Management

```
User's .env file (gitignored)
     │
     ▼
process.env.OPENAI_API_KEY
     │
     ▼
ConfigManager (never logs keys)
     │
     ▼
Model instance (uses key, doesn't expose)
     │
     ▼
Provider API
```

### File System Security

```
User request: "Read /etc/passwd"
     │
     ▼
FileSystemManager.resolvePath()
     │
     ├─→ Check if absolute path
     │
     ├─→ Resolve relative to working directory
     │
     └─→ Prevent directory traversal
```

## Performance Considerations

### Streaming for Responsiveness

```
Traditional:
Wait for full response (30s) → Display all at once

Streaming:
Display chunks as received (0.1s per chunk) → Better UX
```

### Lazy Model Loading

```
App starts → User selects model → Model loaded
(Not all models loaded upfront)
```

### Efficient File Operations

```
FileSystemManager uses fs-extra
     │
     ├─→ Async operations (non-blocking)
     │
     └─→ Efficient glob patterns
```

## Testing Strategy

### Unit Tests (Planned)

```typescript
// Test model factory
describe('ModelFactory', () => {
    it('should create OpenAI model', () => {
        const model = ModelFactory.createModel({
            provider: 'openai',
            model: 'gpt-4',
            apiKey: 'test'
        });
        expect(model).toBeInstanceOf(OpenAIModel);
    });
});
```

### Integration Tests (Planned)

```typescript
// Test agent with mock model
describe('CodingAgent', () => {
    it('should handle chat messages', async () => {
        const mockModel = new MockModel();
        const agent = new CodingAgent(mockModel, mockFS);
        const response = await agent.chat('Hello');
        expect(response).toBeDefined();
    });
});
```

## Scalability Considerations

### Current Limitations
- Single conversation at a time
- History grows unbounded in memory
- No rate limiting

### Future Improvements
- Multiple concurrent agents
- History pagination
- Request queuing
- Caching layer

## Conclusion

This architecture provides:
- **Modularity**: Easy to modify individual components
- **Extensibility**: Simple to add new features
- **Maintainability**: Clear separation of concerns
- **Testability**: Dependency injection enables mocking
- **Scalability**: Foundation for future enhancements

The design follows SOLID principles and common patterns, making it familiar to most developers and easy to contribute to.

# Basic Usage Examples

## Example 1: Starting the Agent

```bash
npm run dev
```

Then select a model using arrow keys and press Enter.

## Example 2: Creating a New File

```
You: Create a new TypeScript file called utils/helper.ts with a function to capitalize strings

Agent: I'll create a helper utility file for you...

[The agent creates the file with the implementation]
```

## Example 3: Reading and Analyzing Code

```
You: Read the package.json file and tell me what dependencies we have

Agent: Let me read the package.json file...

[The agent reads and analyzes the dependencies]
```

## Example 4: Code Review

```
You: Can you review this function and suggest improvements?

function add(a, b) {
  return a + b
}

Agent: I'll review this function. Here are my suggestions:

1. Add TypeScript types for parameters and return value
2. Add input validation
3. Add JSDoc comments

Here's an improved version:

/**
 * Adds two numbers together
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 */
function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both arguments must be numbers');
  }
  return a + b;
}
```

## Example 5: Multi-step Project Setup

```
You: I want to create a new React component library. Set up the basic structure with:
1. A components directory
2. An index.ts barrel file
3. A Button component
4. A Card component

Agent: I'll set up the component library structure for you...

[The agent creates the directory structure and files]
```

## Example 6: Debugging Help

```
You: I'm getting an error "Cannot read property 'map' of undefined". Here's my code:

const MyComponent = ({ items }) => {
  return (
    <div>
      {items.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
};

Agent: The error occurs because 'items' might be undefined when the component first renders. Here's how to fix it:

1. Add a default value:
const MyComponent = ({ items = [] }) => {

2. Or add a conditional check:
{items && items.map(item => ...)}

3. Better yet, add TypeScript types:
interface Item {
  id: string;
  name: string;
}

interface MyComponentProps {
  items: Item[];
}

const MyComponent: React.FC<MyComponentProps> = ({ items = [] }) => {
  return (
    <div>
      {items.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
};
```

## Example 7: Using Different Models

```bash
# Use GPT-4
npm run dev chat --provider openai --model gpt-4

# Use Claude 3 Opus
npm run dev chat --provider anthropic --model claude-3-opus-20240229

# Use GPT-3.5 (faster, cheaper)
npm run dev chat --provider openai --model gpt-3.5-turbo
```

## Example 8: Configuration

```bash
# Set default provider
npm run dev config --set provider=anthropic

# Set default model
npm run dev config --set model=claude-3-sonnet-20240229

# View current config
npm run dev config --list
```

## Example 9: Project Analysis

```
You: Analyze my project structure and suggest improvements

Agent: I'll analyze your project structure...

Based on my analysis:

1. Project Structure: Good separation of concerns
2. Suggestions:
   - Consider adding a /tests directory
   - Add a /docs folder for documentation
   - Create a /scripts folder for build scripts
3. Missing files:
   - .editorconfig for consistent formatting
   - .prettierrc for code formatting
   - jest.config.js for testing
```

## Example 10: Refactoring

```
You: Refactor this code to use async/await instead of promises:

function fetchData() {
  return fetch('https://api.example.com/data')
    .then(response => response.json())
    .then(data => {
      console.log(data);
      return data;
    })
    .catch(error => {
      console.error(error);
      throw error;
    });
}

Agent: Here's the refactored version using async/await:

async function fetchData(): Promise<any> {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

This version is:
- More readable
- Easier to debug
- Better error handling
- Uses modern JavaScript syntax
```

## Tips for Best Results

1. **Be Specific**: The more specific your request, the better the result
2. **Provide Context**: Share relevant code when asking for help
3. **Iterate**: Don't hesitate to ask follow-up questions
4. **Use Examples**: Provide examples of what you want
5. **Be Patient**: Complex tasks may take a moment

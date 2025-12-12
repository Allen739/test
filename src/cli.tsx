#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { App } from './components/App';
import { configManager } from './utils/config';
import { AVAILABLE_MODELS } from './types';

const program = new Command();

program
  .name('code-agent')
  .description('A fully functional CLI coding agent built with React')
  .version('1.0.0');

program
  .command('chat')
  .description('Start an interactive chat session with the coding agent')
  .option('-m, --model <model>', 'Specify the model to use')
  .option('-p, --provider <provider>', 'Specify the provider (openai, anthropic, google, mistral)')
  .action((options) => {
    if (options.provider) {
      configManager.set('provider', options.provider);
    }
    if (options.model) {
      configManager.set('model', options.model);
    }

    render(<App />);
  });

program
  .command('models')
  .description('List all available models')
  .action(() => {
    console.log('\nAvailable Models:\n');
    AVAILABLE_MODELS.forEach((model) => {
      console.log(`  ${model.name}`);
      console.log(`    ID: ${model.id}`);
      console.log(`    Provider: ${model.provider}`);
      console.log(`    Max Tokens: ${model.maxTokens}`);
      console.log(`    Streaming: ${model.supportsStreaming ? 'Yes' : 'No'}`);
      console.log();
    });
  });

program
  .command('config')
  .description('Manage configuration')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-l, --list', 'List all configuration')
  .action((options) => {
    if (options.set) {
      const [key, value] = options.set.split('=');
      configManager.set(key, value);
      console.log(`Set ${key} = ${value}`);
    } else if (options.get) {
      const value = configManager.get(options.get);
      console.log(`${options.get} = ${value}`);
    } else if (options.list) {
      console.log('Current configuration:');
      console.log(JSON.stringify(configManager, null, 2));
    }
  });

// Default action
if (process.argv.length === 2) {
  render(<App />);
} else {
  program.parse();
}

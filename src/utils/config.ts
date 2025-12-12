import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ModelProvider, ModelConfig } from '../types';

dotenv.config();

export class ConfigManager {
  private configPath: string;
  private config: Record<string, any>;

  constructor() {
    this.configPath = path.join(process.cwd(), '.agent-config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): Record<string, any> {
    try {
      if (fs.existsSync(this.configPath)) {
        return fs.readJsonSync(this.configPath);
      }
    } catch (error) {
      console.warn('Failed to load config, using defaults');
    }
    return {};
  }

  saveConfig(): void {
    try {
      fs.writeJsonSync(this.configPath, this.config, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  get<T>(key: string, defaultValue?: T): T {
    return this.config[key] ?? defaultValue;
  }

  set(key: string, value: any): void {
    this.config[key] = value;
    this.saveConfig();
  }

  getModelConfig(provider?: ModelProvider, model?: string): ModelConfig {
    const selectedProvider = provider ||
      this.get<ModelProvider>('provider', process.env.DEFAULT_PROVIDER as ModelProvider || 'openai');

    const selectedModel = model ||
      this.get<string>('model', process.env.DEFAULT_MODEL || 'gpt-4');

    let apiKey = '';
    switch (selectedProvider) {
      case 'openai':
        apiKey = process.env.OPENAI_API_KEY || '';
        break;
      case 'anthropic':
        apiKey = process.env.ANTHROPIC_API_KEY || '';
        break;
      default:
        throw new Error(`Unsupported provider: ${selectedProvider}`);
    }

    if (!apiKey) {
      throw new Error(`API key not found for provider: ${selectedProvider}`);
    }

    return {
      provider: selectedProvider,
      model: selectedModel,
      apiKey,
      maxTokens: parseInt(process.env.MAX_TOKENS || '4096'),
      temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
    };
  }
}

export const configManager = new ConfigManager();

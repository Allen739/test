import { BaseModel } from './BaseModel';
import { OpenAIModel } from './OpenAIModel';
import { AnthropicModel } from './AnthropicModel';
import { ModelConfig, ModelProvider } from '../types';

export class ModelFactory {
  static createModel(config: ModelConfig): BaseModel {
    switch (config.provider) {
      case 'openai':
        return new OpenAIModel(config);
      case 'anthropic':
        return new AnthropicModel(config);
      case 'google':
        throw new Error('Google models not yet implemented');
      case 'mistral':
        throw new Error('Mistral models not yet implemented');
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }
}

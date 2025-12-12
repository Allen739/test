import Anthropic from '@anthropic-ai/sdk';
import { BaseModel } from './BaseModel';
import { Message, ModelConfig } from '../types';

export class AnthropicModel extends BaseModel {
  private client: Anthropic;

  constructor(config: ModelConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async chat(messages: Message[]): Promise<string> {
    try {
      // Separate system messages from user/assistant messages
      const systemMessages = messages.filter(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const systemPrompt = systemMessages.map(m => m.content).join('\n');

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature,
        system: systemPrompt || undefined,
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      });

      const textBlock = response.content.find(block => block.type === 'text');
      return textBlock && 'text' in textBlock ? textBlock.text : '';
    } catch (error: any) {
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  async chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    try {
      const systemMessages = messages.filter(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');

      const systemPrompt = systemMessages.map(m => m.content).join('\n');

      const stream = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature,
        system: systemPrompt || undefined,
        messages: conversationMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && 'delta' in event && event.delta.type === 'text_delta') {
          onChunk(event.delta.text);
        }
      }
    } catch (error: any) {
      throw new Error(`Anthropic API streaming error: ${error.message}`);
    }
  }
}

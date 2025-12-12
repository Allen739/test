import OpenAI from 'openai';
import { BaseModel } from './BaseModel';
import { Message, ModelConfig } from '../types';

export class OpenAIModel extends BaseModel {
  private client: OpenAI;

  constructor(config: ModelConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  async chat(messages: Message[]): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: this.formatMessages(messages) as any,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    try {
      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages: this.formatMessages(messages) as any,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk(content);
        }
      }
    } catch (error: any) {
      throw new Error(`OpenAI API streaming error: ${error.message}`);
    }
  }
}

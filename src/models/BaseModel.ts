import { Message, ModelConfig, AgentResponse } from '../types';

export abstract class BaseModel {
  protected config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  abstract chat(messages: Message[]): Promise<string>;
  abstract chatStream(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;

  protected formatMessages(messages: Message[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  getModelName(): string {
    return this.config.model;
  }

  getProvider(): string {
    return this.config.provider;
  }
}

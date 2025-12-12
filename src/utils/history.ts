import * as fs from 'fs-extra';
import * as path from 'path';
import { Message, ConversationHistory } from '../types';

export class HistoryManager {
  private historyDir: string;
  private currentSession: ConversationHistory | null = null;

  constructor(workingDirectory: string = process.cwd()) {
    this.historyDir = path.join(workingDirectory, '.agent-history');
    this.ensureHistoryDir();
  }

  private ensureHistoryDir(): void {
    fs.ensureDirSync(this.historyDir);
  }

  startSession(model: string): void {
    this.currentSession = {
      messages: [],
      timestamp: new Date(),
      model,
    };
  }

  addMessage(message: Message): void {
    if (this.currentSession) {
      this.currentSession.messages.push(message);
    }
  }

  async saveSession(): Promise<string> {
    if (!this.currentSession) {
      throw new Error('No active session to save');
    }

    const timestamp = this.currentSession.timestamp.toISOString().replace(/:/g, '-');
    const filename = `session-${timestamp}.json`;
    const filepath = path.join(this.historyDir, filename);

    await fs.writeJson(filepath, this.currentSession, { spaces: 2 });
    return filepath;
  }

  async loadSession(filename: string): Promise<ConversationHistory> {
    const filepath = path.join(this.historyDir, filename);
    return await fs.readJson(filepath);
  }

  async listSessions(): Promise<string[]> {
    const files = await fs.readdir(this.historyDir);
    return files.filter(f => f.startsWith('session-') && f.endsWith('.json'));
  }

  async getLastSession(): Promise<ConversationHistory | null> {
    const sessions = await this.listSessions();
    if (sessions.length === 0) {
      return null;
    }

    const lastSession = sessions.sort().reverse()[0];
    return await this.loadSession(lastSession);
  }

  getCurrentSession(): ConversationHistory | null {
    return this.currentSession;
  }

  async deleteSession(filename: string): Promise<void> {
    const filepath = path.join(this.historyDir, filename);
    await fs.remove(filepath);
  }

  async clearAllSessions(): Promise<void> {
    const sessions = await this.listSessions();
    for (const session of sessions) {
      await this.deleteSession(session);
    }
  }
}

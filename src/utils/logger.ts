import * as fs from 'fs-extra';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private logFile: string;
  private verbose: boolean;

  constructor(workingDirectory: string = process.cwd(), verbose: boolean = false) {
    this.logFile = path.join(workingDirectory, '.agent-logs', 'agent.log');
    this.verbose = verbose;
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    const logDir = path.dirname(this.logFile);
    fs.ensureDirSync(logDir);
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}\n`;
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFile, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  debug(message: string, ...args: any[]): void {
    const formatted = this.formatMessage(LogLevel.DEBUG, message);
    this.writeToFile(formatted);
    if (this.verbose) {
      console.debug(message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    const formatted = this.formatMessage(LogLevel.INFO, message);
    this.writeToFile(formatted);
    if (this.verbose) {
      console.info(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    const formatted = this.formatMessage(LogLevel.WARN, message);
    this.writeToFile(formatted);
    console.warn(message, ...args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    const errorDetails = error ? `\n${error.stack}` : '';
    const formatted = this.formatMessage(LogLevel.ERROR, message + errorDetails);
    this.writeToFile(formatted);
    console.error(message, error, ...args);
  }

  async clearLogs(): Promise<void> {
    try {
      await fs.remove(this.logFile);
      this.ensureLogDir();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  async getLogs(lines: number = 100): Promise<string[]> {
    try {
      const content = await fs.readFile(this.logFile, 'utf-8');
      const allLines = content.split('\n').filter(line => line.trim());
      return allLines.slice(-lines);
    } catch (error) {
      return [];
    }
  }
}

export const logger = new Logger();

import React, { useState, useRef, useEffect } from 'react';
import { ModelInfo } from '../../types';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: AgentAction[];
}

interface AgentAction {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'response';
  timestamp: Date;
  content: string;
  toolCall?: {
    id: string;
    name: string;
    parameters: any;
  };
  toolResult?: {
    id: string;
    name: string;
    result: any;
    error?: string;
  };
}

interface AgenticChatInterfaceProps {
  model: ModelInfo;
  onFileChange?: () => void;
}

export const AgenticChatInterface: React.FC<AgenticChatInterfaceProps> = ({
  model,
  onFileChange,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentActions, setCurrentActions] = useState<AgentAction[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, currentActions]);

  useEffect(() => {
    // Initialize Socket.io connection
    const initSocket = async () => {
      // First, ensure the socket.io server is initialized
      await fetch('/api/socket');

      const newSocket = io({
        path: '/api/socket',
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        setSocket(newSocket);

        // Initialize agent with selected model
        newSocket.emit('init_agent', {
          model: model.id,
          provider: model.provider,
        });
      });

      newSocket.on('agent_initialized', (data) => {
        console.log('Agent initialized:', data);
      });

      newSocket.on('agent_action', (action: AgentAction) => {
        console.log('Agent action:', action);
        setCurrentActions((prev) => [...prev, action]);

        // If file was written, trigger refresh
        if (
          action.type === 'tool_result' &&
          action.toolResult?.name === 'write_file' &&
          !action.toolResult.error
        ) {
          if (onFileChange) onFileChange();
        }
      });

      newSocket.on('chat_start', () => {
        setIsLoading(true);
        setStreamingContent('');
        setCurrentActions([]);
      });

      newSocket.on('chat_chunk', (data: { content: string }) => {
        setStreamingContent((prev) => prev + data.content);
      });

      newSocket.on('chat_complete', (data: any) => {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.text,
          timestamp: new Date(),
          actions: data.actions,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');
        setCurrentActions([]);
        setIsLoading(false);
      });

      newSocket.on('chat_error', (data: { message: string }) => {
        console.error('Chat error:', data.message);
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'system',
          content: `Error: ${data.message}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        setStreamingContent('');
        setCurrentActions([]);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !socket || !connected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Send message via WebSocket
    socket.emit('chat_message', { message: userMessage.content });
  };

  const renderAction = (action: AgentAction, index: number) => {
    if (action.type === 'tool_call') {
      return (
        <div
          key={index}
          className="flex items-center gap-2 text-xs text-yellow-400 mb-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <span>
            Using tool: <strong>{action.toolCall?.name}</strong>
          </span>
        </div>
      );
    }

    if (action.type === 'tool_result') {
      const success = !action.toolResult?.error;
      return (
        <div
          key={index}
          className={`flex items-center gap-2 text-xs mb-1 ${
            success ? 'text-green-400' : 'text-red-400'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            {success ? (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            )}
          </svg>
          <span>
            {success
              ? `✓ ${action.toolResult?.name} completed`
              : `✗ ${action.toolResult?.name} failed: ${action.toolResult?.error}`}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-800 to-gray-900">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Agentic AI Assistant
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{model.name}</p>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-700/50 rounded-full">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-300 font-medium">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p className="text-sm font-semibold">Autonomous AI Agent Ready</p>
              <p className="text-xs mt-1">
                I can read, write, and modify files automatically
              </p>
              <p className="text-xs mt-2 text-gray-600">
                Try: "Add error handling to the CodingAgent class"
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2.5 shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                        : message.role === 'system'
                        ? 'bg-gradient-to-br from-red-900 to-red-800 text-red-100 border border-red-700/50'
                        : 'bg-gradient-to-br from-gray-700 to-gray-750 text-gray-100 border border-gray-600/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {message.role === 'user'
                          ? 'You'
                          : message.role === 'system'
                          ? 'System'
                          : 'AI'}
                      </span>
                      <span className="text-xs opacity-60">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <div className="text-xs text-gray-400 mb-1">
                          Agent Actions:
                        </div>
                        {message.actions.map((action, idx) =>
                          renderAction(action, idx)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(streamingContent || currentActions.length > 0) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-700 text-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">AI</span>
                    <span className="text-xs opacity-60">Working...</span>
                  </div>
                  {currentActions.length > 0 && (
                    <div className="mb-2">
                      {currentActions.map((action, idx) => renderAction(action, idx))}
                    </div>
                  )}
                  {streamingContent && (
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {streamingContent}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isLoading && !streamingContent && currentActions.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></span>
                    </div>
                    <span className="text-xs text-gray-400">Initializing...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700/50 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to build or modify something..."
            className="flex-1 bg-gray-700/70 text-gray-100 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-700 border border-gray-600/30 placeholder-gray-400 transition-all"
            disabled={isLoading || !connected}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !connected}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2.5 font-medium transition-all shadow-lg hover:shadow-blue-500/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Working...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Try: "Create a login component" or "Add tests to the utils folder"
        </div>
      </form>
    </div>
  );
};

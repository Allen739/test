import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { CodingAgent } from '../agent/CodingAgent';

interface ChatProps {
  agent: CodingAgent;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const Chat: React.FC<ChatProps> = ({ agent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' && key.ctrl) {
      exit();
    }
  });

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setStreamingMessage('');

    try {
      await agent.chatStream(userMessage, (chunk) => {
        setStreamingMessage(prev => prev + chunk);
      });

      setMessages(prev => [...prev, { role: 'assistant', content: streamingMessage }]);
      setStreamingMessage('');
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" padding={1} marginBottom={1}>
        <Text bold color="cyan">
          Coding Agent Chat
        </Text>
        <Text dimColor>Press Ctrl+Q to quit</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        {messages.map((msg, idx) => (
          <Box key={idx} flexDirection="column" marginBottom={1}>
            <Text bold color={msg.role === 'user' ? 'green' : 'blue'}>
              {msg.role === 'user' ? 'You' : 'Agent'}:
            </Text>
            <Text>{msg.content}</Text>
          </Box>
        ))}

        {isLoading && streamingMessage && (
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color="blue">
              Agent:
            </Text>
            <Text>{streamingMessage}</Text>
          </Box>
        )}

        {isLoading && !streamingMessage && (
          <Box>
            <Text color="yellow">
              <Spinner type="dots" />
              {' Thinking...'}
            </Text>
          </Box>
        )}
      </Box>

      <Box>
        <Text bold color="green">
          {'> '}
        </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="Type your message..."
        />
      </Box>
    </Box>
  );
};

import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { ModelSelector } from './ModelSelector';
import { Chat } from './Chat';
import { CodingAgent } from '../agent/CodingAgent';
import { ModelFactory } from '../models/ModelFactory';
import { FileSystemManager } from '../utils/fileSystem';
import { configManager } from '../utils/config';
import { ModelInfo } from '../types';

export const App: React.FC = () => {
  const [agent, setAgent] = useState<CodingAgent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);

  const handleModelSelect = async (model: ModelInfo) => {
    try {
      setSelectedModel(model);
      const modelConfig = configManager.getModelConfig(model.provider, model.id);
      const modelInstance = ModelFactory.createModel(modelConfig);
      const fileSystem = new FileSystemManager(process.cwd());
      const agentInstance = new CodingAgent(modelInstance, fileSystem);
      setAgent(agentInstance);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box borderStyle="round" borderColor="red" padding={1}>
          <Text color="red" bold>
            Error: {error}
          </Text>
        </Box>
        <Text dimColor marginTop={1}>
          Make sure you have set up your API keys in the .env file
        </Text>
      </Box>
    );
  }

  if (!agent) {
    return <ModelSelector onSelect={handleModelSelect} />;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text dimColor>
          Using: <Text bold color="cyan">{selectedModel?.name}</Text>
        </Text>
      </Box>
      <Chat agent={agent} />
    </Box>
  );
};

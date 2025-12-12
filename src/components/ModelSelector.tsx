import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { AVAILABLE_MODELS, ModelInfo } from '../types';

interface ModelSelectorProps {
  onSelect: (model: ModelInfo) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ onSelect }) => {
  const items = AVAILABLE_MODELS.map(model => ({
    label: `${model.name} (${model.provider})`,
    value: model,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="round" borderColor="cyan" flexDirection="column" padding={1} marginBottom={1}>
        <Text bold color="cyan">
          Select AI Model
        </Text>
        <Text dimColor>Use arrow keys to navigate, Enter to select</Text>
      </Box>

      <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
    </Box>
  );
};

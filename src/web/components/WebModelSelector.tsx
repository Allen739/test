import React, { useState } from 'react';
import { AVAILABLE_MODELS, ModelInfo, ModelProvider } from '../../types';

interface WebModelSelectorProps {
  onSelect: (model: ModelInfo) => void;
}

export const ModelSelector: React.FC<WebModelSelectorProps> = ({ onSelect }) => {
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider | null>(null);

  const providers: ModelProvider[] = ['openai', 'anthropic', 'google', 'mistral'];
  const providerNames: Record<ModelProvider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    mistral: 'Mistral',
  };

  const getModelsByProvider = (provider: ModelProvider) => {
    return AVAILABLE_MODELS.filter((m) => m.provider === provider);
  };

  const handleProviderSelect = (provider: ModelProvider) => {
    setSelectedProvider(provider);
  };

  const handleModelSelect = (model: ModelInfo) => {
    onSelect(model);
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-400 mb-2">
            Choose Your AI Model
          </h2>
          <p className="text-gray-400">
            Select an AI provider and model to start building software
          </p>
        </div>

        {!selectedProvider ? (
          <div className="grid grid-cols-2 gap-4">
            {providers.map((provider) => {
              const models = getModelsByProvider(provider);
              const isAvailable = models.length > 0;

              return (
                <button
                  key={provider}
                  onClick={() => isAvailable && handleProviderSelect(provider)}
                  disabled={!isAvailable}
                  className={`
                    p-6 rounded-lg border-2 transition-all
                    ${
                      isAvailable
                        ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700 cursor-pointer'
                        : 'border-gray-700 bg-gray-750 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  <div className="text-xl font-semibold text-blue-400 mb-2">
                    {providerNames[provider]}
                  </div>
                  <div className="text-sm text-gray-400">
                    {isAvailable ? `${models.length} models` : 'Coming soon'}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedProvider(null)}
              className="text-sm text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to providers
            </button>

            <div className="space-y-3">
              {getModelsByProvider(selectedProvider).map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className="w-full p-4 rounded-lg border-2 border-gray-600 hover:border-blue-500 hover:bg-gray-700 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-blue-400 mb-1">
                        {model.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        Context: {model.maxTokens.toLocaleString()} tokens
                        {model.supportsStreaming && ' • Streaming enabled'}
                      </div>
                    </div>
                    <svg
                      className="w-6 h-6 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

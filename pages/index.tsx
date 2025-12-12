import React, { useState } from 'react';
import Head from 'next/head';
import { WebChatInterface } from '../src/web/components/WebChatInterface';
import { ModelSelector as WebModelSelector } from '../src/web/components/WebModelSelector';
import { FileExplorer } from '../src/web/components/FileExplorer';
import { CodeEditor } from '../src/web/components/CodeEditor';
import { AVAILABLE_MODELS, ModelInfo } from '../src/types';

export default function Home() {
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleModelSelect = (model: ModelInfo) => {
    setSelectedModel(model);
  };

  const handleFileSelect = (path: string, content: string) => {
    setCurrentFile(path);
    setFileContent(content);
  };

  return (
    <>
      <Head>
        <title>Software Builder - Terragon Labs</title>
        <meta name="description" content="AI-powered software building interface" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex h-screen bg-gray-900 text-gray-100">
        {/* Sidebar - File Explorer */}
        <div
          className={`${
            sidebarOpen ? 'w-64' : 'w-0'
          } transition-all duration-300 border-r border-gray-700 overflow-hidden`}
        >
          <FileExplorer onFileSelect={handleFileSelect} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                title="Toggle sidebar"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-blue-400">
                Software Builder
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {selectedModel ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Model:</span>
                  <span className="text-sm font-medium text-blue-400">
                    {selectedModel.name}
                  </span>
                  <button
                    onClick={() => setSelectedModel(null)}
                    className="text-xs text-gray-400 hover:text-gray-200 underline"
                  >
                    Change
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          {/* Model Selector or Main Interface */}
          {!selectedModel ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <WebModelSelector onSelect={handleModelSelect} />
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Code Editor Panel */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {currentFile ? (
                  <CodeEditor
                    file={currentFile}
                    content={fileContent}
                    onChange={(newContent) => setFileContent(newContent)}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto mb-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-lg">Select a file to edit</p>
                      <p className="text-sm mt-2">
                        or start chatting with the AI to build software
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Panel */}
              <div className="w-96 border-l border-gray-700 flex flex-col">
                <WebChatInterface model={selectedModel} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

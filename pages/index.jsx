"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = __importStar(require("react"));
const head_1 = __importDefault(require("next/head"));
const AgenticChatInterface_1 = require("../src/web/components/AgenticChatInterface");
const WebModelSelector_1 = require("../src/web/components/WebModelSelector");
const FileExplorer_1 = require("../src/web/components/FileExplorer");
const CodeEditor_1 = require("../src/web/components/CodeEditor");
const GitHubRepoSelector_1 = require("../src/web/components/GitHubRepoSelector");
const GitHubSettings_1 = require("../src/web/components/GitHubSettings");
const fa_1 = require("react-icons/fa");
function Home() {
    const [selectedModel, setSelectedModel] = (0, react_1.useState)(null);
    const [currentFile, setCurrentFile] = (0, react_1.useState)(null);
    const [fileContent, setFileContent] = (0, react_1.useState)('');
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(true);
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const [selectedRepo, setSelectedRepo] = (0, react_1.useState)(null);
    const fileExplorerRef = (0, react_1.useRef)(null);
    const handleModelSelect = (model) => {
        setSelectedModel(model);
    };
    const handleFileSelect = (path, content) => {
        setCurrentFile(path);
        setFileContent(content);
    };
    const handleFileChange = () => {
        // Refresh file explorer when agent modifies files
        if (fileExplorerRef.current && fileExplorerRef.current.refresh) {
            fileExplorerRef.current.refresh();
        }
    };
    return (<>
      <head_1.default>
        <title>Software Builder - Terragon Labs</title>
        <meta name="description" content="AI-powered software building interface"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </head_1.default>

      <div className="flex h-screen bg-gray-900 text-gray-100">
        {/* Sidebar - File Explorer */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-gray-700 overflow-hidden`}>
          <FileExplorer_1.FileExplorer ref={fileExplorerRef} onFileSelect={handleFileSelect}/>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg" title="Toggle sidebar">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Terragon Software Builder
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <GitHubRepoSelector_1.GitHubRepoSelector onSelect={setSelectedRepo} selectedRepo={selectedRepo}/>

                {selectedModel ? (<>
                    <div className="h-8 w-px bg-gray-700"></div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-center gap-1 text-yellow-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                        <span className="text-xs font-semibold">AGENTIC</span>
                      </div>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs font-medium text-blue-400">
                        {selectedModel.name}
                      </span>
                      <button onClick={() => setSelectedModel(null)} className="text-xs text-gray-400 hover:text-white underline ml-1">
                        Change
                      </button>
                    </div>
                  </>) : null}

                <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors" title="Settings">
                  <fa_1.FaCog className="w-5 h-5"/>
                </button>
              </div>
            </div>
          </header>

          {/* Model Selector or Main Interface */}
          {!selectedModel ? (<div className="flex-1 flex items-center justify-center p-8">
              <WebModelSelector_1.ModelSelector onSelect={handleModelSelect}/>
            </div>) : (<div className="flex-1 flex overflow-hidden">
              {/* Code Editor Panel */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {currentFile ? (<CodeEditor_1.CodeEditor file={currentFile} content={fileContent} onChange={(newContent) => setFileContent(newContent)}/>) : (<div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <p className="text-lg">Select a file to edit</p>
                      <p className="text-sm mt-2">
                        or start chatting with the AI to build software
                      </p>
                    </div>
                  </div>)}
              </div>

              {/* Chat Panel */}
              <div className="w-96 border-l border-gray-700 flex flex-col">
                <AgenticChatInterface_1.AgenticChatInterface model={selectedModel} onFileChange={handleFileChange}/>
              </div>
            </div>)}
        </div>

        {/* Settings Modal */}
        {showSettings && (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="max-w-2xl w-full">
              <GitHubSettings_1.GitHubSettings onClose={() => setShowSettings(false)}/>
            </div>
          </div>)}
      </div>
    </>);
}
//# sourceMappingURL=index.jsx.map
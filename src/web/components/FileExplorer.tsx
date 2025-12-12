import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileSelect: (path: string, content: string) => void;
}

export const FileExplorer = forwardRef<any, FileExplorerProps>(({ onFileSelect }, ref) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFileTree();
  }, []);

  const loadFileTree = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFileTree(data.files || []);
    } catch (error) {
      console.error('Failed to load file tree:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refresh: loadFileTree,
  }));

  const toggleDirectory = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = async (path: string) => {
    try {
      const response = await fetch(`/api/files/read?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      onFileSelect(path, data.content || '');
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const renderNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedDirs.has(node.path);
    const indent = depth * 12;

    if (node.type === 'directory') {
      return (
        <div key={node.path}>
          <div
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer text-sm"
            style={{ paddingLeft: `${indent + 12}px` }}
            onClick={() => toggleDirectory(node.path)}
          >
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
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
            <svg
              className="w-4 h-4 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="text-gray-300">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 cursor-pointer text-sm"
        style={{ paddingLeft: `${indent + 28}px` }}
        onClick={() => handleFileClick(node.path)}
      >
        <svg
          className="w-4 h-4 text-blue-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-gray-300">{node.name}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 overflow-y-auto">
      <div className="px-3 py-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-400 uppercase">
          Explorer
        </h3>
      </div>
      <div className="py-2">
        {fileTree.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            No files found
          </div>
        ) : (
          fileTree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
});

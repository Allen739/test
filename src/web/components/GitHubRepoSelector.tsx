import React, { useState, useEffect } from 'react';
import { FaGithub, FaSearch, FaStar, FaLock, FaUnlock } from 'react-icons/fa';

interface Repository {
  name: string;
  fullName: string;
  owner: string;
  description: string;
  private: boolean;
  url: string;
  defaultBranch: string;
  stars: number;
  language: string;
}

interface GitHubRepoSelectorProps {
  onSelect: (repo: Repository) => void;
  selectedRepo?: Repository;
}

export const GitHubRepoSelector: React.FC<GitHubRepoSelectorProps> = ({ onSelect, selectedRepo }) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const loadRepositories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/github/repos');
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setRepositories(data.repositories || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && repositories.length === 0) {
            loadRepositories();
          }
        }}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
      >
        <FaGithub className="text-white" />
        <span className="text-white text-sm">
          {selectedRepo ? selectedRepo.fullName : 'Select Repository'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-red-400 text-sm">
                <p className="font-semibold mb-1">Error loading repositories</p>
                <p>{error}</p>
                <button
                  onClick={loadRepositories}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm text-center">
                {searchTerm ? 'No repositories match your search' : 'No repositories found'}
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredRepos.map((repo) => (
                  <button
                    key={repo.fullName}
                    onClick={() => {
                      onSelect(repo);
                      setIsOpen(false);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium truncate">
                            {repo.name}
                          </span>
                          {repo.private ? (
                            <FaLock className="text-gray-400 text-xs flex-shrink-0" />
                          ) : (
                            <FaUnlock className="text-gray-400 text-xs flex-shrink-0" />
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-gray-400 text-xs mb-1 line-clamp-2">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FaStar className="text-yellow-500" />
                            {repo.stars}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

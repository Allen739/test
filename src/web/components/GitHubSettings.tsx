import React, { useState, useEffect } from 'react';
import { FaGithub, FaSave, FaKey, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface GitHubSettingsProps {
  onClose?: () => void;
}

export const GitHubSettings: React.FC<GitHubSettingsProps> = ({ onClose }) => {
  const [token, setToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkTokenStatus();
  }, []);

  const checkTokenStatus = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/github/status');
      const data = await response.json();
      setTokenStatus(data.configured ? 'valid' : 'unknown');
    } catch (err) {
      setTokenStatus('unknown');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Please enter a GitHub token' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/github/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'GitHub token saved successfully!' });
        setTokenStatus('valid');
        setToken('');
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save token' });
        setTokenStatus('invalid');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save token' });
      setTokenStatus('invalid');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Please enter a GitHub token' });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/github/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.valid) {
        setMessage({
          type: 'success',
          text: `Token is valid! Authenticated as ${data.user?.login || 'unknown user'}`
        });
        setTokenStatus('valid');
      } else {
        setMessage({ type: 'error', text: 'Token is invalid or expired' });
        setTokenStatus('invalid');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to test token' });
      setTokenStatus('invalid');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <FaGithub className="text-3xl text-white" />
        <div>
          <h2 className="text-xl font-bold text-white">GitHub Configuration</h2>
          <p className="text-gray-400 text-sm">Configure GitHub access for repository operations</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              <FaKey className="inline mr-2" />
              Personal Access Token
            </label>
            {tokenStatus !== 'unknown' && (
              <div className="flex items-center gap-1 text-xs">
                {tokenStatus === 'valid' ? (
                  <>
                    <FaCheckCircle className="text-green-500" />
                    <span className="text-green-500">Token configured</span>
                  </>
                ) : (
                  <>
                    <FaTimesCircle className="text-red-500" />
                    <span className="text-red-500">Token invalid</span>
                  </>
                )}
              </div>
            )}
          </div>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
          <p className="mt-2 text-xs text-gray-400">
            Create a token at{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              github.com/settings/tokens
            </a>
            {' '}with repo access
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-900/30 text-green-400 border border-green-700'
                : 'bg-red-900/30 text-red-400 border border-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing || saving}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Token'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || testing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave />
            {saving ? 'Saving...' : 'Save Token'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors ml-auto"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-sm font-semibold text-white mb-2">Required Permissions</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• <code className="text-gray-300">repo</code> - Full repository access</li>
          <li>• <code className="text-gray-300">read:org</code> - Read organization data</li>
          <li>• <code className="text-gray-300">workflow</code> - Update GitHub Actions (optional)</li>
        </ul>
      </div>
    </div>
  );
};

import type { NextApiRequest, NextApiResponse } from 'next';
import { configManager } from '../../../src/utils/config';
import { Octokit } from '@octokit/rest';
import {
  applyMiddleware,
  rateLimit,
  securityHeaders,
  validateBodySize,
  isValidGitHubToken,
  sanitizeError,
  logSecurityEvent,
} from '../../../src/utils/security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    // Validate token format
    if (!token || typeof token !== 'string') {
      logSecurityEvent('INVALID_TOKEN_FORMAT', { tokenLength: token?.length }, req);
      return res.status(400).json({ error: 'Token is required' });
    }

    // Check token format (basic validation)
    if (!isValidGitHubToken(token)) {
      logSecurityEvent('INVALID_TOKEN_PATTERN', { tokenPrefix: token.substring(0, 4) }, req);
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub token format. Please use a valid Personal Access Token.',
      });
    }

    // Validate token length to prevent DoS
    if (token.length > 200) {
      logSecurityEvent('TOKEN_TOO_LONG', { length: token.length }, req);
      return res.status(400).json({ error: 'Invalid token length' });
    }

    // Test the token with timeout
    try {
      const octokit = new Octokit({
        auth: token,
        request: {
          timeout: 5000, // 5 second timeout
        },
      });

      const { data } = await octokit.users.getAuthenticated();

      // Log successful configuration (without exposing token)
      logSecurityEvent('GITHUB_TOKEN_CONFIGURED', { username: data.login }, req);
    } catch (error: any) {
      logSecurityEvent('GITHUB_TOKEN_VALIDATION_FAILED', { error: error.message }, req);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired GitHub token',
      });
    }

    // Save the token securely
    configManager.setGitHubToken(token);

    res.status(200).json({ success: true });
  } catch (error: any) {
    logSecurityEvent('GITHUB_CONFIGURE_ERROR', { error: error.message }, req);
    res.status(500).json({
      success: false,
      error: sanitizeError(error),
    });
  }
}

export default applyMiddleware(handler, [
  securityHeaders,
  rateLimit(5, 60000), // 5 requests per minute
  validateBodySize(10 * 1024), // 10KB max
]);

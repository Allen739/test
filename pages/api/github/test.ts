import type { NextApiRequest, NextApiResponse } from 'next';
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

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required', valid: false });
    }

    // Validate token format
    if (!isValidGitHubToken(token)) {
      logSecurityEvent('INVALID_TOKEN_TEST', { tokenPrefix: token.substring(0, 4) }, req);
      return res.status(200).json({
        valid: false,
        error: 'Invalid GitHub token format',
      });
    }

    // Validate token length
    if (token.length > 200) {
      return res.status(400).json({ error: 'Invalid token length', valid: false });
    }

    try {
      const octokit = new Octokit({
        auth: token,
        request: {
          timeout: 5000, // 5 second timeout
        },
      });

      const { data } = await octokit.users.getAuthenticated();

      res.status(200).json({
        valid: true,
        user: {
          login: data.login,
          name: data.name,
          email: data.email,
        },
      });
    } catch (error: any) {
      logSecurityEvent('TOKEN_TEST_FAILED', { error: error.message }, req);
      res.status(200).json({
        valid: false,
        error: 'Invalid or expired token',
      });
    }
  } catch (error: any) {
    logSecurityEvent('GITHUB_TEST_ERROR', { error: error.message }, req);
    res.status(500).json({
      valid: false,
      error: sanitizeError(error),
    });
  }
}

export default applyMiddleware(handler, [
  securityHeaders,
  rateLimit(10, 60000), // 10 requests per minute
  validateBodySize(10 * 1024),
]);

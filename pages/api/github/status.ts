import type { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from '@octokit/rest';
import { configManager } from '../../../src/utils/config';
import {
  applyMiddleware,
  rateLimit,
  securityHeaders,
  sanitizeError,
  logSecurityEvent,
} from '../../../src/utils/security';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = configManager.getGitHubToken();

    if (!token) {
      return res.status(200).json({ configured: false });
    }

    // Test if token is valid
    try {
      const octokit = new Octokit({
        auth: token,
        request: {
          timeout: 5000, // 5 second timeout
        },
      });

      const { data } = await octokit.users.getAuthenticated();

      res.status(200).json({
        configured: true,
        user: {
          login: data.login,
          name: data.name,
          email: data.email,
        },
      });
    } catch (error) {
      // Token is configured but invalid
      logSecurityEvent('TOKEN_STATUS_INVALID', {}, req);
      res.status(200).json({ configured: false, invalid: true });
    }
  } catch (error: any) {
    logSecurityEvent('GITHUB_STATUS_ERROR', { error: error.message }, req);
    res.status(500).json({
      error: sanitizeError(error),
      configured: false,
    });
  }
}

export default applyMiddleware(handler, [
  securityHeaders,
  rateLimit(30, 60000), // 30 requests per minute
]);

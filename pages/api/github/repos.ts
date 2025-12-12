import type { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from '@octokit/rest';
import { configManager } from '../../../src/utils/config';
import {
  applyMiddleware,
  rateLimit,
  securityHeaders,
  sanitizeInput,
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
      return res.status(200).json({
        error: 'GitHub token not configured. Please configure your token in settings.',
        repositories: [],
      });
    }

    const { org, limit = 30 } = req.query;

    // Validate and sanitize inputs
    const sanitizedOrg = org && typeof org === 'string' ? sanitizeInput(org) : null;
    const parsedLimit = Math.min(Math.max(1, Number(limit) || 30), 100); // Limit between 1-100

    // Validate org name pattern if provided
    if (sanitizedOrg && !/^[a-zA-Z0-9-]{1,39}$/.test(sanitizedOrg)) {
      logSecurityEvent('INVALID_ORG_NAME', { org: sanitizedOrg }, req);
      return res.status(400).json({
        error: 'Invalid organization name format',
        repositories: [],
      });
    }

    const octokit = new Octokit({
      auth: token,
      request: {
        timeout: 10000, // 10 second timeout
      },
    });

    let repos;
    if (sanitizedOrg) {
      repos = await octokit.repos.listForOrg({
        org: sanitizedOrg,
        per_page: parsedLimit,
        sort: 'updated',
      });
    } else {
      repos = await octokit.repos.listForAuthenticatedUser({
        per_page: parsedLimit,
        sort: 'updated',
      });
    }

    // Sanitize response data
    const repositories = repos.data.map(repo => ({
      name: sanitizeInput(repo.name),
      fullName: sanitizeInput(repo.full_name),
      owner: sanitizeInput(repo.owner.login),
      description: repo.description ? sanitizeInput(repo.description) : null,
      private: Boolean(repo.private),
      url: repo.html_url,
      defaultBranch: repo.default_branch ? sanitizeInput(repo.default_branch) : 'main',
      stars: Math.max(0, repo.stargazers_count || 0),
      language: repo.language ? sanitizeInput(repo.language) : null,
    }));

    res.status(200).json({ repositories });
  } catch (error: any) {
    logSecurityEvent('GITHUB_REPOS_ERROR', { error: error.message }, req);
    res.status(500).json({
      error: sanitizeError(error),
      repositories: [],
    });
  }
}

export default applyMiddleware(handler, [
  securityHeaders,
  rateLimit(20, 60000), // 20 requests per minute
]);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const rest_1 = require("@octokit/rest");
const config_1 = require("../../../src/utils/config");
async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const token = config_1.configManager.getGitHubToken();
        if (!token) {
            return res.status(200).json({
                error: 'GitHub token not configured. Please configure your token in settings.',
                repositories: [],
            });
        }
        const octokit = new rest_1.Octokit({ auth: token });
        const { org, limit = 30 } = req.query;
        let repos;
        if (org && typeof org === 'string') {
            repos = await octokit.repos.listForOrg({
                org,
                per_page: Number(limit),
                sort: 'updated',
            });
        }
        else {
            repos = await octokit.repos.listForAuthenticatedUser({
                per_page: Number(limit),
                sort: 'updated',
            });
        }
        const repositories = repos.data.map(repo => ({
            name: repo.name,
            fullName: repo.full_name,
            owner: repo.owner.login,
            description: repo.description,
            private: repo.private,
            url: repo.html_url,
            defaultBranch: repo.default_branch,
            stars: repo.stargazers_count,
            language: repo.language,
        }));
        res.status(200).json({ repositories });
    }
    catch (error) {
        console.error('GitHub API error:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch repositories',
            repositories: [],
        });
    }
}
//# sourceMappingURL=repos.js.map
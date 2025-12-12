"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const config_1 = require("../../../src/utils/config");
const rest_1 = require("@octokit/rest");
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Token is required' });
        }
        // Test the token first
        try {
            const octokit = new rest_1.Octokit({ auth: token });
            await octokit.users.getAuthenticated();
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired GitHub token',
            });
        }
        // Save the token
        config_1.configManager.setGitHubToken(token);
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('GitHub configuration error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to configure GitHub token',
        });
    }
}
//# sourceMappingURL=configure.js.map
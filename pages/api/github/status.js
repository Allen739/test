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
            return res.status(200).json({ configured: false });
        }
        // Test if token is valid
        try {
            const octokit = new rest_1.Octokit({ auth: token });
            const { data } = await octokit.users.getAuthenticated();
            res.status(200).json({
                configured: true,
                user: {
                    login: data.login,
                    name: data.name,
                    email: data.email,
                },
            });
        }
        catch (error) {
            // Token is configured but invalid
            res.status(200).json({ configured: false, invalid: true });
        }
    }
    catch (error) {
        console.error('GitHub status error:', error);
        res.status(500).json({ error: error.message, configured: false });
    }
}
//# sourceMappingURL=status.js.map
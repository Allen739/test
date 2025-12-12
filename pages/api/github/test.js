"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const rest_1 = require("@octokit/rest");
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ error: 'Token is required', valid: false });
        }
        try {
            const octokit = new rest_1.Octokit({ auth: token });
            const { data } = await octokit.users.getAuthenticated();
            res.status(200).json({
                valid: true,
                user: {
                    login: data.login,
                    name: data.name,
                    email: data.email,
                },
            });
        }
        catch (error) {
            res.status(200).json({
                valid: false,
                error: error.message || 'Invalid token',
            });
        }
    }
    catch (error) {
        console.error('GitHub test error:', error);
        res.status(500).json({
            valid: false,
            error: error.message || 'Failed to test token',
        });
    }
}
//# sourceMappingURL=test.js.map
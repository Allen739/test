# Security Guidelines

## Overview

The Terragon Software Builder implements comprehensive security measures to protect against common web vulnerabilities and ensure safe operation.

## Security Features

### 1. Authentication & Token Security

- **GitHub Token Validation**: All GitHub tokens are validated before storage
  - Pattern matching for valid token formats (ghp_, gho_, github_pat_)
  - Token validation with GitHub API before accepting
  - Tokens never logged or exposed in error messages
  - 5-second timeout on validation requests

- **Secure Storage**:
  - API keys stored in `.env` files (git-ignored)
  - User tokens stored in `.agent-config.json` (git-ignored)
  - Tokens never transmitted in logs or error messages

### 2. Rate Limiting

All API endpoints have rate limiting to prevent abuse:
- `/api/github/configure`: 5 requests/minute
- `/api/github/repos`: 20 requests/minute
- `/api/github/test`: 10 requests/minute
- `/api/github/status`: 30 requests/minute

### 3. Input Validation & Sanitization

- **File Paths**: Protected against directory traversal (`..` detection)
- **Repository Names**: Validated against GitHub's naming conventions
- **Organization Names**: Pattern matching (alphanumeric + hyphens only)
- **Request Bodies**: Size limits enforced (10KB for sensitive endpoints)
- **Content Length**: All file operations limited to 10MB

### 4. Security Headers

All API responses include security headers:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'...
Strict-Transport-Security: max-age=31536000 (HTTPS only)
```

### 5. File System Protection

- **Directory Traversal Prevention**: All paths validated
- **Sensitive File Protection**: Blocks access to:
  - `.env` files
  - SSH keys (`id_rsa`, `id_dsa`, etc.)
  - Credentials and secrets files
  - Private keys
- **Size Limits**: 10MB maximum file size
- **Path Validation**: Only allows access within project directory
- **Null Byte Protection**: Rejects paths with null bytes

### 6. Error Handling

- **Sanitized Error Messages**: Production errors don't expose:
  - File paths
  - IP addresses
  - Email addresses
  - Internal stack traces
- **Security Event Logging**: All security events logged with context
- **No Information Leakage**: Generic error messages in production

### 7. GitHub Integration Security

- **Request Timeouts**: All GitHub API calls have timeouts (5-10s)
- **Scoped Tokens**: Only required permissions documented
- **Token Testing**: Tokens validated before use
- **Response Sanitization**: All GitHub responses sanitized

## Best Practices

### For Users

1. **Environment Variables**:
   ```bash
   # Always use .env for sensitive data
   GITHUB_TOKEN=ghp_your_token_here
   OPENAI_API_KEY=sk-your-key-here
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

2. **GitHub Token Permissions**:
   Create tokens with minimal required permissions:
   - `repo` - Repository access (required)
   - `read:org` - Organization data (optional)
   - `workflow` - Actions access (optional)

3. **Never Commit**:
   - `.env` files
   - `.agent-config.json`
   - Any files containing API keys or tokens

### For Developers

1. **Adding New Endpoints**:
   ```typescript
   import { applyMiddleware, rateLimit, securityHeaders } from '@/utils/security';

   async function handler(req, res) {
     // Your logic
   }

   export default applyMiddleware(handler, [
     securityHeaders,
     rateLimit(10, 60000),
     validateBodySize(10 * 1024)
   ]);
   ```

2. **Validating Input**:
   ```typescript
   import { sanitizeInput, isValidFilePath } from '@/utils/security';

   const userInput = sanitizeInput(req.body.input);
   if (!isValidFilePath(userInput)) {
     return res.status(400).json({ error: 'Invalid path' });
   }
   ```

3. **Logging Security Events**:
   ```typescript
   import { logSecurityEvent } from '@/utils/security';

   logSecurityEvent('SUSPICIOUS_ACTIVITY', { details }, req);
   ```

## Security Audit Checklist

- [x] Authentication tokens validated and secured
- [x] Rate limiting on all endpoints
- [x] Input validation and sanitization
- [x] Security headers implemented
- [x] Directory traversal protection
- [x] Sensitive file access blocked
- [x] File size limits enforced
- [x] Error messages sanitized
- [x] Request timeouts configured
- [x] HTTPS enforced (via headers)
- [x] XSS protection headers
- [x] CSRF considerations (API-only, no sessions)

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to: security@terragonlabs.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

## Security Updates

- Regular dependency updates via `npm audit`
- Security patches applied promptly
- Review of new features for security implications

## Compliance

This application follows:
- OWASP Top 10 security guidelines
- Node.js security best practices
- Next.js security recommendations
- GitHub API security guidelines

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [GitHub Token Security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)

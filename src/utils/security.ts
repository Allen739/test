import type { NextApiRequest, NextApiResponse } from 'next';
import * as crypto from 'crypto';

// Rate limiting store (in-memory, consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(limit: number = 10, windowMs: number = 60000) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const identifier = getClientIdentifier(req);
    const now = Date.now();

    const record = rateLimitStore.get(identifier);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
    }

    record.count++;
    return next();
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Input sanitization - remove potential XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Limit length to prevent DoS
}

/**
 * Validate GitHub token format
 */
export function isValidGitHubToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  // GitHub Personal Access Tokens format: ghp_[A-Za-z0-9]{36}
  // GitHub OAuth tokens format: gho_[A-Za-z0-9]{36}
  // Fine-grained tokens: github_pat_[A-Za-z0-9_]{82}
  const patterns = [
    /^ghp_[A-Za-z0-9]{36}$/,
    /^gho_[A-Za-z0-9]{36}$/,
    /^github_pat_[A-Za-z0-9_]{82}$/,
  ];

  return patterns.some(pattern => pattern.test(token));
}

/**
 * Validate file path to prevent directory traversal
 */
export function isValidFilePath(filePath: string): boolean {
  if (!filePath || typeof filePath !== 'string') return false;

  // Prevent directory traversal
  if (filePath.includes('..')) return false;
  if (filePath.startsWith('/')) return false;
  if (filePath.includes('~')) return false;

  // Prevent access to sensitive files
  const blacklist = [
    '.env',
    '.git',
    'node_modules',
    'package-lock.json',
    '.ssh',
    'id_rsa',
    'id_dsa',
    'authorized_keys',
    'credentials',
    'secrets',
  ];

  return !blacklist.some(blocked => filePath.toLowerCase().includes(blocked));
}

/**
 * Sanitize file content to prevent code injection
 */
export function sanitizeFileContent(content: string, maxSize: number = 1024 * 1024): string {
  if (typeof content !== 'string') return '';

  // Limit file size (default 1MB)
  if (content.length > maxSize) {
    throw new Error(`File content exceeds maximum size of ${maxSize} bytes`);
  }

  return content;
}

/**
 * Validate repository name format
 */
export function isValidRepoName(owner: string, repo: string): boolean {
  // GitHub username/org: 1-39 chars, alphanumeric and hyphens
  const ownerPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  // Repo name: 1-100 chars, alphanumeric, hyphens, underscores, dots
  const repoPattern = /^[a-zA-Z0-9._-]{1,100}$/;

  return ownerPattern.test(owner) && repoPattern.test(repo);
}

/**
 * Secure headers middleware
 */
export function securityHeaders(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
  );

  // Strict Transport Security (HTTPS only)
  if (req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

/**
 * Validate request body size
 */
export function validateBodySize(maxSize: number = 1024 * 1024) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');

    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request body too large',
        maxSize: `${maxSize} bytes`,
      });
    }

    next();
  };
}

/**
 * Middleware composer
 */
export function applyMiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  middlewares: Array<(req: NextApiRequest, res: NextApiResponse, next: () => void) => void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    let index = 0;

    const next = () => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        middleware(req, res, next);
      } else {
        handler(req, res);
      }
    };

    next();
  };
}

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeError(error: any): string {
  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    return 'An error occurred while processing your request';
  }

  // Remove sensitive information from error messages
  const message = error?.message || 'Unknown error';
  return message
    .replace(/\/[^\s]+\//g, '[PATH]') // Remove file paths
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]') // Remove IP addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]'); // Remove emails
}

/**
 * Log security events
 */
export function logSecurityEvent(event: string, details: any, req: NextApiRequest) {
  const timestamp = new Date().toISOString();
  const ip = getClientIdentifier(req);

  console.warn('[SECURITY]', timestamp, event, {
    ip,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ...details,
  });
}

/**
 * Validate API key/token without exposing it in logs
 */
export function validateToken(token: string | undefined): boolean {
  if (!token) return false;

  // Never log the actual token
  const isValid = typeof token === 'string' && token.length > 10;

  if (!isValid) {
    // Log attempt with masked value
    console.warn('[SECURITY] Invalid token attempt:', token?.substring(0, 4) + '****');
  }

  return isValid;
}

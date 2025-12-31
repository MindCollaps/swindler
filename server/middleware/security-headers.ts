// Log security headers initialization on first load
let securityHeadersInitialized = false;

export default defineEventHandler(event => {
    if (!securityHeadersInitialized) {
        console.log('[Security] Security headers middleware initialized');
        securityHeadersInitialized = true;
    }

    const headers = event.node.res;

    // Prevent MIME type sniffing
    headers.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    headers.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking
    headers.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Referrer Policy
    headers.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (restrict access to browser features)
    headers.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Content Security Policy
    const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-inline and unsafe-eval needed for Nuxt
        "style-src 'self' 'unsafe-inline'", // Note: unsafe-inline needed for Vue components
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss:", // Allow WebSocket connections for Socket.io
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
    ];
    headers.setHeader('Content-Security-Policy', cspDirectives.join('; '));

    // Strict Transport Security (HSTS) - only in production
    if (process.env.NODE_ENV === 'production') {
        headers.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
});

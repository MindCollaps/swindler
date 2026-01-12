# swindler-backend

## Development Environment

```bash
cp .env.example .env
```

```bash
curl -fsSL https://bun.sh/install | bash
```

```bash
bun dev
```

## Security Features

This project includes several security features to protect against common web vulnerabilities:

### Authentication & Authorization
- **JWT Authentication**: Uses RSA key pairs (RS256) for secure token signing
- **Session Management**: Redis-based session storage with configurable expiration
- **Rate Limiting**: Protection against brute force attacks
  - Login: 5 attempts per 15 minutes per IP
  - Signup: 3 attempts per hour per IP
- **Strong Password Requirements**: Enforced password complexity (uppercase, lowercase, numbers)

### Security Headers
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking attacks
- **Content-Security-Policy**: Restricts resource loading to prevent XSS
- **Strict-Transport-Security**: Enforces HTTPS in production
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser feature access

### Input Validation & Sanitization
- **Zod Schema Validation**: All API inputs are validated and sanitized
- **Prisma ORM**: Prevents SQL injection through parameterized queries
- **Input Trimming**: Automatic whitespace removal from user inputs

### Infrastructure Security
- **Non-root Docker User**: Application runs with limited privileges
- **Health Checks**: Docker and application-level health monitoring
- **Redis Authentication**: Password-protected Redis connections
- **Environment Variables**: Sensitive data stored in environment variables

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`: Admin account credentials (use strong passwords)
- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_USER`, `POSTGRES_PASSWORD`: Database credentials (use strong passwords)
- `REDIS_HOST`, `REDIS_PASSWORD`: Redis configuration (use strong passwords)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins for Socket.io (optional)

**Important**: Always use strong, unique passwords for production environments.
# Copilot Instructions for Swindler

## Project Overview

**Swindler** is a full-stack multiplayer word game application built with Nuxt 4, Vue 3, and TypeScript. It's a real-time game similar to "Among Us" but with words, where players try to identify the "imposter" who has a different word. The application uses Socket.io for real-time communication, Prisma with PostgreSQL for data persistence, and Redis for session management.

**Key Statistics:**
- ~95 TypeScript/Vue/JavaScript files (~7,900 lines of code)
- Framework: Nuxt 4.2.2 with Vue 3.5.26
- Runtime: Bun 1.3.5+ (packageManager specified in package.json)
- Languages: TypeScript, Vue 3 (Composition API), SCSS
- Database: PostgreSQL 15 with Prisma ORM 7.2.0
- Real-time: Socket.io 4.8.3 with Redis adapter

## Build & Development Process

### Prerequisites

**CRITICAL: You MUST use Bun as the package manager.** Node.js commands will not work correctly with this project.

1. **Install Bun 1.3.5+**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   source ~/.bash_profile  # or restart terminal
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - At minimum, set `DATABASE_URL` for Prisma generation to work
   - Example for local development without Docker:
     ```
     DATABASE_URL=postgresql://user:pass@localhost:5432/swindler
     ```

### Build Process (ALWAYS follow this exact order)

**Step 1: Install Dependencies**
```bash
bun install
```
This automatically runs `nuxt prepare` twice via postinstall hook.

**Step 2: Generate Prisma Client (REQUIRED before build)**
```bash
bun run prisma generate
```
⚠️ **CRITICAL:** If you skip this step, you will get TypeScript errors about missing `@prisma/client` exports (PrismaClient, User, Prisma types). The build will fail with errors like:
- "Module '@prisma/client' has no exported member 'PrismaClient'"
- "Module '@prisma/client' has no exported member 'User'"
- "Parameter 'w' implicitly has an 'any' type"

**Step 3: Build the Application**
```bash
bun run build
```
Takes ~60-90 seconds. Font provider warnings (Google Fonts, Bunny, etc.) are expected in sandboxed environments and do not affect the build.

### Linting Commands

**ALWAYS run linting before committing code changes.**

- **TypeScript/JavaScript linting:**
  ```bash
  bun run lint:ts        # Check only
  bun run lint:ts:fix    # Auto-fix
  ```

- **Style linting (SCSS/CSS/Vue):**
  ```bash
  bun run stylelint      # Check only
  bun run stylelint:fix  # Auto-fix
  ```

- **All linting at once:**
  ```bash
  bun run lint           # Check all
  bun run lint:fix       # Fix all
  ```

All linting commands should exit with code 0 (success) on this codebase.

### Docker Development (Recommended for full functionality)

The project uses Docker Compose with separate dev and prod configurations:

```bash
# Start development environment (app, PostgreSQL, Redis)
bun run dev
# OR manually:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop development environment
bun run dev:down

# Push database schema (after starting containers)
bun run db-push
```

**Local development without Docker:**
```bash
bun run dev:local
```
Requires PostgreSQL and Redis running separately. Port 3000 for app, 51212 for Prisma Studio.

### Database Commands

All database commands assume Docker containers are running:

- `bun run db-push` - Push schema changes (development)
- `bun run db-deploy` - Deploy migrations (production)
- `bun run db-drop` - Force reset database
- `bun run db-reset` - Complete reset with migrations

### Utility Scripts

- `bun run sort` - Sort wordlists in `.config/wordlists/` (Python script)
- `bun run atlas` - Generate avatar atlas (Python script, requires Pillow)

## Project Architecture

### Directory Structure

```
/
├── .config/              # Docker configs, scripts, wordlists
│   ├── Dockerfile        # Production Docker build
│   ├── Dockerfile.dev    # Development Docker build
│   ├── entrypoint.sh     # Production startup script
│   ├── entrypoint.dev.sh # Dev startup script (includes Prisma Studio)
│   ├── wordlists/        # Game word lists (.txt files)
│   ├── sort_wordlists.py
│   └── generate_avatar_atlas.py
│
├── .github/
│   └── workflows/
│       └── docker-publish.yml  # CI: Build & push Docker image to GHCR
│
├── app/                  # Frontend Nuxt application
│   ├── components/       # Vue components
│   │   ├── avatar/
│   │   ├── common/
│   │   ├── game/
│   │   ├── views/
│   │   └── word/
│   ├── composables/      # Vue composables
│   │   └── sockets/
│   ├── layouts/          # Nuxt layouts
│   ├── pages/            # Nuxt pages/routes
│   │   ├── game/
│   │   ├── lobby/
│   │   └── wordlist/
│   ├── plugins/          # Vue plugins
│   ├── scss/             # Global SCSS (colors, variables)
│   ├── store/            # Pinia stores
│   └── utils/            # Frontend utilities
│
├── server/               # Backend Nitro server
│   ├── api/v1/           # API endpoints
│   │   ├── auth/         # Authentication endpoints
│   │   ├── users/
│   │   ├── wordlists/
│   │   └── words/
│   ├── middleware/       # Server middleware
│   ├── plugins/          # Server plugins
│   ├── routes/           # Custom routes (health, logout)
│   ├── socket.io/        # Socket.io handlers
│   └── utils/            # Backend utilities
│       ├── auth/         # JWT, session management
│       ├── backend/      # Business logic (user, wordlists)
│       ├── crypto/       # Encryption utilities
│       └── game/         # Game logic
│
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration files
│
├── modules/              # Nuxt modules
│   └── styles.ts         # Dynamic SCSS variable generation
│
├── types/                # TypeScript type definitions
│   ├── data.ts
│   ├── fetch.ts
│   ├── game-state.ts
│   ├── redis.ts
│   ├── socket.ts
│   └── word.ts
│
├── public/               # Static assets
│   └── resources/
│       └── avatar/       # Avatar image parts
│
├── nuxt.config.ts        # Nuxt configuration
├── tsconfig.json         # TypeScript config (extends .nuxt/tsconfig.json)
├── eslint.config.mjs     # ESLint flat config
├── stylelint.config.js   # Stylelint config
├── prisma.config.ts      # Prisma configuration
├── package.json          # Dependencies and scripts
└── bun.lock              # Bun lockfile
```

### Key Configuration Files

- **nuxt.config.ts**: Nuxt 4 config with WebSocket support, modules (Pinia, Image, Motion, Fonts, Scripts), TypeScript checking enabled
- **eslint.config.mjs**: Flat config with @stylistic/eslint-plugin, strict Vue rules (4-space indent, single quotes, stroustrup brace style)
- **stylelint.config.js**: SCSS/Vue linting with clean-order plugin
- **prisma/schema.prisma**: Database models (User, WordList, Word, FlaggedWord, etc.)
- **package.json**: Bun 1.3.5 package manager, all scripts use `bun run`

## Coding Conventions

### TypeScript/JavaScript
- **Indentation:** 4 spaces (enforced by ESLint)
- **Quotes:** Single quotes for strings
- **Semicolons:** Always use
- **Brace style:** Stroustrup (else/catch on new line)
- **Spacing:** Spaces inside curly braces: `{ foo }`, template literals: `${ variable }`
- **Imports:** Top-level type imports: `import type { ... }`
- **Vue:** Composition API with `<script lang="ts" setup>`, kebab-case components (except `<Icon>`)
- **Vue macro order:** defineOptions, defineProps, defineEmits, defineSlots, defineExpose
- **Vue block order:** template, script, style
- **Type safety:** `noImplicitAny: true`, explicit types for parameters

### SCSS/CSS
- **Indentation:** 4 spaces
- **Vue scoping:** Use `<style lang="scss" scoped>`
- **Global imports:** `colors.scss` and `variables.scss` auto-imported via `additionalData`
- **Order:** Properties ordered via stylelint-config-clean-order

### File Naming
- **Vue components:** PascalCase.vue (e.g., `PlayerList.vue`)
- **Pages/Layouts:** kebab-case or lowercase (Nuxt convention)
- **TypeScript files:** kebab-case.ts

### Security Practices
- **Input validation:** All API inputs validated with Zod schemas
- **Authentication:** JWT with RS256 (RSA key pairs in .pem files)
- **Rate limiting:** Applied to auth endpoints (5 login attempts per 15min, 3 signups per hour)
- **SQL injection prevention:** Prisma parameterized queries only
- **Security headers:** X-Content-Type-Options, X-Frame-Options, CSP, HSTS
- **Sanitization:** Input trimming, no v-html usage

## CI/CD Pipeline

### GitHub Actions Workflow (.github/workflows/docker-publish.yml)

**Trigger:** Push to `main` branch with changes to:
- `app/**`, `server/**`, `public/**`, `prisma/**`, `modules/**`
- `.config/entrypoint.sh`, `nuxt.config.ts`, `package.json`, `bun.lock`, `tsconfig.json`

**Process:**
1. Checkout repository
2. Login to GitHub Container Registry (ghcr.io)
3. Extract metadata (tags: latest, sha)
4. Build Docker image using `.config/Dockerfile`
5. Push to `ghcr.io/mindcollaps/swindler`

**Docker Build Process (in .config/Dockerfile):**
1. Builder stage (oven/bun:1-alpine):
   - Install Node.js (required for Nuxt build)
   - Run `bun install`
   - Set DATABASE_URL (build-time arg)
   - Run `prisma generate`, `bun run prepare`, `nuxt build`
2. Runner stage (node:20-alpine):
   - Install wget (for healthcheck)
   - Create non-root user `app`
   - Copy built artifacts (.output, node_modules, prisma, wordlists)
   - Expose port 3000
   - Run `entrypoint.sh` (migrate deploy + start server)

## Known Issues & Workarounds

### TODO Comments in Codebase
Several endpoints have TODO comments indicating incomplete features:
- `server/api/v1/auth/reset.post.ts` - Password reset not implemented
- `server/api/v1/auth/email/verify.post.ts` - Email verification not implemented
- `server/api/v1/users/me.get.ts` - User profile not implemented
- `server/api/v1/wordlists/[id].put.ts` - Word ID assignment needs improvement
- `server/api/v1/wordlists/[id].delete.ts` - Shared playlists and in-use checks missing
- `server/utils/backend/wordlists.ts` - Automated deletion comment

These are acceptable as-is; don't modify unless explicitly tasked.

### Font Provider Warnings During Build
Expected warnings during `bun run build` about Google Fonts, Bunny, Fontshare, Fontsource being unreachable. This is normal in sandboxed/offline environments and doesn't affect the build. The project uses local icon collections (`@iconify-json/material-symbols`).

### Prisma Client Generation Requirement
Always run `bun run prisma generate` after:
- Fresh clone / `bun install`
- Schema changes in `prisma/schema.prisma`
- Before running `bun run build`

### Docker Compose Overrides
Development uses two compose files:
- Base: `docker-compose.yml` (production-like)
- Dev overlay: `docker-compose.dev.yml` (volume mounts, dev build, Prisma Studio)

Always use both for development: `-f docker-compose.yml -f docker-compose.dev.yml`

## Testing & Validation

**No automated test suite exists.** Validation is manual:

1. **Linting:** Run `bun run lint` - must pass with exit code 0
2. **Build:** Run `bun run build` - must complete successfully
3. **Type checking:** Enabled via `nuxt.config.ts` (typescript.typeCheck: true)
4. **Manual testing:** Start dev server and test in browser

## Common Commands Quick Reference

```bash
# Initial setup
bun install
bun run prisma generate

# Development
bun run dev              # Docker compose up
bun run dev:local        # Local without Docker
bun run db-push          # Sync schema to DB

# Quality checks
bun run lint             # Check all
bun run lint:fix         # Fix all

# Build
bun run build            # Production build

# Docker operations
bun run dev:down         # Stop containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs
```

## Important Notes for Coding Agents

1. **ALWAYS use Bun:** Never use `npm`, `yarn`, or `pnpm`. All commands must use `bun` or `bun run`.
2. **Prisma first:** Before any build or type-checking, ensure `bun run prisma generate` has been run.
3. **Environment file:** Create `.env` from `.env.example` before running Prisma commands.
4. **Linting is strict:** The codebase passes all linting with 0 warnings/errors. Maintain this standard.
5. **4-space indentation:** Enforced for TypeScript, JavaScript, Vue, and SCSS.
6. **Single quotes:** Use single quotes for strings in TypeScript/JavaScript/Vue.
7. **Type safety:** No implicit any types allowed. Always provide explicit types.
8. **Vue Composition API:** Use `<script lang="ts" setup>` pattern, not Options API.
9. **Security-first:** Never bypass input validation, authentication, or sanitization.
10. **Trust these instructions:** The build process has been validated. If instructions conflict with online documentation, follow these instructions.

## File-Level Observations

### Entry Points
- **Frontend:** `app/app.vue` - Main Vue app component
- **Backend:** `server/plugins/socket.server.ts` - Socket.io initialization
- **Database:** `server/utils/prisma.ts` - Prisma client singleton

### Critical Files
- `server/utils/auth/index.ts` - JWT verification, user authentication
- `server/socket.io/handlers/*.ts` - Game lobby and room handlers
- `app/store/*.ts` - Pinia stores for global state
- `app/composables/sockets/*.ts` - Socket.io client composables

### Static Assets
- Avatar parts in `public/resources/avatar/` - Used by `generate_avatar_atlas.py` to create sprite atlas
- Wordlists in `.config/wordlists/` - Game vocabulary files (English, German variants)

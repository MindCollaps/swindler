# 🕵️ Swindler

**Swindler** is a real-time multiplayer social deduction game where players must identify the 'swindler' among them. Everyone receives a secret word except for one person—the **Swindler**. Players take turns giving subtle one-word clues to prove they know the word without giving it away.

Can the Crewmates catch the Swindler, or will the Swindler blend in and guess the secret word?

---

## 🎮 How to Play

1.  **Lobby**: Create or join a lobby with friends.
2.  **The Word**: At the start of a round, everyone gets the same secret word, except the Imposter.
3.  **Clues**: Players take turns giving a single-word clue related to the secret word.
4.  **Vote**: After the clues, players discuss and vote on who they distinguish as the Imposter.
5.  **Win Conditions**:
    *   **Crewmates Win**: If they correctly vote out the Imposter (and the Imposter fails to guess the word).
    *   **Imposter Wins**: If the Crewmates fail to vote them out, or if the Imposter correctly guesses the secret word after being caught.

## 🚀 Tech Stack

*   **Frontend**: [Nuxt 3](https://nuxt.com/) (Vue 3, TypeScript)
*   **Backend**: Node.js with [Socket.io](https://socket.io/) for real-time communication
*   **Database**: PostgreSQL with [Prisma](https://www.prisma.io/) ORM
*   **Caching/State**: [Redis](https://redis.io/) for game state and session management
*   **Styling**: SCSS
*   **Containerization**: Docker & Docker Compose

---

## 🛠️ Development

### Prerequisites
- [Bun](https://bun.sh/)
- Docker & Docker Compose

### Quick Start

1.  **Clone the repository**
2.  **Environment Setup**
    Copy the example environment file:
    ```bash
    cp .env.example .env
    ```
3.  **Run Development Server**
    Start the application and required services (Postgres, Redis) using the dev script:
    ```bash
    bun dev
    ```
    This command spins up the Docker containers and starts the Nuxt development server.

---

## 🔒 Security Features

This project implements robust security measures to ensure safe gameplay and data protection.

### Authentication & Authorization
- **JWT Authentication**: Secure token signing using RS256 key pairs.
- **Session Management**: Redis-backed sessions with configurable expiration.
- **Rate Limiting**:
  - Login: 5 attempts / 15 mins
  - Signup: 3 attempts / 1 hour
- **Password Security**: Strong complexity enforcement (uppercase, lowercase, numbers).

### Infrastructure & Data
- **Container Security**: Application runs as a non-root Docker user.
- **Database**: SQL injection protection via Prisma ORM parameterized queries.
- **Input Validation**: All API inputs are validated and sanitized (Zod).
- **Redis Security**: Password-protected Redis connections.

### Headers & Policies
- Content-Security-Policy (CSP)
- X-Content-Type-Options (MIME sniffing prevention)
- X-Frame-Options (Clickjacking prevention)
- Strict-Transport-Security (HSTS)

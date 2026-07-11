# Changelog

## v0.0.8-alpha
### ✉️ Email System
- 🧱 **Email Infrastructure**: Added SMTP-based transactional email sending with file-based Handlebars templates in `server/emails/templates/`
- 📨 **Template Coverage**: Added templates for account creation, password reset requests, and password-reset success notifications
- 🔧 **Environment Support**: Added app URL and SMTP configuration examples in `.env.example`
- 🔁 **Verification Resend Endpoint**: Added `POST /api/v1/auth/email/resend` to resend verification emails for unverified accounts
- 🔗 **URL Rendering Fix**: Fixed escaped query-string links in email templates so reset/verify links render with `token=` correctly

### 🔐 Authentication & Verification
- ✅ **Email Verification Required**: New accounts now receive verification emails and must verify before login
- 🔗 **Verification Links**: Added token-based email verification flow with dedicated verification endpoints
- 🔒 **Login Gate**: Login now blocks unverified accounts with a clear response message

### 🗝️ Password Recovery
- 📮 **Reset Request Endpoint**: Added endpoint to request password reset emails without leaking account existence
- ♻️ **Reset Confirm Endpoint**: Added token-based password reset confirmation endpoint
- 🧠 **Secure Tokens**: Added Redis-backed, expiring token handling for reset and verification flows
- 🧭 **Reset Password Page**: Added `/reset-password` UI flow for both requesting reset emails and submitting new passwords via token links

### 🧑‍💻 Login UX
- 🆘 **Forgot Password Entry Point**: Added `Forgot password?` link on login page
- 🧾 **Verification Prompt**: Added inline login prompt with resend button when login fails due to unverified email

### 🧪 Developer Testing
- 🖨️ **Console Email Logging**: Added env-controlled email payload logging for debugging
- 🚫 **Log-Only Mode**: Added dry-run mode to render/log emails without sending through SMTP

## v0.0.7-alpha
### ✨ Core Improvements
- 🔌 **Socket State Refactor**: Refactored game and lobby socket handling to use dedicated stores with cleaner lifecycle management and reconnect behavior
- 🔄 **Realtime Reliability**: Added ordered game update metadata and stale patch protection to prevent out-of-order client state regressions
- 🗳️ **Voting Stability**: Hardened vote flow and phase guards in socket handlers to avoid invalid state transitions

### 🔐 API & Backend
- 🔑 **Password Reset Endpoint**: Implemented authenticated password reset with current password verification and session invalidation
- ✅ **Email Verification Endpoint**: Implemented authenticated email verification with idempotent handling for already verified users
- 👤 **Profile Endpoint**: Implemented authenticated `users/me` endpoint to return current user profile data
- 📚 **Wordlist Access Control**: Centralized wordlist permission logic and improved shared/private access checks across get/update/delete
- 🧹 **Wordlist Safety**: Added in-use guardrails for deletes and improved cleanup behavior for unused words

### 🧪 Testing & Quality
- ✅ **Expanded Test Coverage**: Added and updated tests for socket lifecycle helpers, rehydrate scheduling, update ordering, and validation contracts
- 🧰 **Lint & Type Hygiene**: Resolved lint/style issues introduced during refactors and aligned updated files with project standards

### 🎨 UX & Accessibility
- 📱 **Lobby/Game Loading UX**: Improved loading states and status messaging on lobby and game screens
- ♿ **A11y Improvements**: Added `aria-live` enhancements and clearer form labeling in key user flows
- 📝 **Copy Consistency Pass**: Standardized wordlist UI and backend error/success wording for clearer player feedback

### 🐛 Bug Fixes
- 🏁 **End-Game Transition**: Fixed a state-routing issue where rounds ending from swindler guess could skip the game-end screen
- 🎮 **Next Game Flow**: Fixed next-game progression so it transitions directly into the next game instead of routing back to lobby
- 🃏 **Role Deal Reliability**: Fixed intermittent role-deal reveal issues during game-to-game transitions and prevented backdrop-only overlay states
- 🎨 **Role Deal Styling**: Fixed undefined SCSS variable usage in `RoleDeal` shadow styling

## v0.0.6-alpha
### 🧪 Error Checks & Stability
- 🚨 **Global Error Page**: Added a dedicated app error view for clearer failure handling and recovery
- ✅ **Input Hardening**: Improved shared input components with stronger validation and error-state behavior
- 🧯 **Flow Guards**: Added additional defensive checks across game and lobby related UI flows

### 🎨 UX Polish
- 🧩 **Auth Page Improvements**: Refined login and signup flows for clearer feedback and cleaner interactions
- 👤 **Profile & Dashboard Polish**: Improved profile and dashboard presentation and consistency
- 🧭 **Lobby & Menu Cleanup**: Updated lobby and navigation-related views with small usability refinements

### 🖌️ Styling & Layout
- 📐 **Layout Tuning**: Updated layout utilities and page structure for more consistent spacing and behavior
- 🎛️ **SCSS Variable Updates**: Refined shared style variables and layout styling

### 🛠️ Developer Experience
- 🤖 **Design Skills Added**: Added curated design skill packs and lockfile updates for agent-assisted design workflows

## v.0.0.5-alpha
### ✨ Design overhaul
- New design of the entire game
- Got a homepage now
- More statistics

## v.0.0.4-alpha.5
### 🐛 Bug Fixes & Improvements
- 🐳 **Coolify auto deployment**: Prepared Git automation configuration to enable auto deploy in coolify
- 🕵️ **Avatar Local Storage**: Fixed a bug where the end game screen is not shown

## v0.0.4-alpha.4
### ✨ Better Accessibility
- 📱 **QR Code**: Added a QR code to the lobby screen for easier joining
- 🔤 **Simpler Join Codes**: Updated join code generation to create simpler, more memorable codes for players to join games
- 🚫 **Whitespaces Ignored**: Fixed issue where whitespaces were being considered
- 🐳 **Fixed Building of Next Container**: Updated Git automation configuration to fix building of next container of dev branc

## v0.0.4-alpha.3
### ✏️ Typing animation
- ✨ **Typing Animation**: Added a typing animation component to indicate when players are typing clues or guesses
- 🐳 **New Container**: Updated Git automation configuration to include next container of dev branch

## v0.0.4-alpha.2

### 🚀 No need for an account
- 🙎 **Fake User Creation**: Users can now create a fake user to play without an account

## v0.0.4-alpha.1

### 🎨 UI & Visual Improvements
- 📱 **Mobile**: Improvement for mobile view of the game


## v0.0.4-alpha

### ✨ New Features
- 👁️ **Spectator Mode**: Players can now spectate ongoing games without participating
- 🎮 **Lobby Return**: Games can now be returned to the lobby and continued afterward with more people
- 💾 **Persistent Results**: Game results are now saved and persistent
- 🎭 **Swindler Reveal**: See the swindler's guess displayed in the game end screen
- 🗨️ **Toast Notifications**: Added a common toast component for error messages and notifications
- 📊 **Version Display**: Version information now shown as a dedicated component
- 🔄 **Changelog**: The changelog you are reading is displayed

### 🎨 UI & Visual Improvements
- 🙎 **Avatar Update**: Added 1 new character body to the avatar atlas
- 🔤 **Font Fixes**: Corrected font styling across the application

### 🐛 Bug Fixes & Improvements
- ⚡ **Performance**: Fixed lagging issues when gamestate changes (#43)
- 🚫 **Empty Clue Prevention**: Frontend now prevents submitting empty clues (#48)
- 🔒 **Join Restrictions**: Players cannot join games that are already in progress (#42)
- 🎯 **Error Handling**: Implemented basic error handler to emit error messages to frontend (#51, #48)
- 📋 **Wordlist Fix**: Centered wordlist name display (#50)
- 🎲 **Game State**: Various game state management improvements (#46, #54)
- 🕵️ **Avatar Local Sotrage**: The avatar is now saved in the local Storage instead of in a cookie

### 🏗️ Developer Experience {develop}
- �️ **Avatar Atlas**: Added `add` command to easily add new avatar parts
- �🐳 **Devcontainer**: Added devcontainer configuration for smoother GitHub Codespaces experience
- 🐋 **Docker Performance**: Docker environment now uses dev-only optimizations
- 🔧 **Redis Configuration**: Fixed Redis setup and configuration
- 📖 **Documentation**: Updated README with correct dev setup instructions

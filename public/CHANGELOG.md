# Changelog

## v0.0.4-alpha

### ✨ New Features
- 👁️ **Spectator Mode**: Players can now spectate ongoing games without participating
- 🎮 **Lobby Return**: Games can now be returned to the lobby and continued afterward
- 💾 **Persistent Results**: Game results are now saved and persistent
- 🎭 **Imposter Reveal**: See the imposter's guess displayed in the game end screen
- 🗨️ **Toast Notifications**: Added a common toast component for error messages and notifications
- 📊 **Version Display**: Version information now shown as a dedicated component

### 🎨 UI & Visual Improvements
- 🙎 **Avatar Update**: Added 1 new character body to the avatar atlas
- 👄 **Mouth Animation**: Characters now have animated mouths
- 🔄 **Avatar Turning**: Avatars can now turn and face different directions
- 📝 **Wordlist Display**: Centered wordlist name for better visual alignment
- 🔤 **Font Fixes**: Corrected font styling across the application

### 🐛 Bug Fixes & Improvements
- ⚡ **Performance**: Fixed lagging issues when gamestate changes (#43)
- 🚫 **Empty Clue Prevention**: Frontend now prevents submitting empty clues (#48)
- 🔒 **Join Restrictions**: Players cannot join games that are already in progress (#42)
- 🎯 **Error Handling**: Implemented basic error handler to emit error messages to frontend (#51, #48)
- 📋 **Wordlist Fix**: Centered wordlist name display (#50)
- 🎲 **Game State**: Various game state management improvements (#46, #54)

### 🏗️ Developer Experience
- 🐳 **Devcontainer**: Added devcontainer configuration for smoother GitHub Codespaces experience
- 🐋 **Docker Performance**: Docker environment now uses dev-only optimizations
- 🔧 **Redis Configuration**: Fixed Redis setup and configuration
- 📖 **Documentation**: Updated README with correct dev setup instructions
- 🎨 **Formatting**: Added formatting configuration for consistent code style
- ✅ **Linting**: Applied linting fixes across the codebase


# Changelog

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
- 🎭 **Imposter Reveal**: See the imposter's guess displayed in the game end screen
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

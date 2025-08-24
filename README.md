# Recettier

**Store recipes. Build lists. Cook faster.**

A modern React PWA for managing recipes, ingredients, and shopping lists with Google Drive storage.

## � Security & Privacy

- **No API Keys in Code**: Users provide their own Google API keys through a secure interface
- **Local Encryption**: API keys are encrypted using Web Crypto API and stored in IndexedDB
- **Your Data, Your Control**: All data stays in your Google Drive, no third-party servers
- **Privacy First**: No tracking, analytics, or external data collection

## �🚀 Features

- **Recipe Management**: Store and organize your favorite recipes
- **Smart Shopping Lists**: Generate shopping lists from your recipes
- **Ingredient Registry**: Centralized ingredient database with auto-complete
- **Google Drive Storage**: Your data stays in your own Google Drive
- **Responsive Design**: Works great on desktop and mobile
- **Offline Ready**: Built with PWA capabilities

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Material-UI v7 with custom theme
- **Authentication**: Google OAuth 2.0
- **Storage**: Google Drive API
- **State Management**: Zustand + React Context
- **Deployment**: GitHub Pages

## 🛠️ Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

### Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and configure Google OAuth
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📋 Requirements

- Node.js 20+
- Google Cloud Project with Drive API enabled
- Modern web browser

### Getting Your Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API
4. Create credentials (API Key)
5. Add the API key through the app's Settings page

**Note**: The app will guide you through this process on first use.

---

*Built with ❤️ for home cooks who love to stay organized*

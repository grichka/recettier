# Recettier

**Store recipes. Build lists. Cook faster.**

A modern React PWA for managing recipes, ingredients, and shopping lists with Google Drive storage.

## 🚀 Features

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
- Google OAuth 2.0 credentials
- Modern web browser

---

*Built with ❤️ for home cooks who love to stay organized*

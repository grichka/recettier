# Recettier

**Store recipes. Build lists. Cook faster.**

A modern React SPA for managing recipes, ingredients, and shopping lists with Google Drive storage.

## 🚀 Features

- **Recipe Management**: Store and organize your favorite recipes
- **Smart Shopping Lists**: Generate shopping lists from your recipes
- **Ingredient Registry**: Centralized ingredient database with auto-complete
- **Google Drive Storage**: Your data stays in your own Google Drive
- **Responsive Design**: Works great on desktop and mobile
- **Offline Ready**: Built with PWA capabilities (coming soon)

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Material-UI v7 with custom theme
- **Authentication**: Google OAuth 2.0
- **Storage**: Google Drive API
- **State Management**: Zustand + React Context
- **Deployment**: GitHub Pages

## 🎯 Current Status

✅ **Completed**: Core structure, authentication, navigation, and dashboard  
🚧 **In Progress**: This is the initial setup with working authentication and UI  
📋 **Planned**: Recipe CRUD, shopping lists, Google Drive integration

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

- Node.js 20+ (recommended)
- Google OAuth 2.0 credentials
- Modern web browser

## 🎨 Screenshots

*Dashboard showing welcome message and quick stats*

## 🤝 Contributing

This is a single-user application designed for personal recipe management. Feel free to fork and customize for your own needs!

## 📄 License

MIT License - feel free to use this as a starting point for your own recipe management app.

---

*Built with ❤️ for home cooks who love to stay organized*

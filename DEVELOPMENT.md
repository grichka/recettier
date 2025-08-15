# Recettier - Development Setup

## Overview

Recettier is a React SPA built with Vite, Material UI, and Google OAuth for authentication. It stores data in Google Drive and is deployed on GitHub Pages.

## Project Structure

```
src/
├── components/
│   ├── common/
│   ├── layout/
│   │   ├── Layout.tsx
│   │   └── Navigation.tsx
│   ├── recipe/
│   ├── shopping/
│   └── ingredient/
├── contexts/
│   └── AuthContext.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── RecipesPage.tsx
│   ├── ShoppingPage.tsx
│   ├── IngredientsPage.tsx
│   └── SettingsPage.tsx
├── services/
│   └── googleAuth.ts
├── types/
│   ├── auth.ts
│   ├── recipe.ts
│   └── index.ts
└── utils/
    └── theme.ts
```

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI v7
- **Authentication**: Google OAuth 2.0
- **Storage**: Google Drive API
- **State Management**: Zustand + React Context
- **Deployment**: GitHub Pages

## Features Implemented

✅ **Core Structure**
- React TypeScript project with Vite
- Material-UI theme and components
- Responsive layout with navigation
- Protected routes based on authentication

✅ **Authentication**
- Google OAuth 2.0 integration
- AuthContext for state management
- Login/logout functionality
- User profile display

✅ **UI Components**
- Navigation with mobile drawer
- Dashboard with stats cards
- Login page with Google sign-in
- Placeholder pages for future features

✅ **Development Setup**
- TypeScript configuration
- ESLint setup
- Environment variables
- GitHub Pages deployment config

## Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add your domain to authorized origins
   - Update `.env` with your credentials:
     ```
     VITE_GOOGLE_CLIENT_ID=your_actual_client_id
     VITE_GOOGLE_API_KEY=your_actual_api_key
     ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to GitHub Pages
- `npm run lint` - Run ESLint

## Development Notes

### Node.js Compatibility
- The current Vite version requires Node.js 20+
- If using Node.js 18, you may encounter compatibility issues
- Consider upgrading Node.js or using older versions of dependencies

### Google OAuth Setup
- Requires valid Google OAuth credentials to function
- Local development works with demo credentials for UI testing
- Authentication will fail without proper setup

### Architecture Decisions
- Using simple state management instead of complex router
- Material-UI Grid replaced with CSS Grid for better compatibility
- TypeScript strict mode enabled for better type safety

## Next Steps

The application structure is ready for implementing:

1. **Recipe Management**
   - CRUD operations for recipes
   - Google Drive integration
   - Image upload and storage

2. **Shopping Lists**
   - Generate lists from recipes
   - Mark items as purchased
   - Share lists functionality

3. **Ingredient Registry**
   - Centralized ingredient database
   - Auto-complete for recipe input
   - Nutritional information

4. **Data Synchronization**
   - Google Drive file operations
   - Offline caching with IndexedDB
   - Conflict resolution

## Deployment

The application is configured for GitHub Pages deployment:

1. Update `base` in `vite.config.ts` to match your repository name
2. Run `npm run deploy`
3. Configure GitHub Pages to serve from `gh-pages` branch

## Troubleshooting

### Build Issues
- Ensure Node.js version compatibility
- Clear `node_modules` and reinstall if needed
- Check TypeScript compilation errors

### Authentication Issues
- Verify Google OAuth credentials
- Check authorized domains in Google Console
- Ensure HTTPS in production

### Deployment Issues
- Verify GitHub Pages settings
- Check repository name in vite config
- Ensure gh-pages branch exists
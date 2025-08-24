# Recettier - Development Setup

## Overview

Recettier is a React PWA built with Vite, Material UI, and Google OAuth for authentication. It stores data in Google Drive and is deployed on GitHub Pages.

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI v7
- **Authentication**: Google OAuth 2.0
- **Storage**: Google Drive API
- **State Management**: Zustand + React Context
- **Deployment**: GitHub Pages

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

## Deployment

The application is configured for GitHub Pages deployment:

1. Update `base` in `vite.config.ts` to match your repository name
2. Run `npm run deploy`
3. Configure GitHub Pages to serve from `gh-pages` branch

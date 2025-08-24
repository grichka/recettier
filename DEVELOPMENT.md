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
   - Update `.env` with your Client ID only:
     ```
     VITE_GOOGLE_CLIENT_ID=your_actual_client_id
     ```

3. **Important Security Note:**
   - **Google API keys are no longer stored in environment variables** for security
   - Users provide their own API keys through the app interface
   - API keys are encrypted and stored securely in the browser using IndexedDB
   - This ensures that sensitive credentials are never exposed in the frontend code

## Security Architecture

### API Key Management
- **Client ID**: Safely stored in environment variables (public by design)
- **API Key**: User-provided and encrypted using Web Crypto API
- **Storage**: IndexedDB with AES-GCM encryption
- **Key Derivation**: PBKDF2 with device-specific salt and session identifier

### Security Features
- API keys are never transmitted in network requests
- Keys are encrypted at rest using browser's native crypto APIs
- Automatic key expiration (30 days)
- Session-based encryption keys that don't persist across browser restarts
- No sensitive data in built frontend code

### User Workflow
1. User visits Settings page
2. Provides their own Google API key from Google Cloud Console
3. Key is encrypted and stored locally
4. App uses encrypted key for Google Drive operations
5. User can update or remove key at any time

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

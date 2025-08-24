import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/apis\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apis-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
            },
          },
        ],
      },
      includeAssets: ['recettier.png'],
      manifest: {
        name: 'Recettier - Recipe Manager',
        short_name: 'Recettier',
        description: 'Store recipes. Build lists. Cook faster.',
        theme_color: '#2E7D32',
        background_color: '#FAFAFA',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/recettier/',
        start_url: '/recettier/',
        categories: ['food', 'lifestyle', 'productivity'],
        prefer_related_applications: false,
        icons: [
          {
            src: '/recettier/recettier.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/recettier/recettier.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Add Recipe',
            short_name: 'Add Recipe',
            description: 'Quickly add a new recipe',
            url: '/recettier/recipes?action=add',
            icons: [
              {
                src: '/recettier/recettier.png',
                sizes: '96x96'
              }
            ]
          },
          {
            name: 'Shopping List',
            short_name: 'Shopping',
            description: 'View shopping lists',
            url: '/recettier/shopping',
            icons: [
              {
                src: '/recettier/recettier.png',
                sizes: '96x96'
              }
            ]
          }
        ]
      }
    })
  ],
  base: '/recettier/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      // Add security headers for development
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
})

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa.png'],
      manifest: {
        name: 'Col. Henry Kwaku Badasu Portfolio',
        short_name: 'Col. Badasu',
        description: 'Professional portfolio of Col. Henry Kwaku Badasu, Senior Army Officer of the Ghana Armed Forces.',
        theme_color: '#1f5c3a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa.png',
            sizes: '1254x1254',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa.png',
            sizes: '1254x1254',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
})

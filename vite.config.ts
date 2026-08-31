import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Expose Cloudinary env to process for local api/gallery.js runtime
  process.env.CLOUDINARY_CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME
  process.env.CLOUDINARY_API_KEY = env.CLOUDINARY_API_KEY
  process.env.CLOUDINARY_API_SECRET = env.CLOUDINARY_API_SECRET
  process.env.CLOUDINARY_GALLERY_ROOT = env.CLOUDINARY_GALLERY_ROOT || 'colonel-badasu'

  return {
    server: {
      proxy: {
        '/api/gallery': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
        },
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
    ]
  }
})

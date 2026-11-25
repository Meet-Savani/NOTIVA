import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function spaPrerenderPlugin() {
  return {
    name: 'spa-prerender',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist')
      const indexPath = path.join(distDir, 'index.html')
      if (fs.existsSync(indexPath)) {
        // 1. Create 404.html (Render's automatic fallback for static sites)
        fs.copyFileSync(indexPath, path.join(distDir, '404.html'))

        // 2. Pre-generate physical route folders with index.html for instant 200 OK
        const routes = ['dashboard', 'admin', 'login', 'signup', 'admin/login']
        for (const route of routes) {
          const routeDir = path.join(distDir, route)
          fs.mkdirSync(routeDir, { recursive: true })
          fs.copyFileSync(indexPath, path.join(routeDir, 'index.html'))
        }
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaPrerenderPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['react-icons'],
          'vendor-utils': ['axios', 'moment', 'react-modal']
        }
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@pagepersonai/shared': path.resolve(__dirname, '../shared/dist/index.js'),
      '@shared': path.resolve(__dirname, '../shared/dist'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Environment file configuration
  envDir: path.resolve(__dirname, '..'),
  envPrefix: 'VITE_',
  build: {
    // Optimize for better SEO and performance
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('react-markdown')) {
              return 'markdown';
            }
            if (id.includes('@auth0/auth0-react')) {
              return 'auth';
            }
            if (id.includes('@headlessui/react')) {
              return 'ui';
            }
            return 'vendor';
          }
          if (id.includes('PersonaSelector')) {
            return 'personas';
          }
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize chunk size limit
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Better development experience
    port: 5173,
    host: true,
    // Enable HMR for better development
    hmr: {
      overlay: true,
    },
  },
  preview: {
    port: 5173,
    host: true,
  },
  // SEO and performance optimizations
  define: {
    // Enable production optimizations
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@auth0/auth0-react',
      '@headlessui/react',
      'react-markdown',
    ],
  },
})

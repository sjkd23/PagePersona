import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
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
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'auth-vendor': ['@auth0/auth0-react'],
          'ui-vendor': ['@headlessui/react', 'react-markdown'],
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

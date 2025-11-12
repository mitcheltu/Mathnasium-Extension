import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'public/background.js'),
        injector: resolve(__dirname, 'src/inject-components.jsx')
      },
      output: {
        entryFileNames: chunk => {
          if (chunk.name === 'injector') return 'inject-react.js'
          if (chunk.name === 'background') return 'background.js'
          return 'assets/[name].js'
        },
        manualChunks: undefined
      }
    },
    cssCodeSplit: false,
    minify: false
  }
})
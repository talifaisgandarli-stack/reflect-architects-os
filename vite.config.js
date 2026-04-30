import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// build: 2026-04-30
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  oxc: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))

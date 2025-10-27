
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Expose environment variables to the client.
    // This makes 'process.env.API_KEY' available in the code,
    // and Vite will replace it with the value of VITE_API_KEY during build.
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY),
  },
  build: {
    outDir: 'build'
  }
})
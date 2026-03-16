import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { checker } from "vite-plugin-checker";
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    checker({ 
      typescript: {
        tsconfigPath: './tsconfig.app.json'
      },
     })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5183, 
  },
  base: mode === 'production' || mode === 'prod-local' || mode === 'dev-staging' ? '/customer-hub' : '/'
}))

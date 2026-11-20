/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

export default defineConfig({
  // Rutas relativas: dist/ funciona en cualquier carpeta o hosting estático.
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // Los datos de los ~1000 clubes van en un chunk propio (≈ 130 KB comprimido) que el navegador cachea.
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        // Trozos separados que el navegador cachea por su cuenta.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\/](react|react-dom|scheduler)[\/]/ },
            { name: 'vendor', test: /node_modules/ },
            { name: 'data', test: /src[\/]data[\/]/ },
            { name: 'engine', test: /src[\/]engine[\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

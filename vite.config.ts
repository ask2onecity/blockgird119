import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util', 'assert', 'http', 'https', 'os', 'zlib', 'crypto', 'url', 'net', 'tls'],
      globals: { Buffer: true, process: true },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env': {},
  },
});

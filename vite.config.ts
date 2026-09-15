import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the lightweight voice-assistant 3D core (three/R3F) out of the
        // main app chunk. It is only loaded lazily on the Talk page.
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('@react-three') ||
            id.includes('three-stdlib') ||
            id.includes('/three/') ||
            id.includes('node_modules/three/dist')
          ) {
            return 'voice-3d';
          }
          return undefined;
        },
      },
    },
  },
});

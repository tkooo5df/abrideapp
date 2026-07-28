import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/components/ui': path.resolve(__dirname, './src/components/ui'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/integrations': path.resolve(__dirname, './src/integrations'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
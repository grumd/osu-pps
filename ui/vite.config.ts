import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), visualizer()],
  server: {
    open: true,
    proxy: {
      '/local-api': {
        target: 'http://localhost:5174',
        rewrite: (path) => path.replace(/^\/local-api/, ''),
      },
    },
  },
});

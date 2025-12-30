import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set the base to match your GitHub Pages repository name
  base: '/ACB-planner/',
  build: {
    outDir: 'dist',
  },
});

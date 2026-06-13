import react from '@vitejs/plugin-react';
import { build } from 'vite';

await build({
  base: './',
  plugins: [react()],
});

import react from '@vitejs/plugin-react';
import { createServer } from 'vite';

const portArgIndex = process.argv.indexOf('--port');
const port = portArgIndex >= 0 ? Number(process.argv[portArgIndex + 1]) : 5173;

const server = await createServer({
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port,
  },
});

await server.listen();
server.printUrls();

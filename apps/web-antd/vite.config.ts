import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

export default defineConfig(async (config) => {
  const env = loadEnv(config.mode, process.cwd(), '');
  const proxyTarget =
    env.VITE_API_PROXY_TARGET || 'http://localhost:5320/api';

  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            target: proxyTarget,
            ws: true,
          },
        },
      },
    },
  };
});

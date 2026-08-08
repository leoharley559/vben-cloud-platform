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
          // resource 上传/列表需保留 /api 前缀（对齐旧站 UPLOAD_MD5_IMG）
          '/api/resource': {
            changeOrigin: true,
            target: proxyTarget,
            ws: true,
          },
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

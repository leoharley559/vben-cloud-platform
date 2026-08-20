import type { Plugin } from 'vite';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const appVersionFile = path.resolve(appRoot, 'src/app-version.json');

function emitAppVersionPlugin(): Plugin {
  return {
    apply: 'build',
    generateBundle() {
      const meta = JSON.parse(fs.readFileSync(appVersionFile, 'utf8')) as {
        version?: string;
      };
      const payload = {
        buildTime: new Date().toISOString(),
        version: String(meta.version || '').trim(),
      };
      this.emitFile({
        fileName: 'version.json',
        source: `${JSON.stringify(payload, null, 2)}\n`,
        type: 'asset',
      });
    },
    name: 'emit-app-version',
  };
}

export default defineConfig(async (config) => {
  const env = loadEnv(config.mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5320/api';

  return {
    application: {},
    vite: {
      plugins: [emitAppVersionPlugin()],
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

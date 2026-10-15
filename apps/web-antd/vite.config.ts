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
          // 目标为站点根（如 https://cloud.dk888.link）时保留 /api，由对方 Nginx 反代到后端。
          // 勿再 rewrite 掉 /api：剥掉后会打到静态页 HTML，登录验证码等接口会失败。
          '/api': {
            changeOrigin: true,
            target: proxyTarget,
            ws: true,
          },
        },
      },
    },
  };
});

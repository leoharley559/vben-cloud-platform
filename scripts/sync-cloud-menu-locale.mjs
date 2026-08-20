/**
 * 从 cloudPlatform/src/lang/zh-CN.js 同步菜单中文文案
 * 用法：node scripts/sync-cloud-menu-locale.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.resolve(rootDir, '../cloudPlatform/src/lang/zh-CN.js');
const targetPath = path.resolve(
  rootDir,
  'apps/web-antd/src/locales/cloud-platform/zh-CN-menu.json',
);

function loadZhCN() {
  let code = fs.readFileSync(sourcePath, 'utf8');
  code = code.replace(/^export default\s*/, 'module.exports=');
  return new Function(`${code}\n;return module.exports;`)();
}

function main() {
  const locale = loadZhCN();
  const menu = {};

  for (const [key, value] of Object.entries(locale)) {
    if (
      /^[a-z][\w]*$/i.test(key) &&
      typeof value === 'string' &&
      value &&
      /[\u4E00-\u9FFF]/.test(value)
    ) {
      menu[key] = value;
    }
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(menu, null, 2)}\n`);
  console.log(`Synced ${Object.keys(menu).length} keys -> ${targetPath}`);
}

main();

import zhCNMenu from '#/locales/cloud-platform/zh-CN-menu.json';

const menuLocaleMap = zhCNMenu as Record<string, string>;

/**
 * 将后端 Nav.Name（i18n key）转为中文菜单标题
 * 数据来源：cloudPlatform/src/lang/zh-CN.js
 */
export function translateMenuTitle(key?: string) {
  if (!key) {
    return '';
  }

  const translated = menuLocaleMap[key];
  if (translated) {
    return translated;
  }

  // 已是中文则原样返回
  if (/[\u4e00-\u9fff]/.test(key)) {
    return key;
  }

  return key;
}

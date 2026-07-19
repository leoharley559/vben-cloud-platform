import { SECURITY_PATHS } from '#/constants/security-paths';
import { translateMenuTitle } from '#/utils/menu-i18n';

function translatePathSegment(
  segment: string | { key: string; params?: Record<string, string> },
) {
  if (typeof segment === 'string') {
    if (/[\u4e00-\u9fff]/.test(segment)) {
      return segment;
    }
    return translateMenuTitle(segment);
  }

  const label = translateMenuTitle(segment.key);
  if (!segment.params) {
    return label;
  }
  return Object.entries(segment.params).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    label,
  );
}

export function getSecurityPathName(pageId: number | string) {
  const paths = SECURITY_PATHS.filter((item) => item.key === Number(pageId));
  if (!paths.length) {
    return '';
  }

  return paths
    .map((path) => {
      const segments = path.pathArr.map((item) => translatePathSegment(item));
      if (path.actions?.length) {
        segments.push(
          path.actions.map((action) => translateMenuTitle(action)).join('/'),
        );
      }
      return segments.join(' - ');
    })
    .join('\n');
}

export function isSecurityPathActive(pageId: number | string) {
  const path = SECURITY_PATHS.find((item) => item.key === Number(pageId));
  return !!path?.active;
}

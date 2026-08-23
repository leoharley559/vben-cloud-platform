import { useCloudPlatformStore } from '#/store/cloud-platform';

export interface SecuritySettingItem {
  [key: string]: unknown;
  IsOpen?: boolean;
  PageId?: number | string;
}

/** 判断页面是否开启谷歌验证码等安全校验 */
export function checkSecured(pageId?: number | string) {
  if (pageId === 'root') {
    return true;
  }
  if (pageId === undefined || pageId === null || pageId === '') {
    return false;
  }

  const cloudStore = useCloudPlatformStore();
  const securedList = (cloudStore.projectConfig?.SecuritySetting ||
    []) as SecuritySettingItem[];

  const node = securedList.find(
    (item) => String(item.PageId) === String(pageId),
  );
  return !!(node && node.IsOpen);
}

/** 员工账号管理安全页 ID */
export const ADMIN_MANAGE_SECURITY_PAGE_ID = 19;

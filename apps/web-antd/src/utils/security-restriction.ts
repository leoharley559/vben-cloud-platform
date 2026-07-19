import { useCloudPlatformStore } from '#/store/cloud-platform';

import { checkSecured } from '#/components/security/security-utils';

/** 同人操作限制（对齐 cloudPlatform security/utils.js） */
export function isSameAcctActionRestricted(
  pageId: number | string,
  acct?: number | string,
  type: 'Id' | 'Username' = 'Id',
) {
  if (
    !checkSecured(pageId) ||
    acct === undefined ||
    acct === null ||
    acct === ''
  ) {
    return false;
  }
  const cloudStore = useCloudPlatformStore();
  const admin = cloudStore.adminInfo?.Admin as
    | Record<string, unknown>
    | undefined;
  if (!admin) {
    return false;
  }
  return String(acct) === String(admin[type]);
}

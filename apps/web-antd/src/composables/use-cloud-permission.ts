import { storeToRefs } from 'pinia';

import { useCloudPlatformStore } from '#/store/cloud-platform';
import {
  checkPermission,
  checkPermissionByKey,
  checkPermissionWithKey,
} from '#/utils/permission';

export function useCloudPermission() {
  const cloudStore = useCloudPlatformStore();
  const { adminInfo, projectConfig, roles } = storeToRefs(cloudStore);

  return {
    adminInfo,
    checkPermission: (mode?: number | string) => checkPermission(mode),
    checkPermissionByKey,
    checkPermissionWithKey,
    projectConfig,
    roles,
  };
}

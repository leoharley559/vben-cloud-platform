import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useCloudPlatformStore } from '#/store/cloud-platform';
import type { PackageOption } from '#/types/system-manage';

export function useOperationOptions() {
  const cloudStore = useCloudPlatformStore();
  const { projectConfig } = storeToRefs(cloudStore);

  const packageOptions = computed<PackageOption[]>(() => {
    const list = projectConfig.value?.RealPackageIdNameMap;
    const normalized = Array.isArray(list) ? [...list] : [];
    normalized.unshift({
      AdminId: '',
      PackageId: '',
      PackageName: '全部产品',
    });
    return normalized;
  });

  const memberTypeOptions = [
    { label: '全部', value: 2 },
    { label: '正式', value: 0 },
    { label: '测试', value: 1 },
  ];

  return {
    memberTypeOptions,
    packageOptions,
  };
}

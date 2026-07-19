import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useCloudPlatformStore } from '#/store/cloud-platform';
import type { PackageOption } from '#/types/system-manage';

export function useAdminProjectOptions() {
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

  const channelOptions = computed(() => {
    const list = projectConfig.value?.ChildChannelInfo;
    if (!Array.isArray(list)) {
      return [];
    }
    return list.map((item) => {
      const channel = item as Record<string, unknown>;
      return {
        label: `${channel.ChannelId}(${channel.ChannelName})`,
        value: String(channel.ChannelId ?? ''),
      };
    });
  });

  const deviceOptions = computed(() => {
    const map = projectConfig.value?.DevicePlatformAll as
      | Record<string, string>
      | undefined;
    if (!map) {
      return [];
    }
    return Object.entries(map).map(([value, label]) => ({
      label,
      value,
    }));
  });

  return {
    channelOptions,
    deviceOptions,
    packageOptions,
  };
}

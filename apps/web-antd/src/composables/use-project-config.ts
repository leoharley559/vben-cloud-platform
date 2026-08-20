import { computed } from 'vue';

import { storeToRefs } from 'pinia';

import { useCloudPlatformStore } from '#/store/cloud-platform';

/** 全局读取项目配置（登录后由 getProjectConfigApi 写入 store） */
export function useProjectConfig() {
  const cloudStore = useCloudPlatformStore();
  const { projectConfig } = storeToRefs(cloudStore);

  return {
    projectConfig,
    projectConfigValue: computed(() => projectConfig.value),
  };
}

import type {
  CloudNavItem,
  CloudProjectConfig,
  CloudRole,
  CloudUserData,
} from '#/types/cloud-platform';

import { ref } from 'vue';

import { defineStore } from 'pinia';

export const useCloudPlatformStore = defineStore('cloud-platform', () => {
  const navMenus = ref<CloudNavItem[]>([]);
  const projectConfig = ref<CloudProjectConfig | null>(null);
  const roles = ref<CloudRole[]>([]);
  const adminInfo = ref<CloudUserData | null>(null);

  function setNavMenus(nav: CloudNavItem[]) {
    navMenus.value = nav;
  }

  function setProjectConfig(config: CloudProjectConfig) {
    projectConfig.value = config;
    if (config.LangGroup?.length) {
      projectConfig.value = {
        ...config,
        LangGroup: config.LangGroup.map((group) => ({
          ...group,
          Languages: Array.isArray(group.Languages)
            ? group.Languages
            : String(group.Languages).split(/\s*,\s*/),
        })),
      };
    }
  }

  function setSessionData(data: CloudUserData) {
    adminInfo.value = data;
    roles.value = data.Role || [];
    navMenus.value = data.Nav || [];
  }

  function $reset() {
    navMenus.value = [];
    projectConfig.value = null;
    roles.value = [];
    adminInfo.value = null;
  }

  return {
    $reset,
    adminInfo,
    navMenus,
    projectConfig,
    roles,
    setNavMenus,
    setProjectConfig,
    setSessionData,
  };
});

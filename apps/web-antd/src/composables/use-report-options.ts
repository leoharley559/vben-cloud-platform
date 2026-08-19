import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useCloudPlatformStore } from '#/store/cloud-platform';
import { useGameConfig } from '#/composables/use-game-config';
import { formatVenueName } from '#/utils/game-config';
import { PLAYER_STATUS_OPTIONS } from '#/utils/player-status';

export type ReportOption = { label: string; value: number | string };

export function useReportOptions() {
  const cloudStore = useCloudPlatformStore();
  const { projectConfig } = storeToRefs(cloudStore);
  const { ensureGameConfig, gameConfig } = useGameConfig();

  const packageOptions = computed<ReportOption[]>(() =>
    (projectConfig.value?.RealPackageIdNameMap || []).map((item) => ({
      label: item.PackageName,
      value: item.PackageId,
    })),
  );

  const vipOptions = computed<ReportOption[]>(() =>
    (
      (projectConfig.value?.VIPLevelMap || []) as Array<{
        VipLevelId: number | string;
        VipLevelName: string;
      }>
    ).map((item) => ({
      label: item.VipLevelName || `VIP${item.VipLevelId}`,
      value: item.VipLevelId,
    })),
  );

  const devicePlatformOptions = computed<ReportOption[]>(() => {
    const map = (projectConfig.value?.DevicePlatformMap ||
      {}) as Record<string, string>;
    return Object.entries(map).map(([value, label]) => ({
      label,
      value: Number.isNaN(Number(value)) ? value : Number(value),
    }));
  });

  const inviteSiteOptions = computed<ReportOption[]>(() => {
    const list = (projectConfig.value?.InviteSiteList ||
      projectConfig.value?.InviteSites ||
      []) as Array<{ Id?: number | string; Name?: string; SiteName?: string }>;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item) => ({
        label: item.Name || item.SiteName || String(item.Id),
        value: item.Id ?? '',
      }));
    }
    const map = (projectConfig.value?.InviteSiteMap || {}) as Record<
      string,
      string
    >;
    return Object.entries(map).map(([value, label]) => ({ label, value }));
  });

  const iosAppStoreOptions = computed<ReportOption[]>(() => {
    const list = (projectConfig.value?.IosAppStoreList ||
      projectConfig.value?.AppUrlList ||
      []) as Array<{ AppUrl?: string; Name?: string }>;
    return list.map((item) => ({
      label: item.Name || item.AppUrl || '-',
      value: item.AppUrl || '',
    }));
  });

  const userSourceOptions: ReportOption[] = [
    { label: '自然量', value: 0 },
    { label: '推广量', value: 1 },
  ];

  const statisticTypeOptions: ReportOption[] = [
    { label: '全部', value: 0 },
    { label: '注册用户', value: 1 },
    { label: '登录用户', value: 2 },
    { label: '充值用户', value: 3 },
    { label: '投注用户', value: 4 },
  ];

  /** 正式/全部（旧站 DataSearchType：0 正式，2 全部；测试 1 已注释） */
  const dataSearchTypeOptions: ReportOption[] = [
    { label: '正式数据', value: 0 },
    { label: '全部', value: 2 },
  ];

  const platformGameTypeOptions = computed<ReportOption[]>(() => {
    const keys = new Set([
      ...Object.keys(gameConfig.value.platformGameTypeAll || {}),
      ...Object.keys(gameConfig.value.platformGameType || {}),
      ...Object.keys(gameConfig.value.platformGameList || {}),
    ]);
    return [...keys].map((value) => ({
      label: formatVenueName(value, gameConfig.value),
      value: Number.isNaN(Number(value)) ? value : Number(value),
    }));
  });

  const platformGameTypeMap = computed(() => {
    const keys = new Set([
      ...Object.keys(gameConfig.value.platformGameTypeAll || {}),
      ...Object.keys(gameConfig.value.platformGameType || {}),
      ...Object.keys(gameConfig.value.platformGameList || {}),
    ]);
    const map: Record<string, string> = {};
    for (const key of keys) {
      map[key] = formatVenueName(key, gameConfig.value);
    }
    return map;
  });

  return {
    dataSearchTypeOptions,
    devicePlatformOptions,
    ensureGameConfig,
    gameConfig,
    inviteSiteOptions,
    iosAppStoreOptions,
    packageOptions,
    platformGameTypeMap,
    platformGameTypeOptions,
    playerStatusOptions: PLAYER_STATUS_OPTIONS,
    statisticTypeOptions,
    userSourceOptions,
    vipOptions,
  };
}

import { requestClient } from '#/api/request';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import type { CloudProjectConfig } from '#/types/cloud-platform';

/**
 * 获取项目全局配置（cloudPlatform: /backend/config/info）
 */
export async function getProjectConfigApi() {
  const data = await requestClient.get<CloudProjectConfig>(
    '/backend/config/info',
  );
  const cloudStore = useCloudPlatformStore();
  cloudStore.setProjectConfig(data);
  return data;
}

/**
 * 获取系统全局配置（cloudPlatform: /public/public/config）
 */
export async function getSystemConfigApi() {
  return requestClient.get('/public/public/config');
}

/**
 * 获取游戏相关配置（cloudPlatform: /api/game/info）
 */
export async function getGameConfigApi() {
  return requestClient.get('/api/game/info');
}

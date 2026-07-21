import { requestClient } from '#/api/request';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import type { CloudProjectConfig } from '#/types/cloud-platform';

/**
 * 获取项目全局配置（充值类型、开关项等），并写入 cloudStore
 *
 * @returns CloudProjectConfig
 * @see views/gameManage/* 等多处下拉/开关依赖
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
 * 获取系统公共配置（未登录也可访问）
 *
 * @returns 公共系统配置
 */
export async function getSystemConfigApi() {
  return requestClient.get('/public/public/config');
}

/**
 * 获取游戏相关配置（场馆/游戏字典等）
 *
 * @returns 游戏配置原始响应
 */
export async function getGameConfigApi() {
  return requestClient.get('/api/game/info');
}

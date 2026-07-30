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
 * 对齐旧站 getGameConfig：`/api/game/info`
 * Data 含 GameSetting + platformGameTypeAll（场馆全称，含已关闭）
 *
 * @returns Data 对象（含 GameSetting / platformGameTypeAll）
 */
export async function getGameConfigApi() {
  // 默认拦截器已解包 Data；与旧站 response.data.Data 一致
  return requestClient.get<Record<string, unknown>>('/api/game/info');
}

import { requestClient } from '#/api/request';

/**
 * 获取滚动大奖展示配置。
 *
 * @returns 滚动大奖配置对象（Items 为单条配置）
 * @see views/operationalManage/activity/components/jackpot-display-panel.vue
 */
export function fetchJackpotConfigApi() {
  return requestClient.get<
    Record<string, unknown> | { Items?: Record<string, unknown> }
  >('/backend/jackpotconfig/list');
}

/**
 * 保存滚动大奖展示配置（整包提交）。
 *
 * @param data 滚动大奖配置字段
 * @returns 接口响应
 * @see views/operationalManage/activity/components/jackpot-display-panel.vue
 */
export function updateJackpotConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/jackpotconfig/edit', data);
}

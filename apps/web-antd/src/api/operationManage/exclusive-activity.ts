import { requestClient } from '#/api/request';
import { normalizeCloudList } from '#/utils/activity-manage';

/**
 * 查询 VIP 专属活动功能列表
 * @param query 可选筛选条件及分页参数
 * @returns 规范化后的 VIP 活动列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-vip-intro-panel.vue
 */
export async function fetchVipActivityListApi(query?: Record<string, unknown>) {
  const data = await requestClient.get<unknown>('/backend/vipfunction/list', {
    params: query,
  });
  return normalizeCloudList<Record<string, unknown>>(data);
}

/**
 * 查询 VIP 等级礼品/奖励配置列表
 * @param query 可选筛选条件及分页参数
 * @returns 规范化后的 VIP 礼品列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-vip-promotion-panel.vue
 */
export async function fetchVipGiftListApi(query?: Record<string, unknown>) {
  const data = await requestClient.get<unknown>(
    '/backend/viplevelconfig/listprize',
    { params: query },
  );
  return normalizeCloudList<Record<string, unknown>>(data);
}

/**
 * 查询 VIP 基础规则配置列表
 * @param query 可选筛选条件及分页参数
 * @returns 规范化后的 VIP 基础规则列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-vip-basic-rule-panel.vue
 */
export async function fetchVipBasicRuleListApi(
  query?: Record<string, unknown>,
) {
  const data = await requestClient.get<unknown>('/backend/vipbaserule/list', {
    params: query,
  });
  return normalizeCloudList<Record<string, unknown>>(data);
}

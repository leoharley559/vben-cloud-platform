import type { CloudListResult } from '#/types/operation-manage';
import type {
  BrokerageBatchPayload,
  BrokerageSetItem,
  BrokerageSetListQuery,
  BrokerageSetPayload,
  DomainListItem,
  PromoterCostPayload,
  PromoterDetail,
  PromoterDomainPayload,
  PromoterListQuery,
  PromoterListResult,
  PromoterPayload,
  PromoterTeamPayload,
} from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 获取推广员列表
 * @param query 分页与筛选条件
 * @returns 推广员列表及分页信息
 * @see views/generalizeManage/generalizeManageact/index.vue
 * @see views/mobile/openAccount/index.vue
 */
export async function fetchPromoterListApi(query: PromoterListQuery) {
  const data = await requestClient.get<null | PromoterListResult>(
    '/backend/promoter/list',
    {
      params: trimSpace(query),
    },
  );
  // 空环境常返回 Items/ItemsTotal=null，统一归一避免页面崩溃
  return {
    Config: data?.Config,
    Items: Array.isArray(data?.Items) ? data.Items : [],
    ItemsTotal: Array.isArray(data?.ItemsTotal) ? data.ItemsTotal : [],
    Pagination: data?.Pagination,
  } satisfies PromoterListResult;
}

/**
 * 获取推广员详情
 * @param id 推广员 ID
 * @returns 推广员完整信息
 * @see views/generalizeManage/addGeneralize/index.vue
 */
export function fetchPromoterDetailApi(id: number | string) {
  return requestClient.get<PromoterDetail>(`/backend/promoter/${id}`);
}

/**
 * 新建推广员
 * @param data 推广员表单数据
 * @returns 创建结果
 * @see views/generalizeManage/addPromote/index.vue
 */
export function createPromoterApi(data: PromoterPayload) {
  return requestClient.post('/backend/promoter/', data);
}

/**
 * 更新推广员信息
 * @param data 推广员表单数据（含 ID）
 * @returns 更新结果
 * @see views/generalizeManage/addGeneralize/index.vue
 * @see views/generalizeManage/generalizeManageact/index.vue
 */
export function updatePromoterApi(data: PromoterPayload) {
  return requestClient.put('/backend/promoter/', data);
}

/**
 * 删除推广员
 * @param id 推广员 ID
 * @returns 删除结果
 * @see views/generalizeManage/generalizeManageact/index.vue
 */
export function deletePromoterApi(id: number | string) {
  return requestClient.delete(`/backend/promoter/${id}`);
}

/**
 * 设置推广员成本系数
 * @param data 成本系数配置
 * @returns 设置结果
 * @see views/generalizeManage/addGeneralize/index.vue
 */
export function createPromoterCostOddApi(data: PromoterCostPayload) {
  return requestClient.post('/backend/agent/setcostodd/', data);
}

/**
 * 更新推广团队信息
 * @param data 团队配置数据
 * @returns 更新结果
 * @see views/generalizeManage/addGeneralize/index.vue
 * @see views/generalizeManage/generalizeManageact/index.vue
 */
export function updatePromoterTeamApi(data: PromoterTeamPayload) {
  return requestClient.put('/backend/accountteam/', data);
}

/**
 * 获取域名列表
 * @param query 分页与筛选条件
 * @returns 域名列表及分页信息
 * @see views/generalizeManage/addGeneralize/index.vue
 */
export function fetchDomainListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<DomainListItem>>(
    '/backend/domain/list',
    { params: trimSpace(query) },
  );
}

/**
 * 绑定推广员域名
 * @param data 域名绑定数据
 * @returns 绑定结果
 * @see views/generalizeManage/addGeneralize/index.vue
 */
export function createPromoterDomainApi(data: PromoterDomainPayload) {
  return requestClient.post('/backend/promoter/domain', data);
}

/**
 * 获取佣金比例设置列表
 * @param query 团队与游戏筛选条件
 * @returns 佣金比例列表及团队默认比例
 * @see views/generalizeManage/brokerageSet/index.vue
 */
export async function fetchBrokerageSetListApi(query: BrokerageSetListQuery) {
  const data = await requestClient.get<
    | (CloudListResult<BrokerageSetItem> & {
        TeamGameDefaultRate?: number;
      })
    | null
  >('/backend/accountteamgamerate/list', {
    params: trimSpace(query),
  });
  return {
    Items: Array.isArray(data?.Items) ? data.Items : [],
    TeamGameDefaultRate: Number(data?.TeamGameDefaultRate || 0),
  };
}

/**
 * 新建佣金比例设置
 * @param data 佣金比例配置
 * @returns 创建结果
 * @see views/generalizeManage/brokerageSet/index.vue
 */
export function createBrokerageSetApi(data: BrokerageSetPayload) {
  return requestClient.post('/backend/accountteamgamerate/', data);
}

/**
 * 更新佣金比例设置
 * @param data 佣金比例配置（含 ID）
 * @returns 更新结果
 * @see views/generalizeManage/brokerageSet/index.vue
 */
export function updateBrokerageSetApi(data: BrokerageSetPayload) {
  return requestClient.put('/backend/accountteamgamerate/', data);
}

/**
 * 恢复佣金比例为默认值
 * @param data 含 Hash 的恢复参数
 * @returns 恢复结果
 * @see views/generalizeManage/brokerageSet/index.vue
 */
export function resetBrokerageSetApi(data: { Hash?: string }) {
  return requestClient.post('/backend/accountteamgamerate/recover', data);
}

/**
 * 批量更新佣金比例设置
 * @param data 批量更新配置
 * @returns 批量更新结果
 * @see views/generalizeManage/brokerageSet/index.vue
 */
export function batchUpdateBrokerageSetApi(data: BrokerageBatchPayload) {
  return requestClient.post('/backend/accountteamgamerate/batchupdate', data);
}

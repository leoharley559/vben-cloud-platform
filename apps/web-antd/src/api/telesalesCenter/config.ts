import { requestClient } from '#/api/request';
import { toTelesalesListResult } from '#/types/telesales-center';
import { trimSpace } from '#/utils/string';

/**
 * 自动分配呼叫配置列表（配置管理页「呼叫配置」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/configManagement/index.vue
 */
export function fetchAutoAssignConfigListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getlistautoassignconfig', {
      params: trimSpace(query),
    })
    .then(toTelesalesListResult);
}

/**
 * 绑定代理列表（配置管理相关，/backend/configmanagement/getbindagent）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 */
export function fetchBindAgentListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getbindagent', { params: trimSpace(query) })
    .then(toTelesalesListResult);
}

/**
 * 坐席列表（配置管理页「坐席管理」Tab）。
 *
 * @param query 查询参数（分页、Username 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/configManagement/index.vue
 */
export function fetchSeatListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getseatlist', { params: trimSpace(query) })
    .then(toTelesalesListResult);
}

/**
 * 行销结果分类列表（配置管理页「行销结果」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/configManagement/index.vue
 */
export function fetchSalesCategoryListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getsalescatlist', {
      params: trimSpace(query),
    })
    .then(toTelesalesListResult);
}

/**
 * 服务商列表（配置管理页「服务商」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/configManagement/index.vue
 */
export function fetchServiceProviderListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getserviceproviderlist', {
      params: trimSpace(query),
    })
    .then(toTelesalesListResult);
}

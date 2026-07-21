import { requestClient } from '#/api/request';
import { toTelesalesListResult } from '#/types/telesales-center';
import { trimSpace } from '#/utils/string';

/**
 * 电销任务列表（任务列表页）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/taskList/index.vue
 */
export function fetchTaskListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/tasklist/list', { params: trimSpace(query) })
    .then(toTelesalesListResult);
}

/**
 * 电销任务详情列表（/backend/tasklist/detailslist，任务明细查询）。
 *
 * @param query 查询参数（任务 Id、分页等）
 * @returns Items 及 Pagination.MaxCount
 */
export function fetchTaskDetailsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/tasklist/detailslist', { params: trimSpace(query) })
    .then(toTelesalesListResult);
}

/**
 * 我的任务列表（我的任务页「任务列表」Tab）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/myTask/index.vue
 */
export function fetchMyTaskListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/mytask/list', { params: query })
    .then(toTelesalesListResult);
}

/**
 * 我的任务详情列表（我的任务页「任务详情」Tab）。
 *
 * @param query 查询参数（Login、日期、分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/myTask/index.vue
 */
export function fetchMyTaskDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/mytask/detaillist', { params: query })
    .then(toTelesalesListResult);
}

/**
 * 我的任务退回列表（/backend/mytask/returnlist，任务退回记录）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 */
export function fetchMyTaskReturnListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/mytask/returnlist', { params: query })
    .then(toTelesalesListResult);
}

/**
 * 玩家分配列表（玩家分配页）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/telesalesCenter/playerAssigned/index.vue
 */
export function fetchPlayerAssignedListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/playerassigned/list', { params: query })
    .then(toTelesalesListResult);
}

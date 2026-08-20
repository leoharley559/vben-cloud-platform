import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将助力管理列表响应归一为 CloudListResult。
 *
 * 空响应时补默认 Pagination，避免分页组件读取 undefined。
 *
 * @param result 接口原始响应
 * @returns 含 Items 及 Pagination 的列表结构
 */
function normalizeListResult(
  result: CloudListResult<Record<string, unknown>> | null | undefined,
): CloudListResult<Record<string, unknown>> {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination || {
      CurrPage: 1,
      MaxCount: 0,
      MaxPageCount: 1,
      PageSize: 20,
    },
  };
}

/**
 * 查询助力/帮扶申请记录列表
 * @param query 筛选条件（玩家、状态、时间范围及分页）
 * @returns 助力记录列表 Items 及 Pagination（空值已规范化）
 * @see views/operationalManage/helpManage/components/help-manage-panel.vue
 */
export async function fetchHelpManageListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/helprecords/list', { params: trimSpace(query) });
  return normalizeListResult(result);
}

/**
 * 同意/确认助力申请
 * @param data 确认参数（记录 Id 及处理备注）
 * @returns 接口操作结果
 * @see views/operationalManage/helpManage/components/help-manage-panel.vue
 */
export function agreeHelpRecordApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/helprecords/confirm', data);
}

/**
 * 拒绝助力申请
 * @param data 拒绝参数（记录 Id 及拒绝原因）
 * @returns 接口操作结果
 * @see views/operationalManage/helpManage/components/help-manage-panel.vue
 */
export function rejectHelpRecordApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/helprecords/denied', data);
}

/**
 * 关闭/取消助力申请
 * @param data 关闭参数（记录 Id 及关闭原因）
 * @returns 接口操作结果
 * @see views/operationalManage/helpManage/components/help-manage-panel.vue
 */
export function closeHelpRecordApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/helprecords/cancel', data);
}

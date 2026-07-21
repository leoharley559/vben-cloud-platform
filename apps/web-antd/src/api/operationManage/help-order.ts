import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/**
 * 将助力工单列表响应归一为 CloudListResult。
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
 * 查询助力工单列表
 * @param query 筛选条件（玩家、状态、时间范围及分页）
 * @returns 助力工单列表 Items 及 Pagination（空值已规范化）
 * @see views/operationalManage/helpOrder/components/help-order-panel.vue
 */
export async function fetchHelpOrderListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/helprecords/listhelp', { params: trimSpace(query) });
  return normalizeListResult(result);
}

/**
 * 执行助力工单操作并获取协助链接
 * @param query 操作参数（工单 Id、操作类型等）
 * @returns 协助链接 Link（无数据时返回空对象）
 * @see views/operationalManage/helpOrder/components/help-order-panel.vue
 */
export async function helpOrderActionApi(query: Record<string, unknown>) {
  const result = await requestClient.get<{ Link?: string }>(
    '/backend/helprecords/help',
    { params: trimSpace(query) },
  );
  return result || {};
}

/**
 * 协助链接登录（依赖 HelpLinkKey Cookie / HelpLink 请求头）
 * @returns 登录结果（Account、Nav、Token 等）
 * @see views/operationalManage/helpOrder/components/help-order-panel.vue
 */
export async function helpLinkLoginApi() {
  const result = await requestClient.post<{
    Account?: string;
    Nav?: unknown;
    Token?: string;
  }>('/public/user/login', {});
  return result || {};
}

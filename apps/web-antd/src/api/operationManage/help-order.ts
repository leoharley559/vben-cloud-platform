import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

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

export async function fetchHelpOrderListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/helprecords/listhelp', { params: trimSpace(query) });
  return normalizeListResult(result);
}

export async function helpOrderActionApi(query: Record<string, unknown>) {
  const result = await requestClient.get<{ Link?: string }>(
    '/backend/helprecords/help',
    { params: trimSpace(query) },
  );
  return result || {};
}

/**
 * 协助链接登录：对齐旧站 LoginByUsername() 无参调用
 * 依赖请求前已写入 HelpLinkKey Cookie / HelpLink 请求头
 */
export async function helpLinkLoginApi() {
  const result = await requestClient.post<{
    Account?: string;
    Nav?: unknown;
    Token?: string;
  }>('/public/user/login', {});
  return result || {};
}

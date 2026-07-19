import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  LoginLogListItem,
  LoginLogListQuery,
  LoginLogSummaryData,
  LoginLogSummaryQuery,
} from '#/types/member-logs';
import { trimSpace } from '#/utils/string';

function normalizeList(
  result: CloudListResult<LoginLogListItem> | null | undefined,
) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchLoginLogListApi(query: LoginLogListQuery) {
  const result = await requestClient.get<CloudListResult<LoginLogListItem>>(
    '/backend/playeranalysis/log',
    {
      params: trimSpace({ ...query }),
    },
  );
  return normalizeList(result);
}

export async function fetchLoginLogSummaryApi(
  query: Omit<LoginLogSummaryQuery, 'Summary'>,
) {
  const result = await requestClient.get<{
    Items?: LoginLogSummaryData | null;
  }>('/backend/playeranalysis/log', {
    params: trimSpace({ ...query, Summary: 1 }),
  });
  return {
    Items: result?.Items || {},
  };
}

/** 登录记录明细导出 pageId=34 */
export function exportLoginLogListApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/playeranalysis/listcsv',
    { params: trimSpace(params) },
  );
}

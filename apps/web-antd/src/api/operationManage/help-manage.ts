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

export async function fetchHelpManageListApi(query: Record<string, unknown>) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/helprecords/list', { params: trimSpace(query) });
  return normalizeListResult(result);
}

export function agreeHelpRecordApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/helprecords/confirm', data);
}

export function rejectHelpRecordApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/helprecords/denied', data);
}

export function closeHelpRecordApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/helprecords/cancel', data);
}

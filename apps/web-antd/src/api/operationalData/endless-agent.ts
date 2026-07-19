import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

function toListResult(data: {
  Items?: Record<string, unknown>[];
  Pagination?: { MaxCount?: number };
}) {
  const items = data.Items || [];
  return {
    Items: items,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? items.length,
    },
  } satisfies CloudListResult<Record<string, unknown>>;
}

export async function fetchEndlessAgentMultipleListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/wnlimitedproxydata/list', { params: trimSpace(query) });
  return toListResult(data);
}

export async function fetchEndlessAgentByTimeListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/wnlimitedproxydata/listtime', { params: trimSpace(query) });
  return toListResult(data);
}

export async function fetchEndlessAgentByUserListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/wnlimitedproxydata/listdetails', { params: query });
  return toListResult(data);
}

export async function fetchEndlessChannelReportApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
  }>('/backend/operation/unlimitedchannelreport', { params: query });
  return toListResult(data);
}

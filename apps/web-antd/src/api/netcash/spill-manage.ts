import type {
  SpillManageAuditPayload,
  SpillManageItem,
  SpillManageListQuery,
  SpillManageListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type SpillManageRawResult = {
  Items?: null | SpillManageItem[];
  Pagination?: null | {
    MaxCount?: number;
    Page?: number;
    PageSize?: number;
  };
  Total?: null | number | string;
};

export async function fetchSpillManageListApi(
  query: SpillManageListQuery,
): Promise<SpillManageListResult> {
  const result = await requestClient.get<null | SpillManageRawResult>(
    '/backend/agentplayermanage/list',
    { params: trimSpace(query) },
  );
  const items = Array.isArray(result?.Items) ? result.Items : [];
  const total = Number(
    result?.Total ?? result?.Pagination?.MaxCount ?? items.length,
  );
  return {
    Items: items,
    Pagination: {
      ...result?.Pagination,
      MaxCount: Number.isFinite(total) ? total : 0,
    },
    Total: Number.isFinite(total) ? total : 0,
  };
}

export function auditSpillManageApi(data: SpillManageAuditPayload) {
  return requestClient.put('/backend/agentplayermanage/operate', data);
}

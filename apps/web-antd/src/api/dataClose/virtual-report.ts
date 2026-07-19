import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

export function fetchVirtualReportTaskListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/virtualrptasklist', { params: trimSpace(query) })
    .then(toListResult);
}

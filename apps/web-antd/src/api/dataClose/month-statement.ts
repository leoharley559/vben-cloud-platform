import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

export function fetchMonthStatementTotalListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/agentbetwinmanagemonth/totallist', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

export function fetchMonthStatementListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/agentbetwinmanagemonth/list', { params: trimSpace(query) })
    .then(toListResult);
}

export function fetchMonthStatementSonListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/agentbetwinmanagemonth/sonlist', { params: trimSpace(query) })
    .then(toListResult);
}

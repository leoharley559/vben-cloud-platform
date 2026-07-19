import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

export function fetchDayStatementTotalListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/agentbetwinmanageday/totallist', { params: trimSpace(query) })
    .then(toListResult);
}

export function fetchDayStatementListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/agentbetwinmanageday/list', { params: trimSpace(query) })
    .then(toListResult);
}

export function fetchDayStatementSonListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/agentbetwinmanageday/sonlist', { params: trimSpace(query) })
    .then(toListResult);
}

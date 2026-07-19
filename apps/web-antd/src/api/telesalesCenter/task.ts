import { requestClient } from '#/api/request';
import { toTelesalesListResult } from '#/types/telesales-center';
import { trimSpace } from '#/utils/string';

export function fetchTaskListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/tasklist/list', { params: trimSpace(query) })
    .then(toTelesalesListResult);
}

export function fetchTaskDetailsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/tasklist/detailslist', { params: trimSpace(query) })
    .then(toTelesalesListResult);
}

export function fetchMyTaskListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/mytask/list', { params: query })
    .then(toTelesalesListResult);
}

export function fetchMyTaskDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/mytask/detaillist', { params: query })
    .then(toTelesalesListResult);
}

export function fetchMyTaskReturnListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/mytask/returnlist', { params: query })
    .then(toTelesalesListResult);
}

export function fetchPlayerAssignedListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/playerassigned/list', { params: query })
    .then(toTelesalesListResult);
}

import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';

export function fetchKeepDataOneTimeUserListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/onetimeuser', { params: query })
    .then(toListResult);
}

export function fetchKeepDataLtvListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/realtimeltv', { params: query })
    .then(toListResult);
}

export function fetchKeepDataLoginRetentionListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/realtimedau', { params: query })
    .then(toListResult);
}

export function fetchKeepDataSectionRetentionListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/everydaylogindau', { params: query })
    .then(toListResult);
}

export function fetchKeepDataExtantListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/firstpayrealtimedau', { params: query })
    .then(toListResult);
}

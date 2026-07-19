import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

function normalizeCloudList<T>(data: unknown): CloudListResult<T> {
  if (Array.isArray(data)) {
    return { Items: data as T[] };
  }
  if (data && typeof data === 'object') {
    const record = data as CloudListResult<T> & { Data?: CloudListResult<T> };
    if (Array.isArray(record.Items) || record.Pagination) {
      return {
        ...record,
        Items: (record.Items || []) as T[],
      };
    }
    if (
      record.Data &&
      (Array.isArray(record.Data.Items) || record.Data.Pagination)
    ) {
      return {
        ...record.Data,
        Items: (record.Data.Items || []) as T[],
      };
    }
  }
  return { Items: [] };
}

function normalizeCloudObject<T extends Record<string, unknown>>(
  data: unknown,
): T | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown> & { Items?: unknown };
  if (
    record.Items &&
    typeof record.Items === 'object' &&
    !Array.isArray(record.Items)
  ) {
    return record.Items as T;
  }
  if (Array.isArray(record.Items)) {
    return (record.Items[0] as T) || null;
  }
  return record as T;
}

export function fetchLeaderboardListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/leaderboard/list',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

export function fetchLeaderboardByIdApi(id: number | string) {
  return requestClient
    .get<Record<string, unknown>>(`/backend/leaderboard/${id}`)
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

export function createLeaderboardApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/leaderboard', data);
}

export function updateLeaderboardApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/leaderboard', data);
}

export function offshelfLeaderboardApi(id: number | string) {
  return requestClient.put(`/backend/leaderboard/offshelve/${id}`);
}

export function fetchLeaderboardMainConfigApi() {
  return requestClient
    .get<Record<string, unknown>>(
      '/backend/leaderboard/getleaderboardmainconfig',
    )
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

export function updateLeaderboardMainConfigApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/leaderboard/updateleaderboardmainconfig',
    data,
  );
}

export function switchLeaderboardMainConfigApi() {
  return requestClient.put('/backend/leaderboard/switchmainconfig');
}

export function fetchLeaderboardRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/leaderboard/record',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

export function exportLeaderboardRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/leaderboard/recordexport',
    { params: trimSpace(params) },
  );
}

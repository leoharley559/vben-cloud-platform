import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';

export function fetchActivityVisitListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/list',
    { params: query },
  );
}

export function fetchActivityUtilityRecordApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getutilityrecord',
    { params: query },
  );
}

export function fetchActivityUtilityStatisticsApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getutilitystatistics',
    { params: query },
  );
}

export function fetchActivityVisitStatisticsApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/statistics',
    { params: query },
  );
}

export function fetchActivitySummaryApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getactivitysummary',
    { params: query },
  );
}

export function fetchActivityFirstPaySummaryApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getfirstpaysummary',
    { params: query },
  );
}

export function fetchLuckyDrawInfoListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activityvisitrecord/getluckydrawinfolist',
    { params: query },
  );
}

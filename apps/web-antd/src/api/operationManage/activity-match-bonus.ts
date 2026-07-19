import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type { ActivityMatchBonusItem } from '#/types/activity-match-bonus';
import { trimSpace } from '#/utils/string';

export function fetchActivityMatchBonusListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<ActivityMatchBonusItem>>(
    '/backend/activitymatchbonusapplyrecord/list',
    { params: trimSpace(query) },
  );
}

export function approveActivityMatchBonusApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/activitymatchbonusapplyrecord/batchapproveaudit',
    data,
  );
}

export function rejectActivityMatchBonusApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/activitymatchbonusapplyrecord/batchrejectaudit',
    data,
  );
}

export function updateActivityMatchBonusRemarkApi(
  data: Record<string, unknown>,
) {
  return requestClient.post(
    '/backend/activitymatchbonusapplyrecord/updateremark',
    data,
  );
}

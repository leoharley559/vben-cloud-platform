import { requestClient } from '#/api/request';

import { normalizeCloudList } from '#/utils/activity-manage';

export async function fetchVipActivityListApi(query?: Record<string, unknown>) {
  const data = await requestClient.get<unknown>('/backend/vipfunction/list', {
    params: query,
  });
  return normalizeCloudList<Record<string, unknown>>(data);
}

export async function fetchVipGiftListApi(query?: Record<string, unknown>) {
  const data = await requestClient.get<unknown>(
    '/backend/viplevelconfig/listprize',
    { params: query },
  );
  return normalizeCloudList<Record<string, unknown>>(data);
}

export async function fetchVipBasicRuleListApi(
  query?: Record<string, unknown>,
) {
  const data = await requestClient.get<unknown>('/backend/vipbaserule/list', {
    params: query,
  });
  return normalizeCloudList<Record<string, unknown>>(data);
}

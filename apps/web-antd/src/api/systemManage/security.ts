import { requestClient } from '#/api/request';
import type { SecuritySettingItem } from '#/types/system-manage';

export function fetchSecuredListApi() {
  return requestClient.get<SecuritySettingItem[]>(
    '/backend/agentsecuritysetting/list',
  );
}

export function editSecuredStatusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentsecuritysetting', data);
}

export function resetSecuredStatusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentsecuritysetting/resetdefault', data);
}

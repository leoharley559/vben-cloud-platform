import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerAuthApprovePayload,
  PlayerAuthImagePayload,
  PlayerAuthListItem,
  PlayerAuthListQuery,
  PlayerAuthRecordItem,
  PlayerAuthRecordQuery,
  PlayerAuthSettingItem,
  PlayerAuthSwitchPayload,
} from '#/types/player-authentication';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchPlayerAuthListApi(query: PlayerAuthListQuery) {
  const result = await requestClient.get<CloudListResult<PlayerAuthListItem>>(
    '/backend/playerauthentication/list',
    {
      params: trimSpace({ ...query }),
    },
  );
  return normalizeList(result);
}

export function approvePlayerAuthApi(data: PlayerAuthApprovePayload) {
  return requestClient.put('/backend/playerauthentication/approve', data);
}

export async function fetchPlayerAuthRecordApi(query: PlayerAuthRecordQuery) {
  const result = await requestClient.get<CloudListResult<PlayerAuthRecordItem>>(
    '/backend/playerauthentication/record',
    {
      params: trimSpace({ ...query }),
    },
  );
  return normalizeList(result);
}

/** 审核记录导出 pageId=90 */
export function exportPlayerAuthRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/playerauthentication/recordexport',
    { params: trimSpace(params) },
  );
}

export async function fetchPlayerAuthSettingApi() {
  const result = await requestClient.get<
    CloudListResult<PlayerAuthSettingItem>
  >('/backend/playerauthentication/setting');
  return normalizeList(result);
}

export function updatePlayerAuthImageApi(data: PlayerAuthImagePayload) {
  return requestClient.put('/backend/playerauthentication/edit', data);
}

export function updatePlayerAuthSwitchApi(data: PlayerAuthSwitchPayload) {
  return requestClient.put('/backend/playerauthentication/switch', data);
}

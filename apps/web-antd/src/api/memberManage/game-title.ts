import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  GameTitleBatchEditPayload,
  GameTitleGroupItem,
  GameTitleGroupListQuery,
  GameTitleGroupPayload,
  GameTitleItem,
  GameTitleListQuery,
  GameTitleOwnerItem,
  GameTitleOwnerListQuery,
  GameTitleOwnerPayload,
  GameTitlePayload,
  GameTitleSwitchPayload,
} from '#/types/game-title';
import { trimSpace } from '#/utils/string';

function normalizeStatusQuery(query: Record<string, unknown>) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const status = params.Status;
  if (Array.isArray(status)) {
    params.Status = status.length ? status.join(',') : '';
  }
  return params;
}

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchGameTitleGroupListApi(
  query: GameTitleGroupListQuery,
) {
  const result = await requestClient.get<CloudListResult<GameTitleGroupItem>>(
    '/backend/badgecategory/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export function createGameTitleGroupApi(data: GameTitleGroupPayload) {
  return requestClient.post('/backend/badgecategory/add', data);
}

export function editGameTitleGroupApi(data: GameTitleGroupPayload) {
  return requestClient.put('/backend/badgecategory/edit', data);
}

export function updateGameTitleGroupSwitchApi(data: GameTitleSwitchPayload) {
  return requestClient.put(
    `/backend/badgecategory/switch?Id=${data.Id}&Switch=${data.Switch}`,
  );
}

export function deleteGameTitleGroupApi(id: number | string) {
  return requestClient.delete(`/backend/badgecategory/${id}`);
}

export async function fetchGameTitleListApi(query: GameTitleListQuery) {
  const result = await requestClient.get<CloudListResult<GameTitleItem>>(
    '/backend/playerbadge/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

export function createGameTitleApi(data: GameTitlePayload) {
  return requestClient.post('/backend/playerbadge/add', data);
}

export function editGameTitleApi(data: GameTitlePayload) {
  return requestClient.put('/backend/playerbadge/edit', data);
}

export function deleteGameTitleApi(id: number | string) {
  return requestClient.delete(`/backend/playerbadge/${id}`);
}

export function batchEditGameTitleApi(data: GameTitleBatchEditPayload) {
  return requestClient.put('/backend/playerbadge/batchedit', data);
}

export function updateGameTitleSwitchApi(data: GameTitleSwitchPayload) {
  return requestClient.put(
    `/backend/playerbadge/switch?Id=${data.Id}&Switch=${data.Switch}`,
  );
}

export async function fetchGameTitleOwnerListApi(
  query: GameTitleOwnerListQuery,
) {
  const result = await requestClient.get<CloudListResult<GameTitleOwnerItem>>(
    '/backend/playerbadge/playerlist',
    {
      params: normalizeStatusQuery({
        ...query,
      } as Record<string, unknown>),
    },
  );
  return normalizeList(result);
}

export function addGameTitleOwnerApi(data: GameTitleOwnerPayload) {
  return requestClient.post('/backend/playerbadge/addplayer', data);
}

export function checkGameTitleOwnerApi(data: {
  BadgeId?: number | string;
  PlayerInfos?: Array<{ Account?: string; PackageName?: string }>;
  PlayerIds?: Array<number | string> | string;
}) {
  return requestClient.post('/backend/playerbadge/addplayercheck', data);
}

export function multiAddGameTitleOwnerApi(data: {
  BadgeId?: number | string;
  PlayerIds?: Array<number | string> | string;
}) {
  return requestClient.post('/backend/playerbadge/multiaddplayer', data);
}

export function deleteGameTitleOwnerApi(data: {
  BadgeId?: number | string;
  Ids?: Array<number | string>;
  PlayerIds?: Array<number | string>;
}) {
  return requestClient.delete('/backend/playerbadge/deleteplayer', { data });
}

/** 拥有者列表导出 pageId=75 */
export function exportGameTitleOwnerListApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/playerbadge/playerlistcsv',
    { params: normalizeStatusQuery(params) },
  );
}

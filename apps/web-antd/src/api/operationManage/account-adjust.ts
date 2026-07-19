import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerAdjustListItem,
  PlayerAdjustListQuery,
} from '#/types/player-detail';
import { trimSpace } from '#/utils/string';

export function fetchPlayerAdjustListApi(query: PlayerAdjustListQuery) {
  return requestClient.get<
    CloudListResult<PlayerAdjustListItem> & {
      Total?: { Total?: number | string };
    }
  >('/backend/playergoldaccountchange/approvelist', {
    params: trimSpace(query),
  });
}

export function createAccountAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldaccountchange/', data);
}

export function batchCreateAccountAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldaccountchange/batch', data);
}

export function disposeAccountAdjustAuditApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldaccountchange/approve', data);
}

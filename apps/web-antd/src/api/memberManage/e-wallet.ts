import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  EWalletFormPayload,
  EWalletListItem,
  EWalletListQuery,
} from '#/types/e-wallet';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchEWalletListApi(query: EWalletListQuery) {
  const result = await requestClient.get<CloudListResult<EWalletListItem>>(
    '/backend/playerwalletaccount/listall',
    { params: trimSpace({ ...query }) },
  );
  return normalizeList(result);
}

export function createEWalletApi(data: EWalletFormPayload) {
  return requestClient.post(
    '/backend/playerwalletaccount/add',
    trimSpace(data),
  );
}

export function updateEWalletApi(data: EWalletFormPayload) {
  return requestClient.put(
    '/backend/playerwalletaccount/edit',
    trimSpace(data),
  );
}

export function deleteEWalletApi(
  id: number | string,
  params?: { IsBlack?: boolean; ValidCode?: string },
) {
  return requestClient.delete(`/backend/playerwalletaccount/del/${id}`, {
    params: {
      IsBlack: params?.IsBlack ?? false,
      ...(params?.ValidCode ? { ValidCode: params.ValidCode } : {}),
    },
  });
}

/** 玩家详情：按玩家拉取电子钱包账号（GCash/Grab/PayMaya） */
export function fetchPlayerPayAcctListApi(playerId: number | string) {
  return requestClient.get<
    EWalletListItem[] | CloudListResult<EWalletListItem>
  >(`/backend/playerwalletaccount/list/${playerId}`);
}

import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  BankCardFormPayload,
  BankCardListItem,
  BankCardListQuery,
  ResolvePlayerByAccountPayload,
} from '#/types/bank-card';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchBankCardListApi(query: BankCardListQuery) {
  const result = await requestClient.get<CloudListResult<BankCardListItem>>(
    '/backend/playerbankcard/list',
    {
      params: trimSpace({ ...query }),
    },
  );
  return normalizeList(result);
}

export function createBankCardApi(data: BankCardFormPayload) {
  return requestClient.post('/backend/playerbankcard', trimSpace({ ...data }));
}

export function updateBankCardApi(data: BankCardFormPayload) {
  return requestClient.put('/backend/playerbankcard', trimSpace({ ...data }));
}

export function deleteBankCardApi(
  id: number | string,
  params?: {
    IsBlack?: boolean | number;
    OperationType?: number;
    ValidCode?: string;
  },
) {
  return requestClient.delete(`/backend/playerbankcard/${id}`, {
    params,
  });
}

export function resolvePlayerByAccountApi(data: ResolvePlayerByAccountPayload) {
  return requestClient.post<CloudListResult<{ PlayerId?: number | string }>>(
    '/backend/playerinfo/queryplayerexcel',
    trimSpace({ ...data }),
  );
}

import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  CryptoAddressFormPayload,
  CryptoAddressListItem,
  CryptoAddressListQuery,
} from '#/types/crypto-address';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchCryptoAddressListApi(query: CryptoAddressListQuery) {
  const result = await requestClient.get<
    CloudListResult<CryptoAddressListItem>
  >('/backend/playerwithdrawdigitaladdress/list', {
    params: trimSpace({ ...query }),
  });
  return normalizeList(result);
}

export function createCryptoAddressApi(data: CryptoAddressFormPayload) {
  return requestClient.post(
    '/backend/playerwithdrawdigitaladdress',
    trimSpace(data),
  );
}

export function updateCryptoAddressApi(data: CryptoAddressFormPayload) {
  return requestClient.put(
    '/backend/playerwithdrawdigitaladdress',
    trimSpace(data),
  );
}

export function deleteCryptoAddressApi(
  id: number | string,
  params?: { IsBlack?: boolean | number; ValidCode?: string },
) {
  return requestClient.delete(`/backend/playerwithdrawdigitaladdress/${id}`, {
    params,
  });
}

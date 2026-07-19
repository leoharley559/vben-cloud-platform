import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type { PlatformTransferItem } from '#/types/platform-transfer';
import { trimSpace } from '#/utils/string';

export async function fetchPlatformTransferListApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<CloudListResult<PlatformTransferItem>>(
    '/backend/playerwallettransferorder/list',
    { params: trimSpace(query) },
  );
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export function editPlatformTransferStateApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/playerwallettransferorder/editstate',
    data,
  );
}

export function manualPlatformTransferApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerwallettransferorder/manual', data);
}

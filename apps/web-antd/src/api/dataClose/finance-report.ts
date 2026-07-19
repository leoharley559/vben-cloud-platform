import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

export function fetchDepositWithdrawalDiffListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/sgdeposit/DepositWithdrawalReport', { params: trimSpace(query) })
    .then(toListResult);
}

export async function fetchDistributionPayListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{ pay?: Record<string, unknown>[] }>(
    '/backend/operation/userarea',
    { params: trimSpace(query) },
  );
  const items = data.pay || [];
  return toListResult({}, items);
}

export async function fetchDistributionRegListApi(
  query: Record<string, unknown>,
) {
  const data = await requestClient.get<{ reg?: Record<string, unknown>[] }>(
    '/backend/operation/userarea',
    { params: trimSpace(query) },
  );
  const items = data.reg || [];
  return toListResult({}, items);
}

import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export interface WithdrawVisitStatisticsResult {
  DeviceList: Record<string, unknown>[];
  Total: number[];
  UserTypeList: Record<string, unknown>[];
  VipList: Record<string, unknown>[];
}

/** 提现通道统计数据。 */
export async function fetchWithdrawChannelDataApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/withdrawstatistics/list', {
    params: trimSpace(query),
  });
  return {
    Items: result?.Items ?? [],
    Pagination: result?.Pagination ?? {},
  };
}

/** 提现页面访问明细（路径与旧站 operationManage/gameNotice 一致）。 */
export async function fetchWithdrawAccessDetailApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<
    CloudListResult<Record<string, unknown>>
  >('/backend/visitstatistic/list', {
    params: trimSpace(query),
  });
  return {
    Items: result?.Items ?? [],
    Pagination: result?.Pagination ?? {},
  };
}

/** 提现页面访问统计（路径与旧站 operationManage/gameNotice 一致）。 */
export async function fetchWithdrawAccessStatisticsApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<
    Partial<WithdrawVisitStatisticsResult>
  >('/backend/visitstatistic/statisticslist', {
    params: trimSpace(query),
  });
  return {
    DeviceList: result?.DeviceList ?? [],
    Total: result?.Total ?? [],
    UserTypeList: result?.UserTypeList ?? [],
    VipList: result?.VipList ?? [],
  } satisfies WithdrawVisitStatisticsResult;
}

/** 提现访问明细导出，旧站安全页 ID 为 33。 */
export function exportWithdrawAccessDetailApi(query: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/visitstatistic/visitstatisticexcel',
    { params: trimSpace(query) },
  );
}

import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 提现页面访问统计汇总结果 */
export interface WithdrawVisitStatisticsResult {
  /** 按设备维度统计 */
  DeviceList: Record<string, unknown>[];
  /** 汇总数值数组 */
  Total: number[];
  /** 按用户类型维度统计 */
  UserTypeList: Record<string, unknown>[];
  /** 按 VIP 等级维度统计 */
  VipList: Record<string, unknown>[];
}

/**
 * 查询提现通道统计数据。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
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

/**
 * 查询提现页面访问明细。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
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

/**
 * 查询提现页面访问统计汇总。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
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

/**
 * 导出提现页面访问明细 Excel。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function exportWithdrawAccessDetailApi(query: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/visitstatistic/visitstatisticexcel',
    { params: trimSpace(query) },
  );
}

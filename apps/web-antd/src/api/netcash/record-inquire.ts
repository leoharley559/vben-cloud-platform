/* eslint-disable perfectionist/sort-imports */
import { requestClient } from '#/api/request';
import type {
  RecordAdjustItem,
  RecordBackwaterItem,
  RecordBonusItem,
  RecordDepositItem,
  RecordGameItem,
  RecordLoginItem,
  RecordQueryBaseQuery,
  RecordQueryListResult,
  RecordQueryTotal,
  RecordTransactionItem,
  RecordWithdrawItem,
} from '#/types/netcash';
import { trimSpace } from '#/utils/string';

function normalizeListResult<T>(
  result: null | RecordQueryListResult<T> | undefined,
): RecordQueryListResult<T> {
  return {
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || {},
    Total: (result?.Total || {}) as RecordQueryTotal,
  };
}

/**
 * 账变调整记录列表（「记录查询」页调整 Tab）。
 *
 * @param query 查询参数（玩家、时间、分页等）
 * @returns 调整记录 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordAdjustListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordAdjustItem>>(
      '/backend/recordquery/adjustmentlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

/**
 * 充值记录列表（「记录查询」页充值 Tab）。
 *
 * @param query 查询参数（玩家、时间、分页等）
 * @returns 充值记录 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordDepositListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordDepositItem>>(
      '/backend/recordquery/paymentlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

/**
 * 登录记录列表（「记录查询」页登录 Tab）。
 *
 * @param query 查询参数（玩家、时间、分页等）
 * @returns 登录记录 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordLoginListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordLoginItem>>(
      '/backend/recordquery/loginlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

/**
 * 提现记录列表（「记录查询」页提现 Tab）。
 *
 * @param query 查询参数（玩家、时间、分页等）
 * @returns 提现记录 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordWithdrawListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordWithdrawItem>>(
      '/backend/recordquery/withdrawlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

/**
 * 红利记录列表（「记录查询」页红利 Tab）。
 *
 * @param query 查询参数（玩家、时间、分页等）
 * @returns 红利记录 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordBonusListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordDepositItem>>(
      '/backend/recordquery/bonuslist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

/**
 * 返水记录列表（「记录查询」页返水 Tab）。
 *
 * @param query 查询参数（玩家、时间、分页等）
 * @returns 返水记录 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordBackwaterListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordBackwaterItem>>(
      '/backend/recordquery/backwaterlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

/**
 * 游戏记录列表（「记录查询」页游戏 Tab）。
 *
 * @param query 查询参数（玩家、场馆、时间、分页等）
 * @returns 游戏记录 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordGameListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordGameItem>>(
      '/backend/recordquery/gamelist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

/**
 * 红利明细列表（「记录查询」页红利详情子表）。
 *
 * @param query 查询参数（玩家、时间、分页等）
 * @returns 红利明细 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordBonusDetailListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordBonusItem>>(
      '/backend/playergoldhandle/redlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

/**
 * 净现金流水记录列表（「记录查询」页账变/流水 Tab）。
 *
 * @param query 查询参数（代理、类型、时间、分页等）
 * @returns 流水记录 Items、Pagination 及 Total
 * @see views/netcash/recordInquire/components/record-query-panel.vue
 */
export function fetchRecordTransactionListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordTransactionItem>>(
      '/backend/netcashlog/list',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

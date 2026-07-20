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

export function fetchRecordAdjustListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordAdjustItem>>(
      '/backend/recordquery/adjustmentlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

export function fetchRecordDepositListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordDepositItem>>(
      '/backend/recordquery/paymentlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

export function fetchRecordLoginListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordLoginItem>>(
      '/backend/recordquery/loginlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

export function fetchRecordWithdrawListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordWithdrawItem>>(
      '/backend/recordquery/withdrawlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

export function fetchRecordBonusListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordDepositItem>>(
      '/backend/recordquery/bonuslist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

export function fetchRecordBackwaterListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordBackwaterItem>>(
      '/backend/recordquery/backwaterlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

export function fetchRecordGameListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordGameItem>>(
      '/backend/recordquery/gamelist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

export function fetchRecordBonusDetailListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordBonusItem>>(
      '/backend/playergoldhandle/redlist',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

export function fetchRecordTransactionListApi(query: RecordQueryBaseQuery) {
  return requestClient
    .get<RecordQueryListResult<RecordTransactionItem>>(
      '/backend/netcashlog/list',
      { params: trimSpace(query) },
    )
    .then(normalizeListResult);
}

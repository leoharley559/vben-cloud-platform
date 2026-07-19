import { requestClient } from '#/api/request';
import type {
  RecordDepositItem,
  RecordLoginItem,
  RecordQueryBaseQuery,
  RecordQueryListResult,
} from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchRecordAdjustListApi(query: RecordQueryBaseQuery) {
  return requestClient.get<RecordQueryListResult<RecordDepositItem>>(
    '/backend/recordquery/adjustmentlist',
    { params: trimSpace(query) },
  );
}

export function fetchRecordDepositListApi(query: RecordQueryBaseQuery) {
  return requestClient.get<RecordQueryListResult<RecordDepositItem>>(
    '/backend/recordquery/paymentlist',
    { params: trimSpace(query) },
  );
}

export function fetchRecordLoginListApi(query: RecordQueryBaseQuery) {
  return requestClient.get<RecordQueryListResult<RecordLoginItem>>(
    '/backend/recordquery/loginlist',
    { params: trimSpace(query) },
  );
}

export function fetchRecordWithdrawListApi(query: RecordQueryBaseQuery) {
  return requestClient.get<RecordQueryListResult<RecordDepositItem>>(
    '/backend/recordquery/withdrawlist',
    { params: trimSpace(query) },
  );
}

export function fetchRecordBonusListApi(query: RecordQueryBaseQuery) {
  return requestClient.get<RecordQueryListResult<RecordDepositItem>>(
    '/backend/recordquery/bonuslist',
    { params: trimSpace(query) },
  );
}

export function fetchRecordBackwaterListApi(query: RecordQueryBaseQuery) {
  return requestClient.get<RecordQueryListResult<RecordDepositItem>>(
    '/backend/recordquery/backwaterlist',
    { params: trimSpace(query) },
  );
}

export function fetchRecordGameListApi(query: RecordQueryBaseQuery) {
  return requestClient.get<RecordQueryListResult<RecordDepositItem>>(
    '/backend/recordquery/gamelist',
    { params: trimSpace(query) },
  );
}

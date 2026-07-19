import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

function normalizeCloudList<T>(data: unknown): CloudListResult<T> {
  if (Array.isArray(data)) {
    return { Items: data as T[] };
  }
  if (data && typeof data === 'object') {
    const record = data as CloudListResult<T> & { Data?: CloudListResult<T> };
    if (Array.isArray(record.Items) || record.Pagination) {
      return {
        ...record,
        Items: (record.Items || []) as T[],
      };
    }
    if (
      record.Data &&
      (Array.isArray(record.Data.Items) || record.Data.Pagination)
    ) {
      return {
        ...record.Data,
        Items: (record.Data.Items || []) as T[],
      };
    }
  }
  return { Items: [] };
}

function normalizeCloudObject<T extends Record<string, unknown>>(
  data: unknown,
): T | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown> & { Items?: unknown };
  if (
    record.Items &&
    typeof record.Items === 'object' &&
    !Array.isArray(record.Items)
  ) {
    return record.Items as T;
  }
  if (Array.isArray(record.Items)) {
    return (record.Items[0] as T) || null;
  }
  return record as T;
}

/** 票券列表（进行中 / 历史 IsHistory） */
export function fetchVoucherListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/voucher/list', {
      params: trimSpace(query),
    })
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/** 全部票券（含下架/过期，供记录页名称映射） */
export function fetchVoucherListAllApi() {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/voucher/listallwithexpired',
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

export function fetchVoucherDetailApi(id: number | string) {
  return requestClient
    .get<Record<string, unknown>>(`/backend/voucher/${id}`)
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

export function createVoucherApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/voucher', data);
}

export function updateVoucherApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/voucher', data);
}

export function offshelfVoucherApi(id: number | string) {
  return requestClient.put(`/backend/voucher/offshelve/${id}`);
}

export function fetchVoucherGlobalConfigApi() {
  return requestClient
    .get<Record<string, unknown>>('/backend/voucher/getvouchermainconfig')
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

export function updateVoucherGlobalConfigApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/voucher/updatevouchermainconfig', data);
}

export function switchVoucherGlobalConfigApi() {
  return requestClient.put('/backend/voucher/switchmainconfig');
}

/** 票券记录（玩家进度） */
export function fetchVoucherDetailRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/voucher/voucherdetailrecord',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/** 领奖记录（旧 redemption 页，保留 API） */
export function fetchVoucherRedeemRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/voucher/voucherprizeredeemrecord',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/** 手动发放（单人） */
export function issueVoucherApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/voucher/issuevoucher', data);
}

/** 手动发放（批量） */
export function batchIssueVoucherApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/voucher/batchissuevoucher', data);
}

/** 发放记录 */
export function fetchVoucherIssueRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/voucher/issuevoucherrecord',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/** 票券记录导出 pageId=86 */
export function exportVoucherDetailRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/voucher/voucherdetailrecordcsv',
    { params: trimSpace(params) },
  );
}

/** 发放记录导出 pageId=88 */
export function exportVoucherIssueRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/voucher/issuevoucherrecordexport',
    { params: trimSpace(params) },
  );
}

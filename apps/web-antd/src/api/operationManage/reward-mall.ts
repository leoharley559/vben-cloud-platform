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

/* ==================== 商品 ==================== */

export function fetchRewardProductListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/product/list',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

export function fetchRewardProductDetailApi(id: number | string) {
  return requestClient
    .get<Record<string, unknown>>(`/backend/rewardsmall/product/${id}`)
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

export function createRewardProductApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rewardsmall/product/add', data);
}

export function updateRewardProductApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/product/edit', data);
}

export function deleteRewardProductApi(id: number | string) {
  return requestClient.delete(`/backend/rewardsmall/product/${id}`);
}

/** SwitchType: 0=上下移 Id1+Id2；1=置顶 Id1；2=置底 Id1 */
export function switchRewardProductSortApi(data: {
  Id1?: number | string;
  Id2?: number | string;
  SwitchType: number;
}) {
  return requestClient.put('/backend/rewardsmall/product/switchsort', data);
}

/* ==================== 全局配置 ==================== */

export function fetchRewardMallMainConfigApi() {
  return requestClient
    .get<Record<string, unknown>>(
      '/backend/rewardsmall/getrewardsmallmainconfig',
    )
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

export function updateRewardMallMainConfigApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/rewardsmall/updaterewardsmallmainconfig',
    data,
  );
}

export function switchRewardMallMainConfigApi(data?: Record<string, unknown>) {
  return requestClient.put(
    '/backend/rewardsmall/switchrewardsmallmainconfig',
    data || {},
  );
}

/* ==================== 商品页签 ==================== */

export function fetchRewardProductTagListApi(query?: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/producttag/list',
      { params: trimSpace(query || {}) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

export function createRewardProductTagApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rewardsmall/producttag/add', data);
}

export function updateRewardProductTagApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/producttag/edit', data);
}

export function deleteRewardProductTagApi(id: number | string) {
  return requestClient.delete(`/backend/rewardsmall/producttag/${id}`);
}

export function switchRewardProductTagSortApi(data: {
  Id1?: number | string;
  Id2?: number | string;
  SwitchType: number;
}) {
  return requestClient.put('/backend/rewardsmall/producttag/switchsort', data);
}

/* ==================== 积分任务 / 活动亮点 ==================== */

export function fetchRewardTaskListApi(query?: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/rewardtask/list',
      { params: trimSpace(query || {}) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

export function createRewardTaskApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rewardsmall/rewardtask/add', data);
}

export function updateRewardTaskApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/rewardtask/edit', data);
}

export function deleteRewardTaskApi(id: number | string) {
  return requestClient.delete(`/backend/rewardsmall/rewardtask/${id}`);
}

export function switchRewardTaskSortApi(data: {
  Id1?: number | string;
  Id2?: number | string;
  SwitchType: number;
}) {
  return requestClient.put('/backend/rewardsmall/rewardtask/switchsort', data);
}

/* ==================== 兑换记录 / 积分记录 ==================== */

export function fetchRewardExchangeRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/exchange/recordlist',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

export function exportRewardExchangeRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/rewardsmall/exchange/recordlistcsv',
    { params: trimSpace(params) },
  );
}

export function fetchRewardPointRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/point/recordlist',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

export function exportRewardPointRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/rewardsmall/point/recordlistcsv',
    { params: trimSpace(params) },
  );
}

/* ==================== 积分设置（存款/投注返水） ==================== */

export function fetchRewardDepositConfigApi(params?: Record<string, unknown>) {
  return requestClient
    .get<Record<string, unknown>>('/backend/rewardsmall/water/payment', {
      params: trimSpace(params || {}),
    })
    .then(
      (data) => normalizeCloudObject<Record<string, unknown>>(data) || data,
    );
}

export function updateRewardDepositConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/water/payment', data);
}

export function switchRewardDepositConfigApi(data: { Switch: boolean }) {
  return requestClient.put('/backend/rewardsmall/water/paymentswitch', data);
}

export function fetchRewardBetConfigApi(params?: Record<string, unknown>) {
  return requestClient
    .get<Record<string, unknown>>('/backend/rewardsmall/water/bet', {
      params: trimSpace(params || {}),
    })
    .then(
      (data) => normalizeCloudObject<Record<string, unknown>>(data) || data,
    );
}

export function updateRewardBetConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/water/bet', data);
}

export function switchRewardBetConfigApi(data: { Switch: boolean }) {
  return requestClient.put('/backend/rewardsmall/water/betswitch', data);
}

/* ==================== 积分调整 ==================== */

export function fetchRewardPointAdjustListApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        Total?: number | string;
      }
    >('/backend/playerpointhandle/approvelist', { params: trimSpace(query) })
    .then(
      (data) =>
        normalizeCloudList<Record<string, unknown>>(data) as CloudListResult<
          Record<string, unknown>
        > & { Total?: number | string },
    );
}

export function approveRewardPointAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpointhandle/approve', data);
}

export function createRewardPointAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpointhandle', data);
}

export function batchCreateRewardPointAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpointhandle/batch', data);
}

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

/**
 * 分页查询票券列表（进行中/历史由 IsHistory 区分）。
 *
 * @param query 状态、时间等筛选及分页参数
 * @returns 票券 Items 与 Pagination
 * @see views/operationalManage/voucher/components/voucher-active-panel.vue
 */
export function fetchVoucherListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/voucher/list', {
      params: trimSpace(query),
    })
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 获取全部票券（含下架/过期，供记录页名称映射）。
 *
 * @returns 全部票券 Items
 * @see views/operationalManage/rewardMall/components/goods-upsert-modal.vue
 * @see views/operationalManage/voucher/components/voucher-record-panel.vue
 */
export function fetchVoucherListAllApi() {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/voucher/listallwithexpired',
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 获取票券详情。
 *
 * @param id 票券 ID
 * @returns 票券详情对象
 * @see views/operationalManage/voucher/components/voucher-upsert-modal.vue
 */
export function fetchVoucherDetailApi(id: number | string) {
  return requestClient
    .get<Record<string, unknown>>(`/backend/voucher/${id}`)
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

/**
 * 新增票券活动。
 *
 * @param data 票券表单字段
 * @returns 接口响应
 * @see views/operationalManage/voucher/components/voucher-upsert-modal.vue
 */
export function createVoucherApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/voucher', data);
}

/**
 * 编辑票券活动。
 *
 * @param data 票券表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/voucher/components/voucher-upsert-modal.vue
 */
export function updateVoucherApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/voucher', data);
}

/**
 * 下架票券活动。
 *
 * @param id 票券 ID
 * @returns 接口响应
 * @see views/operationalManage/voucher/components/voucher-active-panel.vue
 */
export function offshelfVoucherApi(id: number | string) {
  return requestClient.put(`/backend/voucher/offshelve/${id}`);
}

/**
 * 获取票券全局主配置。
 *
 * @returns 全局配置对象
 * @see views/operationalManage/voucher/components/voucher-global-config-modal.vue
 */
export function fetchVoucherGlobalConfigApi() {
  return requestClient
    .get<Record<string, unknown>>('/backend/voucher/getvouchermainconfig')
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

/**
 * 更新票券全局主配置。
 *
 * @param data 全局配置字段
 * @returns 接口响应
 * @see views/operationalManage/voucher/components/voucher-global-config-modal.vue
 */
export function updateVoucherGlobalConfigApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/voucher/updatevouchermainconfig', data);
}

/**
 * 切换票券全局主配置开关。
 *
 * @returns 接口响应
 * @see views/operationalManage/voucher/components/voucher-global-config-modal.vue
 */
export function switchVoucherGlobalConfigApi() {
  return requestClient.put('/backend/voucher/switchmainconfig');
}

/**
 * 分页查询票券玩家进度记录。
 *
 * @param query 票券、账号、时间等筛选及分页参数
 * @returns 玩家进度 Items 与 Pagination
 * @see views/operationalManage/voucher/components/voucher-record-panel.vue
 */
export function fetchVoucherDetailRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/voucher/voucherdetailrecord',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 分页查询票券领奖记录（旧 redemption 页保留 API）。
 *
 * @param query 票券、时间等筛选及分页参数
 * @returns 领奖记录 Items 与 Pagination
 */
export function fetchVoucherRedeemRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/voucher/voucherprizeredeemrecord',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 手动发放票券（单人）。
 *
 * @param data 玩家账号及票券 Id 等
 * @returns 接口响应
 * @see views/operationalManage/voucher/components/voucher-payout-panel.vue
 */
export function issueVoucherApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/voucher/issuevoucher', data);
}

/**
 * 手动发放票券（批量）。
 *
 * @param data 批量玩家及票券 Id 等
 * @returns 接口响应
 * @see views/operationalManage/voucher/components/voucher-payout-panel.vue
 */
export function batchIssueVoucherApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/voucher/batchissuevoucher', data);
}

/**
 * 分页查询票券发放记录。
 *
 * @param query 票券、时间等筛选及分页参数
 * @returns 发放记录 Items 与 Pagination
 * @see views/operationalManage/voucher/components/voucher-payout-panel.vue
 */
export function fetchVoucherIssueRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/voucher/issuevoucherrecord',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 导出票券玩家进度记录 CSV（pageId=86）。
 *
 * @param params 与列表一致的筛选参数
 * @returns 导出任务信息（Id、Status 等）
 * @see views/operationalManage/voucher/components/voucher-record-panel.vue
 */
export function exportVoucherDetailRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/voucher/voucherdetailrecordcsv',
    { params: trimSpace(params) },
  );
}

/**
 * 导出票券发放记录 CSV（pageId=88）。
 *
 * @param params 与列表一致的筛选参数
 * @returns 导出任务信息（Id、Status 等）
 * @see views/operationalManage/voucher/components/voucher-payout-panel.vue
 */
export function exportVoucherIssueRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/voucher/issuevoucherrecordexport',
    { params: trimSpace(params) },
  );
}

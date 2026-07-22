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
  // 全局配置空库常见 `{ Items: null }`，按无配置处理
  if ('Items' in record && record.Items == null) {
    return null;
  }
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

/**
 * 分页查询积分商城商品列表。
 *
 * @param query 状态、标签等筛选及分页参数
 * @returns 商品 Items 与 Pagination
 * @see views/operationalManage/rewardMall/components/goods-active-panel.vue
 */
export function fetchRewardProductListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/product/list',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 获取积分商城商品详情。
 *
 * @param id 商品 ID
 * @returns 商品详情对象
 * @see views/operationalManage/rewardMall/components/goods-upsert-modal.vue
 * @see views/operationalManage/rewardMall/components/goods-details-modal.vue
 */
export function fetchRewardProductDetailApi(id: number | string) {
  return requestClient
    .get<Record<string, unknown>>(`/backend/rewardsmall/product/${id}`)
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

/**
 * 新增积分商城商品。
 *
 * @param data 商品表单字段
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-upsert-modal.vue
 */
export function createRewardProductApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rewardsmall/product/add', data);
}

/**
 * 编辑积分商城商品。
 *
 * @param data 商品表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-upsert-modal.vue
 */
export function updateRewardProductApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/product/edit', data);
}

/**
 * 删除积分商城商品。
 *
 * @param id 商品 ID
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-active-panel.vue
 */
export function deleteRewardProductApi(id: number | string) {
  return requestClient.delete(`/backend/rewardsmall/product/${id}`);
}

/**
 * 调整商品排序（SwitchType: 0=上下移 Id1+Id2；1=置顶 Id1；2=置底 Id1）。
 *
 * @param data Id1、Id2 及 SwitchType
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-active-panel.vue
 */
export function switchRewardProductSortApi(data: {
  Id1?: number | string;
  Id2?: number | string;
  SwitchType: number;
}) {
  return requestClient.put('/backend/rewardsmall/product/switchsort', data);
}

/* ==================== 全局配置 ==================== */

/**
 * 获取积分商城全局主配置。
 *
 * @returns 全局配置对象
 * @see views/operationalManage/rewardMall/components/goods-global-config-modal.vue
 */
export function fetchRewardMallMainConfigApi() {
  return requestClient
    .get<Record<string, unknown>>(
      '/backend/rewardsmall/getrewardsmallmainconfig',
    )
    .then((data) => normalizeCloudObject<Record<string, unknown>>(data));
}

/**
 * 更新积分商城全局主配置。
 *
 * @param data 全局配置字段
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-global-config-modal.vue
 */
export function updateRewardMallMainConfigApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/rewardsmall/updaterewardsmallmainconfig',
    data,
  );
}

/**
 * 切换积分商城全局主配置开关。
 *
 * @param data 可选开关参数，默认空对象
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-global-config-modal.vue
 */
export function switchRewardMallMainConfigApi(data?: Record<string, unknown>) {
  return requestClient.put(
    '/backend/rewardsmall/switchrewardsmallmainconfig',
    data || {},
  );
}

/* ==================== 商品页签 ==================== */

/**
 * 分页查询商品页签列表。
 *
 * @param query 可选筛选及分页参数
 * @returns 页签 Items 与 Pagination
 * @see views/operationalManage/rewardMall/components/goods-tag-manage-modal.vue
 */
export function fetchRewardProductTagListApi(query?: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/producttag/list',
      { params: trimSpace(query || {}) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 新增商品页签。
 *
 * @param data 页签名称等表单字段
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-tag-manage-modal.vue
 */
export function createRewardProductTagApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rewardsmall/producttag/add', data);
}

/**
 * 编辑商品页签。
 *
 * @param data 页签表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-tag-manage-modal.vue
 */
export function updateRewardProductTagApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/producttag/edit', data);
}

/**
 * 删除商品页签。
 *
 * @param id 页签 ID
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-tag-manage-modal.vue
 */
export function deleteRewardProductTagApi(id: number | string) {
  return requestClient.delete(`/backend/rewardsmall/producttag/${id}`);
}

/**
 * 调整商品页签排序。
 *
 * @param data Id1、Id2 及 SwitchType
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-tag-order-modal.vue
 */
export function switchRewardProductTagSortApi(data: {
  Id1?: number | string;
  Id2?: number | string;
  SwitchType: number;
}) {
  return requestClient.put('/backend/rewardsmall/producttag/switchsort', data);
}

/* ==================== 积分任务 / 活动亮点 ==================== */

/**
 * 分页查询积分任务/活动亮点列表。
 *
 * @param query 可选筛选及分页参数
 * @returns 任务 Items 与 Pagination
 * @see views/operationalManage/rewardMall/components/goods-task-manage-modal.vue
 */
export function fetchRewardTaskListApi(query?: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/rewardtask/list',
      { params: trimSpace(query || {}) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 新增积分任务/活动亮点。
 *
 * @param data 任务表单字段
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-task-upsert-modal.vue
 */
export function createRewardTaskApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rewardsmall/rewardtask/add', data);
}

/**
 * 编辑积分任务/活动亮点。
 *
 * @param data 任务表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-task-upsert-modal.vue
 */
export function updateRewardTaskApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/rewardtask/edit', data);
}

/**
 * 删除积分任务/活动亮点。
 *
 * @param id 任务 ID
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-task-manage-modal.vue
 */
export function deleteRewardTaskApi(id: number | string) {
  return requestClient.delete(`/backend/rewardsmall/rewardtask/${id}`);
}

/**
 * 调整积分任务排序。
 *
 * @param data Id1、Id2 及 SwitchType
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/goods-task-manage-modal.vue
 */
export function switchRewardTaskSortApi(data: {
  Id1?: number | string;
  Id2?: number | string;
  SwitchType: number;
}) {
  return requestClient.put('/backend/rewardsmall/rewardtask/switchsort', data);
}

/* ==================== 兑换记录 / 积分记录 ==================== */

/**
 * 分页查询商品兑换记录。
 *
 * @param query 账号、时间等筛选及分页参数
 * @returns 兑换记录 Items 与 Pagination
 * @see views/operationalManage/rewardMall/components/exchange-record-panel.vue
 */
export function fetchRewardExchangeRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/exchange/recordlist',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 导出商品兑换记录 CSV。
 *
 * @param params 与列表一致的筛选参数
 * @returns 导出任务信息（Id、Status 等）
 * @see views/operationalManage/rewardMall/components/exchange-record-panel.vue
 */
export function exportRewardExchangeRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/rewardsmall/exchange/recordlistcsv',
    { params: trimSpace(params) },
  );
}

/**
 * 分页查询积分变动记录。
 *
 * @param query 账号、时间等筛选及分页参数
 * @returns 积分记录 Items 与 Pagination
 * @see views/operationalManage/rewardMall/components/points-record-panel.vue
 */
export function fetchRewardPointRecordApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/rewardsmall/point/recordlist',
      { params: trimSpace(query) },
    )
    .then((data) => normalizeCloudList<Record<string, unknown>>(data));
}

/**
 * 导出积分变动记录 CSV。
 *
 * @param params 与列表一致的筛选参数
 * @returns 导出任务信息（Id、Status 等）
 * @see views/operationalManage/rewardMall/components/points-record-panel.vue
 */
export function exportRewardPointRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/rewardsmall/point/recordlistcsv',
    { params: trimSpace(params) },
  );
}

/* ==================== 积分设置（存款/投注返水） ==================== */

/**
 * 获取存款返积分配置。
 *
 * @param params 可选筛选参数
 * @returns 存款返积分配置对象
 * @see views/operationalManage/rewardMall/components/points-config-panel.vue
 */
export function fetchRewardDepositConfigApi(params?: Record<string, unknown>) {
  return requestClient
    .get<Record<string, unknown>>('/backend/rewardsmall/water/payment', {
      params: trimSpace(params || {}),
    })
    .then(
      (data) => normalizeCloudObject<Record<string, unknown>>(data) || data,
    );
}

/**
 * 更新存款返积分配置。
 *
 * @param data 返积分规则字段
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/points-config-panel.vue
 */
export function updateRewardDepositConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/water/payment', data);
}

/**
 * 切换存款返积分开关。
 *
 * @param data Switch 布尔开关
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/points-config-panel.vue
 */
export function switchRewardDepositConfigApi(data: { Switch: boolean }) {
  return requestClient.put('/backend/rewardsmall/water/paymentswitch', data);
}

/**
 * 获取投注返积分配置。
 *
 * @param params 可选筛选参数
 * @returns 投注返积分配置对象
 * @see views/operationalManage/rewardMall/components/points-config-panel.vue
 */
export function fetchRewardBetConfigApi(params?: Record<string, unknown>) {
  return requestClient
    .get<Record<string, unknown>>('/backend/rewardsmall/water/bet', {
      params: trimSpace(params || {}),
    })
    .then(
      (data) => normalizeCloudObject<Record<string, unknown>>(data) || data,
    );
}

/**
 * 更新投注返积分配置。
 *
 * @param data 返积分规则字段
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/points-config-panel.vue
 */
export function updateRewardBetConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rewardsmall/water/bet', data);
}

/**
 * 切换投注返积分开关。
 *
 * @param data Switch 布尔开关
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/points-config-panel.vue
 */
export function switchRewardBetConfigApi(data: { Switch: boolean }) {
  return requestClient.put('/backend/rewardsmall/water/betswitch', data);
}

/* ==================== 积分调整 ==================== */

/**
 * 分页查询积分调整审批列表。
 *
 * @param query 状态、时间等筛选及分页参数
 * @returns 审批 Items、Pagination 及 Total 汇总
 * @see views/operationalManage/rewardMall/components/points-adjust-audit-panel.vue
 * @see views/operationalManage/rewardMall/components/points-adjust-record-panel.vue
 */
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

/**
 * 审批积分调整申请（通过/拒绝）。
 *
 * @param data 申请 Id 及审批结果等
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/points-adjust-audit-panel.vue
 */
export function approveRewardPointAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpointhandle/approve', data);
}

/**
 * 单笔提交积分调整。
 *
 * @param data 玩家、积分及原因等
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/points-adjust-form.vue
 */
export function createRewardPointAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpointhandle', data);
}

/**
 * 批量提交积分调整。
 *
 * @param data 批量玩家及积分等
 * @returns 接口响应
 * @see views/operationalManage/rewardMall/components/points-adjust-form.vue
 */
export function batchCreateRewardPointAdjustApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpointhandle/batch', data);
}

import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/**
 * 查询游戏公告列表
 * @param query 筛选条件（标题、状态、时间范围及分页）
 * @returns 游戏公告列表 Items 及 Pagination
 * @see views/operationalManage/gameNotice/components/game-notice-list-panel.vue
 */
export function fetchGameNoticeListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/gamenotice/list',
    { params: trimSpace(query) },
  );
}

/**
 * 获取游戏公告详情
 * @param id 公告 Id
 * @returns 公告详情对象
 * @see views/operationalManage/gameNotice/components/game-notice-form-modal.vue
 */
export function fetchGameNoticeDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/gamenotice/${id}`,
  );
}

/**
 * 新建游戏公告
 * @param data 公告表单（标题、内容、跳转配置等）
 * @returns 接口操作结果
 * @see views/operationalManage/gameNotice/components/game-notice-form-modal.vue
 */
export function createGameNoticeApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gamenotice/', data);
}

/**
 * 更新游戏公告
 * @param data 公告表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/operationalManage/gameNotice/components/game-notice-form-modal.vue
 */
export function updateGameNoticeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamenotice/', data);
}

/**
 * 切换游戏公告开关（IsOpen 1=开 / 2=关）
 * @param data 公告 Id 及开关状态 IsOpen
 * @returns 接口操作结果
 * @see views/operationalManage/gameNotice/components/game-notice-list-panel.vue
 */
export function switchGameNoticeApi(data: {
  Id: number | string;
  IsOpen: number;
}) {
  return requestClient.put('/backend/gamenotice/open', data);
}

/**
 * 删除游戏公告
 * @param id 公告 Id
 * @returns 接口操作结果
 * @see views/operationalManage/gameNotice/components/game-notice-list-panel.vue
 */
export function deleteGameNoticeApi(id: number | string) {
  return requestClient.delete(`/backend/gamenotice/${id}`);
}

/**
 * 获取推送跳转可选公告列表
 * @returns 公告下拉列表数据
 * @see views/operationalManage/voucher/components/voucher-redirect-field.vue
 */
export function fetchAdNoticeJumpListApi() {
  return requestClient.get<unknown>('/backend/gameadconfig/getnoticelist');
}

/**
 * 获取推送跳转可选活动列表
 * @param query 可选筛选参数
 * @returns 活动下拉列表数据
 * @see views/operationalManage/voucher/components/voucher-redirect-field.vue
 * @see views/operationalManage/rewardMall/components/goods-task-upsert-modal.vue
 * @see views/operationalManage/rewardMall/components/goods-task-manage-modal.vue
 */
export function fetchAdActivityJumpListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient.get<unknown>('/backend/gameadconfig/getactivitylist', {
    params: query,
  });
}

/**
 * 查询游戏邮件列表
 * @param query 筛选条件（标题、状态、时间范围及分页）
 * @returns 游戏邮件列表 Items 及 Pagination
 * @see views/operationalManage/gameNotice/components/game-email-list-panel.vue
 */
export function fetchGameEmailListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/gameemail/list',
    { params: trimSpace(query) },
  );
}

/**
 * 获取游戏邮件详情
 * @param id 邮件 Id
 * @returns 邮件详情对象
 * @see views/operationalManage/gameNotice/components/game-email-form-modal.vue
 */
export function fetchGameEmailDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(`/backend/gameemail/${id}`);
}

/**
 * 新建游戏邮件
 * @param data 邮件表单（标题、内容、收件范围等）
 * @returns 接口操作结果
 * @see views/operationalManage/gameNotice/components/game-email-form-modal.vue
 */
export function createGameEmailApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gameemail/', data);
}

/**
 * 更新游戏邮件
 * @param data 邮件表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/operationalManage/gameNotice/components/game-email-form-modal.vue
 */
export function updateGameEmailApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gameemail/', data);
}

/**
 * 删除游戏邮件
 * @param id 邮件 Id
 * @returns 接口操作结果
 * @see views/operationalManage/gameNotice/components/game-email-list-panel.vue
 */
export function deleteGameEmailApi(id: number | string) {
  return requestClient.delete(`/backend/gameemail/${id}`);
}

/**
 * 查询邮件已读/未读玩家列表
 * @param id 邮件 Id
 * @returns 玩家阅读状态列表数据
 * @see views/operationalManage/gameNotice/components/game-email-list-panel.vue
 */
export function fetchGameEmailReadStatusApi(id: number | string) {
  return requestClient.get<unknown>(
    `/backend/gameemail/playerreadstatus/${id}`,
  );
}

/** 公告/推送访问明细列表响应 */
export type VisitStatisticListResult = CloudListResult<Record<string, unknown>>;

/** 公告/推送访问统计汇总结果 */
export interface VisitStatisticSummaryResult {
  /** 按设备维度统计 */
  DeviceList?: Record<string, unknown>[];
  /** 按用户类型维度统计 */
  UserTypeList?: Record<string, unknown>[];
  /** 按 VIP 等级维度统计 */
  VipList?: Record<string, unknown>[];
}

/**
 * 查询公告/推送访问明细列表
 * @param query 筛选条件（公告 Id、时间范围及分页）
 * @returns 访问明细 Items 及 Pagination
 * @see views/operationalManage/components/visit-detail-panel.vue
 */
export async function fetchNoticeDetailDataApi(query: Record<string, unknown>) {
  const result = await requestClient.get<VisitStatisticListResult>(
    '/backend/visitstatistic/list',
    { params: trimSpace(query) },
  );
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 查询公告/推送访问统计汇总
 * @param query 筛选条件（公告 Id、时间范围）
 * @returns 按设备、用户类型、VIP 分组的统计列表
 * @see views/operationalManage/components/visit-statistics-panel.vue
 */
export async function fetchNoticeStatisticListApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<VisitStatisticSummaryResult>(
    '/backend/visitstatistic/statisticslist',
    { params: trimSpace(query) },
  );
  return {
    DeviceList: result?.DeviceList || [],
    UserTypeList: result?.UserTypeList || [],
    VipList: result?.VipList || [],
  };
}

/**
 * 导出公告/推送访问明细 Excel（pageId=33）
 * @param params 导出筛选参数
 * @returns 导出任务信息（Id、Remark、Status）
 * @see views/operationalManage/components/visit-detail-panel.vue
 */
export function exportVisitStatisticApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/visitstatistic/visitstatisticexcel',
    { params: trimSpace(params) },
  );
}

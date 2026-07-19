import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchGameNoticeListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/gamenotice/list',
    { params: trimSpace(query) },
  );
}

export function fetchGameNoticeDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/gamenotice/${id}`,
  );
}

export function createGameNoticeApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gamenotice/', data);
}

export function updateGameNoticeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamenotice/', data);
}

/** 游戏公告开关：IsOpen 1=开 / 2=关 */
export function switchGameNoticeApi(data: {
  Id: number | string;
  IsOpen: number;
}) {
  return requestClient.put('/backend/gamenotice/open', data);
}

export function deleteGameNoticeApi(id: number | string) {
  return requestClient.delete(`/backend/gamenotice/${id}`);
}

/** 推送跳转：公告列表（旧站 gameadconfig/getnoticelist） */
export function fetchAdNoticeJumpListApi() {
  return requestClient.get<unknown>('/backend/gameadconfig/getnoticelist');
}

/** 推送跳转：活动列表 */
export function fetchAdActivityJumpListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient.get<unknown>('/backend/gameadconfig/getactivitylist', {
    params: query,
  });
}

export function fetchGameEmailListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/gameemail/list',
    { params: trimSpace(query) },
  );
}

export function fetchGameEmailDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(`/backend/gameemail/${id}`);
}

export function createGameEmailApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gameemail/', data);
}

export function updateGameEmailApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gameemail/', data);
}

export function deleteGameEmailApi(id: number | string) {
  return requestClient.delete(`/backend/gameemail/${id}`);
}

/** 邮件已读/未读玩家列表 */
export function fetchGameEmailReadStatusApi(id: number | string) {
  return requestClient.get<unknown>(
    `/backend/gameemail/playerreadstatus/${id}`,
  );
}

export type VisitStatisticListResult = CloudListResult<Record<string, unknown>>;

export interface VisitStatisticSummaryResult {
  DeviceList?: Record<string, unknown>[];
  UserTypeList?: Record<string, unknown>[];
  VipList?: Record<string, unknown>[];
}

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

/** 访问明细导出 pageId=33 */
export function exportVisitStatisticApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/visitstatistic/visitstatisticexcel',
    { params: trimSpace(params) },
  );
}

import type { CloudListResult } from '#/types/operation-manage';
import type {
  PlayerAuthApprovePayload,
  PlayerAuthImagePayload,
  PlayerAuthListItem,
  PlayerAuthListQuery,
  PlayerAuthRecordItem,
  PlayerAuthRecordQuery,
  PlayerAuthSettingItem,
  PlayerAuthSwitchPayload,
} from '#/types/player-authentication';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 玩家身份验证审核列表（身份验证 · 审核列表 Tab）。
 *
 * @param query 查询参数（玩家、审核状态、时间等筛选及分页）
 * @returns 待审/已审身份验证行 Items 及 Pagination
 * @see views/memberManage/playerAuthentication/components/auth-audit-list.vue
 */
export async function fetchPlayerAuthListApi(query: PlayerAuthListQuery) {
  const result = await requestClient.get<CloudListResult<PlayerAuthListItem>>(
    '/backend/playerauthentication/list',
    {
      params: trimSpace({ ...query }),
    },
  );
  return normalizeList(result);
}

/**
 * 审批玩家身份验证（身份验证 · 审核列表通过/拒绝操作）。
 *
 * @param data 审批表单（记录 Id、审核结果、备注等）
 * @returns 接口操作结果
 * @see views/memberManage/playerAuthentication/components/auth-audit-action-modal.vue
 */
export function approvePlayerAuthApi(data: PlayerAuthApprovePayload) {
  return requestClient.put('/backend/playerauthentication/approve', data);
}

/**
 * 玩家身份验证审核记录列表（身份验证 · 审核记录 Tab）。
 *
 * @param query 查询参数（玩家、审核结果、时间等筛选及分页）
 * @returns 审核历史行 Items 及 Pagination
 * @see views/memberManage/playerAuthentication/components/auth-record-list.vue
 */
export async function fetchPlayerAuthRecordApi(query: PlayerAuthRecordQuery) {
  const result = await requestClient.get<CloudListResult<PlayerAuthRecordItem>>(
    '/backend/playerauthentication/record',
    {
      params: trimSpace({ ...query }),
    },
  );
  return normalizeList(result);
}

/**
 * 导出玩家身份验证审核记录（身份验证 · 审核记录导出，pageId=90）。
 *
 * @param params 与审核记录列表一致的筛选参数
 * @returns 导出任务信息（Id、Remark、Status）
 * @see views/memberManage/playerAuthentication/components/auth-record-list.vue
 */
export function exportPlayerAuthRecordApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/playerauthentication/recordexport',
    { params: trimSpace(params) },
  );
}

/**
 * 获取身份验证项配置列表（身份验证 · 验证设置 Tab）。
 *
 * @returns 验证项配置行 Items 及 Pagination
 * @see views/memberManage/playerAuthentication/components/auth-setting-panel.vue
 */
export async function fetchPlayerAuthSettingApi() {
  const result = await requestClient.get<
    CloudListResult<PlayerAuthSettingItem>
  >('/backend/playerauthentication/setting');
  return normalizeList(result);
}

/**
 * 更新身份验证示例图/说明（身份验证 · 验证设置编辑弹窗）。
 *
 * @param data 验证项 Id 及示例图、文案等更新内容
 * @returns 接口操作结果
 * @see views/memberManage/playerAuthentication/components/auth-setting-edit-modal.vue
 */
export function updatePlayerAuthImageApi(data: PlayerAuthImagePayload) {
  return requestClient.put('/backend/playerauthentication/edit', data);
}

/**
 * 切换身份验证项前端展示开关（身份验证 · 验证设置 / 验证信息开关面板）。
 *
 * @param data 验证项 Id 及开关状态
 * @returns 接口操作结果
 * @see views/memberManage/playerAuthentication/components/auth-setting-panel.vue
 * @see views/memberManage/playerAuthentication/components/auth-info-switch-panel.vue
 */
export function updatePlayerAuthSwitchApi(data: PlayerAuthSwitchPayload) {
  return requestClient.put('/backend/playerauthentication/switch', data);
}

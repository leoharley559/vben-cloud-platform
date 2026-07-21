import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  GameTitleBatchEditPayload,
  GameTitleGroupItem,
  GameTitleGroupListQuery,
  GameTitleGroupPayload,
  GameTitleItem,
  GameTitleListQuery,
  GameTitleOwnerItem,
  GameTitleOwnerListQuery,
  GameTitleOwnerPayload,
  GameTitlePayload,
  GameTitleSwitchPayload,
} from '#/types/game-title';
import { trimSpace } from '#/utils/string';

/**
 * 归一化称号拥有者查询参数，适配后端 Status 字段约定
 * @param query 前端拥有者筛选/分页参数
 * @returns trim 后的请求参数（Status 数组转为逗号分隔字符串）
 */
function normalizeStatusQuery(query: Record<string, unknown>) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const status = params.Status;
  if (Array.isArray(status)) {
    params.Status = status.length ? status.join(',') : '';
  }
  return params;
}

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 游戏称号分组列表（游戏称号管理 · 分组 Tab）。
 *
 * @param query 查询参数（分组名称、状态等筛选及分页）
 * @returns 称号分组行 Items 及 Pagination
 * @see views/memberManage/gameTitleManagement/components/game-title-group-list.vue
 * @see views/operationalManage/gameTitle/index.vue
 */
export async function fetchGameTitleGroupListApi(
  query: GameTitleGroupListQuery,
) {
  const result = await requestClient.get<CloudListResult<GameTitleGroupItem>>(
    '/backend/badgecategory/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 新增游戏称号分组（游戏称号管理 · 分组新增操作）。
 *
 * @param data 分组表单（名称、排序等）
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-group-list.vue
 */
export function createGameTitleGroupApi(data: GameTitleGroupPayload) {
  return requestClient.post('/backend/badgecategory/add', data);
}

/**
 * 编辑游戏称号分组（游戏称号管理 · 分组编辑操作）。
 *
 * @param data 分组表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-group-list.vue
 */
export function editGameTitleGroupApi(data: GameTitleGroupPayload) {
  return requestClient.put('/backend/badgecategory/edit', data);
}

/**
 * 切换游戏称号分组启用状态（游戏称号管理 · 分组开关操作）。
 *
 * @param data 分组 Id 及开关状态
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-group-list.vue
 */
export function updateGameTitleGroupSwitchApi(data: GameTitleSwitchPayload) {
  return requestClient.put(
    `/backend/badgecategory/switch?Id=${data.Id}&Switch=${data.Switch}`,
  );
}

/**
 * 删除游戏称号分组（游戏称号管理 · 分组删除操作）。
 *
 * @param id 分组 Id
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-group-list.vue
 */
export function deleteGameTitleGroupApi(id: number | string) {
  return requestClient.delete(`/backend/badgecategory/${id}`);
}

/**
 * 游戏称号列表（游戏称号管理 · 称号 Tab）。
 *
 * @param query 查询参数（称号名称、分组、状态等筛选及分页）
 * @returns 称号行 Items 及 Pagination
 * @see views/memberManage/gameTitleManagement/components/game-title-list.vue
 * @see views/operationalManage/gameTitle/index.vue
 */
export async function fetchGameTitleListApi(query: GameTitleListQuery) {
  const result = await requestClient.get<CloudListResult<GameTitleItem>>(
    '/backend/playerbadge/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 新增游戏称号（游戏称号管理 · 称号新增弹窗）。
 *
 * @param data 称号表单（名称、分组、图标等）
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-form-modal.vue
 */
export function createGameTitleApi(data: GameTitlePayload) {
  return requestClient.post('/backend/playerbadge/add', data);
}

/**
 * 编辑游戏称号（游戏称号管理 · 称号编辑弹窗）。
 *
 * @param data 称号表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-form-modal.vue
 */
export function editGameTitleApi(data: GameTitlePayload) {
  return requestClient.put('/backend/playerbadge/edit', data);
}

/**
 * 删除游戏称号（游戏称号管理 · 称号删除操作）。
 *
 * @param id 称号 Id
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-list.vue
 */
export function deleteGameTitleApi(id: number | string) {
  return requestClient.delete(`/backend/playerbadge/${id}`);
}

/**
 * 批量编辑游戏称号（游戏称号管理 · 称号批量编辑操作）。
 *
 * @param data 批量编辑表单（选中称号 Id 及统一更新字段）
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-list.vue
 */
export function batchEditGameTitleApi(data: GameTitleBatchEditPayload) {
  return requestClient.put('/backend/playerbadge/batchedit', data);
}

/**
 * 切换游戏称号启用状态（游戏称号管理 · 称号开关操作）。
 *
 * @param data 称号 Id 及开关状态
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-list.vue
 */
export function updateGameTitleSwitchApi(data: GameTitleSwitchPayload) {
  return requestClient.put(
    `/backend/playerbadge/switch?Id=${data.Id}&Switch=${data.Switch}`,
  );
}

/**
 * 游戏称号拥有者列表（游戏称号管理 · 拥有者弹窗 / 拥有者列表页）。
 *
 * @param query 查询参数（BadgeId、玩家、状态等筛选及分页）
 * @returns 拥有者行 Items 及 Pagination
 * @see views/memberManage/gameTitleManagement/components/game-title-owner-modal.vue
 * @see views/memberManage/gameTitleManagement/gameTitleOwnerList/index.vue
 */
export async function fetchGameTitleOwnerListApi(
  query: GameTitleOwnerListQuery,
) {
  const result = await requestClient.get<CloudListResult<GameTitleOwnerItem>>(
    '/backend/playerbadge/playerlist',
    {
      params: normalizeStatusQuery({
        ...query,
      } as Record<string, unknown>),
    },
  );
  return normalizeList(result);
}

/**
 * 为游戏称号添加拥有者（游戏称号管理 · 拥有者弹窗单个添加）。
 *
 * @param data 拥有者表单（BadgeId、PlayerId 等）
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-owner-modal.vue
 */
export function addGameTitleOwnerApi(data: GameTitleOwnerPayload) {
  return requestClient.post('/backend/playerbadge/addplayer', data);
}

/**
 * 校验待添加的游戏称号拥有者（游戏称号管理 · 拥有者弹窗批量导入前校验）。
 *
 * @param data 称号 Id 及玩家账号/Id 列表
 * @returns 校验结果（合法与非法玩家信息）
 * @see views/memberManage/gameTitleManagement/components/game-title-owner-modal.vue
 */
export function checkGameTitleOwnerApi(data: {
  BadgeId?: number | string;
  PlayerInfos?: Array<{ Account?: string; PackageName?: string }>;
  PlayerIds?: Array<number | string> | string;
}) {
  return requestClient.post('/backend/playerbadge/addplayercheck', data);
}

/**
 * 批量添加游戏称号拥有者（游戏称号管理 · 拥有者弹窗批量添加）。
 *
 * @param data 称号 Id 及玩家 Id 列表
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-owner-modal.vue
 */
export function multiAddGameTitleOwnerApi(data: {
  BadgeId?: number | string;
  PlayerIds?: Array<number | string> | string;
}) {
  return requestClient.post('/backend/playerbadge/multiaddplayer', data);
}

/**
 * 移除游戏称号拥有者（游戏称号管理 · 拥有者弹窗删除操作）。
 *
 * @param data 称号 Id 及待移除的记录 Id / 玩家 Id 列表
 * @returns 接口操作结果
 * @see views/memberManage/gameTitleManagement/components/game-title-owner-modal.vue
 */
export function deleteGameTitleOwnerApi(data: {
  BadgeId?: number | string;
  Ids?: Array<number | string>;
  PlayerIds?: Array<number | string>;
}) {
  return requestClient.delete('/backend/playerbadge/deleteplayer', { data });
}

/**
 * 导出游戏称号拥有者列表 CSV（游戏称号拥有者列表页导出，pageId=75）。
 *
 * @param params 与拥有者列表一致的筛选参数
 * @returns 导出任务信息（Id、Remark、Status）
 * @see views/memberManage/gameTitleManagement/components/game-title-owner-modal.vue
 * @see views/memberManage/gameTitleManagement/gameTitleOwnerList/index.vue
 */
export function exportGameTitleOwnerListApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/playerbadge/playerlistcsv',
    { params: normalizeStatusQuery(params) },
  );
}

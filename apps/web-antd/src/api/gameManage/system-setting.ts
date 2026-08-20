import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 系统设置模块列表响应 */
export interface SystemListResult<T = Record<string, unknown>> {
  Items?: T[];
  Pagination?: { MaxCount?: number };
}

/**
 * 查询游戏帮助Tabs。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/systemSetting
 */
export function fetchGameHelpTabsApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gamehelpcenter/list',
  );
}

/**
 * 查询游戏帮助Contents。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/systemSetting
 */
export function fetchGameHelpContentsApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gamehelpcenter/listall',
  );
}

/**
 * 新增游戏帮助标签。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/systemSetting
 */
export function createGameHelpTabApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gamehelpcenter', data);
}

/**
 * 更新游戏帮助标签。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function updateGameHelpTabApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamehelpcenter', data);
}

/**
 * 删除游戏帮助标签。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/systemSetting
 */
export function deleteGameHelpTabApi(id: number | string) {
  return requestClient.delete(`/backend/gamehelpcenter/${id}`);
}

/**
 * 新增游戏帮助内容。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/systemSetting
 */
export function createGameHelpContentApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gamehelpcenter/addcontent', data);
}

/**
 * 更新游戏帮助内容。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function updateGameHelpContentApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamehelpcenter/editcontent', data);
}

/**
 * 删除游戏帮助内容。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/systemSetting
 */
export function deleteGameHelpContentApi(id: number | string) {
  return requestClient.delete('/backend/gamehelpcenter/deletecontent', {
    params: { Id: id },
  });
}

/**
 * 恢复游戏帮助。
 *
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function recoverGameHelpApi() {
  return requestClient.get('/backend/gamehelpcenter/recover');
}

/**
 * 调整游戏帮助排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function sortGameHelpApi(data: {
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/gamehelpcenter/switchSort', data);
}

/**
 * 查询手机号屏蔽Setting。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/systemSetting
 */
export function fetchPhoneBlockSettingApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/phonecountrycode/blocklist',
  );
}

/**
 * 更新手机号屏蔽Setting。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function updatePhoneBlockSettingApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/phonecountrycode/block', data);
}

/**
 * 查询体育教程列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/systemSetting
 */
export function fetchSportsTutorialListApi(query: Record<string, unknown>) {
  return requestClient.get<SystemListResult>('/backend/sportsconfig/list', {
    params: trimSpace({ ...query, ConfigType: 1 }),
  });
}

/**
 * 新增体育教程。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/systemSetting
 */
export function createSportsTutorialApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/sportsconfig', trimSpace(data));
}

/**
 * 更新体育教程。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function updateSportsTutorialApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/sportsconfig', trimSpace(data));
}

/**
 * 删除体育教程。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/systemSetting
 */
export function deleteSportsTutorialApi(id: number | string) {
  return requestClient.delete(`/backend/sportsconfig/${id}`);
}

/**
 * 调整体育教程排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function sortSportsTutorialApi(data: {
  ConfigType: 1;
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/sportsconfig/switchsequence', data);
}

/**
 * 查询汇率汇率列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/systemSetting
 */
export function fetchExchangeRateListApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>[] | SystemListResult>(
    '/backend/operation/exchangeratesetting',
    { params: trimSpace(query) },
  );
}

/**
 * 新增汇率汇率。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/systemSetting
 */
export function createExchangeRateApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/operation/exchangeratesetting', data);
}

/**
 * 更新汇率汇率。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function updateExchangeRateApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/operation/exchangeratesetting', data);
}

/**
 * 删除汇率汇率。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/systemSetting
 */
export function deleteExchangeRateApi(id: number | string) {
  return requestClient.delete(`/backend/operation/exchangeratesetting/${id}`);
}

/**
 * 查询系统模板列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/systemSetting
 */
export function fetchSystemTemplateListApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>[] | SystemListResult>(
    '/backend/netcashconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 新增系统模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/systemSetting
 */
export function createSystemTemplateApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/netcashconfig/netcashconfigadd', data);
}

/**
 * 更新系统模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/systemSetting
 */
export function updateSystemTemplateApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/netcashconfig/netcashconfigedit', data);
}

/**
 * 删除系统模板。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/systemSetting
 */
export function deleteSystemTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/netcashconfig/netcashconfigdel/${id}`);
}

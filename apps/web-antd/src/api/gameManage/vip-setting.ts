import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** VIP 模块列表响应（含合计 Total） */
export interface VipListResult<T = Record<string, unknown>> {
  Items?: T[];
  Pagination?: { MaxCount?: number };
  Total?: Record<string, number>;
}

/**
 * 查询VIP等级列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/vipSetting
 */
export function fetchVipGradeListApi(query: Record<string, unknown> = {}) {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/viplevelconfig/listvirtualprize',
    { params: trimSpace(query) },
  );
}

/**
 * 新增VIP等级。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/vipSetting
 */
export function createVipGradeApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/viplevelconfig/addvirtualprize',
    data,
  );
}

/**
 * 更新VIP等级。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/vipSetting
 */
export function updateVipGradeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/viplevelconfig/virtualprize', data);
}

/**
 * 查询VIP系数。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/vipSetting
 */
export function fetchVipCoefficientApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/vipcoefficientconfig/detail',
  );
}

/**
 * 保存 VIP 升级系数。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/vipSetting
 */
export function updateVipCoefficientApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/vipcoefficientconfig/', data);
}

/**
 * 查询VIP记录列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/vipSetting
 */
export function fetchVipRecordListApi(query: Record<string, unknown>) {
  return requestClient.get<VipListResult>(
    '/backend/viplevelconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询 VIP 保级天数。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/vipSetting
 */
export function fetchVipRelegationDayApi() {
  return requestClient.get<{ RelegationDay?: number }>(
    '/backend/viplevelconfig/getrelegationday',
  );
}

/**
 * 设置 VIP 保级天数。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/vipSetting
 */
export function updateVipRelegationDayApi(data: { RelegationDay: number }) {
  return requestClient.put('/backend/viplevelconfig/setrelegationday/', data);
}

/**
 * 查询 VIP 升级模式。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/vipSetting
 */
export function fetchVipLevelModeApi() {
  return requestClient.get<{ VipLevelMode?: number }>(
    '/backend/viplevelconfig/getviplevelmode',
  );
}

/**
 * 设置 VIP 升级模式。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/vipSetting
 */
export function updateVipLevelModeApi(data: { VipLevelMode: number }) {
  return requestClient.put('/backend/viplevelconfig/setviplevelmode/', data);
}

/**
 * 更新VIP月度奖励模式。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/vipSetting
 */
export function updateVipMonthRewardModeApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/viplevelconfig/setmonthrewardmode/',
    data,
  );
}

/**
 * 查询VIP图标模板列表。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/vipSetting
 */
export function fetchVipIconTemplateListApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/viplevelconfig/listiconstemplates/',
  );
}

/**
 * 查询 VIP 图标方案详情。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/vipSetting
 */
export function fetchVipIconsApi(data: { TemplateId: number | string }) {
  return requestClient.post<Record<string, unknown>[]>(
    '/backend/viplevelconfig/listicons/',
    data,
  );
}

/**
 * 新增VIP图标模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/vipSetting
 */
export function createVipIconTemplateApi(data: { TemplateName: string }) {
  return requestClient.put(
    '/backend/viplevelconfig/addiconstemplate/',
    data,
  );
}

/**
 * 更新VIP图标模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/vipSetting
 */
export function updateVipIconTemplateApi(data: {
  TemplateId: number | string;
  TemplateName: string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/iconstemplatename/',
    data,
  );
}

/**
 * 删除VIP图标模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/vipSetting
 */
export function deleteVipIconTemplateApi(data: {
  TemplateId: number | string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/deleteiconstemplate/',
    data,
  );
}

/**
 * 重置VIP图标模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/vipSetting
 */
export function resetVipIconTemplateApi(data: {
  TemplateId: number | string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/resettodefaulttemplate/',
    data,
  );
}

/**
 * 更新VIP图标。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/vipSetting
 */
export function updateVipIconApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/viplevelconfig/icons/', data);
}


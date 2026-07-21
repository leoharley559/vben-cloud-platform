import type {
  CommissionListResult,
  CommissionRow,
  NetcashListQuery,
  NetcashListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type Payload = Record<string, unknown>;
type Query = Partial<NetcashListQuery> & Payload;

/**
 * 佣金模板列表（「佣金管理」页方案 Tab 模板列表）。
 *
 * @param query 查询参数（分页等）
 * @returns 佣金模板 Items 及 Pagination
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function fetchCommTempListApi(query: Query = {}) {
  return requestClient.get<NetcashListResult<CommissionRow>>(
    '/backend/commissiontemplate/list',
    {
      params: query,
    },
  );
}

/**
 * 新建佣金模板。
 *
 * @param data 模板表单
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function createCommTemplateApi(data: Payload) {
  return requestClient.post('/backend/commissiontemplate/', data);
}

/**
 * 更新佣金模板。
 *
 * @param data 模板表单（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function updateCommTemplateApi(data: Payload) {
  return requestClient.put('/backend/commissiontemplate/', data);
}

/**
 * 删除佣金模板。
 *
 * @param id 模板 Id
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function deleteCommTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/commissiontemplate/${id}`);
}

/**
 * 佣金配置列表（方案 Tab 配置明细）。
 *
 * @param query 查询参数（模板 Id 等）
 * @returns 佣金配置行数组
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function fetchCommListApi(query: Query) {
  return requestClient.get<CommissionRow[]>(
    '/backend/commissionconfig/list',
    { params: query },
  );
}

/**
 * 新建佣金配置项。
 *
 * @param data 配置表单
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function createCommConfigApi(data: Payload) {
  return requestClient.post('/backend/commissionconfig/', data);
}

/**
 * 更新佣金配置项。
 *
 * @param data 配置表单（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function updateCommConfigApi(data: Payload) {
  return requestClient.put('/backend/commissionconfig/', data);
}

/**
 * 删除佣金配置项。
 *
 * @param id 配置 Id
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function deleteCommConfigApi(id: number | string) {
  return requestClient.delete(`/backend/commissionconfig/${id}`);
}

/**
 * 重置佣金配置为默认值。
 *
 * @param data 重置载荷（模板/配置 Id 等）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function resetCommConfigApi(data: Payload) {
  return requestClient.put('/backend/commissionconfig/resetdefault', data);
}

/**
 * 场馆费率模板列表（方案 Tab 场馆模板）。
 *
 * @param query 查询参数（分页等）
 * @returns 场馆模板 Items 及 Pagination
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function fetchVenueTemplateListApi(query: Query = {}) {
  return requestClient.get<NetcashListResult<CommissionRow>>('/backend/apifeetemplate/list', {
    params: query,
  });
}

/**
 * 新建场馆费率模板。
 *
 * @param data 模板表单
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function createVenueTemplateApi(data: Payload) {
  return requestClient.post('/backend/apifeetemplate/', data);
}

/**
 * 更新场馆费率模板。
 *
 * @param data 模板表单（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function updateVenueTemplateApi(data: Payload) {
  return requestClient.put('/backend/apifeetemplate/', data);
}

/**
 * 删除场馆费率模板。
 *
 * @param id 模板 Id
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function deleteVenueTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/apifeetemplate/${id}`);
}

/**
 * 场馆费率配置列表。
 *
 * @param query 查询参数（模板 Id 等）
 * @returns 场馆费率配置行数组
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function fetchVenueListApi(query: Query) {
  return requestClient.get<CommissionRow[]>('/backend/apifeeconfig/list', {
    params: query,
  });
}

/**
 * 更新场馆费率配置。
 *
 * @param data 配置表单
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function updateVenueConfigApi(data: Payload) {
  return requestClient.put('/backend/apifeeconfig/', data);
}

/**
 * 待发佣金列表（「佣金管理」页发放 Tab 主表格）。
 *
 * @param query 查询参数（周期、代理、分页等）
 * @returns 待发佣金 Items 及 Pagination
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function fetchSendCommListApi(query: Query) {
  return requestClient.get<CommissionListResult>('/backend/sendcommission/list', {
    params: trimSpace(query),
  });
}

/**
 * 团队佣金列表（发放 Tab 团队维度）。
 *
 * @param query 查询参数（周期、团队、分页等）
 * @returns 团队佣金 Items 及 Pagination
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function fetchTeamCommListApi(query: Query) {
  return requestClient.get<CommissionListResult>(
    '/backend/sendcommission/commissionlist',
    {
      params: trimSpace(query),
    },
  );
}

/**
 * 个人佣金列表（与 fetchTeamCommListApi 同接口，发放 Tab 个人维度）。
 *
 * @param query 查询参数（周期、AdminId、分页等）
 * @returns 个人佣金 Items 及 Pagination
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export const fetchPersonalCommListApi = fetchTeamCommListApi;

/**
 * 佣金算法配置数据列表（方案 Tab 算法配置）。
 *
 * @param query 查询参数（AdminId、模板 Id 等）
 * @returns 算法配置行数组
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function fetchCommAlgorithmDataApi(query: Query) {
  return requestClient.get<CommissionRow[]>(
    '/backend/commissionalgorithm/list',
    {
      params: query,
    },
  );
}

/**
 * 佣金算法模板列表。
 *
 * @param query 查询参数（分页等）
 * @returns 算法模板 Items 及 Pagination
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function fetchAlgorithmTemplateListApi(query: Query = {}) {
  return requestClient.get<NetcashListResult<CommissionRow>>(
    '/backend/commissionalgorithmtemplate/list',
    { params: query },
  );
}

/**
 * 新建佣金算法模板。
 *
 * @param data 模板表单
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function createAlgorithmTemplateApi(data: Payload) {
  return requestClient.post('/backend/commissionalgorithmtemplate/', data);
}

/**
 * 更新佣金算法模板。
 *
 * @param data 模板表单（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function updateAlgorithmTemplateApi(data: Payload) {
  return requestClient.put('/backend/commissionalgorithmtemplate/', data);
}

/**
 * 删除佣金算法模板。
 *
 * @param id 模板 Id
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function deleteAlgorithmTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/commissionalgorithmtemplate/${id}`);
}

/**
 * 更新佣金算法配置。
 *
 * @param data 算法配置表单
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function updateAlgorithmApi(data: Payload) {
  return requestClient.put('/backend/commissionalgorithm/', data);
}

/**
 * 重置佣金算法为默认值。
 *
 * @param data 重置载荷
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function resetAlgorithmApi(data: Payload) {
  return requestClient.put('/backend/commissionalgorithm/resetdefault', data);
}

/**
 * 多级佣金模板列表（方案 Tab 多级模板）。
 *
 * @param query 查询参数（分页等）
 * @returns 多级模板 Items 及 Pagination
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function fetchMultCommTempListApi(query: Query = {}) {
  return requestClient.get<NetcashListResult<CommissionRow>>(
    '/backend/commissiontemplatemulti/list',
    {
      params: query,
    },
  );
}

/**
 * 新建多级佣金模板。
 *
 * @param data 模板表单
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function createMultCommTemplateApi(data: Payload) {
  return requestClient.post('/backend/commissiontemplatemulti/', data);
}

/**
 * 更新多级佣金模板。
 *
 * @param data 模板表单（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function updateMultCommTemplateApi(data: Payload) {
  return requestClient.put('/backend/commissiontemplatemulti/', data);
}

/**
 * 删除多级佣金模板。
 *
 * @param id 模板 Id
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function deleteMultCommTemplateApi(id: number | string) {
  return requestClient.delete(`/backend/commissiontemplatemulti/${id}`);
}

/**
 * 多级佣金配置详情（单条配置对象）。
 *
 * @param query 查询参数（模板 Id 等）
 * @returns 多级佣金配置 CommissionRow
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function fetchMultCommConfigApi(query: Query) {
  return requestClient.get<CommissionRow>('/backend/commissionconfigmulti/list', {
    params: query,
  });
}

/**
 * 更新多级佣金配置。
 *
 * @param data 配置表单
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function updateMultCommConfigApi(data: Payload) {
  return requestClient.put('/backend/commissionconfigmulti/', data);
}

/**
 * 重置多级佣金配置为默认值。
 *
 * @param data 重置载荷
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/scheme-panel.vue
 */
export function resetMultCommConfigApi(data: Payload) {
  return requestClient.put('/backend/commissionconfigmulti/resetdefault', data);
}

/**
 * 个人佣金明细（发放 Tab 个人详情弹窗）。
 *
 * @param query 查询参数（AdminId、周期等）
 * @returns 个人明细行数组
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function fetchPersonalDetailApi(query: Query) {
  return requestClient.get<CommissionRow[]>('/backend/sendcommission/personaldetail', {
    params: query,
  });
}

/**
 * 团队佣金明细（发放 Tab 团队详情弹窗）。
 *
 * @param query 查询参数（TeamId、周期等）
 * @returns 团队明细行数组
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function fetchTeamDetailApi(query: Query) {
  return requestClient.get<CommissionRow[]>('/backend/sendcommission/teamdetail', {
    params: query,
  });
}

/**
 * 可选团队列表（发放 Tab 筛选下拉）。
 *
 * @param query 查询参数（分页等）
 * @returns 团队 Items 及 Pagination
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function fetchTeamListApi(query: Query) {
  return requestClient.get<CommissionListResult>(
    '/backend/sendcommission/listadmin',
    { params: query },
  );
}

/**
 * 佣金发放信息列表（历史/详情查询）。
 *
 * @param query 查询参数（AdminId、周期、分页等）
 * @returns 佣金信息 Items 及 Pagination
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function fetchCommissionInfoListApi(query: Query) {
  return requestClient.get<CommissionListResult>(
    '/backend/sendcommission/commissioninfolist',
    { params: trimSpace(query) },
  );
}

/**
 * 单笔发放佣金。
 *
 * @param data 发放载荷（AdminId、周期、金额等）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function sendCommissionApi(data: Payload) {
  return requestClient.post('/backend/sendcommission/sendcommission', data);
}

/**
 * 一键批量发放佣金。
 *
 * @param data 批量发放载荷（周期、筛选条件等）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function oneKeySendCommissionApi(data: Payload) {
  return requestClient.post('/backend/sendcommission/onekeysend', data);
}

/**
 * 调整已生成佣金金额。
 *
 * @param data 调整载荷（记录 Id、AdjustAmount 等）
 * @returns 接口操作结果
 * @see views/netcash/commissionManage/components/commission-ledger-panel.vue
 */
export function adjustCommissionApi(data: Payload) {
  return requestClient.put(
    '/backend/sendcommission/adjustmentcommission',
    data,
  );
}

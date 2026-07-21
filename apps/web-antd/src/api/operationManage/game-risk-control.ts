import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/**
 * 查询 IP 风控黑名单/白名单列表
 * @param query 筛选条件（IP、类型、时间范围及分页）
 * @returns IP 风控记录列表 Items 及 Pagination
 * @see views/operationalManage/gameRiskControl/components/risk-record-panel.vue
 */
export function fetchGameIpRiskListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/gameipriskcontrol/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询设备/邮箱风控黑名单列表
 * @param query 筛选条件（设备标识、类型及分页）
 * @returns 设备风控记录列表 Items 及 Pagination
 * @see views/operationalManage/gameRiskControl/components/risk-record-panel.vue
 */
export function fetchGameRiskListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/gameriskcontrol/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询银行卡黑名单列表
 * @param query 筛选条件（卡号、备注及分页）
 * @returns 银行卡黑名单列表 Items 及 Pagination
 * @see views/operationalManage/gameRiskControl/components/bank-card-risk-panel.vue
 */
export function fetchGameBankRiskListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerbankcard/blacklist',
    { params: trimSpace(query) },
  );
}

/**
 * 查询 App Store 白名单风控列表
 * @param query 筛选条件（Key、UUID 及分页）
 * @returns App Store 白名单列表数据
 * @see views/operationalManage/gameRiskControl/components/appstore-whitelist-panel.vue
 */
export function fetchAppStoreWhiteRiskListApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/appstorewhitelistrisk/list',
    { params: trimSpace(query) },
  );
}

/**
 * 新增 App Store 白名单记录
 * @param data 白名单 Key 与 UUID
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/appstore-whitelist-panel.vue
 */
export function createAppStoreWhiteRiskApi(data: {
  Key: string;
  UUID: string;
}) {
  return requestClient.post('/backend/appstorewhitelistrisk/add', data);
}

/**
 * 删除 App Store 白名单记录
 * @param data 白名单 Key 与 UUID
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/appstore-whitelist-panel.vue
 */
export function deleteAppStoreWhiteRiskApi(data: {
  Key: string;
  UUID: string;
}) {
  return requestClient.post('/backend/appstorewhitelistrisk/del', data);
}

/**
 * 新增银行卡黑名单
 * @param data 银行卡信息及备注
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/bank-card-risk-panel.vue
 * @see views/operationalManage/gameRiskControl/components/bank-card-risk-import-modal.vue
 */
export function createBankCardBlackApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerbankcard/addblack', data);
}

/**
 * 编辑银行卡黑名单备注
 * @param data 记录 Id 及备注 Desc
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/bank-card-risk-panel.vue
 */
export function updateBankCardBlackApi(data: {
  Desc: string;
  Id: number | string;
}) {
  return requestClient.post('/backend/playerbankcard/editblack', data);
}

/**
 * 解除银行卡黑名单
 * @param id 黑名单记录 Id
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/bank-card-risk-panel.vue
 */
export function removeBankCardBlackApi(id: number | string) {
  return requestClient.post(`/backend/playerbankcard/removeblack/${id}`);
}

/**
 * 批量删除银行卡黑名单
 * @param ids 黑名单记录 Id 数组
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/bank-card-risk-panel.vue
 */
export function batchDeleteBankCardBlackApi(ids: Array<number | string>) {
  return requestClient.post(
    '/backend/playerbankcard/batchdelete',
    {},
    { params: { Ids: ids.join(',') } },
  );
}

/**
 * 按卡号预取关联玩家账号信息
 * @param data 查询参数（银行卡号等）
 * @returns 关联玩家账号 Items
 * @see views/operationalManage/gameRiskControl/components/bank-card-risk-panel.vue
 */
export function fetchBankCardBlackInfoApi(data: Record<string, unknown>) {
  return requestClient.post<{ Items?: Array<Record<string, unknown>> }>(
    '/backend/playerbankcard/playerbankcardinfo',
    data,
  );
}

/**
 * 获取注册上限风控配置
 * @param params 查询参数（SubType、Type 等）
 * @returns 注册上限配置列表或分页结果
 * @see views/operationalManage/gameRiskControl/components/reg-config-panel.vue
 */
export function fetchRegConfigApi(params: Record<string, unknown>) {
  return requestClient.get<
    Array<Record<string, unknown>> | CloudListResult<Record<string, unknown>>
  >('/backend/gameipriskcontrol/registerconfigs', { params });
}

/**
 * 保存注册上限风控配置
 * @param data 配置参数（IsOn、LimitAmt、SubType、Type）
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/reg-config-panel.vue
 */
export function updateRegConfigApi(data: {
  IsOn: boolean | number;
  LimitAmt: number;
  SubType: 1 | 2;
  Type?: number;
}) {
  return requestClient.put(
    '/backend/gameipriskcontrol/editregisterconfig',
    data,
  );
}

/**
 * 按设备/邮箱风控值预取关联玩家账号
 * @param data 查询参数（风控标识及类型）
 * @returns 关联玩家账号 Items
 * @see views/operationalManage/gameRiskControl/components/risk-record-create-modal.vue
 * @see views/operationalManage/playerDetails/components/player-relation-blacklist-modal.vue
 */
export function fetchDeviceRiskPlayersApi(data: Record<string, unknown>) {
  return requestClient.post<{ Items?: Array<Record<string, unknown>> }>(
    '/backend/gameriskcontrol/playerriskvalue',
    data,
  );
}

/**
 * 按 IP 风控值预取关联玩家账号
 * @param data 查询参数（IP 及风控类型）
 * @returns 关联玩家账号 Items
 * @see views/operationalManage/gameRiskControl/components/risk-record-create-modal.vue
 * @see views/operationalManage/playerDetails/components/player-relation-blacklist-modal.vue
 */
export function fetchIpRiskPlayersApi(data: Record<string, unknown>) {
  return requestClient.post<{ Items?: Array<Record<string, unknown>> }>(
    '/backend/gameipriskcontrol/playerriskvalue',
    data,
  );
}

/**
 * 新增设备/邮箱风控黑名单
 * @param data 风控标识、类型及备注
 * @returns 批量操作结果（SuccessCount、FailCount）
 * @see views/operationalManage/gameRiskControl/components/risk-record-create-modal.vue
 * @see views/operationalManage/gameRiskControl/components/risk-record-import-modal.vue
 */
export function createDeviceRiskApi(data: Record<string, unknown>) {
  return requestClient.post<{
    FailCount?: number;
    SuccessCount?: number;
  }>('/backend/gameriskcontrol/', data);
}

/**
 * 新增 IP 风控黑名单/白名单
 * @param data IP 地址、类型及备注
 * @returns 批量操作结果（SuccessCount、FailCount）
 * @see views/operationalManage/gameRiskControl/components/risk-record-create-modal.vue
 * @see views/operationalManage/gameRiskControl/components/risk-record-import-modal.vue
 */
export function createIpRiskApi(data: Record<string, unknown>) {
  return requestClient.post<{
    FailCount?: number;
    SuccessCount?: number;
  }>('/backend/gameipriskcontrol/', data);
}

/**
 * 编辑 IP 风控备注
 * @param data 记录 Id 及备注 Desc
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/risk-record-edit-modal.vue
 */
export function updateIpRiskApi(data: { Desc: string; Id: number | string }) {
  return requestClient.put('/backend/gameipriskcontrol/', data);
}

/**
 * 删除 IP 风控记录
 * @param id 风控记录 Id
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/risk-record-panel.vue
 */
export function deleteIpRiskApi(id: number | string) {
  return requestClient.delete(`/backend/gameipriskcontrol/${id}`);
}

/**
 * 批量删除 IP 风控记录
 * @param ids 风控记录 Id 数组
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/risk-record-panel.vue
 */
export function batchDeleteIpRiskApi(ids: Array<number | string>) {
  return requestClient.post(
    '/backend/gameipriskcontrol/batchdelete',
    {},
    {
      params: { Ids: ids.join(',') },
    },
  );
}

/**
 * 编辑设备/邮箱风控备注
 * @param data 记录 Id 及备注 Desc
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/risk-record-edit-modal.vue
 */
export function updateDeviceRiskApi(data: {
  Desc: string;
  Id: number | string;
}) {
  return requestClient.put('/backend/gameriskcontrol/', data);
}

/**
 * 删除设备/邮箱风控记录
 * @param id 风控记录 Id
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/risk-record-panel.vue
 */
export function deleteDeviceRiskApi(id: number | string) {
  return requestClient.delete(`/backend/gameriskcontrol/${id}`);
}

/**
 * 批量删除设备/邮箱风控记录
 * @param ids 风控记录 Id 数组
 * @returns 接口操作结果
 * @see views/operationalManage/gameRiskControl/components/risk-record-panel.vue
 */
export function batchDeleteDeviceRiskApi(ids: Array<number | string>) {
  return requestClient.post(
    '/backend/gameriskcontrol/batchdelete',
    {},
    {
      params: { Ids: ids.join(',') },
    },
  );
}

import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchGameIpRiskListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/gameipriskcontrol/list',
    { params: trimSpace(query) },
  );
}

export function fetchGameRiskListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/gameriskcontrol/list',
    { params: trimSpace(query) },
  );
}

export function fetchGameBankRiskListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerbankcard/blacklist',
    { params: trimSpace(query) },
  );
}

export function fetchAppStoreWhiteRiskListApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/appstorewhitelistrisk/list',
    { params: trimSpace(query) },
  );
}

/** App Store 白名单新增 */
export function createAppStoreWhiteRiskApi(data: {
  Key: string;
  UUID: string;
}) {
  return requestClient.post('/backend/appstorewhitelistrisk/add', data);
}

/** App Store 白名单删除 */
export function deleteAppStoreWhiteRiskApi(data: {
  Key: string;
  UUID: string;
}) {
  return requestClient.post('/backend/appstorewhitelistrisk/del', data);
}

/** 银行卡黑名单新增 */
export function createBankCardBlackApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerbankcard/addblack', data);
}

/** 银行卡黑名单编辑备注 */
export function updateBankCardBlackApi(data: {
  Desc: string;
  Id: number | string;
}) {
  return requestClient.post('/backend/playerbankcard/editblack', data);
}

/** 银行卡黑名单解除 */
export function removeBankCardBlackApi(id: number | string) {
  return requestClient.post(`/backend/playerbankcard/removeblack/${id}`);
}

/** 银行卡黑名单批量删除 */
export function batchDeleteBankCardBlackApi(ids: Array<number | string>) {
  return requestClient.post(
    '/backend/playerbankcard/batchdelete',
    {},
    { params: { Ids: ids.join(',') } },
  );
}

/** 按卡号预取关联账号 */
export function fetchBankCardBlackInfoApi(data: Record<string, unknown>) {
  return requestClient.post<{ Items?: Array<Record<string, unknown>> }>(
    '/backend/playerbankcard/playerbankcardinfo',
    data,
  );
}

export function fetchRegConfigApi(params: Record<string, unknown>) {
  return requestClient.get<
    Array<Record<string, unknown>> | CloudListResult<Record<string, unknown>>
  >('/backend/gameipriskcontrol/registerconfigs', { params });
}

/** 保存注册上限配置 */
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

/** 按设备/邮箱风控值预取关联账号 */
export function fetchDeviceRiskPlayersApi(data: Record<string, unknown>) {
  return requestClient.post<{ Items?: Array<Record<string, unknown>> }>(
    '/backend/gameriskcontrol/playerriskvalue',
    data,
  );
}

/** 按 IP 风控值预取关联账号 */
export function fetchIpRiskPlayersApi(data: Record<string, unknown>) {
  return requestClient.post<{ Items?: Array<Record<string, unknown>> }>(
    '/backend/gameipriskcontrol/playerriskvalue',
    data,
  );
}

/** 新增设备/邮箱黑名单 */
export function createDeviceRiskApi(data: Record<string, unknown>) {
  return requestClient.post<{
    FailCount?: number;
    SuccessCount?: number;
  }>('/backend/gameriskcontrol/', data);
}

/** 新增 IP 黑名单/白名单 */
export function createIpRiskApi(data: Record<string, unknown>) {
  return requestClient.post<{
    FailCount?: number;
    SuccessCount?: number;
  }>('/backend/gameipriskcontrol/', data);
}

/** 编辑 IP 风控备注 */
export function updateIpRiskApi(data: { Desc: string; Id: number | string }) {
  return requestClient.put('/backend/gameipriskcontrol/', data);
}

/** 删除 IP 风控 */
export function deleteIpRiskApi(id: number | string) {
  return requestClient.delete(`/backend/gameipriskcontrol/${id}`);
}

/** 批量删除 IP 风控 */
export function batchDeleteIpRiskApi(ids: Array<number | string>) {
  return requestClient.post(
    '/backend/gameipriskcontrol/batchdelete',
    {},
    {
      params: { Ids: ids.join(',') },
    },
  );
}

/** 编辑设备风控备注 */
export function updateDeviceRiskApi(data: {
  Desc: string;
  Id: number | string;
}) {
  return requestClient.put('/backend/gameriskcontrol/', data);
}

/** 删除设备风控 */
export function deleteDeviceRiskApi(id: number | string) {
  return requestClient.delete(`/backend/gameriskcontrol/${id}`);
}

/** 批量删除设备风控 */
export function batchDeleteDeviceRiskApi(ids: Array<number | string>) {
  return requestClient.post(
    '/backend/gameriskcontrol/batchdelete',
    {},
    {
      params: { Ids: ids.join(',') },
    },
  );
}

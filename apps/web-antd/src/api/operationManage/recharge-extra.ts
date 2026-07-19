import { requestClient } from '#/api/request';
import type {
  CloudListResult,
  RechargeBlackDeviceItem,
  RechargeBlackPlayerItem,
  RechargeCancelStatsItem,
  RechargeLimitConfigItem,
} from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/** 三方充值失败记录 */
export function fetchRechargeFailListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerpayment/faillist',
    { params: trimSpace(query) },
  );
}

/** CP 补单列表 */
export function fetchCpReissueListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/fixpayment/list',
    { params: trimSpace(query) },
  );
}

/** CP 补单：未完成订单 */
export function fetchCpIncompleteOrdersApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/fixpayment/listincompleteorders',
    { params: trimSpace(query) },
  );
}

/** CP 补单提交 */
export function replaceCpPaymentOrderApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/fixpayment/replacementorder', data);
}

/** 充值次数限制列表 */
export function fetchRechargeLimitConfigListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<RechargeLimitConfigItem>>(
    '/backend/rechargelimitconfig/list',
    { params: query },
  );
}

export function createRechargeLimitConfigApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargelimitconfig/', data);
}

export function updateRechargeLimitConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rechargelimitconfig/', data);
}

export function deleteRechargeLimitConfigApi(id: number | string) {
  return requestClient.delete(`/backend/rechargelimitconfig/${id}`);
}

/** 充值黑名单自动条件 */
export function fetchRechargeBlackConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/rechargeblackconfig/',
  );
}

export function updateRechargeBlackConfigApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargeblackconfig/', data);
}

/** 充值玩家黑名单 */
export function fetchRechargeBlackPlayerListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<RechargeBlackPlayerItem>>(
    '/backend/rechargeblackplayer/list',
    { params: trimSpace(query) },
  );
}

export function createRechargeBlackPlayerApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargeblackplayer/', data);
}

export function updateRechargeBlackPlayerApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rechargeblackplayer/', data);
}

export function deleteRechargeBlackPlayerApi(id: number | string) {
  return requestClient.delete(`/backend/rechargeblackplayer/${id}`);
}

/** 充值设备黑名单 */
export function fetchRechargeBlackDeviceListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<RechargeBlackDeviceItem>>(
    '/backend/rechargeblackdevice/list',
    { params: trimSpace(query) },
  );
}

export function createRechargeBlackDeviceApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargeblackdevice/', data);
}

export function updateRechargeBlackDeviceApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rechargeblackdevice/', data);
}

export function deleteRechargeBlackDeviceApi(
  id: number | string,
  removeLoginPlayer: number | string = '',
) {
  return requestClient.delete(`/backend/rechargeblackdevice/${id}`, {
    params: { RemoveLoginPlayer: removeLoginPlayer },
  });
}

/** 充值取消原因统计 */
export function fetchRechargeCancelStatsApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<RechargeCancelStatsItem>>(
    '/backend/golobalgametipconfig/list',
    { params: trimSpace(query) },
  );
}

/** 自助查单列表 */
export function fetchSelfCheckListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerpaymentselfreview/list',
    { params: trimSpace(query) },
  );
}

/** 自助查单：补分 / 拒绝 / 接单 */
export function handleSelfCheckOrderApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerpaymentselfreview/action', data);
}

/** 自助查单处理记录 */
export function fetchSelfCheckActionRecordsApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerpaymentselfreview/detail',
    { params: trimSpace(query) },
  );
}

/** 新增自助查单备注 */
export function createSelfCheckActionRecordApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpaymentselfreview/remark', data);
}

/** 游戏端入口开关 */
export function fetchSelfCheckGameSwitchApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerpaymentselfreview/checkconfig',
  );
}

export function updateSelfCheckGameSwitchApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/playerpaymentselfreview/selfreviewconfig',
    data,
  );
}

/** 自助查单访问记录 */
export function fetchSelfReviewVisitListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/visitstatistic/selfreviewlist',
    { params: trimSpace(query) },
  );
}

/** 自助查单访问统计 */
export function fetchSelfReviewStatisticsListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<{
    DeviceList?: Record<string, unknown>[];
    Total?: unknown[];
    UserTypeList?: Record<string, unknown>[];
    VipList?: Record<string, unknown>[];
  }>('/backend/visitstatistic/selfreviewstatisticslist', {
    params: trimSpace(query),
  });
}

/** 自助查单入口图片 */
export function fetchSelfCheckEntryImageApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerpaymentselfreview/icon',
    { params: trimSpace(query) },
  );
}

export function updateSelfCheckEntryImageApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerpaymentselfreview/upload', data);
}

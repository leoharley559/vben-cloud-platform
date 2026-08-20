import type {
  CloudListResult,
  RechargeBlackDeviceItem,
  RechargeBlackPlayerItem,
  RechargeCancelStatsItem,
  RechargeLimitConfigItem,
} from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 分页查询三方充值失败记录。
 *
 * @param query 时间、渠道等筛选及分页参数
 * @returns 失败记录 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/error-record-list.vue
 */
export function fetchRechargeFailListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerpayment/faillist',
    { params: trimSpace(query) },
  );
}

/**
 * 分页查询 CP 补单列表。
 *
 * @param query 筛选条件及分页参数
 * @returns CP 补单 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/cp-reissue-list.vue
 */
export function fetchCpReissueListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/fixpayment/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询 CP 补单未完成订单。
 *
 * @param query 筛选条件及分页参数
 * @returns 未完成订单 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/cp-reissue-list.vue
 */
export function fetchCpIncompleteOrdersApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/fixpayment/listincompleteorders',
    { params: trimSpace(query) },
  );
}

/**
 * 提交 CP 补单。
 *
 * @param data 原订单及补单信息
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/cp-reissue-list.vue
 */
export function replaceCpPaymentOrderApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/fixpayment/replacementorder', data);
}

/**
 * 分页查询充值次数限制配置列表。
 *
 * @param query 筛选条件及分页参数
 * @returns 限制配置 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/recharge-limit-settings.vue
 */
export function fetchRechargeLimitConfigListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<RechargeLimitConfigItem>>(
    '/backend/rechargelimitconfig/list',
    { params: query },
  );
}

/**
 * 新增充值次数限制配置。
 *
 * @param data 限制规则表单字段
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-limit-settings.vue
 */
export function createRechargeLimitConfigApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargelimitconfig/', data);
}

/**
 * 编辑充值次数限制配置。
 *
 * @param data 限制规则表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-limit-settings.vue
 */
export function updateRechargeLimitConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rechargelimitconfig/', data);
}

/**
 * 删除充值次数限制配置。
 *
 * @param id 配置 ID
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-limit-settings.vue
 */
export function deleteRechargeLimitConfigApi(id: number | string) {
  return requestClient.delete(`/backend/rechargelimitconfig/${id}`);
}

/**
 * 获取充值黑名单自动条件配置。
 *
 * @returns 自动拉黑条件配置对象
 * @see views/operationalManage/rechargeList/components/blacklist-game-account.vue
 */
export function fetchRechargeBlackConfigApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/rechargeblackconfig/',
  );
}

/**
 * 更新充值黑名单自动条件配置。
 *
 * @param data 自动拉黑条件字段
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/blacklist-game-account.vue
 */
export function updateRechargeBlackConfigApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargeblackconfig/', data);
}

/**
 * 分页查询充值玩家黑名单。
 *
 * @param query 账号、时间等筛选及分页参数
 * @returns 玩家黑名单 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/recharge-black-player-modal.vue
 */
export function fetchRechargeBlackPlayerListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<RechargeBlackPlayerItem>>(
    '/backend/rechargeblackplayer/list',
    { params: trimSpace(query) },
  );
}

/**
 * 新增充值玩家黑名单。
 *
 * @param data 玩家账号及拉黑原因等
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-black-player-modal.vue
 */
export function createRechargeBlackPlayerApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargeblackplayer/', data);
}

/**
 * 编辑充值玩家黑名单。
 *
 * @param data 黑名单表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-black-player-modal.vue
 */
export function updateRechargeBlackPlayerApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rechargeblackplayer/', data);
}

/**
 * 删除充值玩家黑名单。
 *
 * @param id 黑名单记录 ID
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-black-player-modal.vue
 */
export function deleteRechargeBlackPlayerApi(id: number | string) {
  return requestClient.delete(`/backend/rechargeblackplayer/${id}`);
}

/**
 * 分页查询充值设备黑名单。
 *
 * @param query 设备 ID、时间等筛选及分页参数
 * @returns 设备黑名单 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/blacklist-device.vue
 */
export function fetchRechargeBlackDeviceListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<RechargeBlackDeviceItem>>(
    '/backend/rechargeblackdevice/list',
    { params: trimSpace(query) },
  );
}

/**
 * 新增充值设备黑名单。
 *
 * @param data 设备 ID 及拉黑原因等
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-black-device-modal.vue
 */
export function createRechargeBlackDeviceApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/rechargeblackdevice/', data);
}

/**
 * 编辑充值设备黑名单。
 *
 * @param data 黑名单表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/recharge-black-device-modal.vue
 */
export function updateRechargeBlackDeviceApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/rechargeblackdevice/', data);
}

/**
 * 删除充值设备黑名单。
 *
 * @param id 黑名单记录 ID
 * @param removeLoginPlayer 是否同时移除登录玩家，默认空
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/blacklist-device.vue
 */
export function deleteRechargeBlackDeviceApi(
  id: number | string,
  removeLoginPlayer: number | string = '',
) {
  return requestClient.delete(`/backend/rechargeblackdevice/${id}`, {
    params: { RemoveLoginPlayer: removeLoginPlayer },
  });
}

/**
 * 分页查询充值取消原因统计。
 *
 * @param query 时间等筛选及分页参数
 * @returns 取消原因统计 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/recharge-stats.vue
 */
export function fetchRechargeCancelStatsApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<RechargeCancelStatsItem>>(
    '/backend/golobalgametipconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 分页查询自助查单列表。
 *
 * @param query 状态、时间等筛选及分页参数
 * @returns 自助查单 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/self-check-list.vue
 */
export function fetchSelfCheckListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerpaymentselfreview/list',
    { params: trimSpace(query) },
  );
}

/**
 * 处理自助查单（补分/拒绝/接单）。
 *
 * @param data 订单 Id 及处理动作等
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/self-check-action-modal.vue
 */
export function handleSelfCheckOrderApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerpaymentselfreview/action', data);
}

/**
 * 分页查询自助查单处理记录。
 *
 * @param query 查单 Id 及分页参数
 * @returns 处理记录 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/self-check-detail-modal.vue
 */
export function fetchSelfCheckActionRecordsApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerpaymentselfreview/detail',
    { params: trimSpace(query) },
  );
}

/**
 * 新增自助查单备注。
 *
 * @param data 查单 Id 及备注内容
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/self-check-action-modal.vue
 */
export function createSelfCheckActionRecordApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerpaymentselfreview/remark', data);
}

/**
 * 获取自助查单游戏端入口开关配置。
 *
 * @returns 入口开关配置对象
 * @see views/operationalManage/rechargeList/components/self-check-list.vue
 */
export function fetchSelfCheckGameSwitchApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerpaymentselfreview/checkconfig',
  );
}

/**
 * 更新自助查单游戏端入口开关。
 *
 * @param data 开关配置字段
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/self-check-list.vue
 */
export function updateSelfCheckGameSwitchApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/playerpaymentselfreview/selfreviewconfig',
    data,
  );
}

/**
 * 分页查询自助查单访问记录。
 *
 * @param query 时间、设备等筛选及分页参数
 * @returns 访问记录 Items 与 Pagination
 * @see views/operationalManage/rechargeList/components/self-check-visit-details.vue
 */
export function fetchSelfReviewVisitListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/visitstatistic/selfreviewlist',
    { params: trimSpace(query) },
  );
}

/**
 * 查询自助查单访问统计汇总。
 *
 * @param query 时间等筛选参数
 * @returns 设备/VIP/用户类型等维度统计
 * @see views/operationalManage/rechargeList/components/self-check-visit-record.vue
 */
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

/**
 * 获取自助查单入口图片配置。
 *
 * @param query 产品包等筛选参数
 * @returns 入口图片配置对象
 * @see views/operationalManage/rechargeList/components/self-check-entry-image-modal.vue
 */
export function fetchSelfCheckEntryImageApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerpaymentselfreview/icon',
    { params: trimSpace(query) },
  );
}

/**
 * 更新自助查单入口图片。
 *
 * @param data 图片 URL 等配置字段
 * @returns 接口响应
 * @see views/operationalManage/rechargeList/components/self-check-entry-image-modal.vue
 */
export function updateSelfCheckEntryImageApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerpaymentselfreview/upload', data);
}

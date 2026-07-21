import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  SendOrderManageItem,
  WithdrawFinanceItem,
  WithdrawOrderStatItem,
  WithdrawRevertedItem,
  WithdrawWaterItem,
  WithdrawWhiteItem,
} from '#/types/withdraw-extra';
import { trimSpace } from '#/utils/string';

/**
 * 分页查询提现白名单列表。
 *
 * @param query 账号、时间等筛选及分页参数
 * @returns 提现白名单 Items 与 Pagination
 * @see views/operationalManage/withdrawList/components/withdraw-white-list.vue
 */
export function fetchWithdrawWhiteListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawWhiteItem>>(
    '/backend/withdrawwhitelist/list',
    { params: trimSpace(query) },
  );
}

/**
 * 新增提现白名单。
 *
 * @param data 玩家账号及白名单配置等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-white-form-modal.vue
 */
export function createWithdrawWhiteApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawwhitelist/', data);
}

/**
 * 编辑提现白名单。
 *
 * @param data 白名单表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-white-form-modal.vue
 */
export function updateWithdrawWhiteApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawwhitelist/', data);
}

/**
 * 删除提现白名单。
 *
 * @param id 白名单 ID
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-white-list.vue
 */
export function deleteWithdrawWhiteApi(id: number | string) {
  return requestClient.delete(`/backend/withdrawwhitelist/${id}`);
}

/**
 * 获取提现白名单详情。
 *
 * @param id 白名单 ID
 * @returns 白名单详情对象
 * @see views/operationalManage/withdrawList/components/withdraw-white-form-modal.vue
 */
export function fetchWithdrawWhiteDetailApi(id: number | string) {
  return requestClient.get(`/backend/withdrawwhitelist/${id}`);
}

/**
 * 分页查询派单人员管理列表。
 *
 * @param query 筛选条件及分页参数
 * @returns 派单人员 Items 与 Pagination
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function fetchSendOrderManageListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<SendOrderManageItem>>(
    '/backend/withdrawsendorderusermanage/list',
    { params: query },
  );
}

/**
 * 获取派单人员详情。
 *
 * @param id 派单人员 ID
 * @returns 派单人员详情
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function fetchSendOrderManageDetailApi(id: number | string) {
  return requestClient.get<SendOrderManageItem>(
    `/backend/withdrawsendorderusermanage/${id}`,
  );
}

/**
 * 新增派单人员。
 *
 * @param data 人员账号及派单配置等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function createSendOrderManageApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawsendorderusermanage/', data);
}

/**
 * 编辑派单人员。
 *
 * @param data 人员表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function updateSendOrderManageApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawsendorderusermanage/', data);
}

/**
 * 删除派单人员。
 *
 * @param id 派单人员 ID
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function deleteSendOrderManageApi(id: number | string) {
  return requestClient.delete(`/backend/withdrawsendorderusermanage/${id}`);
}

/**
 * 获取风控方案列表（用于取默认方案 Id）。
 *
 * @returns 风控方案名称列表
 * @see views/operationalManage/playerLevel/components/player-level-panel.vue
 */
export function fetchWithdrawAutoSchemeListApi() {
  return requestClient.get<
    Array<{ Id?: number | string; SchemeType?: number | string }>
  >('/backend/withdrawautoconfig/listSchemeName');
}

/**
 * 获取派单规则配置（按方案 Id）。
 *
 * @param params Id 风控方案 ID
 * @returns 派单规则配置列表
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function fetchWithdrawAutoConfigListApi(params: {
  Id: number | string;
}) {
  return requestClient.get<
    Array<{ Abbr?: string; Id?: number | string; Name?: string }>
  >('/backend/withdrawautoconfig/list', { params });
}

/**
 * 获取派单总开关状态。
 *
 * @returns 派单开关配置
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function fetchSendOrderSwitchApi() {
  return requestClient.get('/backend/withdrawautoswitch/getswitch2');
}

/**
 * 更新派单总开关。
 *
 * @param data 开关配置字段
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function updateSendOrderSwitchApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawautoswitch/sameswitch2/', data);
}

/**
 * 分页查询派单提现列表（风控待审）。
 *
 * @param query 状态、时间等筛选及分页参数
 * @returns 派单订单 Items 与 Pagination
 * @see views/operationalManage/withdrawList/components/send-order-list.vue
 */
export function fetchSendOrderListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawFinanceItem>>(
    '/backend/withdrawsendorderlist/list',
    { params: trimSpace(query) },
  );
}

/**
 * 更新派单提现订单（审核/分配等）。
 *
 * @param data 订单 Id 及处理信息
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/send-order-list.vue
 * @see views/operationalManage/withdrawList/components/send-order-action-modal.vue
 */
export function updateSendOrderListApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawsendorderlist/', data);
}

/**
 * 更新派单人员上班/下班状态。
 *
 * @param data 人员 Id 及工作状态
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function updateSendOrderWorkStatusApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/withdrawsendorderusermanage/startwork',
    data,
  );
}

/**
 * 派单人员在线心跳。
 *
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/send-order-manage.vue
 */
export function pingSendOrderOnlineApi() {
  return requestClient.post('/backend/withdrawsendorderusermanage/ping');
}

/**
 * 分页查询财务提现列表。
 *
 * @param query 状态、时间等筛选及分页参数
 * @returns 财务提现 Items 与 Pagination
 * @see views/operationalManage/withdrawList/components/withdraw-finance-list.vue
 */
export function fetchWithdrawFinanceListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawFinanceItem>>(
    '/backend/withdrawfinancelist/list',
    { params: trimSpace(query) },
  );
}

/**
 * 分页查询提现订单统计报表。
 *
 * @param query 时间、渠道等筛选及分页参数
 * @returns 订单统计 Items 与 Pagination
 * @see views/operationalManage/withdrawList/components/withdraw-order-stat.vue
 */
export function fetchWithdrawOrderStatApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawOrderStatItem>>(
    '/backend/playerwithdrawreport/list',
    { params: query },
  );
}

/**
 * 分页查询三方提现回退/撤销记录。
 *
 * @param query 时间等筛选及分页参数
 * @returns 回退记录 Items 与 Pagination
 * @see views/operationalManage/withdrawList/components/withdraw-third-party-record.vue
 */
export function fetchWithdrawRevertedListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawRevertedItem>>(
    '/backend/playerwithdraw/revertedlist',
    { params: trimSpace(query) },
  );
}

/**
 * 分页查询提现流水/打码审核列表。
 *
 * @param query 状态、时间等筛选及分页参数
 * @returns 打码审核 Items 与 Pagination
 * @see views/operationalManage/withdrawList/components/withdraw-water-list.vue
 */
export function fetchWithdrawWaterListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawWaterItem>>(
    '/backend/playerwithdrawflow/list',
    { params: query },
  );
}

/**
 * 批量更新提现流水审核状态。
 *
 * @param data 订单 Id 列表及目标状态等
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-water-list.vue
 */
export function updateWithdrawWaterStatusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerwithdrawflow/editMore', data);
}

/**
 * 查询提现流水状态变更日志。
 *
 * @param id 流水记录 ID
 * @returns 状态变更日志 Items
 * @see views/operationalManage/withdrawList/components/withdraw-water-list.vue
 */
export function fetchWithdrawWaterStatusLogApi(id: number | string) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    `/backend/playerwithdrawflow/statusLog/${id}`,
  );
}

/**
 * 获取提现流水自动审核规则列表及总开关。
 *
 * @returns Items 规则列表与 Switch 开关
 * @see views/operationalManage/withdrawList/components/withdraw-water-setting-modal.vue
 */
export function fetchWithdrawWaterFlowSettingListApi() {
  return requestClient.get<{
    Items?: Array<{
      BalanceAmount?: number;
      Id?: number | string;
      NegativeProfitAmount?: number;
      [key: string]: unknown;
    }>;
    Switch?: number;
  }>('/backend/playerwithdrawflow/flowList');
}

/**
 * 新增提现流水自动审核规则。
 *
 * @param data 余额/负盈利阈值等规则字段
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-water-setting-modal.vue
 */
export function createWithdrawWaterFlowSettingApi(
  data: Record<string, unknown>,
) {
  return requestClient.post('/backend/playerwithdrawflow/', data);
}

/**
 * 编辑提现流水自动审核规则。
 *
 * @param data 规则表单数据（含 Id）
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-water-setting-modal.vue
 */
export function updateWithdrawWaterFlowSettingApi(
  data: Record<string, unknown>,
) {
  return requestClient.put('/backend/playerwithdrawflow/', data);
}

/**
 * 删除提现流水自动审核规则。
 *
 * @param id 规则 ID
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-water-setting-modal.vue
 */
export function deleteWithdrawWaterFlowSettingApi(id: number | string) {
  return requestClient.delete(`/backend/playerwithdrawflow/${id}`);
}

/**
 * 切换提现流水自动审核总开关。
 *
 * @param data Switch 0/1
 * @returns 接口响应
 * @see views/operationalManage/withdrawList/components/withdraw-water-setting-modal.vue
 */
export function switchWithdrawWaterFlowSettingApi(data: { Switch: number }) {
  return requestClient.put('/backend/playerwithdrawflow/switch', data);
}

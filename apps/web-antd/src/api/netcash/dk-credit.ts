import type {
  DkAccountPayload,
  DkAdjustPayload,
  DkApplyCreditPayload,
  DkCreditInfo,
  DkExcelPlayerQuery,
  DkListQuery,
  DkListResult,
  DkPlayerAvailableCredit,
  DkSharedConfig,
} from './dk-credit.types';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将 DK 信用列表响应归一为 DkListResult。
 *
 * 缺 Items/Pagination/Total 时补默认值。
 *
 * @param result 接口原始响应
 * @returns 含 Items、Pagination 及 Total 的列表结构
 */
function normalizeList(result?: DkListResult | null): DkListResult {
  return {
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || { MaxCount: 0 },
    Total: result?.Total || {},
  };
}

/**
 * DK 信用额度调整申请记录列表（「DK 信用管理」页申请记录 Tab）。
 *
 * @param query 查询参数（代理、状态、时间、分页等）
 * @returns 申请记录 Items 及 Pagination
 * @see views/netcash/dkCreditManage/index.vue
 */
export async function getDkCreditLimitApplyRecordListApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/agentcreditlimitapplyrecord/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * DK 账户额度列表（「DK 信用管理」页账户列表 Tab）。
 *
 * @param query 查询参数（代理账号、分页等）
 * @returns DK 账户行 Items 及 Pagination
 * @see views/netcash/dkCreditManage/index.vue
 */
export async function getDkAccountLimitListApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/agentdkaccountlimit/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * DK 信用交易流水记录列表。
 *
 * @param query 查询参数（AdminId、时间、分页等）
 * @returns 交易流水 Items 及 Pagination
 * @see views/netcash/dkCreditManage/index.vue
 */
export async function fetchDkCreditRecordApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/agentcreditlimittransaction/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * DK 净现金流水日志列表。
 *
 * @param query 查询参数（AdminId、类型、时间、分页等）
 * @returns 流水 Items 及 Pagination
 * @see views/netcash/dkCreditManage/index.vue
 */
export async function getDkNetCashLogListApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/netcashlog/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 查询单个代理 DK 账户额度信息（额度概览与调整弹窗）。
 *
 * @param query 查询参数（AdminId 等；默认可传空对象）
 * @returns DK 信用额度详情 DkCreditInfo
 * @see views/netcash/dkCreditManage/index.vue
 */
export function getAgentDkAccountLimitApi(query: Record<string, unknown> = {}) {
  return requestClient.get<DkCreditInfo>(
    '/backend/agentdkaccountlimit/getagentdkaccountlimit',
    { params: trimSpace(query) },
  );
}

/**
 * 调整 DK 玩家钱包金额（批量加减金币）。
 *
 * @param data 调整载荷 DkAdjustPayload（含 Hash、Items JSON、支付密码）
 * @returns 接口操作结果
 * @see views/netcash/dkCreditManage/index.vue
 */
export function adjustDkPlayerMoneyApi(data: DkAdjustPayload) {
  return requestClient.post(
    '/backend/agentdkaccountlimit/adjustplayermoney',
    data,
  );
}

/**
 * 申请 DK 信用额度调整。
 *
 * @param data 申请表单 DkApplyCreditPayload
 * @returns 接口操作结果
 * @see views/netcash/dkCreditManage/index.vue
 */
export function applyDkCreditApi(data: DkApplyCreditPayload) {
  return requestClient.post('/backend/agentdkaccountlimit/applycredit', data);
}

/**
 * 查询玩家可扣减信用额度（扣减前校验可用金额）。
 *
 * @param query PlayerId 玩家 Id
 * @returns `{ Items?: DkPlayerAvailableCredit }` 可扣减额度与金币信息
 * @see views/netcash/dkCreditManage/index.vue
 */
export function getPlayerAvailableDeductCreditApi(query: {
  PlayerId: number | string;
}) {
  return requestClient.get<{
    Items?: DkPlayerAvailableCredit;
  }>('/backend/agentcreditlimittransaction/getplayeravailabledeductcredit', {
    params: trimSpace(query),
  });
}

/**
 * DK 玩家列表（选择玩家进行额度操作时）。
 *
 * @param query 查询参数（LoginAccount、PackageName、分页等）
 * @returns 玩家行 Items 及 Pagination
 * @see views/netcash/dkCreditManage/index.vue
 */
export async function getDkPlayerListApi(query: DkListQuery) {
  const result = await requestClient.get<DkListResult>(
    '/backend/playerinfo/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 通过 Excel 批量查询 DK 玩家（导入玩家账号与金额）。
 *
 * @param data Excel 查询表单 DkExcelPlayerQuery
 * @returns 匹配玩家 Items 及 Pagination
 * @see views/netcash/dkCreditManage/index.vue
 */
export async function queryDkPlayersByExcelApi(data: DkExcelPlayerQuery) {
  const result = await requestClient.post<DkListResult>(
    '/backend/playerinfo/queryplayerexcel',
    data,
  );
  return normalizeList(result);
}

/**
 * 新增 DK 信用账户。
 *
 * @param data 账户表单 DkAccountPayload（AgentAccount、TotalCreditLimit 等）
 * @returns 接口操作结果
 * @see views/netcash/dkCreditManage/index.vue
 */
export function createDkAccountApi(data: DkAccountPayload) {
  return requestClient.post('/backend/agentdkaccountlimit/add', data);
}

/**
 * 编辑 DK 信用账户信息。
 *
 * @param data 账户表单 DkAccountPayload（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/dkCreditManage/index.vue
 */
export function editDkAccountApi(data: DkAccountPayload) {
  return requestClient.post('/backend/agentdkaccountlimit/edit', data);
}

/**
 * 扣减 DK 账户信用额度。
 *
 * @param data 扣减表单 DkAccountPayload（CreditDeduct 等）
 * @returns 接口操作结果
 * @see views/netcash/dkCreditManage/index.vue
 */
export function deductDkAccountCreditApi(data: DkAccountPayload) {
  return requestClient.post('/backend/agentdkaccountlimit/deductcredit', data);
}

/**
 * 获取 DK 共享组件配置（新增账号时后台管理员下拉选项）。
 *
 * 旧页新增账号的数据源：仅允许选择后台账号，昵称由选项自动回填。
 *
 * @returns 共享配置 DkSharedConfig（含 BOAdminName 选项）
 * @see views/netcash/dkCreditManage/index.vue
 */
export function getDkSharedConfigApi() {
  return requestClient.get<DkSharedConfig>('/backend/sharedComponent/list');
}

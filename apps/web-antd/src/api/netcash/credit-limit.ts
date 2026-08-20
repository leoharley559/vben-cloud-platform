import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将信用额度相关列表响应归一为 NetcashListResult。
 *
 * 缺 Items/Pagination/Total 时补默认值，避免表格渲染异常。
 *
 * @param result 接口原始响应
 * @returns 含 Items、Pagination 及 Total 的列表结构
 */
function normalizeList(result?: NetcashListResult | null): NetcashListResult {
  return {
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination || { MaxCount: 0 },
    Total: result?.Total || {},
  };
}

/**
 * 净现金账户列表（「信用额度管理」页账户概览）。
 *
 * @param query 查询参数（代理、分页等）
 * @returns 账户行 Items 及 Pagination
 * @see views/netcash/creditLimitManage/index.vue
 */
export async function getNetCashAccountListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/netcashaccount/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

/**
 * 信用额度调整申请记录列表（调整记录 Tab）。
 *
 * @param query 查询参数（代理、状态、时间、分页等）
 * @returns 申请记录 Items 及 Pagination
 * @see views/netcash/creditLimitManage/components/adjust-records.vue
 */
export async function getCreditLimitApplyRecordListApi(
  query: NetcashListQuery,
) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitapplyrecord/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

/**
 * 净现金流水日志列表（信用额度管理「流水日志」Tab）。
 *
 * @param query 查询参数（AdminId、类型、时间、分页等）
 * @returns 流水 Items 及 Pagination
 * @see views/netcash/creditLimitManage/components/net-cash-log.vue
 */
export async function getNetCashLogListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/netcashlog/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

/**
 * 代理信用额度权限配置列表（权限设置 Tab）。
 *
 * @param query 查询参数（AdminId、分页等）
 * @returns 权限配置 Items 及 Pagination
 * @see views/netcash/creditLimitManage/components/permission-settings.vue
 */
export async function getAgentPermissionsApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitpermission/list',
    {
      params: trimSpace(query),
    },
  );
  return normalizeList(result);
}

/**
 * 查询单个代理当前信用额度信息（额度调整弹窗数据源）。
 *
 * @param query 查询参数（AdminId 等）
 * @returns 信用额度详情（可用额度、总额度等）
 * @see views/netcash/creditLimitManage/components/credit-limit-adjust.vue
 */
export function getAgentCreditLimitApi(query: NetcashListQuery) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/agentcreditlimit/getagentcreditlimit',
    { params: trimSpace(query) },
  );
}

/**
 * 欠款/到期信用记录列表（欠款记录 Tab）。
 *
 * @param query 查询参数（代理、时间、分页等）
 * @returns 欠款记录 Items 及 Pagination
 * @see views/netcash/creditLimitManage/components/debt-records.vue
 */
export async function fetchDebtListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitapplyrecord/duecreditlist',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 提交信用额度调整申请。
 *
 * @param data 申请表单（AdminId、AdjustAmount、备注等）
 * @returns 接口操作结果
 * @see views/netcash/creditLimitManage/components/credit-limit-adjust.vue
 */
export function applyCreditLimitApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimitapplyrecord/add', data);
}

/**
 * 审批通过信用额度调整申请。
 *
 * @param data 审批载荷（申请 Id 等）
 * @returns 接口操作结果
 * @see views/netcash/creditLimitManage/components/pending-adjustment.vue
 */
export function approveCreditLimitApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/approve',
    data,
  );
}

/**
 * 拒绝信用额度调整申请。
 *
 * @param data 审批载荷（申请 Id、拒绝原因等）
 * @returns 接口操作结果
 * @see views/netcash/creditLimitManage/components/pending-adjustment.vue
 */
export function rejectCreditLimitApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/agentcreditlimitapplyrecord/reject',
    data,
  );
}

/**
 * 直接编辑代理信用额度（无需走审批流程的管理员操作）。
 *
 * @param data 编辑表单（AdminId、Credit 等）
 * @returns 接口操作结果
 * @see views/netcash/creditLimitManage/components/credit-limit-adjust.vue
 */
export function editCreditLimitApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimit/edit', data);
}

/**
 * 信用额度受限代理列表（限制名单 Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns 受限代理 Items 及 Pagination
 * @see views/netcash/creditLimitManage/components/permission-settings.vue
 */
export async function getAgentRestrictionListApi(query: NetcashListQuery) {
  const result = await requestClient.get<NetcashListResult>(
    '/backend/agentcreditlimitrestrict/list',
    { params: trimSpace(query) },
  );
  return normalizeList(result);
}

/**
 * 添加信用额度限制代理。
 *
 * @param data 限制表单（AdminId 等）
 * @returns 接口操作结果
 * @see views/netcash/creditLimitManage/components/permission-settings.vue
 */
export function addAgentRestrictionApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimitrestrict/add', data);
}

/**
 * 移除信用额度限制代理。
 *
 * @param data 删除载荷（AdminId 等）
 * @returns 接口操作结果
 * @see views/netcash/creditLimitManage/components/permission-settings.vue
 */
export function removeAgentRestrictionApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimitrestrict/delete', data);
}

/**
 * 更新代理信用额度权限配置。
 *
 * @param data 权限表单（AdminId、各开关字段等）
 * @returns 接口操作结果
 * @see views/netcash/creditLimitManage/components/permission-settings.vue
 */
export function updateAgentPermissionsApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/agentcreditlimitpermission/edit', data);
}

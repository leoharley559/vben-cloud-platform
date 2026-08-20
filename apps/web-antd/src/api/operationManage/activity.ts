import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 查询进行中的运营活动配置列表
 * @param query 筛选条件（活动类型、状态及分页）
 * @returns 活动配置列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-ongoing-panel.vue
 */
export function fetchActivityListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询已结束/历史运营活动配置列表
 * @param query 筛选条件（活动类型、时间范围及分页）
 * @returns 历史活动列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-history-panel.vue
 */
export function fetchActivityHistoryListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/history',
    { params: trimSpace(query) },
  );
}

/**
 * 查询系统活动模板列表
 * @param query 筛选条件（模板类型及分页）
 * @returns 系统模板列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-template-system-panel.vue
 */
export function fetchActivityTemplateListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesdefaultconfig/list',
    { params: query },
  );
}

/**
 * 查询自定义活动模板列表
 * @param query 筛选条件（模板名称及分页）
 * @returns 自定义模板列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-template-own-panel.vue
 */
export function fetchActivityOwnTemplateListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesdefaultconfig/list',
    {
      params: {
        ...query,
        IsTemplate: true,
      },
    },
  );
}

/**
 * 查询活动类型/分类列表
 * @param query 筛选条件及分页参数
 * @returns 活动类型列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-template-category-panel.vue
 */
export function fetchActivityTypeListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activitytype/list',
    { params: query },
  );
}

/**
 * 查询充值优惠方案规则列表
 * @param query 筛选条件及分页参数
 * @returns 充值优惠方案列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-deposit-promo-rules-panel.vue
 */
export function fetchDepositPromoListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerrechargeofferscheme/list',
    { params: query },
  );
}

/**
 * 查询充值优惠领取历史记录
 * @param query 筛选条件（玩家、方案及分页）
 * @returns 领取记录列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-deposit-promo-claim-panel.vue
 */
export function fetchDepositPromoClaimHistoryApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerpaydiscount/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询预约提现活动参与记录列表
 * @param query 筛选条件（玩家、状态及分页）
 * @returns 预约提现记录列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-appointment-records-panel.vue
 */
export function fetchAppointmentWithdrawListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/reservewithdrawactivity/list',
    { params: trimSpace(query) },
  );
}

/**
 * 获取预约提现活动规则配置
 * @returns 预约提现活动当前配置详情
 * @see views/operationalManage/activity/components/activity-appointment-rules-panel.vue
 */
export function fetchReserveWithdrawActivityApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/reservewithdrawactivity',
  );
}

/**
 * 更新预约提现活动规则配置
 * @param data 活动规则表单数据
 * @returns 接口操作结果
 * @see views/operationalManage/activity/components/activity-appointment-rules-panel.vue
 */
export function updateReserveWithdrawActivityApi(
  data: Record<string, unknown>,
) {
  return requestClient.put('/backend/reservewithdrawactivity', data);
}

/**
 * 查询新手转盘活动配置列表
 * @param query 筛选条件及分页参数
 * @returns 新手转盘配置列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-beginner-turntable-detail-panel.vue
 */
export function fetchNewPlayerDrawListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/newplayerdrawconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询活动配置变更日志列表
 * @param query 筛选条件（活动、操作人及分页）
 * @returns 变更日志列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-change-log-panel.vue
 */
export function fetchActivityChangeLogListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activitychangelog/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询每日签到活动配置列表
 * @param query 筛选条件及分页参数
 * @returns 签到活动配置列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-daily-checkin-list-panel.vue
 */
export function fetchDailyCheckInListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/dailycheckin/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询玩家每日签到参与记录
 * @param query 筛选条件（玩家、日期及分页）
 * @returns 玩家签到记录列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-daily-checkin-record-panel.vue
 */
export function fetchDailyCheckInPlayerRecordApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/dailycheckin/playerrecord',
    { params: trimSpace(query) },
  );
}

/**
 * 查询玩家代理佣金报表
 * @param query 筛选条件（代理玩家、时间范围及分页）
 * @returns 代理佣金报表列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-player-agent-commission-panel.vue
 */
export function fetchPlayerAgentReportApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playeragent/listplayeragentreport',
    { params: trimSpace(query) },
  );
}

/**
 * 查询玩家代理奖励发放流水
 * @param query 筛选条件（代理玩家、时间范围及分页）
 * @returns 代理奖励流水列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-player-agent-reward-panel.vue
 */
export function fetchPlayerAgentTransactionApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playeragent/listplayeragenttransaction',
    { params: trimSpace(query) },
  );
}

/**
 * 查询玩家代理团队成员列表
 * @param query 筛选条件（代理玩家及分页）
 * @returns 代理团队成员列表 Items 及 Pagination
 * @see views/operationalManage/activity/components/activity-player-agent-team-panel.vue
 */
export function fetchPlayerAgentTeamApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playeragent/listplayeragentteam',
    { params: trimSpace(query) },
  );
}

/**
 * 下架/关闭当前进行中的运营活动
 * @param data 活动 Id（ActivityId）
 * @returns 接口操作结果
 * @see views/operationalManage/activity/components/activity-ongoing-panel.vue
 */
export function offshelfActivityApi(data: { ActivityId: number | string }) {
  return requestClient.put('/backend/operationactivitiesconfig/offshelf', data);
}

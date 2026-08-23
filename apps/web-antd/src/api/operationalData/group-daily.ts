import type { CloudListResult } from '#/types/operational-data';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 代理分组日报原始响应 */
export interface AgentGroupDailyRespond {
  /** 横幅汇总指标 */
  BannerItems?: Record<string, unknown>;
  Items?: Record<string, unknown>[];
  Pagination?: { MaxCount?: number };
}

/**
 * 获取代理分组日报原始数据（含明细与 BannerItems 汇总）。
 * @param query 查询参数（SearchType、日期范围、分组 Id 等）
 * @returns Items、BannerItems、Pagination 等分组日报结构
 * @see views/operationalData/groupDaily/components/group-daily-panel.vue
 */
export function fetchAgentGroupDailyReportApi(query: Record<string, unknown>) {
  return requestClient.get<AgentGroupDailyRespond>(
    '/backend/agentnetcashgroup/dailyreport',
    { params: trimSpace(query) },
  );
}

/**
 * 获取代理分组日报列表（归一化为 CloudListResult）。
 * @param query 查询参数（日期范围、分组 Id 等）
 * @returns Items 分组日报行，Pagination.MaxCount 为条目数
 * @see views/operationalData/groupDaily/components/group-daily-panel.vue
 */
export function fetchAgentGroupDailyListApi(query: Record<string, unknown>) {
  return fetchAgentGroupDailyReportApi(query).then((data) => ({
    Items: data.Items || [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? (data.Items || []).length,
    },
  })) as Promise<CloudListResult<Record<string, unknown>>>;
}

/** 代理分组树节点 */
export interface AgentGroupNode {
  [key: string]: unknown;
  /** 分组名称 */
  GroupName?: string;
  Id?: number | string;
  /** 子分组列表 */
  List?: AgentGroupNode[];
}

/**
 * 获取代理分组树列表（用于分组筛选下拉）。
 * @param query 查询参数（如 IsTop 是否仅取顶层分组，默认空对象）
 * @returns Items 代理分组树节点
 * @see views/operationalData/groupDaily/components/group-daily-panel.vue
 */
export function fetchAgentGroupListApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{ Items?: AgentGroupNode[] }>(
    '/backend/agentnetcashgroup/grouplist',
    { params: query },
  );
}

import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

export interface AgentGroupDailyRespond {
  BannerItems?: Record<string, unknown>;
  Items?: Record<string, unknown>[];
  Pagination?: { MaxCount?: number };
}

export function fetchAgentGroupDailyReportApi(query: Record<string, unknown>) {
  return requestClient.get<AgentGroupDailyRespond>(
    '/backend/agentnetcashgroup/dailyreport',
    { params: trimSpace(query) },
  );
}

export function fetchAgentGroupDailyListApi(query: Record<string, unknown>) {
  return fetchAgentGroupDailyReportApi(query).then((data) => ({
    Items: data.Items || [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? (data.Items || []).length,
    },
  })) as Promise<CloudListResult<Record<string, unknown>>>;
}

export interface AgentGroupNode {
  GroupName?: string;
  Id?: number | string;
  List?: AgentGroupNode[];
  [key: string]: unknown;
}

export function fetchAgentGroupListApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{ Items?: AgentGroupNode[] }>(
    '/backend/agentnetcashgroup/grouplist',
    { params: query },
  );
}

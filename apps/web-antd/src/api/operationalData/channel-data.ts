import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

export interface ChannelReportRespond {
  Items?: Record<string, unknown>[];
  Pagination?: { MaxCount?: number };
  RealTimeItems?: Record<string, unknown>[];
  TotalItems?: Record<string, unknown>;
  /** 渠道历史接口实际返回此字段（旧站 HistoryChannelData 也按此取值） */
  TotalRealTimeItems?: Record<string, unknown>;
}

export async function fetchChannelReportRawApi(query: Record<string, unknown>) {
  return requestClient.get<ChannelReportRespond>(
    '/backend/operation/channelreport',
    { params: trimSpace(query) },
  );
}

export async function fetchChannelReportByChannelRawApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<ChannelReportRespond>(
    '/backend/operation/channelreportbychannel',
    { params: trimSpace(query) },
  );
}

/** 兼容 OperationListPanel：归一化为 Items */
export async function fetchChannelAgentReportApi(
  query: Record<string, unknown>,
) {
  const data = await fetchChannelReportRawApi(query);
  const items = data.RealTimeItems || data.Items || [];
  return {
    Items: items,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? items.length,
    },
  } satisfies CloudListResult<Record<string, unknown>>;
}

export async function fetchChannelDetailReportApi(
  query: Record<string, unknown>,
) {
  const data = await fetchChannelReportByChannelRawApi(query);
  const items = data.RealTimeItems || data.Items || [];
  return {
    Items: items,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? items.length,
    },
  } satisfies CloudListResult<Record<string, unknown>>;
}

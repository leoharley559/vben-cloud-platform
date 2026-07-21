import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

/** 代理渠道报表原始响应 */
export interface ChannelReportRespond {
  /** 历史明细行 */
  Items?: Record<string, unknown>[];
  Pagination?: { MaxCount?: number };
  /** 实时明细行 */
  RealTimeItems?: Record<string, unknown>[];
  TotalItems?: Record<string, unknown>;
  /** 渠道历史接口实际返回此字段（旧站 HistoryChannelData 也按此取值） */
  TotalRealTimeItems?: Record<string, unknown>;
}

/**
 * 获取代理渠道报表原始数据（按代理维度汇总）。
 * @param query 查询参数（SearchType、日期范围、渠道筛选等）
 * @returns RealTimeItems、Items、TotalRealTimeItems 等渠道报表结构
 * @see views/operationalData/channelData/components/channel-report-panel.vue
 */
export async function fetchChannelReportRawApi(query: Record<string, unknown>) {
  return requestClient.get<ChannelReportRespond>(
    '/backend/operation/channelreport',
    { params: trimSpace(query) },
  );
}

/**
 * 获取代理渠道明细报表原始数据（按渠道维度展开）。
 * @param query 查询参数（SearchType、日期范围、渠道筛选等）
 * @returns RealTimeItems、Items、TotalRealTimeItems 等渠道明细结构
 * @see views/operationalData/channelData/components/channel-report-panel.vue
 */
export async function fetchChannelReportByChannelRawApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<ChannelReportRespond>(
    '/backend/operation/channelreportbychannel',
    { params: trimSpace(query) },
  );
}

/**
 * 获取代理渠道报表列表（优先 RealTimeItems，归一化为 CloudListResult，兼容 OperationListPanel）。
 * @param query 查询参数（SearchType、日期范围、渠道筛选等）
 * @returns Items 代理渠道报表行，Pagination.MaxCount 为条目数
 */
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

/**
 * 获取代理渠道明细报表列表（优先 RealTimeItems，归一化为 CloudListResult）。
 * @param query 查询参数（SearchType、日期范围、渠道筛选等）
 * @returns Items 渠道明细报表行，Pagination.MaxCount 为条目数
 */
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

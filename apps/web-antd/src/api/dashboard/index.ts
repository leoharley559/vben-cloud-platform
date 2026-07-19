import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';

export function fetchDashboardChannelApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    Items?: Array<Record<string, unknown>>;
    RealtimeItems?: Array<Record<string, unknown>>;
  }>('/backend/dashboard/reportchannelinfo', { params: query });
}

export function fetchDashboardTodayApi(query: Record<string, unknown> = {}) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/dashboard/reporttoday',
    { params: query },
  );
}

export function fetchDashboardReportApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    Items?: Array<Record<string, unknown>>;
    TotalCount?: Record<string, Array<Record<string, unknown>>>;
    TotalHours?: Record<string, Array<Record<string, unknown>>>;
  }>('/backend/dashboard/reportinfo', { params: query });
}

export function fetchOnlineSummaryApi() {
  return requestClient.get<{
    DeviceResult?: Array<Record<string, unknown>>;
    GameResult?: Array<Record<string, unknown>>;
    MapResult?: Array<Record<string, unknown>>;
  }>('/backend/dashboard/onlinesummary');
}

export function fetchPlayerProfitLossApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    ItemsLose?: Array<Record<string, unknown>>;
    ItemsWin?: Array<Record<string, unknown>>;
    Users?: Array<Record<string, unknown>>;
  }>('/backend/dashboard/goldbyplayergame', { params: query });
}

export function fetchGameProfitLossApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    ItemsLose?: Array<Record<string, unknown>>;
    ItemsWin?: Array<Record<string, unknown>>;
  }>('/backend/dashboard/rankbygameid', { params: query });
}

export function fetchTeamChannelDataApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/dashboard/reportteamchannelinfo',
    { params: query },
  );
}

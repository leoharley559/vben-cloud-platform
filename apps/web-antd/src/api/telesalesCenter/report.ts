import { requestClient } from '#/api/request';
import { toTelesalesListResult } from '#/types/telesales-center';

function listApi(url: string, query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>(url, { params: query })
    .then(toTelesalesListResult);
}

export const fetchCallRecordListApi = (query: Record<string, unknown>) =>
  listApi('/backend/callrecordreport/list', query);

export const fetchCallStatisticsListApi = (query: Record<string, unknown>) =>
  listApi('/backend/callstatisticsreport/list', query);

export const fetchVipPlayerReportListApi = (query: Record<string, unknown>) =>
  listApi('/backend/vipplayerreport/list', query);

export const fetchNewRegisterDepositListApi = (
  query: Record<string, unknown>,
) => listApi('/backend/newregisterdepositreport/list', query);

export const fetchNewRegisterNoDepositListApi = (
  query: Record<string, unknown>,
) => listApi('/backend/newregisternodepositreport/list', query);

export const fetchGroupMaintenanceListApi = (query: Record<string, unknown>) =>
  listApi('/backend/groupmaintenancereport/list', query);

export const fetchDormantReportListApi = (query: Record<string, unknown>) =>
  listApi('/backend/dormantreport/list', query);

export const fetchBlockedMoneyListApi = (query: Record<string, unknown>) =>
  listApi('/backend/blockedmoneyreport/list', query);

export const fetchActiveUserReportListApi = (query: Record<string, unknown>) =>
  listApi('/backend/activeuserreport/list', query);

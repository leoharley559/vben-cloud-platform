import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

type Query = Record<string, unknown>;

/** 数据比较 */
export function fetchDataAnalyzeApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/dataanalyze',
    { params: trimSpace(query) },
  );
}

/** 数据比较下钻折线 */
export function fetchDataAnalyzeReportApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/dataanalyzereport',
    { params: trimSpace(query) },
  );
}

/** 运营日报主体 */
export function fetchOperationDailyReportApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/dayreport',
    { params: trimSpace(query) },
  );
}

/** 游戏盈亏排行 */
export async function fetchOperationDailyWinRankApi(query: Query) {
  const data = await requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/dayreportwinrank',
    { params: trimSpace(query) },
  );
  return {
    raw: data,
    list: toListResult(
      {},
      (data?.TodayPlayerItemsWin as Record<string, unknown>[]) || [],
    ),
  };
}

/** 收入分析 / 充值详情 */
export function fetchOperationIncomeAnalyzeApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/incomeanalyze',
    { params: trimSpace(query) },
  );
}

/** 推广分析 */
export function fetchOperationPromotionAnalyzeApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/promotionanalyze',
    { params: trimSpace(query) },
  );
}

/** 数据报表 scheduler 列表 */
export function fetchDataReportListApi(query: Query) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[] | null;
      ItemsLimit?: Record<string, unknown> | null;
      Pagination?: { MaxCount?: number } | null;
    }>('/backend/operationdayreportscheduler/list', {
      params: trimSpace(query),
    })
    .then((data) => ({
      ...toListResult(data),
      ItemsLimit: data?.ItemsLimit || {},
    }));
}

export function fetchDataReportDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/operationdayreportscheduler/getone?Id=${id}`,
  );
}

export function createDataReportApi(data: Query) {
  return requestClient.post('/backend/operationdayreportscheduler/create', data);
}

export function updateDataReportApi(data: Query) {
  return requestClient.post('/backend/operationdayreportscheduler/update', data);
}

export function deleteDataReportApi(id: number | string) {
  return requestClient.delete(
    `/backend/operationdayreportscheduler/delete?Id=${id}`,
  );
}

export function toggleDataReportApi(id: number | string) {
  return requestClient.get(
    `/backend/operationdayreportscheduler/toggle?Id=${id}`,
  );
}

export function resendDataReportApi(id: number | string) {
  return requestClient.get(
    `/backend/operationdayreportscheduler/resend?Id=${id}`,
  );
}

export function regenerateDataReportTokenApi(id: number | string) {
  return requestClient.get(
    `/backend/operationdayreportscheduler/regeneratetoken?Id=${id}`,
  );
}

export function buyDataReportNumApi() {
  return requestClient.get('/backend/operationdayreportscheduler/buyreportnum');
}

export function fetchWhatsAppRecipientListApi(query: Query) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[] | null;
      Pagination?: { MaxCount?: number } | null;
    }>('/backend/operationdayreportscheduler/listwhatsapprecipient', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

export function addWhatsAppRecipientApi(query: Query) {
  return requestClient.post(
    '/backend/operationdayreportscheduler/addwhatsapprecipient',
    null,
    { params: trimSpace(query) },
  );
}

export function deleteWhatsAppRecipientApi(query: Query) {
  return requestClient.delete(
    '/backend/operationdayreportscheduler/deletewhatsapprecipient',
    { params: trimSpace(query) },
  );
}

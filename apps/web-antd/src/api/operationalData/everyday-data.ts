import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

export interface DailyReportRespond {
  Items?: Record<string, unknown>[];
  TodayItems?: Record<string, unknown>;
  BannerItems?: Record<string, unknown>;
  Pagination?: { MaxCount?: number };
}

export function fetchDailyReportApi(query: Record<string, unknown>) {
  return requestClient.get<DailyReportRespond>(
    '/backend/operation/dailyreport',
    {
      params: trimSpace(query),
    },
  );
}

export function fetchDailyReportListApi(query: Record<string, unknown>) {
  return fetchDailyReportApi({ ...query, SearchType: 'old' }).then((data) => ({
    Items: data.Items || [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? (data.Items || []).length,
    },
  })) as Promise<CloudListResult<Record<string, unknown>>>;
}

export function fetchDailyReportTodayApi(query: Record<string, unknown>) {
  return fetchDailyReportApi({ ...query, SearchType: 'today' }).then((data) => {
    const items = data.TodayItems ? [data.TodayItems] : [];
    return {
      Items: items,
      Pagination: { MaxCount: items.length },
    };
  }) as Promise<CloudListResult<Record<string, unknown>>>;
}

export function fetchDailyReportStatisticsApi(query: Record<string, unknown>) {
  return requestClient.get<{ BannerItems?: Record<string, unknown> }>(
    '/backend/operation/dailyreporttotal',
    { params: trimSpace(query) },
  );
}

export interface IosAppStoreItem {
  AppName?: string;
  AppUrl?: string;
  Id?: number;
}

export function fetchIosAppStoreDataApi(query: Record<string, unknown>) {
  return requestClient.get<DailyReportRespond>(
    '/backend/iosappstoredata/getiosappstoredata',
    { params: trimSpace(query) },
  );
}

export function fetchIosAppStoreListApi() {
  return requestClient.get<{ Items?: IosAppStoreItem[] }>(
    '/backend/iosappstoredata/list',
  );
}

export function fetchIosAppStoreTodayExportApi(query: Record<string, unknown>) {
  return requestClient.get<{ Items?: Record<string, unknown>[] }>(
    '/backend/iosappstoredata/todayappstorecsv',
    { params: trimSpace(query) },
  );
}

export function fetchDeviceDayReportApi(query: Record<string, unknown>) {
  return requestClient.get<DailyReportRespond>(
    '/backend/operation/devicedayreport',
    { params: trimSpace(query) },
  );
}

export function fetchVipDayReportApi(query: Record<string, unknown>) {
  return requestClient.get<DailyReportRespond>(
    '/backend/operation/vipdayreport',
    { params: trimSpace(query) },
  );
}

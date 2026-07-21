import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

/** 公司/包体/设备日报原始响应 */
export interface DailyReportRespond {
  /** 历史日报明细行 */
  Items?: Record<string, unknown>[];
  /** 今日日报单行 */
  TodayItems?: Record<string, unknown>;
  /** 横幅汇总指标 */
  BannerItems?: Record<string, unknown>;
  Pagination?: { MaxCount?: number };
}

/**
 * 获取公司日报原始数据（支持 today / old 等 SearchType）。
 * @param query 查询参数（SearchType、日期范围、渠道/账号筛选等）
 * @returns Items、TodayItems、BannerItems、Pagination 等日报结构
 * @see views/operationalData/everydayData/components/daily-report-panel.vue
 */
export function fetchDailyReportApi(query: Record<string, unknown>) {
  return requestClient.get<DailyReportRespond>(
    '/backend/operation/dailyreport',
    {
      params: trimSpace(query),
    },
  );
}

/**
 * 获取历史公司日报列表（SearchType=old，归一化为 CloudListResult）。
 * @param query 查询参数（日期范围、渠道/账号筛选等）
 * @returns Items 历史日报行，Pagination.MaxCount 为条目数
 * @see views/operationalData/everydayData/components/daily-report-panel.vue
 */
export function fetchDailyReportListApi(query: Record<string, unknown>) {
  return fetchDailyReportApi({ ...query, SearchType: 'old' }).then((data) => ({
    Items: data.Items || [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? (data.Items || []).length,
    },
  })) as Promise<CloudListResult<Record<string, unknown>>>;
}

/**
 * 获取今日公司日报（SearchType=today，归一化为 CloudListResult）。
 * @param query 查询参数（渠道/账号筛选等）
 * @returns Items 今日日报单行，Pagination.MaxCount 为 0 或 1
 * @see views/operationalData/everydayData/components/daily-report-panel.vue
 */
export function fetchDailyReportTodayApi(query: Record<string, unknown>) {
  return fetchDailyReportApi({ ...query, SearchType: 'today' }).then((data) => {
    const items = data.TodayItems ? [data.TodayItems] : [];
    return {
      Items: items,
      Pagination: { MaxCount: items.length },
    };
  }) as Promise<CloudListResult<Record<string, unknown>>>;
}

/**
 * 获取公司日报汇总统计（BannerItems 横幅指标）。
 * @param query 查询参数（日期范围、SearchType、渠道/账号筛选等）
 * @returns BannerItems 汇总统计字段
 * @see views/operationalData/everydayData/components/daily-report-panel.vue
 */
export function fetchDailyReportStatisticsApi(query: Record<string, unknown>) {
  return requestClient.get<{ BannerItems?: Record<string, unknown> }>(
    '/backend/operation/dailyreporttotal',
    { params: trimSpace(query) },
  );
}

/** iOS 上架包选项 */
export interface IosAppStoreItem {
  /** 应用名称 */
  AppName?: string;
  /** 应用链接 */
  AppUrl?: string;
  Id?: number;
}

/**
 * 获取 iOS 上架包日报数据。
 * @param query 查询参数（日期范围、上架包筛选等）
 * @returns Items、BannerItems 等上架包日报结构
 * @see views/operationalData/everydayData/components/package-daily-panel.vue
 */
export function fetchIosAppStoreDataApi(query: Record<string, unknown>) {
  return requestClient.get<DailyReportRespond>(
    '/backend/iosappstoredata/getiosappstoredata',
    { params: trimSpace(query) },
  );
}

/**
 * 获取 iOS 上架包下拉列表（AppName / AppUrl / Id）。
 * @returns Items iOS 上架包选项列表
 * @see views/operationalData/everydayData/components/package-daily-panel.vue
 * @see views/memberManage/gameRecord/components/game-record-list-panel.vue
 */
export function fetchIosAppStoreListApi() {
  return requestClient.get<{ Items?: IosAppStoreItem[] }>(
    '/backend/iosappstoredata/list',
  );
}

/**
 * 导出今日 iOS 上架包 CSV 数据。
 * @param query 查询参数（上架包 Id 等）
 * @returns Items 今日上架包导出行
 * @see views/operationalData/everydayData/components/package-daily-panel.vue
 */
export function fetchIosAppStoreTodayExportApi(query: Record<string, unknown>) {
  return requestClient.get<{ Items?: Record<string, unknown>[] }>(
    '/backend/iosappstoredata/todayappstorecsv',
    { params: trimSpace(query) },
  );
}

/**
 * 获取设备维度日报数据。
 * @param query 查询参数（日期范围、SearchType、渠道/账号筛选等）
 * @returns Items、BannerItems 等设备日报结构
 * @see views/operationalData/everydayData/components/device-daily-panel.vue
 */
export function fetchDeviceDayReportApi(query: Record<string, unknown>) {
  return requestClient.get<DailyReportRespond>(
    '/backend/operation/devicedayreport',
    { params: trimSpace(query) },
  );
}

/**
 * 获取 VIP 维度日报数据。
 * @param query 查询参数（日期范围、SearchType、渠道/账号筛选等）
 * @returns Items、BannerItems 等 VIP 日报结构
 * @see views/operationalData/everydayData/components/vip-daily-panel.vue
 */
export function fetchVipDayReportApi(query: Record<string, unknown>) {
  return requestClient.get<DailyReportRespond>(
    '/backend/operation/vipdayreport',
    { params: trimSpace(query) },
  );
}

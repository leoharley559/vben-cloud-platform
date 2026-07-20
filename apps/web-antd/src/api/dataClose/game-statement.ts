import { requestClient } from '#/api/request';
import { toListResult, type ReportListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

type Query = Record<string, unknown>;

export type GameStatementResult = ReportListResult & {
  IsNegativeWinCount?: boolean;
};

function wrapGameStatement(
  data: {
    IsNegativeWinCount?: boolean;
    Items?: Record<string, unknown>[];
    ItemsMoney?: Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
    Total?: Record<string, unknown> | number;
    [key: string]: unknown;
  },
  preferMoney = false,
): GameStatementResult {
  const items = preferMoney
    ? data.ItemsMoney || data.Items
    : data.Items || data.ItemsMoney;
  return {
    ...toListResult(data, items),
    IsNegativeWinCount: Boolean(data.IsNegativeWinCount),
  };
}

/** 游戏报表（优先 ItemsMoney） */
export function fetchGameStatementListApi(query: Query) {
  return requestClient
    .get<GameStatementResult>('/backend/operation/gamestatisticsbygametype', {
      params: trimSpace(query),
    })
    .then((data) => wrapGameStatement(data || {}, true));
}

/** 分类报表 */
export function fetchClassifiedReportListApi(query: Query) {
  return requestClient
    .get<GameStatementResult>(
      '/backend/operation/gamestatisticsbygameplatformtype',
      { params: trimSpace(query) },
    )
    .then((data) => wrapGameStatement(data || {}));
}

/** 子游戏报表 */
export function fetchSubGameReportListApi(query: Query) {
  return requestClient
    .get<GameStatementResult>('/backend/operation/gamestatisticsbysubgame', {
      params: trimSpace(query),
    })
    .then((data) => wrapGameStatement(data || {}));
}

/** 游戏报表按日详情 */
export function fetchGameDetailReportApi(query: Query) {
  return requestClient
    .get<GameStatementResult>(
      '/backend/operation/gamestatisticsbygametypedetail',
      { params: trimSpace(query) },
    )
    .then((data) => wrapGameStatement(data || {}));
}

/** 分类报表按日详情 */
export function fetchClassifiedDetailReportApi(query: Query) {
  return requestClient
    .get<GameStatementResult>(
      '/backend/operation/gamestatisticsbygameplatformtypedetail',
      { params: trimSpace(query) },
    )
    .then((data) => wrapGameStatement(data || {}));
}

/** 子游戏报表按日详情 */
export function fetchSubGameDetailReportApi(query: Query) {
  return requestClient
    .get<GameStatementResult>(
      '/backend/operation/gamestatisticsbysubgamedetail',
      { params: trimSpace(query) },
    )
    .then((data) => wrapGameStatement(data || {}));
}

/** 游戏报表投注人数详情 */
export function fetchGameDetailPlayersApi(query: Query) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/gamestatisticsbygametypedetailplayers', {
      params: trimSpace(query),
    })
    .then((data) => toListResult(data));
}

/** 子游戏投注人数详情 */
export function fetchSubGamePlayersApi(query: Query) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/gamestatisticsbysubgameplayers', {
      params: trimSpace(query),
    })
    .then((data) => toListResult(data));
}

/** 场馆费率模板 */
export function fetchVenueTemplateListApi(query: Query = {}) {
  return requestClient.get<{
    Items?: Array<{ Id?: number | string; TemplateName?: string }>;
  }>('/backend/apifeetemplate/list', {
    params: query,
  });
}

/** 场馆费率配置 */
export function fetchVenueFeeConfigListApi(query: Query) {
  return requestClient.get<
    Array<{ ApiName?: number | string; Fee?: number }>
  >('/backend/apifeeconfig/list', {
    params: query,
  });
}

/**
 * 修复日报/月报
 * @param params.Date e.g.2024-01-01
 * @param params.Type day/month
 */
export function fixDayReportDataApi(params: { Date: string; Type: string }) {
  return requestClient.get('/backend/operation/fixdayreportdata2', {
    params,
  });
}

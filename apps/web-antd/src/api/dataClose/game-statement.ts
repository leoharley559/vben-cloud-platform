import type { ReportListResult } from '#/api/dataClose/shared';

import { toListResult } from '#/api/dataClose/shared';
import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type Query = Record<string, unknown>;

/** 游戏报表列表响应（含盈亏符号约定） */
export type GameStatementResult = {
  /** 是否以负数表示盈利 */
  IsNegativeWinCount?: boolean;
} & ReportListResult;

/**
 * 包装游戏报表响应，选取列表行并保留盈亏符号约定
 * @param data 游戏报表原始响应（含 Items / ItemsMoney 等字段）
 * @param preferMoney 为 true 时优先取 ItemsMoney 作为列表行
 * @returns GameStatementResult：Items + Pagination + IsNegativeWinCount
 */
function wrapGameStatement(
  data: {
    [key: string]: unknown;
    IsNegativeWinCount?: boolean;
    Items?: null | Record<string, unknown>[];
    ItemsMoney?: null | Record<string, unknown>[];
    Pagination?: { MaxCount?: number };
    Total?: number | Record<string, unknown>;
  },
  preferMoney = false,
): GameStatementResult {
  const money = Array.isArray(data.ItemsMoney) ? data.ItemsMoney : undefined;
  const items = Array.isArray(data.Items) ? data.Items : undefined;
  const resolved = preferMoney ? money || items : items || money;
  return {
    ...toListResult(data, resolved),
    IsNegativeWinCount: Boolean(data.IsNegativeWinCount),
  };
}

/**
 * 游戏报表列表（游戏报表页，按游戏类型汇总）
 *
 * 优先取 `ItemsMoney` 作为列表行，保留 `IsNegativeWinCount` 盈亏符号约定。
 *
 * @param query 日期、游戏类型、渠道等筛选参数；导出时传 `IsExp: true`
 * @returns GameStatementResult：Items + Pagination + IsNegativeWinCount
 * @see views/dataClose/gameStatement/components/game-report-panel.vue
 */
export function fetchGameStatementListApi(query: Query) {
  return requestClient
    .get<GameStatementResult>('/backend/operation/gamestatisticsbygametype', {
      params: trimSpace(query),
    })
    .then((data) => wrapGameStatement(data || {}, true));
}

/**
 * 分类报表列表（分类报表页，按场馆/平台类型汇总）
 *
 * @param query 日期、平台类型、渠道等筛选参数；导出时传 `IsExp: true`
 * @returns GameStatementResult：Items + Pagination + IsNegativeWinCount
 * @see views/dataClose/gameStatement/components/classified-report-panel.vue
 */
export function fetchClassifiedReportListApi(query: Query) {
  return requestClient
    .get<GameStatementResult>(
      '/backend/operation/gamestatisticsbygameplatformtype',
      { params: trimSpace(query) },
    )
    .then((data) => wrapGameStatement(data || {}));
}

/**
 * 子游戏报表列表（子游戏报表页）
 *
 * @param query 日期、子游戏、渠道等筛选参数；导出时传 `IsExp: true`
 * @returns GameStatementResult：Items + Pagination + IsNegativeWinCount
 * @see views/dataClose/gameStatement/components/sub-game-report-panel.vue
 */
export function fetchSubGameReportListApi(query: Query) {
  return requestClient
    .get<GameStatementResult>('/backend/operation/gamestatisticsbysubgame', {
      params: trimSpace(query),
    })
    .then((data) => wrapGameStatement(data || {}));
}

/**
 * 游戏报表按日详情（折线图 / 详情视图下钻）
 *
 * @param query 游戏 Id、日期区间等下钻参数
 * @returns 按日明细列表 GameStatementResult
 * @see views/dataClose/gameStatement/components/line-chart-modal.vue
 * @see views/dataClose/gameStatement/components/detail-view.vue
 */
export function fetchGameDetailReportApi(query: Query) {
  return requestClient
    .get<GameStatementResult>(
      '/backend/operation/gamestatisticsbygametypedetail',
      { params: trimSpace(query) },
    )
    .then((data) => wrapGameStatement(data || {}));
}

/**
 * 分类报表按日详情（折线图 / 详情视图下钻）
 *
 * @param query 平台类型、日期区间等下钻参数
 * @returns 按日明细列表 GameStatementResult
 * @see views/dataClose/gameStatement/components/line-chart-modal.vue
 * @see views/dataClose/gameStatement/components/detail-view.vue
 */
export function fetchClassifiedDetailReportApi(query: Query) {
  return requestClient
    .get<GameStatementResult>(
      '/backend/operation/gamestatisticsbygameplatformtypedetail',
      { params: trimSpace(query) },
    )
    .then((data) => wrapGameStatement(data || {}));
}

/**
 * 子游戏报表按日详情（折线图 / 详情视图下钻）
 *
 * @param query 子游戏 Id、日期区间等下钻参数
 * @returns 按日明细列表 GameStatementResult
 * @see views/dataClose/gameStatement/components/line-chart-modal.vue
 * @see views/dataClose/gameStatement/components/detail-view.vue
 */
export function fetchSubGameDetailReportApi(query: Query) {
  return requestClient
    .get<GameStatementResult>(
      '/backend/operation/gamestatisticsbysubgamedetail',
      { params: trimSpace(query) },
    )
    .then((data) => wrapGameStatement(data || {}));
}

/**
 * 游戏报表投注人数详情（游戏报表玩家弹窗）
 *
 * @param query 游戏 Id、日期等下钻参数
 * @returns 投注玩家列表 Items + Pagination
 * @see views/dataClose/gameStatement/components/players-modal.vue
 */
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

/**
 * 子游戏投注人数详情（子游戏报表玩家弹窗）
 *
 * @param query 子游戏 Id、日期等下钻参数
 * @returns 投注玩家列表 Items + Pagination
 * @see views/dataClose/gameStatement/components/players-modal.vue
 * @see views/dataClose/gameStatement/components/sub-game-report-panel.vue
 */
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

/**
 * 场馆费率模板列表（游戏报表页费率模板下拉）
 *
 * @param query 可选筛选参数（页面通常无参）
 * @returns Items 模板 Id / TemplateName 列表
 * @see views/dataClose/gameStatement/components/game-report-panel.vue
 */
export function fetchVenueTemplateListApi(query: Query = {}) {
  return requestClient.get<{
    Items?: Array<{ Id?: number | string; TemplateName?: string }>;
  }>('/backend/apifeetemplate/list', {
    params: query,
  });
}

/**
 * 场馆费率配置列表（游戏报表页按模板展示费率）
 *
 * @param query 含 TemplateId 等模板关联参数
 * @returns ApiName / Fee 费率配置数组
 * @see views/dataClose/gameStatement/components/game-report-panel.vue
 */
export function fetchVenueFeeConfigListApi(query: Query) {
  return requestClient.get<Array<{ ApiName?: number | string; Fee?: number }>>(
    '/backend/apifeeconfig/list',
    {
      params: query,
    },
  );
}

/**
 * 修复日报/月报数据（游戏报表「更新报表」按钮）
 *
 * @param params.Date 目标日期，如 `2024-01-01`
 * @param params.Type 报表类型：`day` 日报 / `month` 月报
 * @returns 修复任务结果
 * @see views/dataClose/gameStatement/components/update-report-btn.vue
 */
export function fixDayReportDataApi(params: { Date: string; Type: string }) {
  return requestClient.get('/backend/operation/fixdayreportdata2', {
    params,
  });
}

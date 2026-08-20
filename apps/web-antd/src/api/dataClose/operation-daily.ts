import { toListResult } from '#/api/dataClose/shared';
import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

type Query = Record<string, unknown>;

/**
 * 运营日报数据比较（数据比较面板 KPI / 对比表格）
 *
 * @param query 日期、渠道等筛选参数
 * @returns 数据比较原始报表对象
 * @see views/dataClose/operationDaily/components/data-compare-panel.vue
 */
export function fetchDataAnalyzeApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/dataanalyze',
    { params: trimSpace(query) },
  );
}

/**
 * 运营日报数据比较下钻折线（数据比较面板趋势图）
 *
 * @param query 下钻维度、日期等查询参数
 * @returns 折线/时序报表数据
 * @see views/dataClose/operationDaily/components/data-compare-panel.vue
 */
export function fetchDataAnalyzeReportApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/dataanalyzereport',
    { params: trimSpace(query) },
  );
}

/**
 * 运营日报主体数据（运营日报 / 游戏分析面板核心指标）
 *
 * @param query 日报日期、渠道等筛选参数
 * @returns 日报汇总原始对象（充值、活跃、盈亏等）
 * @see views/dataClose/operationDaily/components/operation-daily-panel.vue
 * @see views/dataClose/operationDaily/components/game-analyze-panel.vue
 */
export function fetchOperationDailyReportApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/dayreport',
    { params: trimSpace(query) },
  );
}

/**
 * 运营日报游戏盈亏排行（运营日报 / 游戏分析「今日盈亏玩家」）
 *
 * 将 `TodayPlayerItemsWin` 包装为 `{ raw, list }`，list 为 toListResult 结构。
 *
 * @param query 日报日期、渠道等筛选参数
 * @returns raw 原始响应；list 盈亏排行列表结构
 * @see views/dataClose/operationDaily/components/operation-daily-panel.vue
 * @see views/dataClose/operationDaily/components/game-analyze-panel.vue
 */
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

/**
 * 运营日报收入分析（收入分析面板 / 运营日报充值详情区块）
 *
 * @param query 日期、渠道等筛选参数
 * @returns 收入分析原始对象（充值通道、金额分布等）
 * @see views/dataClose/operationDaily/components/income-panel.vue
 * @see views/dataClose/operationDaily/components/operation-daily-panel.vue
 */
export function fetchOperationIncomeAnalyzeApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/incomeanalyze',
    { params: trimSpace(query) },
  );
}

/**
 * 运营日报推广分析（推广分析面板）
 *
 * @param query 日期、渠道、推广维度等筛选参数
 * @returns 推广分析原始报表对象
 * @see views/dataClose/operationDaily/components/promotion-panel.vue
 */
export function fetchOperationPromotionAnalyzeApi(query: Query) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/operationdayreport/promotionanalyze',
    { params: trimSpace(query) },
  );
}

/**
 * 数据报表定时任务列表（数据报表面板 scheduler 表格）
 *
 * 除标准列表外额外返回 `ItemsLimit` 配额信息。
 *
 * @param query 分页等查询参数
 * @returns Items / Pagination / ItemsLimit
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function fetchDataReportListApi(query: Query) {
  return requestClient
    .get<{
      Items?: null | Record<string, unknown>[];
      ItemsLimit?: null | Record<string, unknown>;
      Pagination?: null | { MaxCount?: number };
    }>('/backend/operationdayreportscheduler/list', {
      params: trimSpace(query),
    })
    .then((data) => ({
      ...toListResult(data),
      ItemsLimit: data?.ItemsLimit || {},
    }));
}

/**
 * 数据报表定时任务详情（编辑弹窗回填）
 *
 * @param id 任务 Id
 * @returns 单条 scheduler 配置详情
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function fetchDataReportDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/operationdayreportscheduler/getone?Id=${id}`,
  );
}

/**
 * 创建数据报表定时任务
 *
 * @param data 任务名称、Cron、接收方式等表单字段
 * @returns 新建任务响应（含 Id 等）
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function createDataReportApi(data: Query) {
  return requestClient.post(
    '/backend/operationdayreportscheduler/create',
    data,
  );
}

/**
 * 更新数据报表定时任务
 *
 * @param data 含 Id 的完整任务配置
 * @returns 更新结果
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function updateDataReportApi(data: Query) {
  return requestClient.post(
    '/backend/operationdayreportscheduler/update',
    data,
  );
}

/**
 * 删除数据报表定时任务
 *
 * @param id 任务 Id
 * @returns 删除结果
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function deleteDataReportApi(id: number | string) {
  return requestClient.delete(
    `/backend/operationdayreportscheduler/delete?Id=${id}`,
  );
}

/**
 * 启用/停用数据报表定时任务
 *
 * @param id 任务 Id
 * @returns 切换后的任务状态
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function toggleDataReportApi(id: number | string) {
  return requestClient.get(
    `/backend/operationdayreportscheduler/toggle?Id=${id}`,
  );
}

/**
 * 重发数据报表（手动触发一次推送）
 *
 * @param id 任务 Id
 * @returns 重发结果
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function resendDataReportApi(id: number | string) {
  return requestClient.get(
    `/backend/operationdayreportscheduler/resend?Id=${id}`,
  );
}

/**
 * 重新生成数据报表访问 Token
 *
 * @param id 任务 Id
 * @returns 含新 Token 的任务信息
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function regenerateDataReportTokenApi(id: number | string) {
  return requestClient.get(
    `/backend/operationdayreportscheduler/regeneratetoken?Id=${id}`,
  );
}

/**
 * 购买数据报表配额次数
 *
 * @returns 购买结果 / 剩余配额信息
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function buyDataReportNumApi() {
  return requestClient.get('/backend/operationdayreportscheduler/buyreportnum');
}

/**
 * WhatsApp 接收人列表（数据报表面板接收人管理）
 *
 * @param query 分页等查询参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function fetchWhatsAppRecipientListApi(query: Query) {
  return requestClient
    .get<{
      Items?: null | Record<string, unknown>[];
      Pagination?: null | { MaxCount?: number };
    }>('/backend/operationdayreportscheduler/listwhatsapprecipient', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

/**
 * 添加 WhatsApp 接收人
 *
 * @param query 手机号、名称等接收人字段（经 query params 提交）
 * @returns 添加结果
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function addWhatsAppRecipientApi(query: Query) {
  return requestClient.post(
    '/backend/operationdayreportscheduler/addwhatsapprecipient',
    null,
    { params: trimSpace(query) },
  );
}

/**
 * 删除 WhatsApp 接收人
 *
 * @param query 接收人标识（如 Id / 手机号）
 * @returns 删除结果
 * @see views/dataClose/operationDaily/components/data-report-panel.vue
 */
export function deleteWhatsAppRecipientApi(query: Query) {
  return requestClient.delete(
    '/backend/operationdayreportscheduler/deletewhatsapprecipient',
    { params: trimSpace(query) },
  );
}

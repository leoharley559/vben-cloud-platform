import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 获取投注行为分析报表数据（不分页，直接返回 Items）。
 * @param query 查询参数（日期范围、DataSearchType、账号/渠道筛选等）
 * @returns Items：投注行为分析明细行
 * @see views/operationalData/gameDetails/index.vue
 */
export function fetchGameAnalysisReportApi(query: Record<string, unknown>) {
  return requestClient.get<{
    Items?: Record<string, unknown>[];
  }>('/backend/operation/gametransactionanalysisreport', {
    params: trimSpace(query),
  });
}

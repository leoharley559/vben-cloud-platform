import type { ReportListResult } from '#/api/dataClose/shared';

import { toListResult } from '#/api/dataClose/shared';
import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 请求月报列表接口并归一化响应
 * @param url 月报列表接口路径
 * @param query 筛选/分页参数（会先 trim 空格）
 * @returns 标准列表结构 Items + Pagination + Total
 */
function fetchMonthList(
  url: string,
  query: Record<string, unknown>,
): Promise<ReportListResult> {
  return requestClient
    .get<ReportListResult>(url, { params: trimSpace(query) })
    .then((data) => toListResult(data));
}

/**
 * 汇总月报列表（月报「汇总」Tab）
 *
 * @param query 月份、渠道、分页等筛选参数；导出时传 `IsExp: true`
 * @returns 标准列表结构 Items + Pagination + Total
 * @see views/dataClose/monthStatement/components/total-panel.vue
 */
export function fetchMonthStatementTotalListApi(
  query: Record<string, unknown>,
) {
  return fetchMonthList('/backend/agentbetwinmanagemonth/totallist', query);
}

/**
 * 自营月报列表（月报「自营」Tab）
 *
 * @param query 月份、渠道、分页等筛选参数；导出时传 `IsExp: true`
 * @returns 标准列表结构 Items + Pagination + Total
 * @see views/dataClose/monthStatement/components/self-panel.vue
 */
export function fetchMonthStatementListApi(query: Record<string, unknown>) {
  return fetchMonthList('/backend/agentbetwinmanagemonth/list', query);
}

/**
 * 子包网月报列表（月报「子包网」Tab，含 ItemsAgents）
 *
 * @param query 月份、子代理、分页等筛选参数；导出时传 `IsExp: true`
 * @returns 标准列表结构 Items + Pagination（含 ItemsAgents）
 * @see views/dataClose/monthStatement/components/son-panel.vue
 */
export function fetchMonthStatementSonListApi(query: Record<string, unknown>) {
  return fetchMonthList('/backend/agentbetwinmanagemonth/sonlist', query);
}

/**
 * 子包网月报详情（子包网月报下钻弹窗）
 *
 * @param query 子代理 Id、月份等下钻参数
 * @returns 详情列表 Items + Pagination
 * @see views/dataClose/monthStatement/components/son-detail-modal.vue
 */
export function fetchMonthStatementSonDetailApi(
  query: Record<string, unknown>,
) {
  return fetchMonthList('/backend/agentbetwinmanagemonth/sonlistdetail', query);
}

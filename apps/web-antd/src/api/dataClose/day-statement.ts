import type { ReportListResult } from '#/api/dataClose/shared';

import { toListResult } from '#/api/dataClose/shared';
import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 请求日报列表接口并归一化响应
 * @param url 日报列表接口路径
 * @param query 筛选/分页参数（会先 trim 空格）
 * @returns 标准列表结构 Items + Pagination + Total
 */
function fetchDayList(
  url: string,
  query: Record<string, unknown>,
): Promise<ReportListResult> {
  return requestClient
    .get<ReportListResult>(url, { params: trimSpace(query) })
    .then((data) => toListResult(data));
}

/**
 * 汇总日报列表（日报「汇总」Tab）
 *
 * @param query 日期、渠道、分页等筛选参数；导出时传 `IsExp: true`
 * @returns 标准列表结构 Items + Pagination + Total
 * @see views/dataClose/dayStatement/components/total-panel.vue
 */
export function fetchDayStatementTotalListApi(query: Record<string, unknown>) {
  return fetchDayList('/backend/agentbetwinmanageday/totallist', query);
}

/**
 * 自营日报列表（日报「自营」Tab）
 *
 * @param query 日期、渠道、分页等筛选参数
 * @returns 标准列表结构 Items + Pagination + Total
 * @see views/dataClose/dayStatement/components/self-panel.vue
 */
export function fetchDayStatementListApi(query: Record<string, unknown>) {
  return fetchDayList('/backend/agentbetwinmanageday/list', query);
}

/**
 * 子包网日报列表（日报「子包网」Tab，含 ItemsAgents）
 *
 * @param query 日期、子代理、分页等筛选参数；导出时传 `IsExp: true`
 * @returns 标准列表结构 Items + Pagination（含 ItemsAgents）
 * @see views/dataClose/dayStatement/components/son-panel.vue
 */
export function fetchDayStatementSonListApi(query: Record<string, unknown>) {
  return fetchDayList('/backend/agentbetwinmanageday/sonlist', query);
}

/**
 * 子包网日报详情（子包网日报下钻弹窗）
 *
 * @param query 子代理 Id、日期等下钻参数
 * @returns 详情列表 Items + Pagination
 * @see views/dataClose/dayStatement/components/son-detail-modal.vue
 */
export function fetchDayStatementSonDetailApi(query: Record<string, unknown>) {
  return fetchDayList('/backend/agentbetwinmanageday/sonlistdetail', query);
}

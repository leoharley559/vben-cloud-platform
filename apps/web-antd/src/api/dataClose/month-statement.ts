import { requestClient } from '#/api/request';
import { toListResult, type ReportListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

function fetchMonthList(
  url: string,
  query: Record<string, unknown>,
): Promise<ReportListResult> {
  return requestClient
    .get<ReportListResult>(url, { params: trimSpace(query) })
    .then((data) => toListResult(data));
}

/** 汇总月报 */
export function fetchMonthStatementTotalListApi(query: Record<string, unknown>) {
  return fetchMonthList('/backend/agentbetwinmanagemonth/totallist', query);
}

/** 自营月报 */
export function fetchMonthStatementListApi(query: Record<string, unknown>) {
  return fetchMonthList('/backend/agentbetwinmanagemonth/list', query);
}

/** 子包网月报（含 ItemsAgents） */
export function fetchMonthStatementSonListApi(query: Record<string, unknown>) {
  return fetchMonthList('/backend/agentbetwinmanagemonth/sonlist', query);
}

/** 子包网月报详情 */
export function fetchMonthStatementSonDetailApi(
  query: Record<string, unknown>,
) {
  return fetchMonthList('/backend/agentbetwinmanagemonth/sonlistdetail', query);
}

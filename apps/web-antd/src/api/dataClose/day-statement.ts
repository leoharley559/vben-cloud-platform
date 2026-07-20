import { requestClient } from '#/api/request';
import { toListResult, type ReportListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

function fetchDayList(
  url: string,
  query: Record<string, unknown>,
): Promise<ReportListResult> {
  return requestClient
    .get<ReportListResult>(url, { params: trimSpace(query) })
    .then((data) => toListResult(data));
}

/** 汇总日报 */
export function fetchDayStatementTotalListApi(query: Record<string, unknown>) {
  return fetchDayList('/backend/agentbetwinmanageday/totallist', query);
}

/** 自营日报 */
export function fetchDayStatementListApi(query: Record<string, unknown>) {
  return fetchDayList('/backend/agentbetwinmanageday/list', query);
}

/** 子包网日报（含 ItemsAgents） */
export function fetchDayStatementSonListApi(query: Record<string, unknown>) {
  return fetchDayList('/backend/agentbetwinmanageday/sonlist', query);
}

/** 子包网日报详情 */
export function fetchDayStatementSonDetailApi(query: Record<string, unknown>) {
  return fetchDayList('/backend/agentbetwinmanageday/sonlistdetail', query);
}

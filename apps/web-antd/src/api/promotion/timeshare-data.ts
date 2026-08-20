import type { TimeshareDataQuery, TimeshareHourItem } from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 获取推广分时数据报表
 * @param query 日期与渠道筛选条件
 * @returns 按小时分组的推广数据列表
 * @see views/generalizeData/timeshareData/index.vue
 */
export async function fetchTimeshareDataApi(query: TimeshareDataQuery) {
  const data = await requestClient.get<null | {
    Items?: null | TimeshareHourItem[][];
  }>('/backend/promotedata/hourreport', { params: trimSpace(query) });
  return { Items: data?.Items || [] };
}

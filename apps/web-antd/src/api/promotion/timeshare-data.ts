import type { TimeshareDataQuery, TimeshareHourItem } from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export async function fetchTimeshareDataApi(query: TimeshareDataQuery) {
  const data = await requestClient.get<null | {
    Items?: null | TimeshareHourItem[][];
  }>(
    '/backend/promotedata/hourreport',
    { params: trimSpace(query) },
  );
  return { Items: data?.Items || [] };
}

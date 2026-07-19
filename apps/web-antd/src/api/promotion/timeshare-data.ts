import { requestClient } from '#/api/request';
import type { TimeshareDataQuery, TimeshareHourItem } from '#/types/promotion';
import { trimSpace } from '#/utils/string';

export function fetchTimeshareDataApi(query: TimeshareDataQuery) {
  return requestClient.get<{ Items?: TimeshareHourItem[][] }>(
    '/backend/promotedata/hourreport',
    { params: trimSpace(query) },
  );
}

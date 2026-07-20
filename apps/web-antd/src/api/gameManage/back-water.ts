import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export interface BackWaterListResult<T = Record<string, unknown>> {
  Count?: number;
  Items?: null | T[];
  Pagination?: null | { MaxCount?: number };
  Sum?: number;
  SumBackWater?: number;
  SumValidWater?: number;
  Total?: number;
  UnSum?: number;
  [key: string]: unknown;
}

export function fetchBackWaterSchemesApi() {
  return requestClient.get<Array<Record<string, unknown>> | null>(
    '/backend/playerbackwaterscheme/allscheme',
  );
}

export function fetchBackWaterSchemeApi(Id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerbackwaterscheme/scheme',
    { params: { Id } },
  );
}

export function updateBackWaterSchemeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerbackwaterscheme/', data);
}

export function updateBackWaterSchemeConfigApi(data: {
  Config: string;
  Id: number | string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/config', data);
}

export function updateBackWaterSchemeRuleApi(data: {
  Id: number | string;
  LangText: string;
  Rule: string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/rule', data);
}

export function updateBackWaterSchemeNameApi(data: {
  Id: number | string;
  Name: string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/name', data);
}

export function createBackWaterSchemeApi(LangGroupId: number | string) {
  return requestClient.post('/backend/playerbackwaterscheme/', { LangGroupId });
}

export function deleteBackWaterSchemeApi(id: number | string) {
  return requestClient.get(`/backend/playerbackwaterscheme/${id}`);
}

export function fetchBackWaterRecordApi(query: Record<string, unknown>) {
  return requestClient.get<BackWaterListResult>(
    '/backend/playerbackwaterrecord/list',
    { params: trimSpace(query) },
  );
}

export function fetchBackWaterRecordDetailApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<BackWaterListResult>(
    '/backend/playerbackwaterrecord/detaillist',
    { params: trimSpace(query) },
  );
}

export function fetchBackWaterOrderDetailsApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<Array<Record<string, unknown>> | null>(
    '/backend/playerbackwaterrecord/detail',
    { params: trimSpace(query) },
  );
}

export function exportBackWaterRecordApi(
  type: 'detail' | 'summary',
  query: Record<string, unknown>,
) {
  const path =
    type === 'summary'
      ? '/backend/playerbackwaterrecord/listcsv'
      : '/backend/playerbackwaterrecord/detaillistcsv';
  return requestClient.get<Record<string, unknown>>(path, {
    params: trimSpace(query),
  });
}

export function fetchBackWaterReviewApi(query: Record<string, unknown>) {
  return requestClient.get<BackWaterListResult>(
    '/backend/playerbackwaterrecord/reviewlist',
    { params: trimSpace(query) },
  );
}

export function reviewBackWaterApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerbackwaterrecord/review', data);
}

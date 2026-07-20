import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export interface AdvertisementListResult<T = Record<string, unknown>> {
  Data?: T[];
  Items?: T[];
  Pagination?: { MaxCount?: number };
  [key: string]: unknown;
}

export function fetchAdvertisementProgrammesApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<AdvertisementListResult>(
    '/backend/gameadtemplate/list',
    { params: trimSpace(query) },
  );
}

export function fetchAdvertisementProgrammeApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/gameadtemplate/${id}`,
  );
}

export function createAdvertisementProgrammeApi(
  data: Record<string, unknown>,
) {
  return requestClient.post('/backend/gameadtemplate/', data);
}

export function updateAdvertisementProgrammeApi(
  data: Record<string, unknown>,
) {
  return requestClient.put('/backend/gameadtemplate/', data);
}

export function deleteAdvertisementProgrammeApi(id: number | string) {
  return requestClient.delete(`/backend/gameadtemplate/${id}`);
}

export function recoverAdvertisementProgrammeApi(
  data: Record<string, unknown>,
) {
  return requestClient.post('/backend/gameadtemplate/recover', data);
}

export function fetchAdvertisementListApi(query: Record<string, unknown>) {
  return requestClient.get<AdvertisementListResult | Record<string, unknown>[]>(
    '/backend/gameadconfig/list',
    { params: trimSpace(query) },
  );
}

export function fetchAdvertisementImagesApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gameadimage/list',
    { params: trimSpace(query) },
  );
}

export function registerAdvertisementImageApi(data: Record<string, unknown>) {
  return requestClient.post<Record<string, unknown>>(
    '/backend/gameadimage/',
    data,
  );
}

export function fetchAdvertisementNoticeListApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gameadconfig/getnoticelist',
  );
}

export function fetchAdvertisementActivityListApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gameadconfig/getactivitylist',
  );
}

export function createAdvertisementApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gameadconfig/', data);
}

export function updateAdvertisementApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gameadconfig/', data);
}

export function switchAdvertisementSortApi(data: {
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/gameadconfig/switchSort', data);
}

export function deleteAdvertisementApi(id: number | string) {
  return requestClient.delete(`/backend/gameadconfig/${id}`);
}

export function switchAdvertisementApi(data: {
  Id: number | string;
  Status: number;
}) {
  return requestClient.post('/backend/gameadconfig/switch', data);
}

export function fetchVenueRebateListApi(query: Record<string, unknown>) {
  return requestClient.get<AdvertisementListResult>(
    '/backend/gamevenuerebate/list',
    { params: trimSpace(query) },
  );
}

export function createVenueRebateApi(query: Record<string, unknown>) {
  return requestClient.post('/backend/gamevenuerebate', undefined, {
    params: trimSpace(query),
  });
}

export function updateVenueRebateApi(query: Record<string, unknown>) {
  return requestClient.put('/backend/gamevenuerebate', undefined, {
    params: trimSpace(query),
  });
}

export function deleteVenueRebateApi(id: number | string) {
  return requestClient.delete(`/backend/gamevenuerebate/${id}`);
}

export function recoverVenueRebateApi(query: Record<string, unknown>) {
  return requestClient.put('/backend/gamevenuerebate/recover', undefined, {
    params: trimSpace(query),
  });
}

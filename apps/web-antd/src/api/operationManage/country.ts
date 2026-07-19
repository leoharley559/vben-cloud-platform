import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchCountriesConfigListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/countriesconfig/list',
    { params: trimSpace(query) },
  );
}

export function fetchGameCountriesStateApi() {
  return requestClient.get<Record<string, unknown>>('/backend/gamecountries/');
}

/** 提交 Countries / CountriesAllow / Option */
export function updateGameCountriesStateApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamecountries/', data);
}

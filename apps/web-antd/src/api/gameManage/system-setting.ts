import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export interface SystemListResult<T = Record<string, unknown>> {
  Items?: T[];
  Pagination?: { MaxCount?: number };
}

export function fetchGameHelpTabsApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gamehelpcenter/list',
  );
}

export function fetchGameHelpContentsApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gamehelpcenter/listall',
  );
}

export function createGameHelpTabApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gamehelpcenter', data);
}

export function updateGameHelpTabApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamehelpcenter', data);
}

export function deleteGameHelpTabApi(id: number | string) {
  return requestClient.delete(`/backend/gamehelpcenter/${id}`);
}

export function createGameHelpContentApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gamehelpcenter/addcontent', data);
}

export function updateGameHelpContentApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamehelpcenter/editcontent', data);
}

export function deleteGameHelpContentApi(id: number | string) {
  return requestClient.delete('/backend/gamehelpcenter/deletecontent', {
    params: { Id: id },
  });
}

export function recoverGameHelpApi() {
  return requestClient.get('/backend/gamehelpcenter/recover');
}

export function sortGameHelpApi(data: {
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/gamehelpcenter/switchSort', data);
}

export function fetchPhoneBlockSettingApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/phonecountrycode/blocklist',
  );
}

export function updatePhoneBlockSettingApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/phonecountrycode/block', data);
}

export function fetchSportsTutorialListApi(query: Record<string, unknown>) {
  return requestClient.get<SystemListResult>(
    '/backend/sportsconfig/list',
    { params: trimSpace({ ...query, ConfigType: 1 }) },
  );
}

export function createSportsTutorialApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/sportsconfig', trimSpace(data));
}

export function updateSportsTutorialApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/sportsconfig', trimSpace(data));
}

export function deleteSportsTutorialApi(id: number | string) {
  return requestClient.delete(`/backend/sportsconfig/${id}`);
}

export function sortSportsTutorialApi(data: {
  ConfigType: 1;
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/sportsconfig/switchsequence', data);
}

export function fetchExchangeRateListApi(query: Record<string, unknown>) {
  return requestClient.get<
    Record<string, unknown>[] | SystemListResult
  >('/backend/operation/exchangeratesetting', { params: trimSpace(query) });
}

export function createExchangeRateApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/operation/exchangeratesetting', data);
}

export function updateExchangeRateApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/operation/exchangeratesetting', data);
}

export function deleteExchangeRateApi(id: number | string) {
  return requestClient.delete(
    `/backend/operation/exchangeratesetting/${id}`,
  );
}

export function fetchSystemTemplateListApi(query: Record<string, unknown>) {
  return requestClient.get<
    Record<string, unknown>[] | SystemListResult
  >('/backend/netcashconfig/list', { params: trimSpace(query) });
}

export function createSystemTemplateApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/netcashconfig/netcashconfigadd',
    data,
  );
}

export function updateSystemTemplateApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/netcashconfig/netcashconfigedit',
    data,
  );
}

export function deleteSystemTemplateApi(id: number | string) {
  return requestClient.delete(
    `/backend/netcashconfig/netcashconfigdel/${id}`,
  );
}

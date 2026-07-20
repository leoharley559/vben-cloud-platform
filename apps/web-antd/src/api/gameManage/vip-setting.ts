import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export interface VipListResult<T = Record<string, unknown>> {
  Items?: T[];
  Pagination?: { MaxCount?: number };
  Total?: Record<string, number>;
}

export function fetchVipGradeListApi(query: Record<string, unknown> = {}) {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/viplevelconfig/listvirtualprize',
    { params: trimSpace(query) },
  );
}

export function createVipGradeApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/viplevelconfig/addvirtualprize',
    data,
  );
}

export function updateVipGradeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/viplevelconfig/virtualprize', data);
}

export function fetchVipCoefficientApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/vipcoefficientconfig/detail',
  );
}

export function updateVipCoefficientApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/vipcoefficientconfig/', data);
}

export function fetchVipRecordListApi(query: Record<string, unknown>) {
  return requestClient.get<VipListResult>(
    '/backend/viplevelconfig/list',
    { params: trimSpace(query) },
  );
}

export function fetchVipRelegationDayApi() {
  return requestClient.get<{ RelegationDay?: number }>(
    '/backend/viplevelconfig/getrelegationday',
  );
}

export function updateVipRelegationDayApi(data: { RelegationDay: number }) {
  return requestClient.put('/backend/viplevelconfig/setrelegationday/', data);
}

export function fetchVipLevelModeApi() {
  return requestClient.get<{ VipLevelMode?: number }>(
    '/backend/viplevelconfig/getviplevelmode',
  );
}

export function updateVipLevelModeApi(data: { VipLevelMode: number }) {
  return requestClient.put('/backend/viplevelconfig/setviplevelmode/', data);
}

export function updateVipMonthRewardModeApi(data: Record<string, unknown>) {
  return requestClient.put(
    '/backend/viplevelconfig/setmonthrewardmode/',
    data,
  );
}

export function fetchVipIconTemplateListApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/viplevelconfig/listiconstemplates/',
  );
}

export function fetchVipIconsApi(data: { TemplateId: number | string }) {
  return requestClient.post<Record<string, unknown>[]>(
    '/backend/viplevelconfig/listicons/',
    data,
  );
}

export function createVipIconTemplateApi(data: { TemplateName: string }) {
  return requestClient.put(
    '/backend/viplevelconfig/addiconstemplate/',
    data,
  );
}

export function updateVipIconTemplateApi(data: {
  TemplateId: number | string;
  TemplateName: string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/iconstemplatename/',
    data,
  );
}

export function deleteVipIconTemplateApi(data: {
  TemplateId: number | string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/deleteiconstemplate/',
    data,
  );
}

export function resetVipIconTemplateApi(data: {
  TemplateId: number | string;
}) {
  return requestClient.put(
    '/backend/viplevelconfig/resettodefaulttemplate/',
    data,
  );
}

export function updateVipIconApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/viplevelconfig/icons/', data);
}

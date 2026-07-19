import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  ChannelDataResult,
  ChannelRecoupItem,
  ChannelRecoupListQuery,
  DropChangeListQuery,
  DropChangeResult,
  ExchangeRateItem,
  HandRecordItem,
  HandRecordListQuery,
  HandRecordPayload,
  InvalidUserData,
  LandingPageItem,
  PromoteDataBaseQuery,
} from '#/types/promotion';
import { trimSpace } from '#/utils/string';

function normalizeArrayQuery(query: Record<string, unknown>, fields: string[]) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  for (const field of fields) {
    const value = params[field];
    if (Array.isArray(value)) {
      params[field] = value.length ? value.join(',') : '';
    }
  }
  return params;
}

export function fetchChannelDataListApi(query: PromoteDataBaseQuery) {
  return requestClient.get<ChannelDataResult>(
    '/backend/promotedata/channelreport',
    {
      params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
        'ChannelIds',
      ]),
    },
  );
}

export function fetchDropChangeListApi(query: DropChangeListQuery) {
  return requestClient.get<DropChangeResult>(
    '/backend/promotedata/getsumrecord',
    {
      params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
        'ChannelIds',
      ]),
    },
  );
}

export function fetchInvalidUserApi(query: PromoteDataBaseQuery) {
  return requestClient.get<{ Items?: InvalidUserData }>(
    '/backend/promotedata/invaliduser',
    {
      params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
        'ChannelIds',
      ]),
    },
  );
}

export function fetchHandRecordListApi(query: HandRecordListQuery) {
  return requestClient.get<CloudListResult<HandRecordItem>>(
    '/backend/handrecord/list',
    {
      params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
        'ChannelIds',
      ]),
    },
  );
}

export function fetchHandRecordDetailApi(id: number | string) {
  return requestClient.get<HandRecordItem>(`/backend/handrecord/${id}`);
}

export function createHandRecordApi(data: HandRecordPayload) {
  return requestClient.post('/backend/handrecord/', data);
}

export function updateHandRecordApi(data: HandRecordPayload) {
  return requestClient.put('/backend/handrecord/', data);
}

export function deleteHandRecordApi(id: number | string) {
  return requestClient.delete(`/backend/handrecord/${id}`);
}

export function fetchLandingPageListApi() {
  return requestClient.get<CloudListResult<LandingPageItem>>(
    '/backend/landingpage/listall',
  );
}

export function fetchChannelRecoupListApi(query: ChannelRecoupListQuery) {
  return requestClient.get<CloudListResult<ChannelRecoupItem>>(
    '/backend/operation/channelbreakevenreport',
    { params: trimSpace(query) },
  );
}

export function fetchExchangeRateListApi() {
  return requestClient.get<ExchangeRateItem[]>(
    '/backend/operation/exchangeratesetting',
  );
}

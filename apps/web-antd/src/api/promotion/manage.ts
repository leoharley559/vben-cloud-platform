import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  BrokerageBatchPayload,
  BrokerageSetItem,
  BrokerageSetListQuery,
  BrokerageSetPayload,
  DomainListItem,
  PromoterCostPayload,
  PromoterDetail,
  PromoterDomainPayload,
  PromoterListQuery,
  PromoterListResult,
  PromoterPayload,
  PromoterTeamPayload,
} from '#/types/promotion';
import { trimSpace } from '#/utils/string';

export function fetchPromoterListApi(query: PromoterListQuery) {
  return requestClient.get<PromoterListResult>('/backend/promoter/list', {
    params: trimSpace(query),
  });
}

export function fetchPromoterDetailApi(id: number | string) {
  return requestClient.get<PromoterDetail>(`/backend/promoter/${id}`);
}

export function createPromoterApi(data: PromoterPayload) {
  return requestClient.post('/backend/promoter/', data);
}

export function updatePromoterApi(data: PromoterPayload) {
  return requestClient.put('/backend/promoter/', data);
}

export function deletePromoterApi(id: number | string) {
  return requestClient.delete(`/backend/promoter/${id}`);
}

export function createPromoterCostOddApi(data: PromoterCostPayload) {
  return requestClient.post('/backend/agent/setcostodd/', data);
}

export function updatePromoterTeamApi(data: PromoterTeamPayload) {
  return requestClient.put('/backend/accountteam/', data);
}

export function fetchDomainListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<DomainListItem>>(
    '/backend/domain/list',
    { params: trimSpace(query) },
  );
}

export function createPromoterDomainApi(data: PromoterDomainPayload) {
  return requestClient.post('/backend/promoter/domain', data);
}

export function fetchBrokerageSetListApi(query: BrokerageSetListQuery) {
  return requestClient.get<
    CloudListResult<BrokerageSetItem> & {
      TeamGameDefaultRate?: BrokerageSetItem[];
    }
  >('/backend/accountteamgamerate/list', {
    params: trimSpace(query),
  });
}

export function createBrokerageSetApi(data: BrokerageSetPayload) {
  return requestClient.post('/backend/accountteamgamerate/', data);
}

export function updateBrokerageSetApi(data: BrokerageSetPayload) {
  return requestClient.put('/backend/accountteamgamerate/', data);
}

export function resetBrokerageSetApi(data: { Hash?: string }) {
  return requestClient.post('/backend/accountteamgamerate/recover', data);
}

export function batchUpdateBrokerageSetApi(data: BrokerageBatchPayload) {
  return requestClient.post('/backend/accountteamgamerate/batchupdate', data);
}

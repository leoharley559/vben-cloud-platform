import { requestClient } from '#/api/request';
import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

export function fetchExtensionMaterialListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>(
    '/backend/promotionmaterials/list',
    { params: query },
  );
}

export function fetchPromotionConfListApi(query: NetcashListQuery) {
  return requestClient.get<NetcashListResult>('/backend/promotionconf/list', {
    params: query,
  });
}

export function createPromotionMaterialApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/promotionmaterials/', data);
}

export function deletePromotionMaterialApi(id: number | string) {
  return requestClient.delete(`/backend/promotionmaterials/${id}`);
}

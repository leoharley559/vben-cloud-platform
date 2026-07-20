import type {
  ExtensionMaterialItem,
  ExtensionMaterialListQuery,
  NetcashListQuery,
  NetcashListResult,
  NetcashMutationResult,
  PromotionConfItem,
  PromotionMaterialPayload,
} from '#/types/netcash';

import { requestClient } from '#/api/request';

export function fetchExtensionMaterialListApi(
  query: ExtensionMaterialListQuery,
) {
  return requestClient
    .get<NetcashListResult<ExtensionMaterialItem> | null>(
      '/backend/promotionmaterials/list',
      { params: query },
    )
    .then((result) => result ?? { Items: [] });
}

export function fetchPromotionConfListApi(query: NetcashListQuery) {
  return requestClient
    .get<NetcashListResult<PromotionConfItem> | null>(
      '/backend/promotionconf/list',
      { params: query },
    )
    .then((result) => result ?? { Items: [] });
}

export function fetchPromotionConfAllApi(type: 1 | 2) {
  return requestClient
    .get<NetcashListResult<PromotionConfItem> | null>(
      '/backend/promotionconf/listall',
      { params: { Type: type } },
    )
    .then((result) => result ?? { Items: [] });
}

export function createPromotionConfApi(data: {
  Type: number | string;
  Value: string;
}) {
  return requestClient.post<NetcashMutationResult>(
    '/backend/promotionconf/',
    data,
  );
}

export function updatePromotionConfApi(data: {
  Id: number | string;
  Value: string;
}) {
  return requestClient.put<NetcashMutationResult>(
    '/backend/promotionconf/',
    data,
  );
}

export function deletePromotionConfApi(id: number | string) {
  return requestClient.delete<NetcashMutationResult>(
    `/backend/promotionconf/${id}`,
  );
}

export function createPromotionMaterialApi(data: PromotionMaterialPayload) {
  return requestClient.post<NetcashMutationResult>(
    '/backend/promotionmaterials/',
    data,
  );
}

export function updatePromotionMaterialApi(data: PromotionMaterialPayload) {
  return requestClient.put<NetcashMutationResult>(
    '/backend/promotionmaterials/',
    data,
  );
}

export function deletePromotionMaterialApi(id: number | string) {
  return requestClient.delete<NetcashMutationResult>(
    `/backend/promotionmaterials/${id}`,
  );
}

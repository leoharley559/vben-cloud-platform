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

function normalizeListResult<T>(
  result: NetcashListResult<T> | null | undefined,
): NetcashListResult<T> {
  return {
    ...(result ?? {}),
    Items: Array.isArray(result?.Items) ? result.Items : [],
  };
}

/**
 * 推广素材列表（「推广素材」页素材 Tab 主表格）。
 *
 * @param query 查询参数（主题、尺寸、分页等）
 * @returns 推广素材 Items；空响应时返回 `{ Items: [] }`
 * @see views/netcash/extensionMaterial/components/material-list.vue
 */
export function fetchExtensionMaterialListApi(
  query: ExtensionMaterialListQuery,
) {
  return requestClient
    .get<NetcashListResult<ExtensionMaterialItem> | null>(
      '/backend/promotionmaterials/list',
      { params: query },
    )
    .then(normalizeListResult);
}

/**
 * 推广配置项列表（主题/尺寸等字典，分页查询）。
 *
 * @param query 查询参数（Type、分页等）
 * @returns 配置项 Items；空响应时返回 `{ Items: [] }`
 * @see views/netcash/extensionMaterial/components/theme-size-panel.vue
 */
export function fetchPromotionConfListApi(query: NetcashListQuery) {
  return requestClient
    .get<NetcashListResult<PromotionConfItem> | null>(
      '/backend/promotionconf/list',
      { params: query },
    )
    .then(normalizeListResult);
}

/**
 * 推广配置全量列表（下拉/表单选项，不分页）。
 *
 * @param type 配置类型：`1` 尺寸；`2` 主题
 * @returns 该类型全部配置项 Items
 * @see views/netcash/extensionMaterial/components/material-list.vue
 */
export function fetchPromotionConfAllApi(type: 1 | 2) {
  return requestClient
    .get<NetcashListResult<PromotionConfItem> | null>(
      '/backend/promotionconf/listall',
      { params: { Type: type } },
    )
    .then(normalizeListResult);
}

/**
 * 新增推广配置项（主题或尺寸）。
 *
 * @param data Type 配置类型；Value 配置值
 * @returns 接口变更结果
 * @see views/netcash/extensionMaterial/components/theme-size-panel.vue
 */
export function createPromotionConfApi(data: {
  Type: number | string;
  Value: string;
}) {
  return requestClient.post<NetcashMutationResult>(
    '/backend/promotionconf/',
    data,
  );
}

/**
 * 更新推广配置项。
 *
 * @param data Id 及新 Value
 * @returns 接口变更结果
 * @see views/netcash/extensionMaterial/components/theme-size-panel.vue
 */
export function updatePromotionConfApi(data: {
  Id: number | string;
  Value: string;
}) {
  return requestClient.put<NetcashMutationResult>(
    '/backend/promotionconf/',
    data,
  );
}

/**
 * 删除推广配置项。
 *
 * @param id 配置项 Id
 * @returns 接口变更结果
 * @see views/netcash/extensionMaterial/components/theme-size-panel.vue
 */
export function deletePromotionConfApi(id: number | string) {
  return requestClient.delete<NetcashMutationResult>(
    `/backend/promotionconf/${id}`,
  );
}

/**
 * 新增推广素材。
 *
 * @param data 素材表单（图片、主题、尺寸、链接等）
 * @returns 接口变更结果
 * @see views/netcash/extensionMaterial/components/material-list.vue
 */
export function createPromotionMaterialApi(data: PromotionMaterialPayload) {
  return requestClient.post<NetcashMutationResult>(
    '/backend/promotionmaterials/',
    data,
  );
}

/**
 * 更新推广素材。
 *
 * @param data 素材表单（含 Id 及待更新字段）
 * @returns 接口变更结果
 * @see views/netcash/extensionMaterial/components/material-list.vue
 */
export function updatePromotionMaterialApi(data: PromotionMaterialPayload) {
  return requestClient.put<NetcashMutationResult>(
    '/backend/promotionmaterials/',
    data,
  );
}

/**
 * 删除推广素材。
 *
 * @param id 素材 Id
 * @returns 接口变更结果
 * @see views/netcash/extensionMaterial/components/material-list.vue
 */
export function deletePromotionMaterialApi(id: number | string) {
  return requestClient.delete<NetcashMutationResult>(
    `/backend/promotionmaterials/${id}`,
  );
}

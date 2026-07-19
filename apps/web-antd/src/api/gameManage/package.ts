import type {
  AvailableChannelQuery,
  AvailableChannelsResult,
  PackageColorThemeListResult,
  PackageColorThemeQuery,
  PackageDependencyItem,
  PackageDependencyListResult,
  PackageDescriptionPayload,
  PackageDetail,
  PackageFormPayload,
  PackageId,
  PackageListQuery,
  PackageListResult,
  PackageResourceListResult,
  PackageResourceQuery,
  PackageUnderageConfig,
  PackageUnderagePayload,
  PackageUnderageQuery,
} from '#/types/package-config';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

import { fetchAdActivityJumpListApi } from '../operationManage/game-notice';
import {
  fetchAdTemplateListApi as fetchExistingAdTemplateListApi,
  fetchBackWaterSchemeListApi as fetchExistingBackWaterSchemeListApi,
} from './index';

/** Package list, including resources and VIP badge metadata. */
export function fetchPackageListApi(query: PackageListQuery) {
  return requestClient.get<PackageListResult>('/backend/package/list', {
    params: trimSpace(query),
  });
}

export function fetchPackageDetailApi(id: PackageId) {
  return requestClient.get<PackageDetail>(`/backend/package/${id}`);
}

export function createPackageApi(data: PackageFormPayload) {
  return requestClient.post<PackageDetail>('/backend/package/', data);
}

export function updatePackageApi(data: PackageFormPayload) {
  return requestClient.put<PackageDetail>('/backend/package/', data);
}

export function updateNoviceGuidanceApi(data: {
  NoviceGuidanceState: number | string;
  PackageId: PackageId;
}) {
  return requestClient.put('/backend/noviceguidance', data);
}

export function deletePackageApi(id: PackageId) {
  return requestClient.delete(`/backend/package/${id}`);
}

export function fetchPackageResourceListApi(query: PackageResourceQuery) {
  return requestClient.get<PackageResourceListResult>('/api/resource/list', {
    params: trimSpace(query),
  });
}

export function buyPackageNumberApi() {
  return requestClient.post('/backend/package/buypackagenum');
}

export function updatePackageDescriptionApi(data: PackageDescriptionPayload) {
  return requestClient.put('/backend/package/editdescription', data);
}

export function fetchPackageUnderageConfigApi(query: PackageUnderageQuery) {
  return requestClient.get<PackageUnderageConfig>(
    '/backend/package/getunderageconfig',
    { params: query },
  );
}

export function updatePackageUnderageConfigApi(data: PackageUnderagePayload) {
  return requestClient.put('/backend/package/editunderageconfig', data);
}

export function fetchPackageColorThemeListApi(query: PackageColorThemeQuery) {
  return requestClient.get<PackageColorThemeListResult>(
    '/api/resource/packagecolorthemelist',
    { params: trimSpace(query) },
  );
}

export function fetchPackageColorThemeDetailListApi(
  query: PackageColorThemeQuery,
) {
  return requestClient.get<PackageColorThemeListResult>(
    '/api/resource/packagecolorthemedetaillist',
    { params: trimSpace(query) },
  );
}

/**
 * Available-channel deployments use either Item or Items. Keep both fields in
 * the returned payload and ensure callers can consistently read Item first.
 */
export async function fetchAvailableChannelsApi(query: AvailableChannelQuery) {
  const result = await requestClient.get<AvailableChannelsResult>(
    '/backend/channel/availablechannels',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Item: result.Item ?? result.Items ?? [],
  };
}

/** Existing inclusion-hub dependencies, exposed from the focused module. */
export function fetchAdTemplateListApi(query: Record<string, unknown> = {}) {
  return fetchExistingAdTemplateListApi(trimSpace(query));
}

export function fetchPackageActivityListApi(
  query: Record<string, unknown> = {},
) {
  return fetchAdActivityJumpListApi(trimSpace(query)) as Promise<
    PackageDependencyItem[] | PackageDependencyListResult
  >;
}

export function fetchPackageLogoGroupListApi() {
  return requestClient.get<PackageDependencyItem[]>(
    '/backend/gameadtemplate/listlogogroup',
  );
}

export function fetchBackWaterSchemeListApi(
  query: Record<string, unknown> = {},
) {
  return fetchExistingBackWaterSchemeListApi(trimSpace(query));
}

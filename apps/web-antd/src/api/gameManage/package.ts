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
/**
 * 查询包体列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export async function fetchPackageListApi(query: PackageListQuery) {
  const result = await requestClient.get<null | PackageListResult>(
    '/backend/package/list',
    {
      params: trimSpace(query),
    },
  );
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    MoreItems: {
      ...result?.MoreItems,
      Resources: Array.isArray(result?.MoreItems?.Resources)
        ? result.MoreItems.Resources
        : [],
    },
    Pagination: result?.Pagination,
    VIPBadgeGroups: Array.isArray(result?.VIPBadgeGroups)
      ? result.VIPBadgeGroups
      : [],
  } satisfies PackageListResult;
}

/**
 * 查询包体明细。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchPackageDetailApi(id: PackageId) {
  return requestClient.get<PackageDetail>(`/backend/package/${id}`);
}

/**
 * 新增包体。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function createPackageApi(data: PackageFormPayload) {
  return requestClient.post<PackageDetail>('/backend/package/', data);
}

/**
 * 更新包体。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackageApi(data: PackageFormPayload) {
  return requestClient.put<PackageDetail>('/backend/package/', data);
}

/**
 * 更新新手引导。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updateNoviceGuidanceApi(data: {
  NoviceGuidanceState: number | string;
  PackageId: PackageId;
}) {
  return requestClient.put('/backend/noviceguidance', data);
}

/**
 * 删除包体。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function deletePackageApi(id: PackageId) {
  return requestClient.delete(`/backend/package/${id}`);
}

/**
 * 查询包体资源列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export async function fetchPackageResourceListApi(query: PackageResourceQuery) {
  const result = await requestClient.get<null | PackageResourceListResult>(
    '/api/resource/list',
    {
      params: trimSpace(query),
    },
  );
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination,
  } satisfies PackageResourceListResult;
}

/**
 * 购买包体数量。
 *
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function buyPackageNumberApi() {
  return requestClient.post('/backend/package/buypackagenum');
}

/**
 * 更新包体备注说明。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackageDescriptionApi(data: PackageDescriptionPayload) {
  return requestClient.put('/backend/package/editdescription', data);
}

/**
 * 查询包体未成年配置。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchPackageUnderageConfigApi(query: PackageUnderageQuery) {
  return requestClient.get<PackageUnderageConfig>(
    '/backend/package/getunderageconfig',
    { params: query },
  );
}

/**
 * 更新包体未成年配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackageUnderageConfigApi(data: PackageUnderagePayload) {
  return requestClient.put('/backend/package/editunderageconfig', data);
}

/**
 * 查询包体配色主题列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export async function fetchPackageColorThemeListApi(
  query: PackageColorThemeQuery,
) {
  const result = await requestClient.get<null | PackageColorThemeListResult>(
    '/api/resource/packagecolorthemelist',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination,
  } satisfies PackageColorThemeListResult;
}

/**
 * 查询包体配色主题明细列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export async function fetchPackageColorThemeDetailListApi(
  query: PackageColorThemeQuery,
) {
  const result = await requestClient.get<null | PackageColorThemeListResult>(
    '/api/resource/packagecolorthemedetaillist',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Items: Array.isArray(result?.Items) ? result.Items : [],
    Pagination: result?.Pagination,
  } satisfies PackageColorThemeListResult;
}

/**
 * Available-channel deployments use either Item or Items. Keep both fields in
 * the returned payload and ensure callers can consistently read Item first.
 */
/**
 * 查询可用通道。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
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
/**
 * 查询广告模板列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchAdTemplateListApi(query: Record<string, unknown> = {}) {
  return fetchExistingAdTemplateListApi(trimSpace(query));
}

/**
 * 查询包体活动列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export async function fetchPackageActivityListApi(
  query: Record<string, unknown> = {},
) {
  const result = await fetchAdActivityJumpListApi(trimSpace(query));
  if (Array.isArray(result)) {
    return result as PackageDependencyItem[];
  }
  if (result && typeof result === 'object') {
    const record = result as PackageDependencyListResult;
    if (Array.isArray(record.Items)) {
      return record;
    }
  }
  return [] as PackageDependencyItem[];
}

/**
 * 查询包体LogoGroup列表。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export async function fetchPackageLogoGroupListApi() {
  const result = await requestClient.get<null | PackageDependencyItem[]>(
    '/backend/gameadtemplate/listlogogroup',
  );
  return Array.isArray(result) ? result : [];
}

/**
 * 查询返水方案列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchBackWaterSchemeListApi(
  query: Record<string, unknown> = {},
) {
  return fetchExistingBackWaterSchemeListApi(trimSpace(query));
}

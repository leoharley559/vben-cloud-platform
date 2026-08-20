import type { PackageAnalyticsConfig } from './package-settings';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 包体管理模块记录 Id */
export type PackageManageId = number | string;
/** 上架平台类型 */
export type ShelfPlatform = 'android' | 'ios';

/** 包体管理列表响应结构 */
export interface PackageManageListResult<T = Record<string, unknown>> {
  Items?: T[];
  MoreItems?: Record<string, unknown>;
  Pagination?: {
    CurrPage?: number;
    MaxCount?: number;
    PageSize?: number;
  };
}

/** 空列表常返回 Items=null；保留 MoreItems（如 package/list 的 Resources）。 */
function normalizeListResult<T = Record<string, unknown>>(
  data: null | PackageManageListResult<T> | undefined,
): PackageManageListResult<T> {
  const items = Array.isArray(data?.Items) ? data.Items : [];
  return {
    Items: items,
    MoreItems: data?.MoreItems ?? {},
    Pagination: {
      CurrPage: data?.Pagination?.CurrPage,
      MaxCount: data?.Pagination?.MaxCount ?? items.length,
      PageSize: data?.Pagination?.PageSize,
    },
  };
}

/**
 * 查询企业签包体Games。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/packageManage
 */
export function fetchEnterprisePackageGamesApi(query: Record<string, unknown>) {
  return requestClient
    .get<PackageManageListResult>('/backend/package/list', {
      params: trimSpace(query),
    })
    .then(normalizeListResult);
}

/**
 * 查询企业签通道。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/packageManage
 */
export async function fetchEnterpriseChannelsApi(PackageId: PackageManageId) {
  const result = await requestClient.get<Array<Record<string, unknown>> | null>(
    '/backend/channel/listall',
    { params: { PackageId } },
  );
  return Array.isArray(result) ? result : [];
}

/**
 * 绑定企业签渠道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/packageManage
 */
export function bindEnterpriseChannelApi(data: {
  ChannelId: PackageManageId;
  PackageId: PackageManageId;
}) {
  return requestClient.post('/backend/package/bindchannel', data);
}

/**
 * 解绑企业签渠道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/packageManage
 */
export function unbindEnterpriseChannelApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/package/', data);
}

/**
 * 查询企业签步骤。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/packageManage
 */
export async function fetchEnterpriseStepApi(PackageId: PackageManageId) {
  const result = await requestClient.get<{
    Items?: null | Record<string, unknown>;
  }>('/backend/packagelinkios/iospackversion', { params: { PackageId } });
  return {
    Items:
      result?.Items && typeof result.Items === 'object' ? result.Items : {},
  };
}

/**
 * 查询企业签包体列表。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/packageManage
 */
export function fetchEnterprisePackageListApi(PackageId: PackageManageId) {
  return requestClient
    .get<PackageManageListResult>(
      '/backend/packagelinkios/listpackageiosdetail',
      { params: { PackageId } },
    )
    .then(normalizeListResult);
}

/**
 * 新增企业签包体。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/packageManage
 */
export function createEnterprisePackageApi(data: {
  IosName: string;
  IosUploadUrl: string;
  PackageId: PackageManageId;
}) {
  return requestClient.post('/backend/packagelinkios/uploadsignpackage', data);
}

/**
 * 更新企业签包体。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/packageManage
 */
export function updateEnterprisePackageApi(data: {
  Id: PackageManageId;
  IosName: string;
  IosUploadUrl: string;
}) {
  return requestClient.put('/backend/packagelinkios/reuploadsignpackage', data);
}

/**
 * 删除企业签包体。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/packageManage
 */
export function deleteEnterprisePackageApi(id: PackageManageId) {
  return requestClient.delete(`/backend/packagelinkios/${id}`);
}

/**
 * 按平台返回上架包配置接口根路径。
 *
 * @param platform `ios` → iosappstoredata；否则 androidappstoreconfig
 * @returns `/backend/...` 根路径
 */
const shelfPath = (platform: ShelfPlatform) =>
  platform === 'ios'
    ? '/backend/iosappstoredata'
    : '/backend/androidappstoreconfig';

/**
 * 查询上架包体列表。
 *
 * @param platform 上架平台（android | ios）
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/packageManage
 */
export function fetchShelfPackageListApi(
  platform: ShelfPlatform,
  query: Record<string, unknown>,
) {
  return requestClient
    .get<PackageManageListResult>(`${shelfPath(platform)}/list`, {
      params: trimSpace(query),
    })
    .then(normalizeListResult);
}

/**
 * 新增上架包体。
 *
 * @param platform 上架平台（android | ios）
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/packageManage
 */
export function createShelfPackageApi(
  platform: ShelfPlatform,
  data: Record<string, unknown>,
) {
  return requestClient.post(shelfPath(platform), data);
}

/**
 * 更新上架包体。
 *
 * @param platform 上架平台（android | ios）
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/packageManage
 */
export function updateShelfPackageApi(
  platform: ShelfPlatform,
  data: Record<string, unknown>,
) {
  return requestClient.put(shelfPath(platform), data);
}

/**
 * 删除上架包体。
 *
 * @param platform 上架平台（android | ios）
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/packageManage
 */
export function deleteShelfPackageApi(
  platform: ShelfPlatform,
  id: PackageManageId,
) {
  return requestClient.delete(`${shelfPath(platform)}/${id}`);
}

/**
 * 查询上架统计。
 *
 * @param platform 上架平台（android | ios）
 * @param AppPackageConfigId 应用包配置 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/packageManage
 */
export async function fetchShelfAnalyticsApi(
  platform: ShelfPlatform,
  AppPackageConfigId: PackageManageId,
) {
  const result = await requestClient.get<null | PackageAnalyticsConfig>(
    `${shelfPath(platform)}/analyticinfo`,
    { params: { AppPackageConfigId } },
  );
  return result ?? {};
}

/**
 * 更新上架统计。
 *
 * @param platform 上架平台（android | ios）
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/packageManage
 */
export function updateShelfAnalyticsApi(
  platform: ShelfPlatform,
  data: Record<string, unknown>,
) {
  return requestClient.put(`${shelfPath(platform)}/analyticinfo`, data);
}

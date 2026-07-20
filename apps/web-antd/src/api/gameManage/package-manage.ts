import type { PackageAnalyticsConfig } from './package-settings';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export type PackageManageId = number | string;
export type ShelfPlatform = 'android' | 'ios';

export interface PackageManageListResult<T = Record<string, unknown>> {
  Items?: T[];
  MoreItems?: Record<string, unknown>;
  Pagination?: {
    CurrPage?: number;
    MaxCount?: number;
    PageSize?: number;
  };
}

export function fetchEnterprisePackageGamesApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<PackageManageListResult>(
    '/backend/package/list',
    { params: trimSpace(query) },
  );
}

export function fetchEnterpriseChannelsApi(PackageId: PackageManageId) {
  return requestClient.get<Array<Record<string, unknown>>>(
    '/backend/channel/listall',
    { params: { PackageId } },
  );
}

export function bindEnterpriseChannelApi(data: {
  ChannelId: PackageManageId;
  PackageId: PackageManageId;
}) {
  return requestClient.post('/backend/package/bindchannel', data);
}

export function unbindEnterpriseChannelApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/package/', data);
}

export function fetchEnterpriseStepApi(PackageId: PackageManageId) {
  return requestClient.get<{ Items?: Record<string, unknown> }>(
    '/backend/packagelinkios/iospackversion',
    { params: { PackageId } },
  );
}

export function fetchEnterprisePackageListApi(PackageId: PackageManageId) {
  return requestClient.get<PackageManageListResult>(
    '/backend/packagelinkios/listpackageiosdetail',
    { params: { PackageId } },
  );
}

export function createEnterprisePackageApi(data: {
  IosName: string;
  IosUploadUrl: string;
  PackageId: PackageManageId;
}) {
  return requestClient.post('/backend/packagelinkios/uploadsignpackage', data);
}

export function updateEnterprisePackageApi(data: {
  Id: PackageManageId;
  IosName: string;
  IosUploadUrl: string;
}) {
  return requestClient.put('/backend/packagelinkios/reuploadsignpackage', data);
}

export function deleteEnterprisePackageApi(id: PackageManageId) {
  return requestClient.delete(`/backend/packagelinkios/${id}`);
}

const shelfPath = (platform: ShelfPlatform) =>
  platform === 'ios'
    ? '/backend/iosappstoredata'
    : '/backend/androidappstoreconfig';

export function fetchShelfPackageListApi(
  platform: ShelfPlatform,
  query: Record<string, unknown>,
) {
  return requestClient.get<PackageManageListResult>(
    `${shelfPath(platform)}/list`,
    { params: trimSpace(query) },
  );
}

export function createShelfPackageApi(
  platform: ShelfPlatform,
  data: Record<string, unknown>,
) {
  return requestClient.post(shelfPath(platform), data);
}

export function updateShelfPackageApi(
  platform: ShelfPlatform,
  data: Record<string, unknown>,
) {
  return requestClient.put(shelfPath(platform), data);
}

export function deleteShelfPackageApi(
  platform: ShelfPlatform,
  id: PackageManageId,
) {
  return requestClient.delete(`${shelfPath(platform)}/${id}`);
}

export function fetchShelfAnalyticsApi(
  platform: ShelfPlatform,
  AppPackageConfigId: PackageManageId,
) {
  return requestClient.get<PackageAnalyticsConfig>(
    `${shelfPath(platform)}/analyticinfo`,
    { params: { AppPackageConfigId } },
  );
}

export function updateShelfAnalyticsApi(
  platform: ShelfPlatform,
  data: Record<string, unknown>,
) {
  return requestClient.put(`${shelfPath(platform)}/analyticinfo`, data);
}

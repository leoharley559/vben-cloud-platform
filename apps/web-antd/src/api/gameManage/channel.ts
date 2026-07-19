import type {
  AvailableChannelQuery,
  AvailableChannelsResult,
  ChannelAnalyticsConfig,
  ChannelAppPackageOption,
  ChannelBatchPayload,
  ChannelBatchResult,
  ChannelCountryListResult,
  ChannelDetail,
  ChannelDomainListResult,
  ChannelDomainQuery,
  ChannelFormPayload,
  ChannelHierarchyQuery,
  ChannelHierarchyResult,
  ChannelId,
  ChannelInvitationPayload,
  ChannelIosPackageListResult,
  ChannelIosPackageOption,
  ChannelLandingResourceListResult,
  ChannelLandingResourceQuery,
  ChannelListQuery,
  ChannelListResult,
  ChannelPackageOption,
  ChannelPackagePayload,
  ChannelRegisterLoginConfig,
  ChannelRegisterLoginPayload,
  ChannelRepackQuery,
  ChannelShortUrlConfig,
  ChannelSiteOption,
  ChannelSitePayload,
  ChannelSiteTypePayload,
  ChannelUrlConfig,
  ChannelUrlQuery,
  DefaultTagVenuesResult,
} from '#/types/channel-config';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** Legacy uploader target. Pass this URL to the existing upload component. */
export const CHANNEL_UPLOAD_URL = '/api/uploadfile';

export const CHANNEL_UPLOAD_ACCEPT = 'image/*';

function withItems<T extends { Items?: null | unknown[] }>(result: T) {
  return { ...result, Items: result.Items ?? [] };
}

/** Primary list; keeps Pagination and both MoreItems collections intact. */
export async function fetchChannelListApi(query: ChannelListQuery) {
  const result = await requestClient.get<ChannelListResult>(
    '/backend/channel/list',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Items: result.Items ?? [],
    MoreItems: {
      ...result.MoreItems,
      Parents: result.MoreItems?.Parents ?? [],
      Resources: result.MoreItems?.Resources ?? [],
    },
  };
}

/** Hierarchy response deliberately retains ItemsSon rather than renaming it. */
export async function fetchChannelHierarchyApi(query: ChannelHierarchyQuery) {
  const result = await requestClient.get<ChannelHierarchyResult>(
    '/backend/channel/listallsonpromoter',
    { params: query },
  );
  return {
    ...result,
    ItemsSon: result.ItemsSon ?? [],
    Parents: result.Parents ?? [],
  };
}

export function fetchChannelDetailApi(id: ChannelId) {
  return requestClient.get<ChannelDetail>(`/backend/channel/${id}`);
}

export function createChannelApi(data: ChannelFormPayload) {
  return requestClient.post<ChannelDetail>('/backend/channel/', data);
}

export function updateChannelApi(data: ChannelFormPayload) {
  return requestClient.put<ChannelDetail>('/backend/channel/', data);
}

export function deleteChannelApi(id: ChannelId) {
  return requestClient.delete(`/backend/channel/${id}`);
}

export function updateChannelInvitationCodeApi(data: ChannelInvitationPayload) {
  return requestClient.put('/backend/channel/editinvitationcode', data);
}

export function updateChannelsBatchApi(data: ChannelBatchPayload) {
  return requestClient.put<ChannelBatchResult>(
    '/backend/channel/editbatch',
    data,
  );
}

/** The legacy repack endpoint sends ChannelId in the query string, not body. */
export function repackChannelApi(query: ChannelRepackQuery) {
  return requestClient.post('/backend/channel/repack', undefined, {
    params: query,
  });
}

/** This endpoint returns a direct array rather than an Items envelope. */
export async function fetchChannelPackageOptionsApi(
  query: Record<string, unknown> = {},
) {
  const result = await requestClient.get<ChannelPackageOption[] | null>(
    '/backend/package/listall',
    { params: query },
  );
  return result ?? [];
}

export async function fetchChannelDomainOptionsApi(query: ChannelDomainQuery) {
  const result = await requestClient.get<ChannelDomainListResult>(
    '/backend/domain/list',
    { params: query },
  );
  return withItems(result) as ChannelDomainListResult;
}

export async function fetchChannelIosEnterprisePackagesApi(
  PackageId: ChannelId,
) {
  const result = await requestClient.get<ChannelIosPackageListResult>(
    '/backend/packagelinkios/listall',
    { params: { PackageId } },
  );
  return withItems(result) as ChannelIosPackageListResult;
}

export async function fetchChannelIosAppPackagesApi(PackageId: ChannelId) {
  const result = await requestClient.get<ChannelIosPackageOption[] | null>(
    '/backend/channel/iosapppackageconfig',
    { params: trimSpace({ PackageId }) },
  );
  return result ?? [];
}

export async function fetchChannelAndroidAppPackagesApi() {
  const result = await requestClient.get<ChannelAppPackageOption[] | null>(
    '/backend/channel/androidapppackageconfig',
  );
  return result ?? [];
}

/** Legacy targeted edit: the endpoint expects the complete channel detail. */
export function updateChannelIosAppPackageApi(data: ChannelPackagePayload) {
  return requestClient.put('/backend/channel/iosapppackageconfig', data);
}

/** Legacy targeted edit: the endpoint expects the complete channel detail. */
export function updateChannelAndroidAppPackageApi(data: ChannelPackagePayload) {
  return requestClient.put('/backend/channel/androidapppackageconfig', data);
}

export async function fetchChannelLandingResourcesApi(
  query: ChannelLandingResourceQuery,
) {
  const result = await requestClient.get<ChannelLandingResourceListResult>(
    '/api/resource/list',
    { params: query },
  );
  return withItems(result) as ChannelLandingResourceListResult;
}

export async function fetchChannelCountriesApi(query: Record<string, unknown>) {
  const result = await requestClient.get<ChannelCountryListResult>(
    '/backend/countriesconfig/list',
    { params: query },
  );
  return withItems(result) as ChannelCountryListResult;
}

/**
 * Older deployments return a serialized JSON string; newer ones may return
 * the parsed array. Consumers should parse only when the returned value is a
 * string.
 */
export function fetchDefaultTagVenuesApi() {
  return requestClient.get<DefaultTagVenuesResult>(
    '/backend/channel/defaulttagvenues',
  );
}

export function fetchChannelUrlApi(query: ChannelUrlQuery) {
  return requestClient.get<ChannelUrlConfig>('/backend/channel/channelurl', {
    params: query,
  });
}

/** Legacy endpoint expects the full URL configuration in query parameters. */
export function updateChannelUrlApi(query: ChannelUrlConfig) {
  return requestClient.put('/backend/channel/editchannelurl', undefined, {
    params: query,
  });
}

export function fetchChannelShortUrlApi(query: ChannelUrlQuery) {
  return requestClient.get<ChannelShortUrlConfig>(
    '/backend/channel/showshorturl',
    { params: query },
  );
}

/** Legacy endpoint creates or refreshes the short URL through query params. */
export function updateChannelShortUrlApi(query: ChannelUrlQuery) {
  return requestClient.put<ChannelShortUrlConfig>(
    '/backend/channel/putshorturl',
    undefined,
    { params: query },
  );
}

export async function fetchAvailableChannelsApi(query: AvailableChannelQuery) {
  const result = await requestClient.get<AvailableChannelsResult>(
    '/backend/channel/availablechannels',
    { params: query },
  );
  return {
    ...result,
    Item: result.Item ?? result.Items ?? [],
    ...(result.Items === null ? { Items: [] } : {}),
  };
}

export async function fetchPackageSiteOptionsApi(PackageId: ChannelId) {
  const result = await requestClient.get<ChannelSiteOption[] | null>(
    '/backend/package/packagesiteconfig',
    { params: { PackageId } },
  );
  return result ?? [];
}

export function updateChannelSiteConfigApi(data: ChannelSitePayload) {
  return requestClient.post('/backend/channel/channelsiteconfig', data);
}

export function updateChannelSiteTypeApi(data: ChannelSiteTypePayload) {
  return requestClient.put('/backend/channel/channelsitetype', data);
}

export function fetchChannelRegisterLoginConfigApi(ChannelId: ChannelId) {
  return requestClient.get<ChannelRegisterLoginConfig>(
    '/backend/packageregisterloginconfig',
    { params: { ChannelId } },
  );
}

export function updateChannelRegisterLoginConfigApi(
  data: ChannelRegisterLoginPayload,
) {
  return requestClient.put('/backend/packageregisterloginconfig', data);
}

export function fetchChannelAnalyticsConfigApi(ChannelId: ChannelId) {
  return requestClient.get<ChannelAnalyticsConfig>(
    '/backend/channel/analyticinfo',
    { params: trimSpace({ ChannelId }) },
  );
}

export function updateChannelAnalyticsConfigApi(data: ChannelAnalyticsConfig) {
  return requestClient.put('/backend/channel/analyticinfo', trimSpace(data));
}

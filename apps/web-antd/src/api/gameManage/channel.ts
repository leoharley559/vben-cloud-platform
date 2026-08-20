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

function withItems<T extends { Items?: null | unknown[] }>(result: null | T) {
  return { ...result, Items: result?.Items ?? [] };
}

/** Primary list; keeps Pagination and both MoreItems collections intact. */
/**
 * 查询渠道列表（含分页与家长/资源扩展字段）
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchChannelListApi(query: ChannelListQuery) {
  const result = await requestClient.get<ChannelListResult | null>(
    '/backend/channel/list',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    MoreItems: {
      ...result?.MoreItems,
      Parents: result?.MoreItems?.Parents ?? [],
      Resources: result?.MoreItems?.Resources ?? [],
    },
  };
}

/** Hierarchy response deliberately retains ItemsSon rather than renaming it. */
/**
 * 查询子推广渠道层级树。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchChannelHierarchyApi(query: ChannelHierarchyQuery) {
  const result = await requestClient.get<ChannelHierarchyResult | null>(
    '/backend/channel/listallsonpromoter',
    { params: query },
  );
  return {
    ...result,
    ItemsSon: result?.ItemsSon ?? [],
    Parents: result?.Parents ?? [],
  };
}

/**
 * 查询渠道明细。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export function fetchChannelDetailApi(id: ChannelId) {
  return requestClient.get<ChannelDetail>(`/backend/channel/${id}`);
}

/**
 * 新增渠道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/createChannel
 */
export function createChannelApi(data: ChannelFormPayload) {
  return requestClient.post<ChannelDetail>('/backend/channel/', data);
}

/**
 * 更新渠道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelApi(data: ChannelFormPayload) {
  return requestClient.put<ChannelDetail>('/backend/channel/', data);
}

/**
 * 删除渠道。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/createChannel
 */
export function deleteChannelApi(id: ChannelId) {
  return requestClient.delete(`/backend/channel/${id}`);
}

/**
 * 更新渠道Invitation兑换码。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelInvitationCodeApi(data: ChannelInvitationPayload) {
  return requestClient.put('/backend/channel/editinvitationcode', data);
}

/**
 * 更新通道Batch。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelsBatchApi(data: ChannelBatchPayload) {
  return requestClient.put<ChannelBatchResult>(
    '/backend/channel/editbatch',
    data,
  );
}

/** The legacy repack endpoint sends ChannelId in the query string, not body. */
/**
 * 重新打包渠道安装包。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口响应数据
 * @see views/gameManage/createChannel
 */
export function repackChannelApi(query: ChannelRepackQuery) {
  return requestClient.post('/backend/channel/repack', undefined, {
    params: query,
  });
}

/** This endpoint returns a direct array rather than an Items envelope. */
/**
 * 查询渠道包体Options。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchChannelPackageOptionsApi(
  query: Record<string, unknown> = {},
) {
  const result = await requestClient.get<ChannelPackageOption[] | null>(
    '/backend/package/listall',
    { params: query },
  );
  return result ?? [];
}

/**
 * 查询渠道域名Options。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchChannelDomainOptionsApi(query: ChannelDomainQuery) {
  const result = await requestClient.get<ChannelDomainListResult>(
    '/backend/domain/list',
    { params: query },
  );
  return withItems(result) as ChannelDomainListResult;
}

/**
 * 查询渠道iOS企业签Packages。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchChannelIosEnterprisePackagesApi(
  PackageId: ChannelId,
) {
  const result = await requestClient.get<ChannelIosPackageListResult>(
    '/backend/packagelinkios/listall',
    { params: { PackageId } },
  );
  return withItems(result) as ChannelIosPackageListResult;
}

/**
 * 查询渠道iOSAppPackages。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchChannelIosAppPackagesApi(PackageId: ChannelId) {
  const result = await requestClient.get<ChannelIosPackageOption[] | null>(
    '/backend/channel/iosapppackageconfig',
    { params: trimSpace({ PackageId }) },
  );
  return result ?? [];
}

/**
 * 查询渠道AndroidAppPackages。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchChannelAndroidAppPackagesApi() {
  const result = await requestClient.get<ChannelAppPackageOption[] | null>(
    '/backend/channel/androidapppackageconfig',
  );
  return result ?? [];
}

/** Legacy targeted edit: the endpoint expects the complete channel detail. */
/**
 * 更新渠道iOSApp包体。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelIosAppPackageApi(data: ChannelPackagePayload) {
  return requestClient.put('/backend/channel/iosapppackageconfig', data);
}

/** Legacy targeted edit: the endpoint expects the complete channel detail. */
/**
 * 更新渠道AndroidApp包体。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelAndroidAppPackageApi(data: ChannelPackagePayload) {
  return requestClient.put('/backend/channel/androidapppackageconfig', data);
}

/**
 * 查询渠道落地页Resources。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchChannelLandingResourcesApi(
  query: ChannelLandingResourceQuery,
) {
  const result = await requestClient.get<ChannelLandingResourceListResult>(
    '/api/resource/list',
    { params: query },
  );
  return withItems(result) as ChannelLandingResourceListResult;
}

/**
 * 查询渠道国家。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
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
/**
 * 查询渠道默认标签场馆配置。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export function fetchDefaultTagVenuesApi() {
  return requestClient.get<DefaultTagVenuesResult>(
    '/backend/channel/defaulttagvenues',
  );
}

/**
 * 查询渠道链接。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export function fetchChannelUrlApi(query: ChannelUrlQuery) {
  return requestClient.get<ChannelUrlConfig>('/backend/channel/channelurl', {
    params: query,
  });
}

/** Legacy endpoint expects the full URL configuration in query parameters. */
/**
 * 编辑渠道完整 URL 配置（query 传参）
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelUrlApi(query: ChannelUrlConfig) {
  return requestClient.put('/backend/channel/editchannelurl', undefined, {
    params: query,
  });
}

/**
 * 查询渠道短链链接。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export function fetchChannelShortUrlApi(query: ChannelUrlQuery) {
  return requestClient.get<ChannelShortUrlConfig>(
    '/backend/channel/showshorturl',
    { params: query },
  );
}

/** Legacy endpoint creates or refreshes the short URL through query params. */
/**
 * 创建或刷新渠道短链接。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelShortUrlApi(query: ChannelUrlQuery) {
  return requestClient.put<ChannelShortUrlConfig>(
    '/backend/channel/putshorturl',
    undefined,
    { params: query },
  );
}

/**
 * 查询可用通道。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchAvailableChannelsApi(query: AvailableChannelQuery) {
  const result = await requestClient.get<AvailableChannelsResult | null>(
    '/backend/channel/availablechannels',
    { params: query },
  );
  return {
    ...result,
    Item: result?.Item ?? result?.Items ?? [],
    ...(result?.Items === null ? { Items: [] } : {}),
  };
}

/**
 * 查询包体站点Options。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export async function fetchPackageSiteOptionsApi(PackageId: ChannelId) {
  const result = await requestClient.get<ChannelSiteOption[] | null>(
    '/backend/package/packagesiteconfig',
    { params: { PackageId } },
  );
  return result ?? [];
}

/**
 * 更新渠道站点配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelSiteConfigApi(data: ChannelSitePayload) {
  return requestClient.post('/backend/channel/channelsiteconfig', data);
}

/**
 * 更新渠道站点类型。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelSiteTypeApi(data: ChannelSiteTypePayload) {
  return requestClient.put('/backend/channel/channelsitetype', data);
}

/**
 * 查询渠道注册Login配置。
 *
 * @param ChannelId 渠道 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export function fetchChannelRegisterLoginConfigApi(ChannelId: ChannelId) {
  return requestClient.get<ChannelRegisterLoginConfig>(
    '/backend/packageregisterloginconfig',
    { params: { ChannelId } },
  );
}

/**
 * 更新渠道注册Login配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelRegisterLoginConfigApi(
  data: ChannelRegisterLoginPayload,
) {
  return requestClient.put('/backend/packageregisterloginconfig', data);
}

/**
 * 查询渠道统计配置。
 *
 * @param ChannelId 渠道 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/createChannel
 */
export function fetchChannelAnalyticsConfigApi(ChannelId: ChannelId) {
  return requestClient.get<ChannelAnalyticsConfig>(
    '/backend/channel/analyticinfo',
    { params: trimSpace({ ChannelId }) },
  );
}

/**
 * 更新渠道统计配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/createChannel
 */
export function updateChannelAnalyticsConfigApi(data: ChannelAnalyticsConfig) {
  return requestClient.put('/backend/channel/analyticinfo', trimSpace(data));
}

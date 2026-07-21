import type {
  AvailableChannelQuery,
  AvailableChannelsResult,
  ChannelDetail,
  ChannelFormPayload,
  ChannelId,
  ChannelListQuery,
  ChannelListResult,
} from '#/types/channel-config';
import type {
  CloneChannelPlanPayload,
  CloneChannelPlanQuery,
  CloneChannelPlanResult,
  LogoGroupListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 代理渠道列表（「创建代理渠道」页主表格；固定 ChannelType=2）。
 *
 * 保留 MoreItems，供编辑落地页时回显旧资源。
 *
 * @param query 查询参数（渠道名、状态、分页等）
 * @returns 渠道 Items、MoreItems（Parents/Resources）及 Pagination
 * @see views/netcash/createMoneyChannel/components/money-channel-panel.vue
 */
export async function fetchMoneyChannelListApi(query: ChannelListQuery) {
  const result = await requestClient.get<ChannelListResult | null>(
    '/backend/channel/list',
    {
      params: trimSpace({ ChannelType: 2, ...query }),
    },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    MoreItems: {
      ...result?.MoreItems,
      Parents: result?.MoreItems?.Parents ?? [],
      Resources: result?.MoreItems?.Resources ?? [],
    },
    Pagination: result?.Pagination ?? { MaxCount: 0 },
  };
}

/**
 * 克隆渠道方案列表（「克隆渠道」面板主表格）。
 *
 * @param query 查询参数（分页等）
 * @returns 克隆方案 Items
 * @see views/netcash/createMoneyChannel/components/clone-channel-panel.vue
 */
export async function fetchCloneChannelPlanListApi(
  query: CloneChannelPlanQuery,
) {
  const result = await requestClient.get<CloneChannelPlanResult | null>(
    '/backend/clonechannelplan/list',
    { params: trimSpace(query) },
  );
  return { ...result, Items: result?.Items ?? [] };
}

/**
 * 新增克隆渠道方案。
 *
 * @param data 方案表单 CloneChannelPlanPayload
 * @returns 接口操作结果
 * @see views/netcash/createMoneyChannel/components/clone-channel-panel.vue
 */
export function addCloneChannelPlanApi(data: CloneChannelPlanPayload) {
  return requestClient.post('/backend/clonechannelplan/add/', data);
}

/**
 * 编辑克隆渠道方案。
 *
 * @param data 方案表单（含 Id）
 * @returns 接口操作结果
 * @see views/netcash/createMoneyChannel/components/clone-channel-panel.vue
 */
export function editCloneChannelPlanApi(data: CloneChannelPlanPayload) {
  return requestClient.put('/backend/clonechannelplan/edit/', data);
}

/**
 * 删除克隆渠道方案。
 *
 * @param Id 方案 Id
 * @returns 接口操作结果
 * @see views/netcash/createMoneyChannel/components/clone-channel-panel.vue
 */
export function deleteCloneChannelPlanApi(Id: ChannelId) {
  return requestClient.delete('/backend/clonechannelplan/delete/', {
    params: { Id },
  });
}

/**
 * 可选源渠道列表（克隆/新建时选择可复制配置的渠道）。
 *
 * @param query 可用渠道查询 AvailableChannelQuery
 * @returns 可用渠道 Item（兼容 Item / Items 字段）
 * @see views/netcash/createMoneyChannel/components/clone-channel-panel.vue
 */
export async function fetchAvailableMoneyChannelsApi(
  query: AvailableChannelQuery,
) {
  const result = await requestClient.get<AvailableChannelsResult | null>(
    '/backend/channel/availablechannels',
    { params: query },
  );
  return {
    ...result,
    Item: result?.Item ?? result?.Items ?? [],
  };
}

/**
 * 代理渠道详情（编辑渠道表单回显）。
 *
 * @param id 渠道 Id
 * @returns 渠道详情 ChannelDetail；空响应时返回 `{}`
 * @see views/netcash/createMoneyChannel/components/money-channel-panel.vue
 */
export async function fetchMoneyChannelDetailApi(id: ChannelId) {
  const result = await requestClient.get<ChannelDetail | null>(
    `/backend/channel/${id}`,
  );
  return result ?? {};
}

/**
 * 新建代理渠道。
 *
 * @param data 渠道表单 ChannelFormPayload
 * @returns 新建后的渠道详情 ChannelDetail
 * @see views/netcash/createMoneyChannel/components/money-channel-panel.vue
 */
export function createMoneyChannelApi(data: ChannelFormPayload) {
  return requestClient.post<ChannelDetail>('/backend/channel/', data);
}

/**
 * 更新代理渠道信息。
 *
 * @param data 渠道表单（含 Id）
 * @returns 更新后的渠道详情 ChannelDetail
 * @see views/netcash/createMoneyChannel/components/money-channel-panel.vue
 */
export function updateMoneyChannelApi(data: ChannelFormPayload) {
  return requestClient.put<ChannelDetail>('/backend/channel/', data);
}

/**
 * 更新渠道预警/风控开关（precautionactive）。
 *
 * @param data 渠道表单（含预警相关字段）
 * @returns 接口操作结果
 * @see views/netcash/createMoneyChannel/components/money-channel-panel.vue
 */
export function updateMoneyChannelPrecautionApi(data: ChannelFormPayload) {
  return requestClient.put('/backend/channel/precautionactive', data);
}

/**
 * 渠道自定义 Logo 分组（渠道外观弹窗数据源）。
 *
 * @param ChannelId 渠道 Id
 * @returns Logo 分组 Items 及 PackageLogo
 * @see views/netcash/createMoneyChannel/components/channel-appearance-modal.vue
 */
export async function fetchChannelLogoGroupsApi(ChannelId: ChannelId) {
  const result = await requestClient.get<LogoGroupListResult | null>(
    '/backend/gameadtemplate/getcustomlogo',
    { params: { ChannelId } },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    PackageLogo: result?.PackageLogo ?? null,
  };
}

import type { CloudListResult } from '#/types/operation-manage';
import type {
  ChannelDataResult,
  ChannelRecoupItem,
  ChannelRecoupListQuery,
  DropChangeListQuery,
  DropChangeResult,
  ExchangeRateItem,
  HandRecordItem,
  HandRecordListQuery,
  HandRecordPayload,
  InvalidUserData,
  LandingPageItem,
  PromoteDataBaseQuery,
} from '#/types/promotion';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 规范化推广数据查询参数中的多选数组字段。
 *
 * 先 trim 全部字段，再将指定字段的数组值转为逗号分隔字符串（空数组转为 `''`）。
 *
 * @param query 原始查询对象
 * @param fields 需要数组转字符串的字段名列表
 * @returns 可直接作为 GET params 的对象
 */
function normalizeArrayQuery(query: Record<string, unknown>, fields: string[]) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  for (const field of fields) {
    const value = params[field];
    if (Array.isArray(value)) {
      params[field] = value.length > 0 ? value.join(',') : '';
    }
  }
  return params;
}

/**
 * 获取渠道推广数据列表
 * @param query 日期、管理员与渠道筛选条件
 * @returns 渠道推广数据汇总
 * @see views/generalizeManage/promoteData/components/channel-data-list.vue
 */
export async function fetchChannelDataListApi(query: PromoteDataBaseQuery) {
  const data = await requestClient.get<ChannelDataResult | null>(
    '/backend/promotedata/channelreport',
    {
      params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
        'AdminIds',
        'ChannelIds',
      ]),
    },
  );
  return {
    Items: Array.isArray(data?.Items) ? data.Items : [],
    ItemsCost: Array.isArray(data?.ItemsCost) ? data.ItemsCost : [],
    ItemsTotal: Array.isArray(data?.ItemsTotal) ? data.ItemsTotal : [],
  } satisfies ChannelDataResult;
}

/**
 * 获取掉量变更记录列表
 * @param query 日期、管理员与渠道筛选条件
 * @returns 掉量变更汇总数据
 * @see views/generalizeManage/promoteData/components/drop-change-list.vue
 */
export async function fetchDropChangeListApi(query: DropChangeListQuery) {
  const data = await requestClient.get<DropChangeResult | null>(
    '/backend/promotedata/getsumrecord',
    {
      params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
        'AdminIds',
        'ChannelIds',
      ]),
    },
  );
  return {
    Item: Array.isArray(data?.Item) ? data.Item : [],
    Page: data?.Page,
  } satisfies DropChangeResult;
}

/**
 * 获取无效用户数据
 * @param query 日期、管理员与渠道筛选条件
 * @returns 无效用户统计明细
 * @see views/generalizeManage/promoteData/components/invalid-user-panel.vue
 */
export async function fetchInvalidUserApi(query: PromoteDataBaseQuery) {
  const data = await requestClient.get<null | { Items?: InvalidUserData }>(
    '/backend/promotedata/invaliduser',
    {
      params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
        'AdminIds',
        'ChannelIds',
      ]),
    },
  );
  return { Items: data?.Items };
}

/**
 * 获取手工录入记录列表
 * @param query 分页与筛选条件
 * @returns 手工录入记录列表及分页信息
 * @see views/generalizeManage/promoteData/components/data-write-list.vue
 */
export async function fetchHandRecordListApi(query: HandRecordListQuery) {
  const data = await requestClient.get<CloudListResult<HandRecordItem> | null>(
    '/backend/handrecord/list',
    {
      params: normalizeArrayQuery(query as unknown as Record<string, unknown>, [
        'AdminIds',
        'ChannelIds',
      ]),
    },
  );
  return {
    Items: Array.isArray(data?.Items) ? data.Items : [],
    Pagination: data?.Pagination,
  } satisfies CloudListResult<HandRecordItem>;
}

/**
 * 获取手工录入记录详情
 * @param id 记录 ID
 * @returns 手工录入记录详细信息
 * @see views/generalizeManage/promoteData/components/data-write-list.vue
 */
export function fetchHandRecordDetailApi(id: number | string) {
  return requestClient.get<HandRecordItem>(`/backend/handrecord/${id}`);
}

/**
 * 新建手工录入记录
 * @param data 录入表单数据
 * @returns 创建结果
 * @see views/generalizeManage/promoteData/components/data-write-list.vue
 */
export function createHandRecordApi(data: HandRecordPayload) {
  return requestClient.post('/backend/handrecord/', data);
}

/**
 * 更新手工录入记录
 * @param data 录入表单数据（含 ID）
 * @returns 更新结果
 * @see views/generalizeManage/promoteData/components/data-write-list.vue
 */
export function updateHandRecordApi(data: HandRecordPayload) {
  return requestClient.put('/backend/handrecord/', data);
}

/**
 * 删除手工录入记录
 * @param id 记录 ID
 * @returns 删除结果
 * @see views/generalizeManage/promoteData/components/data-write-list.vue
 */
export function deleteHandRecordApi(id: number | string) {
  return requestClient.delete(`/backend/handrecord/${id}`);
}

/**
 * 获取全部落地页列表（下拉选项用）
 * @returns 落地页选项数组
 * @see views/generalizeManage/promoteData/components/data-write-list.vue
 */
export async function fetchLandingPageListApi() {
  const data = await requestClient.get<
    CloudListResult<LandingPageItem> | LandingPageItem[] | null
  >('/backend/landingpage/listall');
  if (!data) return [];
  return Array.isArray(data) ? data : data.Items || [];
}

/**
 * 获取渠道回本数据列表
 * @param query 分页与筛选条件
 * @returns 渠道回本记录列表及分页信息
 * @see views/generalizeManage/promoteData/components/channel-recoup-list.vue
 */
export async function fetchChannelRecoupListApi(query: ChannelRecoupListQuery) {
  const data =
    await requestClient.get<CloudListResult<ChannelRecoupItem> | null>(
      '/backend/operation/channelbreakevenreport',
      { params: trimSpace(query) },
    );
  return {
    Items: Array.isArray(data?.Items) ? data.Items : [],
    Pagination: data?.Pagination,
  } satisfies CloudListResult<ChannelRecoupItem>;
}

/**
 * 获取汇率设置列表
 * @returns 汇率配置数组
 * @see views/generalizeManage/promoteData/components/data-write-list.vue
 * @see views/generalizeManage/promoteData/components/channel-recoup-list.vue
 */
export async function fetchExchangeRateListApi() {
  const data = await requestClient.get<
    CloudListResult<ExchangeRateItem> | ExchangeRateItem[] | null
  >('/backend/operation/exchangeratesetting');
  if (!data) return [];
  return Array.isArray(data) ? data : data.Items || [];
}

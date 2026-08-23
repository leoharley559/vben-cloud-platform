import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 广告/场馆返水模块列表响应 */
export interface AdvertisementListResult<T = Record<string, unknown>> {
  [key: string]: unknown;
  Data?: T[];
  Items?: T[];
  Pagination?: { MaxCount?: number };
}

/**
 * 查询广告Programmes。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/advertisementManage
 */
export function fetchAdvertisementProgrammesApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<AdvertisementListResult>(
    '/backend/gameadtemplate/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询广告方案。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/advertisementManage
 */
export function fetchAdvertisementProgrammeApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/gameadtemplate/${id}`,
  );
}

/**
 * 新增广告方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/advertisementManage
 */
export function createAdvertisementProgrammeApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gameadtemplate/', data);
}

/**
 * 更新广告方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/advertisementManage
 */
export function updateAdvertisementProgrammeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gameadtemplate/', data);
}

/**
 * 删除广告方案。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/advertisementManage
 */
export function deleteAdvertisementProgrammeApi(id: number | string) {
  return requestClient.delete(`/backend/gameadtemplate/${id}`);
}

/**
 * 恢复广告方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/advertisementManage
 */
export function recoverAdvertisementProgrammeApi(
  data: Record<string, unknown>,
) {
  return requestClient.post('/backend/gameadtemplate/recover', data);
}

/**
 * 查询广告列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/advertisementManage
 */
export function fetchAdvertisementListApi(query: Record<string, unknown>) {
  return requestClient.get<AdvertisementListResult | Record<string, unknown>[]>(
    '/backend/gameadconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询广告图片。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/advertisementManage
 */
export function fetchAdvertisementImagesApi(query: Record<string, unknown>) {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gameadimage/list',
    { params: trimSpace(query) },
  );
}

/**
 * 登记广告图片。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/advertisementManage
 */
export function registerAdvertisementImageApi(data: Record<string, unknown>) {
  return requestClient.post<Record<string, unknown>>(
    '/backend/gameadimage/',
    data,
  );
}

/**
 * 查询广告公告列表。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/advertisementManage
 */
export function fetchAdvertisementNoticeListApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gameadconfig/getnoticelist',
  );
}

/**
 * 查询广告活动列表。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/advertisementManage
 */
export function fetchAdvertisementActivityListApi() {
  return requestClient.get<Record<string, unknown>[]>(
    '/backend/gameadconfig/getactivitylist',
  );
}

/**
 * 新增广告。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/advertisementManage
 */
export function createAdvertisementApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/gameadconfig/', data);
}

/**
 * 更新广告。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/advertisementManage
 */
export function updateAdvertisementApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gameadconfig/', data);
}

/**
 * 切换广告排序。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/advertisementManage
 */
export function switchAdvertisementSortApi(data: {
  Id1: number | string;
  Id2: number | string;
}) {
  return requestClient.put('/backend/gameadconfig/switchSort', data);
}

/**
 * 删除广告。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/advertisementManage
 */
export function deleteAdvertisementApi(id: number | string) {
  return requestClient.delete(`/backend/gameadconfig/${id}`);
}

/**
 * 切换广告。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/advertisementManage
 */
export function switchAdvertisementApi(data: {
  Id: number | string;
  Status: number;
}) {
  return requestClient.post('/backend/gameadconfig/switch', data);
}

/**
 * 查询场馆返水列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/advertisementManage
 */
export function fetchVenueRebateListApi(query: Record<string, unknown>) {
  return requestClient.get<AdvertisementListResult>(
    '/backend/gamevenuerebate/list',
    { params: trimSpace(query) },
  );
}

/**
 * 新增场馆返水。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/advertisementManage
 */
export function createVenueRebateApi(query: Record<string, unknown>) {
  return requestClient.post('/backend/gamevenuerebate', undefined, {
    params: trimSpace(query),
  });
}

/**
 * 更新场馆返水。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/advertisementManage
 */
export function updateVenueRebateApi(query: Record<string, unknown>) {
  return requestClient.put('/backend/gamevenuerebate', undefined, {
    params: trimSpace(query),
  });
}

/**
 * 删除场馆返水。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/advertisementManage
 */
export function deleteVenueRebateApi(id: number | string) {
  return requestClient.delete(`/backend/gamevenuerebate/${id}`);
}

/**
 * 恢复场馆返水。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/advertisementManage
 */
export function recoverVenueRebateApi(query: Record<string, unknown>) {
  return requestClient.put('/backend/gamevenuerebate/recover', undefined, {
    params: trimSpace(query),
  });
}

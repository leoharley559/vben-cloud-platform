import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 返水记录/审核列表响应（含汇总字段） */
export interface BackWaterListResult<T = Record<string, unknown>> {
  [key: string]: unknown;
  Count?: number;
  Items?: null | T[];
  Pagination?: null | { MaxCount?: number };
  Sum?: number;
  SumBackWater?: number;
  SumValidWater?: number;
  Total?: number;
  UnSum?: number;
}

function withItems<T extends { Items?: null | unknown[] }>(
  result: null | T | undefined,
): T & {
  Items: NonNullable<T['Items']> extends Array<infer U> ? U[] : unknown[];
} {
  return {
    ...(result ?? ({} as T)),
    Items: (result?.Items ?? []) as never,
  };
}

function asSchemeList(
  result: Array<Record<string, unknown>> | null | Record<string, unknown>,
): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray((result as { Items?: unknown }).Items)) {
    return (result as { Items: Array<Record<string, unknown>> }).Items;
  }
  return [];
}

/**
 * 查询返水方案。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/backWater
 */
export async function fetchBackWaterSchemesApi() {
  const result = await requestClient.get<
    Array<Record<string, unknown>> | null | Record<string, unknown>
  >('/backend/playerbackwaterscheme/allscheme');
  return asSchemeList(result);
}

/**
 * 查询返水方案。
 *
 * @param Id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/backWater
 */
export function fetchBackWaterSchemeApi(Id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playerbackwaterscheme/scheme',
    { params: { Id } },
  );
}

/**
 * 更新返水方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/backWater
 */
export function updateBackWaterSchemeApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerbackwaterscheme/', data);
}

/**
 * 更新返水方案配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/backWater
 */
export function updateBackWaterSchemeConfigApi(data: {
  Config: string;
  Id: number | string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/config', data);
}

/**
 * 保存返水方案规则文案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/backWater
 */
export function updateBackWaterSchemeRuleApi(data: {
  Id: number | string;
  LangText: string;
  Rule: string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/rule', data);
}

/**
 * 重命名返水方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/backWater
 */
export function updateBackWaterSchemeNameApi(data: {
  Id: number | string;
  Name: string;
}) {
  return requestClient.put('/backend/playerbackwaterscheme/name', data);
}

/**
 * 新增返水方案。
 *
 * @param LangGroupId 语言组 ID
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/backWater
 */
export function createBackWaterSchemeApi(LangGroupId: number | string) {
  return requestClient.post('/backend/playerbackwaterscheme/', { LangGroupId });
}

/**
 * 删除返水方案。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/backWater
 */
export function deleteBackWaterSchemeApi(id: number | string) {
  return requestClient.get(`/backend/playerbackwaterscheme/${id}`);
}

/**
 * 查询返水记录。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/backWater
 */
export async function fetchBackWaterRecordApi(query: Record<string, unknown>) {
  const result = await requestClient.get<BackWaterListResult>(
    '/backend/playerbackwaterrecord/list',
    { params: trimSpace(query) },
  );
  return withItems(result);
}

/**
 * 查询返水记录明细。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/backWater
 */
export async function fetchBackWaterRecordDetailApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<BackWaterListResult>(
    '/backend/playerbackwaterrecord/detaillist',
    { params: trimSpace(query) },
  );
  return withItems(result);
}

/**
 * 查询返水订单Details。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/backWater
 */
export async function fetchBackWaterOrderDetailsApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<Array<Record<string, unknown>> | null>(
    '/backend/playerbackwaterrecord/detail',
    {
      params: trimSpace(query),
    },
  );
  return result ?? [];
}

/**
 * 导出返水记录。
 *
 * @param type 类型（如 summary/detail、deposit/register）
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/backWater
 */
export function exportBackWaterRecordApi(
  type: 'detail' | 'summary',
  query: Record<string, unknown>,
) {
  const path =
    type === 'summary'
      ? '/backend/playerbackwaterrecord/listcsv'
      : '/backend/playerbackwaterrecord/detaillistcsv';
  return requestClient.get<Record<string, unknown>>(path, {
    params: trimSpace(query),
  });
}

/**
 * 查询返水审核。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/backWater
 */
export async function fetchBackWaterReviewApi(query: Record<string, unknown>) {
  const result = await requestClient.get<BackWaterListResult>(
    '/backend/playerbackwaterrecord/reviewlist',
    { params: trimSpace(query) },
  );
  return withItems(result);
}

/**
 * 审核玩家返水记录。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/backWater
 */
export function reviewBackWaterApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playerbackwaterrecord/review', data);
}

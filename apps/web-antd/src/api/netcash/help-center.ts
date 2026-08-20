import type {
  HelpCenterItem,
  HelpCenterLangTextItem,
  HelpCenterListQuery,
  NetcashListResult,
  NetcashMutationResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 帮助中心条目列表（「帮助中心」页主表格）。
 *
 * @param query 查询参数（标题、语言组、分页等）
 * @returns 帮助条目 Items；空响应时返回 `{ Items: [] }`
 * @see views/netcash/helpCenter/index.vue
 */
export function fetchHelpCenterListApi(query: HelpCenterListQuery) {
  return requestClient
    .get<NetcashListResult<HelpCenterItem> | null>('/backend/helpcenter/list', {
      params: trimSpace(query),
    })
    .then((result) => result ?? { Items: [] });
}

/**
 * 解析帮助中心多语言文案 LangText。
 *
 * 支持 JSON 字符串、数组，或 `{ [langGroupId]: item }` 对象；解析失败返回空数组。
 *
 * @param value 接口返回的 LangText（字符串、数组或对象）
 * @returns 多语言条目数组，对象形式时会补全 LangGroupId
 */
function parseLangText(
  value: HelpCenterItem['LangText'],
): HelpCenterLangTextItem[] {
  if (!value || value === 'null') return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed as HelpCenterLangTextItem[];
    return Object.entries(parsed || {}).map(([langGroupId, item]) => ({
      ...(item as HelpCenterLangTextItem),
      LangGroupId: (item as HelpCenterLangTextItem).LangGroupId ?? langGroupId,
    }));
  } catch {
    return [];
  }
}

/**
 * 部分环境返回对象形式 LangText，但写接口只接受 JSON 数组字符串。
 * 保留其他语言内容，并把当前语言组正在编辑的标签和正文合并进去。
 */
function serializeHelpCenterPayload(data: HelpCenterItem): HelpCenterItem {
  const payload = trimSpace({ ...data });
  if (
    data.LangText === undefined &&
    (data.LangGroupId === undefined || data.LangGroupId === null)
  ) {
    return payload;
  }

  const langText = parseLangText(data.LangText);
  const current: HelpCenterLangTextItem = {
    Content: String(data.Content || ''),
    LangGroupId: data.LangGroupId,
    Tag: String(data.Tag || '').trim(),
  };
  const index = langText.findIndex(
    (item) => String(item.LangGroupId) === String(data.LangGroupId),
  );
  if (index === -1) langText.push(current);
  else langText[index] = { ...langText[index], ...current };
  payload.LangText = JSON.stringify(langText);
  return payload;
}

/**
 * 新增帮助中心条目。
 *
 * @param data 帮助条目（含多语言 LangText，提交前自动序列化）
 * @returns 接口变更结果
 * @see views/netcash/helpCenter/index.vue
 */
export function createHelpCenterApi(data: HelpCenterItem) {
  return requestClient.post<NetcashMutationResult>(
    '/backend/helpcenter',
    serializeHelpCenterPayload(data),
  );
}

/**
 * 更新帮助中心条目。
 *
 * @param data 帮助条目（含 Id 及待更新字段）
 * @returns 接口变更结果
 * @see views/netcash/helpCenter/index.vue
 */
export function updateHelpCenterApi(data: HelpCenterItem) {
  return requestClient.put<NetcashMutationResult>(
    '/backend/helpcenter',
    serializeHelpCenterPayload(data),
  );
}

/**
 * 删除帮助中心条目。
 *
 * @param id 条目 Id
 * @returns 接口变更结果
 * @see views/netcash/helpCenter/index.vue
 */
export function deleteHelpCenterApi(id: number | string) {
  return requestClient.delete<NetcashMutationResult>(
    `/backend/helpcenter/${id}`,
  );
}

/**
 * 调整帮助中心条目排序（交换两条记录的顺序）。
 *
 * @param data Id1、Id2 待交换的两条记录 Id
 * @returns 接口变更结果
 * @see views/netcash/helpCenter/index.vue
 */
export function sortHelpCenterApi(data: {
  Id1?: number | string;
  Id2?: number | string;
}) {
  return requestClient.put<NetcashMutationResult>(
    '/backend/helpcenter/switchSort',
    {},
    {
      params: data,
    },
  );
}

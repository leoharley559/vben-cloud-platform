import type {
  HelpCenterItem,
  HelpCenterLangTextItem,
  HelpCenterListQuery,
  NetcashListResult,
  NetcashMutationResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export function fetchHelpCenterListApi(query: HelpCenterListQuery) {
  return requestClient
    .get<NetcashListResult<HelpCenterItem> | null>('/backend/helpcenter/list', {
      params: trimSpace(query),
    })
    .then((result) => result ?? { Items: [] });
}

function parseLangText(
  value: HelpCenterItem['LangText'],
): HelpCenterLangTextItem[] {
  if (!value || value === 'null') return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed as HelpCenterLangTextItem[];
    return Object.entries(parsed || {}).map(([langGroupId, item]) => ({
      ...(item as HelpCenterLangTextItem),
      LangGroupId:
        (item as HelpCenterLangTextItem).LangGroupId ?? langGroupId,
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

export function createHelpCenterApi(data: HelpCenterItem) {
  return requestClient.post<NetcashMutationResult>(
    '/backend/helpcenter',
    serializeHelpCenterPayload(data),
  );
}

export function updateHelpCenterApi(data: HelpCenterItem) {
  return requestClient.put<NetcashMutationResult>(
    '/backend/helpcenter',
    serializeHelpCenterPayload(data),
  );
}

export function deleteHelpCenterApi(id: number | string) {
  return requestClient.delete<NetcashMutationResult>(
    `/backend/helpcenter/${id}`,
  );
}

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

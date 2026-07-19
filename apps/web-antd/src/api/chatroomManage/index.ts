import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';
import { registerPermissionKeys } from '#/utils/permission';

registerPermissionKeys({
  chatroomBlockRecords: [11663, 11664],
  chatroomChatRecord: [11836],
  chatroomConfigShow: [11612, 11616],
  chatroomGiftConfig: [12454],
  chatroomInterceptRecord: [11687, 11688],
  chatroomMgrShow: [11693],
  chatroomPhraseSetting: [11631],
  chatroomSensitivePhrase: [11620, 11621],
  chatroomStickerSetting: [13018],
  chatroomWelcomeSetting: [13019],
});

function toListResult(data: CloudListResult<Record<string, unknown>>) {
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

export function fetchChatroomListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroommanage/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchChatroomSystemListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroommanage/listsystem',
      { params: query },
    )
    .then(toListResult);
}

export function fetchMuteRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroommute/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchInterceptRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroomintercept/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchChatRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroomchatrecord/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchSensitiveWordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroomfilterword/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchPhraseListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroomphrases/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchChatroomGiftListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>> | Record<string, unknown>[]>(
      '/backend/chatroomgiftconfig/list',
      { params: query },
    )
    .then((data) => {
      const items = Array.isArray(data)
        ? data
        : ((data as CloudListResult<Record<string, unknown>>).Items ?? []);
      return {
        Items: items as Record<string, unknown>[],
        Pagination: { MaxCount: items.length },
      };
    });
}

export function fetchWelcomePlanListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>> | Record<string, unknown>[]>(
      '/backend/chatroomwelcome/plans',
      { params: query },
    )
    .then((data) => {
      const items = Array.isArray(data)
        ? data
        : ((data as CloudListResult<Record<string, unknown>>).Items ?? []);
      return {
        Items: items as Record<string, unknown>[],
        Pagination: { MaxCount: items.length },
      };
    });
}

export function fetchStickerTabListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>> | Record<string, unknown>[]>(
      '/backend/chatroomstickers/tags',
      { params: query },
    )
    .then((data) => {
      const items = Array.isArray(data)
        ? data
        : ((data as CloudListResult<Record<string, unknown>>).Items ?? []);
      return {
        Items: items as Record<string, unknown>[],
        Pagination: { MaxCount: items.length },
      };
    });
}

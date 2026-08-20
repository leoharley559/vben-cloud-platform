import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { registerPermissionKeys } from '#/utils/permission';
import { trimSpace } from '#/utils/string';

registerPermissionKeys({
  chatroomBlockRecords: [11_663, 11_664],
  chatroomChatRecord: [11_836],
  chatroomConfigShow: [11_612, 11_616],
  chatroomGiftConfig: [12_454],
  chatroomInterceptRecord: [11_687, 11_688],
  chatroomMgrShow: [11_693],
  chatroomPhraseSetting: [11_631],
  chatroomSensitivePhrase: [11_620, 11_621],
  chatroomStickerSetting: [13_018],
  chatroomWelcomeSetting: [13_019],
});

/**
 * 将云后台列表响应归一化为 Items + Pagination 结构
 * @param data 云后台原始列表响应
 * @returns 含 Items 数组与 Pagination.MaxCount 的标准列表结果
 */
function toListResult(data: CloudListResult<Record<string, unknown>>) {
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

/**
 * 聊天室列表（业务房）
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/chatroomManage/chatroomList
 * @see views/chatroomManage/chatroomManage
 */
export function fetchChatroomListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroommanage/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 系统聊天室列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/chatroomManage/chatroomManage
 */
export function fetchChatroomSystemListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroommanage/listsystem',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 禁言/拉黑记录列表
 *
 * @param query 筛选/分页参数（会 trim 空格）
 * @returns Items + Pagination
 * @see views/chatroomManage/blockRecords
 */
export function fetchMuteRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroommute/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 拦截记录列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/chatroomManage/interceptRecord
 */
export function fetchInterceptRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroomintercept/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 聊天记录列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/chatroomManage/chatRecord
 */
export function fetchChatRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroomchatrecord/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 敏感词列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/chatroomManage/sensitivePhrase
 */
export function fetchSensitiveWordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroomfilterword/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 常用语/话术列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/chatroomManage/phrases
 */
export function fetchPhraseListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/chatroomphrases/list',
      { params: query },
    )
    .then(toListResult);
}

/**
 * 聊天室礼物配置列表
 *
 * @param query 筛选参数（可选）
 * @returns Items + Pagination（兼容数组或列表结构）
 * @see views/chatroomManage/giftSetting
 */
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

/**
 * 欢迎语方案列表
 *
 * @param query 筛选参数（可选）
 * @returns Items + Pagination（兼容数组或列表结构）
 * @see views/chatroomManage/chatroomWelcome
 */
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

/**
 * 表情包 Tab/标签列表
 *
 * @param query 筛选参数（可选）
 * @returns Items + Pagination（兼容数组或列表结构）
 * @see views/chatroomManage/stickerSetting
 */
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

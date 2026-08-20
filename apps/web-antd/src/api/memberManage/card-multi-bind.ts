import type {
  CardMultiBindFormPayload,
  CardMultiBindListItem,
  CardMultiBindListQuery,
} from '#/types/card-multi-bind';
import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 多卡绑定配置列表（钱包管理 · 多卡绑定 Tab）。
 *
 * @param query 查询参数（玩家、配置状态等筛选及分页）
 * @returns 多卡绑定配置行 Items 及 Pagination
 * @see views/memberManage/walletManage/components/card-multi-bind-list.vue
 */
export async function fetchCardMultiBindListApi(query: CardMultiBindListQuery) {
  const result = await requestClient.get<
    CloudListResult<CardMultiBindListItem>
  >('/backend/playerbindcardconfig/listcardmultiple', {
    params: trimSpace({ ...query }),
  });
  return normalizeList(result);
}

/**
 * 新增多卡绑定配置（钱包管理 · 多卡绑定新增弹窗）。
 *
 * @param data 多卡绑定表单（玩家、允许绑卡数量等）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/card-multi-bind-form-modal.vue
 */
export function createCardMultiBindApi(data: CardMultiBindFormPayload) {
  return requestClient.post(
    '/backend/playerbindcardconfig/addcardmultiple',
    trimSpace(data),
  );
}

/**
 * 删除多卡绑定配置（钱包管理 · 多卡绑定列表删除操作）。
 *
 * @param id 多卡绑定配置 Id
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/card-multi-bind-list.vue
 */
export function deleteCardMultiBindApi(id: number | string) {
  return requestClient.delete(
    `/backend/playerbindcardconfig/delcardmultiple/${id}`,
  );
}

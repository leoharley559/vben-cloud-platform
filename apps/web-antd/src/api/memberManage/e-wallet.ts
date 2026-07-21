import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  EWalletFormPayload,
  EWalletListItem,
  EWalletListQuery,
} from '#/types/e-wallet';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 电子钱包账号列表（钱包管理 · 电子钱包 Tab）。
 *
 * @param query 查询参数（玩家、钱包类型、状态等筛选及分页）
 * @returns 电子钱包行 Items 及 Pagination
 * @see views/memberManage/walletManage/components/e-wallet-list.vue
 */
export async function fetchEWalletListApi(query: EWalletListQuery) {
  const result = await requestClient.get<CloudListResult<EWalletListItem>>(
    '/backend/playerwalletaccount/listall',
    { params: trimSpace({ ...query }) },
  );
  return normalizeList(result);
}

/**
 * 新增电子钱包账号（钱包管理 · 电子钱包新增弹窗）。
 *
 * @param data 电子钱包表单（玩家、钱包类型、账号等）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/e-wallet-form-modal.vue
 */
export function createEWalletApi(data: EWalletFormPayload) {
  return requestClient.post(
    '/backend/playerwalletaccount/add',
    trimSpace(data),
  );
}

/**
 * 编辑电子钱包账号（钱包管理 · 电子钱包编辑弹窗）。
 *
 * @param data 电子钱包表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/e-wallet-form-modal.vue
 */
export function updateEWalletApi(data: EWalletFormPayload) {
  return requestClient.put(
    '/backend/playerwalletaccount/edit',
    trimSpace(data),
  );
}

/**
 * 删除电子钱包账号（钱包管理 · 电子钱包列表删除操作）。
 *
 * @param id 电子钱包记录 Id
 * @param params 可选删除参数（IsBlack 是否拉黑、ValidCode 验证码）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/e-wallet-list.vue
 */
export function deleteEWalletApi(
  id: number | string,
  params?: { IsBlack?: boolean; ValidCode?: string },
) {
  return requestClient.delete(`/backend/playerwalletaccount/del/${id}`, {
    params: {
      IsBlack: params?.IsBlack ?? false,
      ...(params?.ValidCode ? { ValidCode: params.ValidCode } : {}),
    },
  });
}

/**
 * 按玩家拉取电子钱包账号（玩家详情 · 支付账号列表，GCash/Grab/PayMaya 等）。
 *
 * @param playerId 玩家 Id
 * @returns 该玩家绑定的电子钱包账号列表
 * @see views/operationalManage/playerDetails/components/player-pay-acct-list.vue
 */
export function fetchPlayerPayAcctListApi(playerId: number | string) {
  return requestClient.get<
    EWalletListItem[] | CloudListResult<EWalletListItem>
  >(`/backend/playerwalletaccount/list/${playerId}`);
}

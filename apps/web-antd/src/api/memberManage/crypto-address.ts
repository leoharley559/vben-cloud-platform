import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  CryptoAddressFormPayload,
  CryptoAddressListItem,
  CryptoAddressListQuery,
} from '#/types/crypto-address';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 虚拟币提现地址列表（钱包管理 · 虚拟币地址 Tab）。
 *
 * @param query 查询参数（玩家、币种、地址等筛选及分页）
 * @returns 虚拟币地址行 Items 及 Pagination
 * @see views/memberManage/walletManage/components/crypto-address-list.vue
 */
export async function fetchCryptoAddressListApi(query: CryptoAddressListQuery) {
  const result = await requestClient.get<
    CloudListResult<CryptoAddressListItem>
  >('/backend/playerwithdrawdigitaladdress/list', {
    params: trimSpace({ ...query }),
  });
  return normalizeList(result);
}

/**
 * 新增虚拟币提现地址（钱包管理 · 虚拟币地址新增弹窗）。
 *
 * @param data 虚拟币地址表单（玩家、链类型、地址等）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/crypto-address-form-modal.vue
 */
export function createCryptoAddressApi(data: CryptoAddressFormPayload) {
  return requestClient.post(
    '/backend/playerwithdrawdigitaladdress',
    trimSpace(data),
  );
}

/**
 * 编辑虚拟币提现地址（钱包管理 · 虚拟币地址编辑弹窗）。
 *
 * @param data 虚拟币地址表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/crypto-address-form-modal.vue
 */
export function updateCryptoAddressApi(data: CryptoAddressFormPayload) {
  return requestClient.put(
    '/backend/playerwithdrawdigitaladdress',
    trimSpace(data),
  );
}

/**
 * 删除虚拟币提现地址（钱包管理 / 玩家详情 · 虚拟币地址列表删除操作）。
 *
 * @param id 虚拟币地址记录 Id
 * @param params 可选删除参数（IsBlack 拉黑、ValidCode 验证码）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/crypto-address-list.vue
 * @see views/operationalManage/playerDetails/components/player-virtual-address-list.vue
 */
export function deleteCryptoAddressApi(
  id: number | string,
  params?: { IsBlack?: boolean | number; ValidCode?: string },
) {
  return requestClient.delete(`/backend/playerwithdrawdigitaladdress/${id}`, {
    params,
  });
}

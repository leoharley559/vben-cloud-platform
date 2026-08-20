import type {
  BankCardFormPayload,
  BankCardListItem,
  BankCardListQuery,
  ResolvePlayerByAccountPayload,
} from '#/types/bank-card';
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
 * 银行卡列表（钱包管理 · 银行卡 Tab）。
 *
 * @param query 查询参数（玩家、卡号、状态等筛选及分页）
 * @returns 银行卡行 Items 及 Pagination
 * @see views/memberManage/walletManage/components/card-manage-list.vue
 */
export async function fetchBankCardListApi(query: BankCardListQuery) {
  const result = await requestClient.get<CloudListResult<BankCardListItem>>(
    '/backend/playerbankcard/list',
    {
      params: trimSpace({ ...query }),
    },
  );
  return normalizeList(result);
}

/**
 * 新增银行卡（钱包管理 · 银行卡新增弹窗）。
 *
 * @param data 银行卡表单（玩家、银行、卡号等）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/card-form-modal.vue
 */
export function createBankCardApi(data: BankCardFormPayload) {
  return requestClient.post('/backend/playerbankcard', trimSpace({ ...data }));
}

/**
 * 编辑银行卡（钱包管理 · 银行卡编辑弹窗）。
 *
 * @param data 银行卡表单（含 Id 及待更新字段）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/card-form-modal.vue
 */
export function updateBankCardApi(data: BankCardFormPayload) {
  return requestClient.put('/backend/playerbankcard', trimSpace({ ...data }));
}

/**
 * 删除银行卡（钱包管理 / 玩家详情 · 银行卡或支付宝列表删除操作）。
 *
 * @param id 银行卡记录 Id
 * @param params 可选删除参数（IsBlack 拉黑、OperationType 操作类型、ValidCode 验证码）
 * @returns 接口操作结果
 * @see views/memberManage/walletManage/components/card-manage-list.vue
 * @see views/operationalManage/playerDetails/components/player-bank-card-list.vue
 * @see views/operationalManage/playerDetails/components/player-alipay-list.vue
 */
export function deleteBankCardApi(
  id: number | string,
  params?: {
    IsBlack?: boolean | number;
    OperationType?: number;
    ValidCode?: string;
  },
) {
  return requestClient.delete(`/backend/playerbankcard/${id}`, {
    params,
  });
}

/**
 * 按账号批量解析玩家 Id（钱包管理 · 银行卡批量导入前校验账号）。
 *
 * @param data 账号解析请求（账号列表等）
 * @returns 匹配到的玩家 Id 列表
 * @see views/memberManage/walletManage/components/card-form-modal.vue
 */
export function resolvePlayerByAccountApi(data: ResolvePlayerByAccountPayload) {
  return requestClient.post<CloudListResult<{ PlayerId?: number | string }>>(
    '/backend/playerinfo/queryplayerexcel',
    trimSpace({ ...data }),
  );
}

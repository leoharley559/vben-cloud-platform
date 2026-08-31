import type {
  BankCardFormPayload,
  BankCardListQuery,
  BankCardListResult,
  DeletePlayerPayResourceParams,
  ResolvePlayerByAccountPayload,
} from '#/types/bank-card';
import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { normalizeBankCardListQuery } from '#/utils/bank-card';
import { trimSpace } from '#/utils/string';

/**
 * 银行卡列表（钱包管理 · 银行卡 Tab / 玩家详情银行卡·支付宝·微信）。
 *
 * @param query 查询参数（玩家、卡号、状态等筛选及分页）
 * @returns Items（银行卡）及 AlipayAccounts / WechatAccounts
 * @see views/memberManage/walletManage/components/card-manage-list.vue
 * @see views/operationalManage/playerDetails/components/player-bank-card-list.vue
 * @see views/operationalManage/playerDetails/components/player-alipay-list.vue
 * @see views/operationalManage/playerDetails/components/player-wechat-list.vue
 */
export async function fetchBankCardListApi(query: BankCardListQuery) {
  const result = await requestClient.get<BankCardListResult>(
    '/backend/playerbankcard/list',
    {
      params: normalizeBankCardListQuery(query),
    },
  );
  return {
    AlipayAccounts: result?.AlipayAccounts || [],
    Items: result?.Items || [],
    Pagination: result?.Pagination,
    WechatAccounts: result?.WechatAccounts || [],
  };
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
 * 删除玩家银行卡或提款账号（支付宝 / 微信等）。
 *
 * @param params ResourceType、Id 及可选 IsBlack、ValidCode、AccountType
 * @returns 接口操作结果
 */
export function deleteBankCardApi(params: DeletePlayerPayResourceParams) {
  const { Id, ...rest } = params;
  return requestClient.delete(`/backend/playerbankcard/${Id}`, {
    params: trimSpace({ ...rest, Id }),
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

import type {
  FundFlowListItem,
  FundFlowListQuery,
  FundFlowSummary,
} from '#/types/fund-flow';
import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 归一化资金流水查询参数，适配后端接口约定
 * @param query 前端资金流水筛选/分页参数
 * @returns trim 后的请求参数（Reason 数组转为逗号分隔字符串）
 */
function normalizeFundFlowQuery(query: FundFlowListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const reason = params.Reason;
  if (Array.isArray(reason)) {
    params.Reason = reason.length > 0 ? reason.join(',') : '';
  }
  return params;
}

/**
 * 资金流水列表（会员管理 · 资金流水页主表格及汇总）。
 *
 * @param query 查询参数（玩家、时间、变动原因等筛选及分页）
 * @returns 资金流水 Items、Pagination 及 MoreItems 汇总
 * @see views/memberManage/fundFlowManage/index.vue
 */
export async function fetchFundFlowListApi(query: FundFlowListQuery) {
  const result = await requestClient.get<
    CloudListResult<FundFlowListItem> & { MoreItems?: FundFlowSummary }
  >('/backend/operation/gamedetail', {
    params: normalizeFundFlowQuery(query),
  });
  return {
    Items: result?.Items || [],
    MoreItems: result?.MoreItems,
    Pagination: result?.Pagination,
  };
}

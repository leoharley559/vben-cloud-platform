import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  FundFlowListItem,
  FundFlowListQuery,
  FundFlowSummary,
} from '#/types/fund-flow';
import { trimSpace } from '#/utils/string';

function normalizeFundFlowQuery(query: FundFlowListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const reason = params.Reason;
  if (Array.isArray(reason)) {
    params.Reason = reason.length ? reason.join(',') : '';
  }
  return params;
}

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

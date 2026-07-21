import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operational-data';
import { trimSpace } from '#/utils/string';

/**
 * LTV 报表列表（LTV 独立页）
 *
 * 接口可能返回数组或 CloudListResult；统一归一化为 Items + Pagination。
 * 与留存数据 LTV 面板（keep-data）读 ItemsOld 的约定不同，本页直接消费 Items。
 *
 * @param query 日期区间、渠道等筛选参数
 * @returns CloudListResult：Items + Pagination.MaxCount
 * @see views/dataClose/ltv/index.vue
 */
export function fetchLtvListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>> | Record<string, unknown>[]>(
      '/backend/operation/realtimeltv',
      { params: trimSpace(query) },
    )
    .then((data) => {
      const items = Array.isArray(data)
        ? data
        : ((data as CloudListResult<Record<string, unknown>>).Items ?? []);
      return {
        Items: items as Record<string, unknown>[],
        Pagination: {
          MaxCount:
            (data as CloudListResult<Record<string, unknown>>).Pagination
              ?.MaxCount ?? items.length,
        },
      } satisfies CloudListResult<Record<string, unknown>>;
    });
}

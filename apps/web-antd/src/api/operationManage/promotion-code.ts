import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { PROMO_CODE_TYPE } from '#/utils/activity-manage';
import { trimSpace } from '#/utils/string';

/**
 * 分页查询优惠码领取/使用记录。
 *
 * @param query 活动、账号、时间等筛选及分页参数
 * @returns 优惠码记录 Items 与 Pagination
 * @see views/operationalManage/activity/components/activity-promo-code-record-panel.vue
 */
export function fetchPromoGiftRecordApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/giftcoderecord',
    { params: query },
  );
}

/**
 * 分页查询优惠码活动统计报表。
 *
 * @param query 活动、时间等筛选及分页参数
 * @returns 优惠码报表 Items 与 Pagination
 */
export function fetchPromoGiftReportApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/giftcodereport',
    { params: query },
  );
}

/**
 * 分页查询进行中的优惠码活动列表（Type=10017）。
 *
 * @param query 筛选条件及分页参数
 * @returns 优惠码活动 Items 与 Pagination
 * @see views/operationalManage/activity/components/activity-promo-code-active-panel.vue
 */
export function fetchPromoCodeActivityListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/list',
    {
      params: trimSpace({
        ...query,
        Type: PROMO_CODE_TYPE,
      }),
    },
  );
}

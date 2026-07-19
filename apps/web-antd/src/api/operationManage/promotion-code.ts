import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

import { PROMO_CODE_TYPE } from '#/utils/activity-manage';

export function fetchPromoGiftRecordApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/giftcoderecord',
    { params: query },
  );
}

export function fetchPromoGiftReportApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/giftcodereport',
    { params: query },
  );
}

/** 优惠码活动列表（Type=10017） */
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

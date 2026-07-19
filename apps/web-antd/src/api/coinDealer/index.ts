import { requestClient } from '#/api/request';
import { toCoinDealerListResult } from '#/types/coin-dealer';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchCoinDealerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/coindealer/list', {
      params: trimSpace(query),
    })
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerSellListApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        Total?: Record<string, unknown>;
      }
    >('/backend/coindealersell/list', { params: trimSpace(query) })
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerPaybackListApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        Total?: Record<string, unknown>;
      }
    >('/backend/coindealerpayback/list', { params: trimSpace(query) })
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerServiceRecordListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporterrecord/list',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerReturnListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporterrecord/recvlist',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerMissedListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporterrecord/missedrecordlist',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerStatisticsListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/dealersupporterstatistics/supporter',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerSellPlayerListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersellplayer/list',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerCustomerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/coindealer/list', {
      params: query,
    })
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerEasyReplyGroupListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupportereasyreplygroup/list',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerAnnouncementListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporterannouncement/list',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerWelcomeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporterwelcome/list',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

export function fetchCoinDealerWorkTimeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealerworktime/list',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

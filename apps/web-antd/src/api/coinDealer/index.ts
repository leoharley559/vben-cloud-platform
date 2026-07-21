import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { toCoinDealerListResult } from '#/types/coin-dealer';
import { trimSpace } from '#/utils/string';

/**
 * 币商账号列表
 *
 * @param query 筛选/分页参数（会 trim 空格）
 * @returns 归一化后的币商列表（Items + Pagination 等）
 * @see views/coinDealer/account
 * @see views/coinDealer/dealerClose
 * @see views/coinDealer/sellReturn
 */
export function fetchCoinDealerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/coindealer/list', {
      params: trimSpace(query),
    })
    .then(toCoinDealerListResult);
}

/**
 * 币商售币记录列表
 *
 * @param query 筛选/分页参数
 * @returns 列表 + 可选 Total 汇总
 * @see views/coinDealer/sellRecord
 * @see views/coinDealer/dealerClose
 */
export function fetchCoinDealerSellListApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        Total?: Record<string, unknown>;
      }
    >('/backend/coindealersell/list', { params: trimSpace(query) })
    .then(toCoinDealerListResult);
}

/**
 * 币商回款/退回记录列表
 *
 * @param query 筛选/分页参数
 * @returns 列表 + 可选 Total 汇总
 * @see views/coinDealer/returnRecord
 * @see views/coinDealer/dealerClose
 */
export function fetchCoinDealerPaybackListApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        Total?: Record<string, unknown>;
      }
    >('/backend/coindealerpayback/list', { params: trimSpace(query) })
    .then(toCoinDealerListResult);
}

/**
 * 币商客服服务记录列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/coinDealer/servicerecord
 */
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

/**
 * 币商客服接回/回收记录列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 */
export function fetchCoinDealerReturnListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporterrecord/recvlist',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

/**
 * 币商客服漏接记录列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 */
export function fetchCoinDealerMissedListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporterrecord/missedrecordlist',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

/**
 * 币商客服统计列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/coinDealer/statistics
 */
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

/**
 * 币商售币玩家列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/coinDealer/sellCoin
 */
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

/**
 * 币商客户列表（与账号列表同接口，查询参数不做 trim）
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/coinDealer/customeManage
 */
export function fetchCoinDealerCustomerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/coindealer/list', {
      params: query,
    })
    .then(toCoinDealerListResult);
}

/**
 * 币商客服快捷回复分组列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/coinDealer/customeSetting
 */
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

/**
 * 币商客服公告列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/coinDealer/customeSetting
 */
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

/**
 * 币商客服欢迎语列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/coinDealer/customeSetting
 */
export function fetchCoinDealerWelcomeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealersupporterwelcome/list',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

/**
 * 币商工作时间配置列表
 *
 * @param query 筛选/分页参数
 * @returns Items + Pagination
 * @see views/coinDealer/account
 */
export function fetchCoinDealerWorkTimeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/coindealerworktime/list',
      { params: trimSpace(query) },
    )
    .then(toCoinDealerListResult);
}

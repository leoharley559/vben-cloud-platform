import { requestClient } from '#/api/request';
import { toListResult, wrapMatrixAsList } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

type Query = Record<string, unknown>;

function listGet(url: string, query: Query) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[] | null;
      ItemsOld?: Record<string, unknown>[] | null;
      Pagination?: { MaxCount?: number } | null;
    }>(url, { params: trimSpace(query) })
    .then(toListResult);
}

function detailGet(url: string, query: Query) {
  return requestClient.get<{
    Items?: Record<string, unknown>[] | null;
    Pagination?: { MaxCount?: number } | null;
  }>(url, { params: trimSpace(query) });
}

/** 留存 firstpayrealtimedau */
export function fetchKeepDataExtantListApi(query: Query) {
  return listGet('/backend/operation/firstpayrealtimedau', query);
}

/** 登录留存 realtimedau（读 ItemsOld） */
export async function fetchKeepDataLoginRetentionListApi(query: Query) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[] | null;
    ItemsOld?: Record<string, unknown>[] | null;
    Pagination?: { MaxCount?: number } | null;
  }>('/backend/operation/realtimedau', { params: trimSpace(query) });
  return toListResult({
    ...data,
    Items: Array.isArray(data?.ItemsOld) ? data.ItemsOld : [],
    ItemsOld: Array.isArray(data?.ItemsOld) ? data.ItemsOld : [],
  });
}

/** 区间留存 everydaylogindau（单对象包装成一行） */
export async function fetchKeepDataSectionRetentionListApi(query: Query) {
  const data = await requestClient.get<Record<string, unknown>>(
    '/backend/operation/everydaylogindau',
    { params: trimSpace(query) },
  );
  return wrapMatrixAsList(data);
}

/** LTV realtimeltv（读 ItemsOld） */
export async function fetchKeepDataLtvListApi(query: Query) {
  const data = await requestClient.get<{
    Items?: Record<string, unknown>[] | null;
    ItemsOld?: Record<string, unknown>[] | null;
  }>('/backend/operation/realtimeltv', { params: trimSpace(query) });
  return toListResult({
    ...data,
    Items: Array.isArray(data?.ItemsOld) ? data.ItemsOld : [],
    ItemsOld: Array.isArray(data?.ItemsOld) ? data.ItemsOld : [],
  });
}

/** 一次性用户 */
export function fetchKeepDataOneTimeUserListApi(query: Query) {
  return listGet('/backend/operation/onetimeuser', query);
}

export function fetchKeepDataOneTimeUserDetailApi(query: Query) {
  return detailGet('/backend/operation/onetimeuserdetail', query);
}

export function fetchKeepDataFirstRegDetailsApi(query: Query) {
  return detailGet('/backend/operation/firstregisterplayer', query);
}

export function fetchKeepDataFirstPayDetailsApi(query: Query) {
  return detailGet('/backend/operation/firstpayplayer', query);
}

export function fetchKeepDataDauDetailApi(query: Query) {
  return detailGet('/backend/operation/firstpayrealtimedaudetail', query);
}

export function fetchKeepDataOnceUserDetailApi(query: Query) {
  return detailGet(
    '/backend/operation/firstpayrealtimedauonceuserdetail',
    query,
  );
}

export function fetchKeepDataLoginDauDetailApi(query: Query) {
  return detailGet('/backend/operation/realtimedaudetail', query);
}

export function fetchKeepDataSectionDauDetailApi(query: Query) {
  return detailGet('/backend/operation/everydaylogindaudetail', query);
}

export function fetchKeepDataQujianDetailsApi(query: Query) {
  return detailGet('/backend/operation/loginintervalplayer', query);
}

export function fetchKeepDataLtvRechargeDetailApi(query: Query) {
  return detailGet('/backend/operation/realtimeltvdetail', query);
}

/** 安全 CSV：一次性用户 PageId=92 */
export function exportKeepDataOneTimeUserCsvApi(query: Query) {
  return requestClient.get<{
    Id?: number;
    Remark?: string;
    Status?: number;
  }>('/backend/operation/onetimeusercsv', { params: trimSpace(query) });
}

/** 安全 CSV：注册/新增人数 PageId=93 */
export function exportKeepDataFirstRegCsvApi(query: Query) {
  return requestClient.get<{
    Id?: number;
    Remark?: string;
    Status?: number;
  }>('/backend/operation/firstregisterplayercsv', {
    params: trimSpace(query),
  });
}

/** 安全 CSV：区间留存新增人数 PageId=94 */
export function exportKeepDataQujianCsvApi(query: Query) {
  return requestClient.get<{
    Id?: number;
    Remark?: string;
    Status?: number;
  }>('/backend/operation/loginintervalplayercsv', {
    params: trimSpace(query),
  });
}

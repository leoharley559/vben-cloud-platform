import { requestClient } from '#/api/request';
import { toListResult, wrapMatrixAsList } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

type Query = Record<string, unknown>;

/**
 * 请求留存数据列表接口并归一化响应
 * @param url 留存列表接口路径
 * @param query 筛选参数（会先 trim 空格）
 * @returns 标准列表结构 Items + Pagination
 */
function listGet(url: string, query: Query) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[] | null;
      ItemsOld?: Record<string, unknown>[] | null;
      Pagination?: { MaxCount?: number } | null;
    }>(url, { params: trimSpace(query) })
    .then(toListResult);
}

/**
 * 请求留存数据下钻明细接口（保留原始响应结构）
 * @param url 明细接口路径
 * @param query 下钻筛选参数（会先 trim 空格）
 * @returns 含 Items 与 Pagination 的原始明细响应
 */
function detailGet(url: string, query: Query) {
  return requestClient.get<{
    Items?: Record<string, unknown>[] | null;
    Pagination?: { MaxCount?: number } | null;
  }>(url, { params: trimSpace(query) });
}

/**
 * 首充留存列表（留存数据「首充留存」面板）
 *
 * @param query 日期区间、渠道等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/keepData/components/extant-panel.vue
 */
export function fetchKeepDataExtantListApi(query: Query) {
  return listGet('/backend/operation/firstpayrealtimedau', query);
}

/**
 * 登录留存列表（留存数据「登录留存」面板）
 *
 * 旧站约定：列表数据读 `ItemsOld`，非 `Items`。
 *
 * @param query 日期区间、渠道等筛选参数
 * @returns 标准列表结构（Items 取自 ItemsOld）
 * @see views/dataClose/keepData/components/login-retention-panel.vue
 */
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

/**
 * 区间留存列表（留存数据「区间留存」面板）
 *
 * 接口返回单对象矩阵，经 `wrapMatrixAsList` 包装为一行列表。
 *
 * @param query 区间起止日期、渠道等筛选参数
 * @returns 矩阵转列表后的 Items + Pagination
 * @see views/dataClose/keepData/components/section-retention-panel.vue
 */
export async function fetchKeepDataSectionRetentionListApi(query: Query) {
  const data = await requestClient.get<Record<string, unknown>>(
    '/backend/operation/everydaylogindau',
    { params: trimSpace(query) },
  );
  return wrapMatrixAsList(data);
}

/**
 * 留存 LTV 列表（留存数据 LTV 面板）
 *
 * 旧站约定：列表数据读 `ItemsOld`，非 `Items`。
 *
 * @param query 日期区间、渠道等筛选参数
 * @returns 标准列表结构（Items 取自 ItemsOld）
 * @see views/dataClose/keepData/components/ltv-panel.vue
 */
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

/**
 * 一次性用户列表（留存数据「一次性用户」面板）
 *
 * @param query 日期区间、渠道等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/keepData/components/one-time-user-panel.vue
 */
export function fetchKeepDataOneTimeUserListApi(query: Query) {
  return listGet('/backend/operation/onetimeuser', query);
}

/**
 * 一次性用户下钻明细（留存详情弹窗）
 *
 * @param query 下钻日期、渠道等参数
 * @returns Items 明细行 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataOneTimeUserDetailApi(query: Query) {
  return detailGet('/backend/operation/onetimeuserdetail', query);
}

/**
 * 首注册玩家明细（留存详情弹窗「新增人数」）
 *
 * @param query 下钻日期、渠道等参数
 * @returns Items 玩家明细 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataFirstRegDetailsApi(query: Query) {
  return detailGet('/backend/operation/firstregisterplayer', query);
}

/**
 * 首充玩家明细（留存详情弹窗「首充人数」）
 *
 * @param query 下钻日期、渠道等参数
 * @returns Items 玩家明细 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataFirstPayDetailsApi(query: Query) {
  return detailGet('/backend/operation/firstpayplayer', query);
}

/**
 * 首充留存下钻明细（留存详情弹窗 DAU 明细）
 *
 * @param query 下钻日期、留存天数等参数
 * @returns Items 明细行 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataDauDetailApi(query: Query) {
  return detailGet('/backend/operation/firstpayrealtimedaudetail', query);
}

/**
 * 首充留存「一次性用户」下钻明细
 *
 * @param query 下钻日期、渠道等参数
 * @returns Items 明细行 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataOnceUserDetailApi(query: Query) {
  return detailGet(
    '/backend/operation/firstpayrealtimedauonceuserdetail',
    query,
  );
}

/**
 * 登录存留下钻明细（留存详情弹窗）
 *
 * @param query 下钻日期、留存天数等参数
 * @returns Items 明细行 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataLoginDauDetailApi(query: Query) {
  return detailGet('/backend/operation/realtimedaudetail', query);
}

/**
 * 区间存留下钻明细（留存详情弹窗）
 *
 * @param query 区间日期、渠道等参数
 * @returns Items 明细行 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataSectionDauDetailApi(query: Query) {
  return detailGet('/backend/operation/everydaylogindaudetail', query);
}

/**
 * 区间留存新增人数明细（留存详情弹窗）
 *
 * @param query 区间起止、渠道等参数
 * @returns Items 玩家明细 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataQujianDetailsApi(query: Query) {
  return detailGet('/backend/operation/loginintervalplayer', query);
}

/**
 * LTV 充值下钻明细（留存详情弹窗）
 *
 * @param query 下钻日期、LTV 天数等参数
 * @returns Items 充值明细 + Pagination
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function fetchKeepDataLtvRechargeDetailApi(query: Query) {
  return detailGet('/backend/operation/realtimeltvdetail', query);
}

/**
 * 一次性用户安全 CSV 导出（PageId=92）
 *
 * 异步导出任务，返回任务 Id / Status / Remark。
 *
 * @param query 与列表明细一致的筛选参数
 * @returns 导出任务 Id、Status、Remark
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function exportKeepDataOneTimeUserCsvApi(query: Query) {
  return requestClient.get<{
    Id?: number;
    Remark?: string;
    Status?: number;
  }>('/backend/operation/onetimeusercsv', { params: trimSpace(query) });
}

/**
 * 注册/新增人数安全 CSV 导出（PageId=93）
 *
 * @param query 与明细弹窗一致的筛选参数
 * @returns 导出任务 Id、Status、Remark
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function exportKeepDataFirstRegCsvApi(query: Query) {
  return requestClient.get<{
    Id?: number;
    Remark?: string;
    Status?: number;
  }>('/backend/operation/firstregisterplayercsv', {
    params: trimSpace(query),
  });
}

/**
 * 区间留存新增人数安全 CSV 导出（PageId=94）
 *
 * @param query 与区间明细一致的筛选参数
 * @returns 导出任务 Id、Status、Remark
 * @see views/dataClose/keepData/components/details-panel.vue
 */
export function exportKeepDataQujianCsvApi(query: Query) {
  return requestClient.get<{
    Id?: number;
    Remark?: string;
    Status?: number;
  }>('/backend/operation/loginintervalplayercsv', {
    params: trimSpace(query),
  });
}

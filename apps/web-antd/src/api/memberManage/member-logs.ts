import type {
  LoginLogListItem,
  LoginLogListQuery,
  LoginLogSummaryData,
  LoginLogSummaryQuery,
} from '#/types/member-logs';
import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将云后台列表响应归一化为 Items + Pagination 结构
 * @param result 云后台原始列表响应（可能为 null / undefined）
 * @returns 含 Items 数组与 Pagination 的标准列表结果
 */
function normalizeList(
  result: CloudListResult<LoginLogListItem> | null | undefined,
) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 会员登录记录列表（会员日志 · 登录记录 Tab 明细表格）。
 *
 * @param query 查询参数（玩家、IP、设备、时间等筛选及分页）
 * @returns 登录记录行 Items 及 Pagination
 * @see views/memberManage/memberLog/components/login-record-list.vue
 */
export async function fetchLoginLogListApi(query: LoginLogListQuery) {
  const result = await requestClient.get<CloudListResult<LoginLogListItem>>(
    '/backend/playeranalysis/log',
    {
      params: trimSpace({ ...query }),
    },
  );
  return normalizeList(result);
}

/**
 * 会员登录记录汇总（会员日志 · 登录记录 Tab 顶部汇总面板）。
 *
 * @param query 汇总筛选参数（不含 Summary，内部自动追加 Summary=1）
 * @returns Items 为登录汇总统计数据对象
 * @see views/memberManage/memberLog/components/login-summary-panel.vue
 */
export async function fetchLoginLogSummaryApi(
  query: Omit<LoginLogSummaryQuery, 'Summary'>,
) {
  const result = await requestClient.get<{
    Items?: LoginLogSummaryData | null;
  }>('/backend/playeranalysis/log', {
    params: trimSpace({ ...query, Summary: 1 }),
  });
  return {
    Items: result?.Items || {},
  };
}

/**
 * 导出会员登录记录明细 CSV（会员日志 · 登录记录导出，pageId=34）。
 *
 * @param params 与列表一致的筛选参数
 * @returns 导出任务信息（Id、Remark、Status）
 * @see views/memberManage/memberLog/components/login-record-list.vue
 */
export function exportLoginLogListApi(params: Record<string, unknown>) {
  return requestClient.get<{ Id?: number; Remark?: string; Status?: number }>(
    '/backend/playeranalysis/listcsv',
    { params: trimSpace(params) },
  );
}

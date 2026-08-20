import { toListResult } from '#/api/dataClose/shared';
import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 虚拟报表任务列表（虚拟报表页）
 *
 * @param query 日期、任务状态、分页等筛选参数
 * @returns 标准列表结构 Items + Pagination
 * @see views/dataClose/virtualReport/index.vue
 */
export function fetchVirtualReportTaskListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/operation/virtualrptasklist', { params: trimSpace(query) })
    .then(toListResult);
}

import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/**
 * 查询 CSV/Excel 导出任务列表
 * @param query 筛选条件（任务状态、时间范围及分页）
 * @returns 导出任务列表 Items 及 Pagination
 * @see views/operationalManage/downloadCsvManage/index.vue
 */
export function fetchDownloadCsvListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/downloadexcel/list',
    { params: trimSpace(query) },
  );
}

/**
 * 删除 CSV/Excel 导出任务记录
 * @param id 导出任务 Id
 * @returns 接口操作结果
 * @see views/operationalManage/downloadCsvManage/index.vue
 */
export function deleteDownloadCsvApi(id: number | string) {
  return requestClient.delete(`/backend/downloadexcel/${id}`);
}

/**
 * 校验并获取 CSV/Excel 文件下载路径
 * @param params 校验参数（FileName、ValidCode 等）
 * @returns 可下载文件 Path
 * @see views/operationalManage/downloadCsvManage/index.vue
 */
export function downloadCsvCheckApi(params: Record<string, unknown>) {
  return requestClient.get<{ Path?: string }>(
    '/backend/downloadexcel/download',
    { params: trimSpace(params) },
  );
}

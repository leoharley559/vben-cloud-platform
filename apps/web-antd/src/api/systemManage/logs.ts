import { requestClient } from '#/api/request';
import type {
  LogListQuery,
  LogListResult,
  LogTypeOption,
  LogUserOption,
} from '#/types/system-manage';
import { trimSpace } from '#/utils/string';

/**
 * 操作日志列表（日志管理页表格）。
 *
 * @param query 查询参数（时间范围、日志类型、操作人等）
 * @returns LogListResult（日志行及分页信息）
 * @see views/systemManage/logsManage/index.vue
 */
export function fetchLogListApi(query: LogListQuery) {
  return requestClient.get<LogListResult>('/backend/handlelog/list', {
    params: trimSpace(query),
  });
}

/**
 * 日志类型下拉选项（日志管理页筛选）。
 *
 * @returns LogTypeOption[] 日志类型列表
 * @see views/systemManage/logsManage/index.vue
 */
export function fetchLogTypeOptionsApi() {
  return requestClient.get<LogTypeOption[]>('/backend/handlelog/listlogtypes');
}

/**
 * 操作人下拉选项（日志管理页筛选）。
 *
 * @returns LogUserOption[] 操作人列表
 * @see views/systemManage/logsManage/index.vue
 */
export function fetchLogUserListApi() {
  return requestClient.get<LogUserOption[]>('/backend/handlelog/listuser');
}

import { requestClient } from '#/api/request';
import type {
  LogListQuery,
  LogListResult,
  LogTypeOption,
  LogUserOption,
} from '#/types/system-manage';
import { trimSpace } from '#/utils/string';

export function fetchLogListApi(query: LogListQuery) {
  return requestClient.get<LogListResult>('/backend/handlelog/list', {
    params: trimSpace(query),
  });
}

export function fetchLogTypeOptionsApi() {
  return requestClient.get<LogTypeOption[]>('/backend/handlelog/listlogtypes');
}

export function fetchLogUserListApi() {
  return requestClient.get<LogUserOption[]>('/backend/handlelog/listuser');
}

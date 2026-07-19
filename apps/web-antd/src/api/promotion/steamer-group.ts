import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  SteamerDirectGroupResult,
  SteamerGroupItem,
} from '#/types/promotion';
import { trimSpace } from '#/utils/string';

export function fetchSteamerGroupListApi() {
  return requestClient.get<CloudListResult<SteamerGroupItem>>(
    '/backend/sportsteamerteam/list',
  );
}

export function fetchSteamerDirectGroupApi(query: {
  AdminId?: number | string;
}) {
  return requestClient.get<SteamerDirectGroupResult>(
    '/backend/sportsteamerteam/getadminteams',
    { params: trimSpace(query) },
  );
}

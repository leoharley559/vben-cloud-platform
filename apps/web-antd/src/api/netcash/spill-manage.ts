import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type { SpillManageItem, SpillManageListQuery } from '#/types/netcash';
import { trimSpace } from '#/utils/string';

export function fetchSpillManageListApi(query: SpillManageListQuery) {
  return requestClient.get<CloudListResult<SpillManageItem>>(
    '/backend/agentplayermanage/list',
    { params: trimSpace(query) },
  );
}

export function auditSpillManageApi(data: {
  Id?: number | string;
  Status?: number;
}) {
  return requestClient.put('/backend/agentplayermanage/operate', data);
}

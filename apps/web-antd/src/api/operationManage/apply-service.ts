import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchApplyServiceListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/customsupport/list',
    { params: trimSpace(query) },
  );
}

/** 工单问题类型（旧站 workQuestions / customersupporterworkquestiontype） */
export function fetchWorkQuestionTypeListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/customersupporterworkquestiontype/list',
    { params: trimSpace({ Enabled: 0, Page: 1, PageSize: 9999, ...query }) },
  );
}

/** 结束理由下拉（旧站 fetchQustion，Type=0） */
export function fetchEndReasonListApi(query: Record<string, unknown> = {}) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/customersupporterquestiontype/list',
    {
      params: trimSpace({
        Type: 0,
        Page: 1,
        PageSize: 999_999,
        ...query,
      }),
    },
  );
}

export function handleApplyServiceApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/customsupport/handle', data);
}

export function rejectApplyServiceApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/customsupport/reject', data);
}

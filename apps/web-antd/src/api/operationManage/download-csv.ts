import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchDownloadCsvListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/downloadexcel/list',
    { params: trimSpace(query) },
  );
}

export function deleteDownloadCsvApi(id: number | string) {
  return requestClient.delete(`/backend/downloadexcel/${id}`);
}

/** 校验后返回可下载 Path；可带 FileName / ValidCode */
export function downloadCsvCheckApi(params: Record<string, unknown>) {
  return requestClient.get<{ Path?: string }>(
    '/backend/downloadexcel/download',
    { params: trimSpace(params) },
  );
}

import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export interface AiAssistantCategoryItem {
  Id?: number | string;
  Title?: string;
  [key: string]: unknown;
}

export interface AiAssistantContentViewItem {
  CategoryTitle?: string;
  ContentId?: number | string;
  CreateTime?: number | string;
  LangInfos?: Array<Record<string, unknown>>;
  PlayerName?: string;
  Satisfaction?: number;
  Title?: string;
  [key: string]: unknown;
}

export function fetchAiAssistantCategoryListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<AiAssistantCategoryItem>>(
    '/backend/aiassistantv2/categorylist',
    { params: query },
  );
}

export function fetchAiAssistantContentViewListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<AiAssistantContentViewItem>>(
    '/backend/aiassistantv2/contentviewlist',
    { params: trimSpace(query) },
  );
}

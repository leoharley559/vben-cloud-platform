import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/** AI 助手内容分类项 */
export interface AiAssistantCategoryItem {
  Id?: number | string;
  /** 分类标题 */
  Title?: string;
  [key: string]: unknown;
}

/** AI 助手内容浏览/咨询记录项 */
export interface AiAssistantContentViewItem {
  /** 所属分类标题 */
  CategoryTitle?: string;
  ContentId?: number | string;
  /** 浏览/咨询时间 */
  CreateTime?: number | string;
  /** 多语言内容信息 */
  LangInfos?: Array<Record<string, unknown>>;
  /** 玩家名称 */
  PlayerName?: string;
  /** 满意度评分 */
  Satisfaction?: number;
  /** 内容标题 */
  Title?: string;
  [key: string]: unknown;
}

/**
 * 查询 AI 助手内容分类列表
 * @param query 筛选条件及分页参数
 * @returns AI 助手分类列表 Items 及 Pagination
 * @see views/operationalManage/playerDetails/components/player-visit-record.vue
 */
export function fetchAiAssistantCategoryListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<AiAssistantCategoryItem>>(
    '/backend/aiassistantv2/categorylist',
    { params: query },
  );
}

/**
 * 查询 AI 助手内容浏览/咨询记录列表
 * @param query 筛选条件（玩家、分类、时间范围及分页）
 * @returns 内容浏览记录列表 Items 及 Pagination
 * @see views/operationalManage/playerDetails/components/player-visit-record.vue
 */
export function fetchAiAssistantContentViewListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<AiAssistantContentViewItem>>(
    '/backend/aiassistantv2/contentviewlist',
    { params: trimSpace(query) },
  );
}

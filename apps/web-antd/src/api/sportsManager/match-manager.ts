import { requestClient } from '#/api/request';
import { toSportsListResult } from '#/types/sports-manager';

export function fetchSportsMatchListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      respond?: {
        Items?: Record<string, unknown>[];
        MaxCount?: number;
      };
    }>('/backend/sportslivematch/list', { params: query })
    .then(toSportsListResult);
}

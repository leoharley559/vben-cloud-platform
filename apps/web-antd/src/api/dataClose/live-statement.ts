import { requestClient } from '#/api/request';
import { toListResult } from '#/api/dataClose/shared';
import { trimSpace } from '#/utils/string';

export function fetchLiveDataStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/livereport/listlivestatistics', { params: query })
    .then(toListResult);
}

export function fetchLiveRoomStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/livereport/liststeamingstatistics', { params: query })
    .then(toListResult);
}

export function fetchAnnouncerDonateListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/chatroomgiftrecordstatistic/list', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

export function fetchGiftReportListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/chatroomgiftsummary/list', { params: trimSpace(query) })
    .then(toListResult);
}

export function fetchGuessingGameReportListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/sportbettransaction/steammatchreport', { params: query })
    .then(toListResult);
}

export function fetchLiveGameReportListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/gamezbdp/livereport', { params: query })
    .then(toListResult);
}

export function fetchPkStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/sportpkstatistic/list', { params: query })
    .then(toListResult);
}

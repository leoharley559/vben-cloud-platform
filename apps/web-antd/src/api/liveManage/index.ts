import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';
import { registerPermissionKeys } from '#/utils/permission';

registerPermissionKeys({
  betRuleConfig: [13051],
  landingPageList: [11602],
  liveChatroomTab: [11533],
  liveEventCurrent: [13026],
  pkManage: [13070],
  pushManage: [11589],
  scheduleList: [11532],
  streamerHostManage: [11535],
});

function toListResult(data: CloudListResult<Record<string, unknown>>) {
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

export function fetchLiveRoomListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/sportsteaming/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchStreamerListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/sportsteamer/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchMatchScheduleListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/backend/sportmatch/list', {
      params: query,
    })
    .then(toListResult);
}

export function fetchPushOrderListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/gamepushorder/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchLandingPageListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/landingpagefordisplay/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchLiveEventListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/livestreamactivitiesconfig/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchPkListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/sportpktheme/list',
      { params: query },
    )
    .then(toListResult);
}

export function fetchGuessThemeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/sportbettheme/list',
      { params: query },
    )
    .then(toListResult);
}

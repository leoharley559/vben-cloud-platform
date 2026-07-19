import { requestClient } from '#/api/request';
import type {
  ChildAdminInfoResult,
  ChildChannelInfoResult,
} from '#/types/config';
import { trimSpace } from '#/utils/string';

export function fetchChildAdminInfoApi(params?: Record<string, unknown>) {
  return requestClient.get<ChildAdminInfoResult>(
    '/backend/config/getchildadmininfo',
    {
      params: trimSpace(params || {}),
    },
  );
}

export function fetchChildChannelInfoApi(params?: Record<string, unknown>) {
  return requestClient.get<ChildChannelInfoResult>(
    '/backend/config/getchildchannelinfo',
    {
      params: trimSpace(params || {}),
    },
  );
}

export function fetchChildPromotionInfoApi(params?: Record<string, unknown>) {
  return requestClient.get('/backend/config/getchildnetcashinfo', {
    params: trimSpace(params || {}),
  });
}

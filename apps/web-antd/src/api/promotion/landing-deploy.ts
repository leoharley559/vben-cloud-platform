import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  LandingPageItem,
  LandingPageListQuery,
  LandingPagePayload,
  LandingResourceItem,
} from '#/types/promotion';
import { trimSpace } from '#/utils/string';

export function fetchLandingDeployListApi(query: LandingPageListQuery) {
  return requestClient.get<
    CloudListResult<LandingPageItem> & {
      MoreItems?: { Resources?: LandingResourceItem[] };
    }
  >('/backend/landingpage/list', { params: trimSpace(query) });
}

export function fetchLandingDeployDetailApi(id: number | string) {
  return requestClient.get<LandingPageItem>(`/backend/landingpage/${id}`);
}

export function createLandingDeployApi(data: LandingPagePayload) {
  return requestClient.post('/backend/landingpage/', data);
}

export function updateLandingDeployApi(data: LandingPagePayload) {
  return requestClient.put('/backend/landingpage/', data);
}

export function deleteLandingDeployApi(id: number | string) {
  return requestClient.delete(`/backend/landingpage/${id}`);
}

export function fetchLandingResourceListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<LandingResourceItem>>(
    '/api/resource/list',
    { params: trimSpace(query) },
  );
}

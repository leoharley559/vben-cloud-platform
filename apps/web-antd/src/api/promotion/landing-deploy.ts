import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  LandingPageItem,
  LandingPageListQuery,
  LandingPagePayload,
  LandingResourceItem,
} from '#/types/promotion';
import { trimSpace } from '#/utils/string';

/**
 * 获取落地页部署列表
 * @param query 分页与筛选条件
 * @returns 落地页列表、资源及分页信息
 * @see views/generalizeManage/dropDeploy/index.vue
 */
export function fetchLandingDeployListApi(query: LandingPageListQuery) {
  return requestClient.get<
    CloudListResult<LandingPageItem> & {
      MoreItems?: { Resources?: LandingResourceItem[] };
    }
  >('/backend/landingpage/list', { params: trimSpace(query) });
}

/**
 * 获取落地页部署详情
 * @param id 落地页 ID
 * @returns 落地页详细信息
 * @see views/generalizeManage/dropDeploy/components/landing-form-modal.vue
 */
export function fetchLandingDeployDetailApi(id: number | string) {
  return requestClient.get<LandingPageItem>(`/backend/landingpage/${id}`);
}

/**
 * 新建落地页部署
 * @param data 落地页表单数据
 * @returns 创建结果
 * @see views/generalizeManage/dropDeploy/components/landing-form-modal.vue
 */
export function createLandingDeployApi(data: LandingPagePayload) {
  return requestClient.post('/backend/landingpage/', data);
}

/**
 * 更新落地页部署
 * @param data 落地页表单数据（含 ID）
 * @returns 更新结果
 * @see views/generalizeManage/dropDeploy/components/landing-form-modal.vue
 */
export function updateLandingDeployApi(data: LandingPagePayload) {
  return requestClient.put('/backend/landingpage/', data);
}

/**
 * 删除落地页部署
 * @param id 落地页 ID
 * @returns 删除结果
 * @see views/generalizeManage/dropDeploy/index.vue
 */
export function deleteLandingDeployApi(id: number | string) {
  return requestClient.delete(`/backend/landingpage/${id}`);
}

/**
 * 获取落地页资源列表
 * @param query 分页与筛选条件
 * @returns 资源文件列表及分页信息
 * @see views/generalizeManage/dropDeploy/components/landing-form-modal.vue
 */
export function fetchLandingResourceListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<LandingResourceItem>>(
    '/api/resource/list',
    { params: trimSpace(query) },
  );
}

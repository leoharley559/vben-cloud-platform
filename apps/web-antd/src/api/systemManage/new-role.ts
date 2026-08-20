import type {
  RoleFormModel,
  RoleListQuery,
  RoleListResult,
} from '#/types/system-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 新角色列表（角色管理页表格）。
 *
 * @param query 查询参数（分页、角色名等）
 * @returns RoleListResult（角色行及分页信息）
 * @see views/systemManage/newRole/index.vue
 */
export function fetchRoleListApi(query: RoleListQuery) {
  return requestClient
    .get<RoleListResult>('/public/rolenew/list', {
      params: trimSpace(query),
    })
    .then((data) => ({
      Items: data?.Items ?? [],
      Pagination: {
        MaxCount: data?.Pagination?.MaxCount ?? data?.Items?.length ?? 0,
      },
    }));
}

/**
 * 新角色详情（编辑弹窗回显）。
 *
 * @param id 角色 Id
 * @returns RoleFormModel 角色表单数据
 * @see views/systemManage/newRole/components/role-form-modal.vue
 */
export function fetchRoleDetailApi(id: number | string) {
  return requestClient.get<RoleFormModel>(`/public/rolenew/${id}`);
}

/**
 * 新建角色。
 *
 * @param data 角色表单（名称、权限树等）
 * @returns 接口操作结果
 * @see views/systemManage/newRole/index.vue
 */
export function createRoleApi(data: Record<string, unknown>) {
  return requestClient.post('/public/rolenew/', data);
}

/**
 * 更新角色。
 *
 * @param data 角色表单（含 Id）
 * @returns 接口操作结果
 * @see views/systemManage/newRole/index.vue
 */
export function updateRoleApi(data: Record<string, unknown>) {
  return requestClient.put('/public/rolenew/', data);
}

/**
 * 删除角色。
 *
 * @param id 角色 Id
 * @returns 接口操作结果
 * @see views/systemManage/newRole/index.vue
 */
export function deleteRoleApi(id: number | string) {
  return requestClient.delete(`/public/rolenew/${id}`);
}

/**
 * 角色参数列表（角色编辑弹窗「角色参数」Tab）。
 *
 * @param params 查询参数（角色 Id 等）
 * @returns 角色参数配置列表
 * @see views/systemManage/newRole/components/role-form-modal.vue
 */
export function fetchRoleParamListApi(params: Record<string, unknown>) {
  return requestClient.get('/public/roleparams/list', { params });
}

/**
 * 保存角色参数（角色编辑弹窗「角色参数」Tab）。
 *
 * @param data 角色参数表单
 * @returns 接口操作结果
 * @see views/systemManage/newRole/components/role-form-modal.vue
 */
export function saveRoleParamApi(data: Record<string, unknown>) {
  return requestClient.put('/public/roleparams/', data);
}

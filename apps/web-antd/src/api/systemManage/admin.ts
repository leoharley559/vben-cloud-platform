import type { AdminListQuery, AdminListResult } from '#/types/system-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 子账号列表（管理员管理页表格）。
 *
 * @param query 查询参数（分页、用户名、角色等）
 * @returns AdminListResult（列表行及分页信息）
 * @see views/systemManage/adminManage/index.vue
 */
export function fetchAdminListApi(query: AdminListQuery) {
  return requestClient.get<AdminListResult>('/backend/sonuser/list', {
    params: trimSpace(query),
  });
}

/**
 * 子账号详情（编辑弹窗回显）。
 *
 * @param id 子账号 Id
 * @returns 子账号详情字段
 * @see views/systemManage/adminManage/components/admin-form-modal.vue
 */
export function fetchAdminDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(`/backend/sonuser/${id}`);
}

/**
 * 新建子账号。
 *
 * @param data 子账号表单（用户名、角色、权限等）
 * @returns 接口操作结果
 * @see views/systemManage/adminManage/index.vue
 */
export function createAdminApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/sonuser/', data);
}

/**
 * 更新子账号。
 *
 * @param data 子账号表单（含 Id）
 * @returns 接口操作结果
 * @see views/systemManage/adminManage/index.vue
 */
export function updateAdminApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/sonuser/', data);
}

/**
 * 删除子账号（需安全验证码）。
 *
 * @param id 子账号 Id
 * @param validCode 安全验证码
 * @returns 接口操作结果
 * @see views/systemManage/adminManage/index.vue
 */
export function deleteAdminApi(id: number | string, validCode: string) {
  return requestClient.delete(`/backend/sonuser/${id}`, {
    params: { ValidCode: validCode },
  });
}

import type { SecuritySettingItem } from '#/types/system-manage';

import { requestClient } from '#/api/request';

/**
 * 安全设置列表（安全管理页各 Tab 表格数据）。
 *
 * @returns SecuritySettingItem[] 安全项配置列表
 * @see views/systemManage/securityManage/index.vue
 */
export function fetchSecuredListApi() {
  return requestClient.get<SecuritySettingItem[]>(
    '/backend/agentsecuritysetting/list',
  );
}

/**
 * 编辑安全项开关状态。
 *
 * @param data 安全项 Id 及目标状态
 * @returns 接口操作结果
 * @see views/systemManage/securityManage/index.vue
 */
export function editSecuredStatusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentsecuritysetting', data);
}

/**
 * 重置安全项为默认状态。
 *
 * @param data 安全项 Id 等
 * @returns 接口操作结果
 * @see views/systemManage/securityManage/index.vue
 */
export function resetSecuredStatusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/agentsecuritysetting/resetdefault', data);
}

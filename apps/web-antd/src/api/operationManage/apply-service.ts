import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { registerPermissionKeys } from '#/utils/permission';
import { trimSpace } from '#/utils/string';

registerPermissionKeys({
  applyServicePass: [12_437],
  applyServiceCheck: [12_438],
  pleyerOrderHandle: [12_431],
  pleyerOrderCheck: [12_439],
  pleyerOrderReject: [12_440],
  playerOrderQuestType: [12_436],
});

/**
 * 查询客服申请/工单列表
 * @param query 筛选条件（玩家、状态、时间范围及分页）
 * @returns 工单列表 Items 及 Pagination
 * @see views/operationalManage/applyService/components/apply-service-panel.vue
 */
export function fetchApplyServiceListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/customsupport/list',
    { params: trimSpace(query) },
  );
}

/**
 * 查询工单问题类型下拉列表
 * @param query 可选附加筛选参数（默认 Enabled=0）
 * @returns 问题类型列表 Items 及 Pagination
 * @see views/operationalManage/applyService/components/apply-service-panel.vue
 */
export function fetchWorkQuestionTypeListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/customersupporterworkquestiontype/list',
    { params: trimSpace({ Enabled: 0, Page: 1, PageSize: 9999, ...query }) },
  );
}

/**
 * 查询工单结束理由下拉列表
 * @param query 可选附加筛选参数（默认 Type=0）
 * @returns 结束理由列表 Items 及 Pagination
 * @see views/operationalManage/applyService/components/apply-service-panel.vue
 */
export function fetchEndReasonListApi(query: Record<string, unknown> = {}) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/customersupporterquestiontype/list',
    {
      params: trimSpace({
        Type: 0,
        Page: 1,
        PageSize: 999_999,
        ...query,
      }),
    },
  );
}

/**
 * 处理/受理客服申请工单
 * @param data 处理参数（工单 Id、处理结果及备注）
 * @returns 接口操作结果
 * @see views/operationalManage/applyService/components/apply-service-panel.vue
 */
export function handleApplyServiceApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/customsupport/handle', data);
}

/**
 * 拒绝客服申请工单
 * @param data 拒绝参数（工单 Id 及拒绝原因）
 * @returns 接口操作结果
 * @see views/operationalManage/applyService/components/apply-service-panel.vue
 */
export function rejectApplyServiceApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/customsupport/reject', data);
}

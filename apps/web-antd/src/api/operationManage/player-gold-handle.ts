import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

/**
 * 分页查询玩家金币发放/扣减记录。
 *
 * @param query 账号、时间、状态等筛选及分页参数
 * @returns 金币操作记录 Items 与 Pagination
 * @see views/operationalManage/playerGoldHandle/components/gold-record-panel.vue
 */
export function fetchPlayerGoldHandleListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playergoldhandle/list',
    { params: trimSpace(query) },
  );
}

/**
 * 单笔提交玩家金币发放/扣减。
 *
 * @param data 玩家、金额、原因等表单字段
 * @returns 接口响应
 * @see views/operationalManage/playerGoldHandle/components/gold-grant-panel.vue
 */
export function createPlayerGoldHandleApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldhandle/', data);
}

/**
 * 批量提交玩家金币发放/扣减。
 *
 * @param data 批量玩家及金额等
 * @returns 接口响应
 * @see views/operationalManage/playerGoldHandle/components/gold-grant-panel.vue
 */
export function batchCreatePlayerGoldHandleApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldhandle/batch', data);
}

/**
 * 获取金币发放页红色提示标题文案。
 *
 * @returns 提示标题配置对象
 * @see views/operationalManage/playerGoldHandle/components/gold-grant-panel.vue
 */
export function getPlayerGoldRedTitleApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/playergoldhandle/redtitle',
  );
}

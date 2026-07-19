import { requestClient } from '#/api/request';

/** 滚动大奖配置（Items 为单对象配置） */
export function fetchJackpotConfigApi() {
  return requestClient.get<
    { Items?: Record<string, unknown> } | Record<string, unknown>
  >('/backend/jackpotconfig/list');
}

/** 保存滚动大奖配置（整包提交） */
export function updateJackpotConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/jackpotconfig/edit', data);
}

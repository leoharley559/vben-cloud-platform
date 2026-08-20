import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 查询国家/地区配置列表
 * @param query 筛选条件（国家名称、状态及分页）
 * @returns 国家配置列表 Items 及 Pagination
 * @see views/operationalManage/countrySet/index.vue
 */
export function fetchCountriesConfigListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/countriesconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 获取游戏开放国家/地区当前状态
 * @returns 游戏国家限制配置（Countries、CountriesAllow、Option 等）
 * @see views/operationalManage/countrySet/index.vue
 */
export function fetchGameCountriesStateApi() {
  return requestClient.get<Record<string, unknown>>('/backend/gamecountries/');
}

/**
 * 更新游戏开放国家/地区配置
 * @param data 国家限制表单（Countries、CountriesAllow、Option）
 * @returns 接口操作结果
 * @see views/operationalManage/countrySet/index.vue
 */
export function updateGameCountriesStateApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/gamecountries/', data);
}

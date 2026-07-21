import type { ChannelDomainListResult } from '#/types/channel-config';
import type {
  AgentDomainQuery,
  AgentDomainRow,
  NetcashListResult,
} from '#/types/netcash';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 代理域名绑定列表（「代理域名管理」页主表格）。
 *
 * @param query 查询参数（代理、渠道、域名等筛选）
 * @returns 代理域名行 Items 及 Pagination
 * @see views/netcash/agentDomainManage/index.vue
 */
export async function fetchAgentDomainListApi(query: AgentDomainQuery) {
  const result = await requestClient.get<
    NetcashListResult<AgentDomainRow> | null
  >(
    '/backend/agentchanneldomain/list',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    Pagination: result?.Pagination ?? { MaxCount: 0 },
  };
}

/**
 * 更新代理域名绑定（旧接口要求提交整行，不能只发两个域名字段）。
 *
 * @param data 完整代理域名行数据
 * @returns 接口操作结果
 * @see views/netcash/agentDomainManage/index.vue
 */
export function updateAgentDomainApi(data: AgentDomainRow) {
  return requestClient.put('/backend/agentchanneldomain/', data);
}

/**
 * 可分配域名列表（编辑代理域名时选择可用域名）。
 *
 * @param query 查询参数（渠道、状态等筛选）
 * @returns 域名 Items 及 Pagination
 * @see views/netcash/agentDomainManage/index.vue
 */
export async function fetchAssignableDomainsApi(
  query: Record<string, unknown>,
) {
  const result = await requestClient.get<ChannelDomainListResult | null>(
    '/backend/domain/list',
    { params: trimSpace(query) },
  );
  return {
    ...result,
    Items: result?.Items ?? [],
    Pagination: result?.Pagination ?? { MaxCount: 0 },
  };
}

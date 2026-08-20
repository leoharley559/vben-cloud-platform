import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 将系统管理列表响应归一为 CloudListResult。
 *
 * 保留 MoreItems；Pagination.MaxCount 优先取接口值，否则回退为 Items 长度。
 *
 * @param data 接口原始响应（含可选 MoreItems）
 * @returns 含 Items、MoreItems 及 Pagination.MaxCount 的列表结构
 */
function toListResult(
  data: CloudListResult<Record<string, unknown>> & {
    MoreItems?: Record<string, unknown>;
  },
) {
  return {
    Items: data.Items ?? [],
    MoreItems: data.MoreItems,
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

/**
 * 旧版角色列表（角色管理页，兼容 public/role 接口）。
 *
 * @param query 查询参数（分页等）
 * @returns Items、MoreItems 及 Pagination.MaxCount
 * @see views/systemManage/role/index.vue
 */
export function fetchLegacyRoleListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>('/public/role/list', {
      params: trimSpace(query),
    })
    .then(toListResult);
}

/**
 * 语言分组列表（语言分组管理页）。
 *
 * @param query 可选查询参数
 * @returns Items 及 Pagination.MaxCount
 * @see views/systemManage/languageGroupManage/index.vue
 */
export function fetchLanguageGroupListApi(query: Record<string, unknown> = {}) {
  return requestClient
    .get<Record<string, unknown>[] | { Items?: Record<string, unknown>[] }>(
      '/backend/agentgrouplang/list',
      { params: query },
    )
    .then((data) => {
      const items = Array.isArray(data)
        ? data
        : ((data as { Items?: Record<string, unknown>[] }).Items ?? []);
      return {
        Items: items as Record<string, unknown>[],
        Pagination: { MaxCount: items.length },
      };
    });
}

/** 语言分组新增/编辑提交载荷 */
export interface LanguageGroupPayload {
  /** 分组 Id；新建时可空 */
  Id?: number;
  /** 是否启用 */
  IsOpen: boolean;
  /** 语言列表（JSON 字符串） */
  Languages: string;
  /** 分组名称 */
  Name: string;
}

/**
 * 编辑语言分组（新建或更新）。
 *
 * @param data 分组名称、语言列表及开关状态
 * @returns 接口操作结果
 * @see views/systemManage/languageGroupManage/index.vue
 */
export function editLanguageGroupApi(data: LanguageGroupPayload) {
  return requestClient.put('/backend/agentgrouplang/', data);
}

/**
 * 删除语言分组。
 *
 * @param id 分组 Id
 * @returns 接口操作结果
 * @see views/systemManage/languageGroupManage/index.vue
 */
export function deleteLanguageGroupApi(id: number) {
  return requestClient.delete(`/backend/agentgrouplang/${id}`);
}

/**
 * 金币售出（金币管理页「售出金币」弹窗）。
 *
 * @param data AgentId、AddScores、AgentName、Hash 等
 * @returns 接口操作结果
 * @see views/systemManage/goldManage/components/gold-sell-panel.vue
 */
export function createGoldSellApi(data: {
  AddScores: number | string;
  AgentId: number | string;
  AgentName: string;
  Hash: string;
}) {
  return requestClient.post('/backend/agentscoresell/add', data);
}

/**
 * 金币回收（金币管理页「回收金币」弹窗）。
 *
 * @param data AgentId、AddScores、AgentName、Hash、Note 等
 * @returns 接口操作结果
 * @see views/systemManage/goldManage/components/gold-sell-panel.vue
 */
export function createGoldRefundApi(data: {
  AddScores: number | string;
  AgentId: number | string;
  AgentName: string;
  Hash: string;
  Note?: string;
}) {
  return requestClient.post('/backend/agentscoresell/refund', data);
}

/**
 * 购买云币（云币管理页购买弹窗）。
 *
 * @param data Hash 及购买数量 Num
 * @returns 接口操作结果
 * @see views/systemManage/cloudCoinManage/components/cloud-coin-buy-modal.vue
 */
export function buyCloudCoinApi(data: { Hash: string; Num: number | string }) {
  return requestClient.put('/backend/cloudcoinlog/buy', data);
}

/**
 * 金币库存汇总列表（金币管理页库存 Tab 主表）。
 *
 * @param query 查询参数（日期范围等）
 * @returns Items、MoreItems 及 Pagination.MaxCount
 * @see views/systemManage/goldManage/components/gold-inventory-panel.vue
 */
export function fetchGoldInventoryApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        MoreItems?: Record<string, unknown>;
      }
    >('/backend/scoremanage/list', { params: query })
    .then(toListResult);
}

/**
 * 金币库存明细列表（含 MoreItems.TotalSum 合计）。
 *
 * @param query 查询参数（代理、日期等）
 * @returns Items、MoreItems（含 TotalSum）及 Pagination.MaxCount
 * @see views/systemManage/goldManage/components/gold-inventory-panel.vue
 */
export function fetchGoldInventoryDetailApi(query: Record<string, unknown>) {
  return requestClient
    .get<
      CloudListResult<Record<string, unknown>> & {
        MoreItems?: Record<string, unknown>;
      }
    >('/backend/scoremanage/detaillist', { params: query })
    .then(toListResult);
}

/**
 * 金币售出代理列表（金币管理页「售出/回收」Tab 主表）。
 *
 * @param query 查询参数（分页、Username 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/systemManage/goldManage/components/gold-sell-panel.vue
 */
export function fetchGoldSellListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/agentscoresell/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 金币售出明细记录（金币管理页「查看记录」弹窗）。
 *
 * @param query 查询参数（AgentName 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/systemManage/goldManage/components/gold-sell-record-panel.vue
 */
export function fetchGoldSellRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/agentscoresell/selldetaillist',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

type CloudCoinListRespond = CloudListResult<Record<string, unknown>> & {
  MoreItems?: Record<string, unknown>;
  Stock?: number | string;
  Today?: { Buy?: number | string; Consume?: number | string };
};

/**
 * 将云币列表响应归一化，并提取库存与今日汇总。
 *
 * Stock、Today 优先取顶层字段，缺失时从 MoreItems 回退。
 *
 * @param data 云币列表原始响应
 * @returns Items、Pagination、MoreItems、Stock 及 Today（Buy/Consume）
 */
function toCloudCoinListResult(data: CloudCoinListRespond) {
  const more = (data.MoreItems || {}) as Record<string, unknown>;
  const today =
    (data.Today as CloudCoinListRespond['Today']) ||
    (more.Today as CloudCoinListRespond['Today']) ||
    {};
  return {
    Items: Array.isArray(data.Items) ? data.Items : [],
    MoreItems: data.MoreItems,
    Pagination: {
      MaxCount:
        data.Pagination?.MaxCount ??
        (Array.isArray(data.Items) ? data.Items.length : 0),
    },
    Stock: data.Stock ?? more.Stock ?? 0,
    Today: {
      Buy: today.Buy ?? more.Buy ?? 0,
      Consume: today.Consume ?? more.Consume ?? 0,
    },
    Total: data.Total,
  };
}

/**
 * 云币库存概览（云币管理页「库存」Tab）。
 *
 * @param query 查询参数
 * @returns Items、Stock、Today 及 Pagination
 * @see views/systemManage/cloudCoinManage/components/stock-panel.vue
 */
export function fetchCloudCoinStockApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudCoinListRespond>('/backend/cloudcoinlog/stock', {
      params: query,
    })
    .then(toCloudCoinListResult);
}

/**
 * 云币日汇总列表（云币管理页「日汇总」Tab）。
 *
 * @param query 查询参数（日期范围等）
 * @returns Items、Stock、Today 及 Pagination
 * @see views/systemManage/cloudCoinManage/components/daily-panel.vue
 */
export function fetchCloudCoinDailyListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudCoinListRespond>('/backend/cloudcoinlog/daily', {
      params: query,
    })
    .then(toCloudCoinListResult);
}

/**
 * 云币明细流水列表（云币管理页「明细」Tab）。
 *
 * @param query 查询参数（日期、类型等）
 * @returns Items、Stock、Today 及 Pagination
 * @see views/systemManage/cloudCoinManage/components/detail-panel.vue
 */
export function fetchCloudCoinDetailListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudCoinListRespond>('/backend/cloudcoinlog/list', {
      params: query,
    })
    .then(toCloudCoinListResult);
}

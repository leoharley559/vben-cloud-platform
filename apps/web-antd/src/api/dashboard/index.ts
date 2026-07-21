import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';

/**
 * 渠道今日数据（数据总览「渠道今日数据」表格）
 *
 * 页面优先用 `RealtimeItems`，为空时回退 `Items`。
 *
 * @param query 查询参数（总览页当前传空对象）
 * @returns RealtimeItems / Items：渠道新增、付费、登录、充兑等实时行
 * @see views/dashboard/index/components/channel-today-table.vue
 */
export function fetchDashboardChannelApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    Items?: Array<Record<string, unknown>>;
    RealtimeItems?: Array<Record<string, unknown>>;
  }>('/backend/dashboard/reportchannelinfo', { params: query });
}

/**
 * 今日运营数据（数据总览「今日运营」区块）
 *
 * 含充值通道、近 15 分钟充值、兑换汇总、在线用户等。
 *
 * @param query 查询参数（总览页当前无参）
 * @returns Recharged / Recharged15 / WithDraw / OnlineUser 等今日运营结构
 * @see views/dashboard/index/components/today-ops-panel.vue
 */
export function fetchDashboardTodayApi(query: Record<string, unknown> = {}) {
  return requestClient.get<Record<string, unknown>>(
    '/backend/dashboard/reporttoday',
    { params: query },
  );
}

/**
 * 数据总览报表（「今日数据」KPI + 分时折线 / 在线总览在线人数折线）
 *
 * - `Items`：按天日汇总 → KPI 卡片
 * - `TotalHours`：按小时 → 投注/返奖/盈利/充值/兑换/充兑差折线
 * - `TotalCount`：按 5 分钟 → 在线人数折线
 *
 * @param query 可选自选日期 `Date1` / `Date2` / `Date3`（`YYYY-MM-DD`，须小于今日且不等于昨日）
 * @returns Items / TotalHours / TotalCount
 * @see views/dashboard/index/index.vue
 * @see views/dashboard/onlineSummary/index.vue
 */
export function fetchDashboardReportApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    Items?: Array<Record<string, unknown>>;
    TotalCount?: Record<string, Array<Record<string, unknown>>>;
    TotalHours?: Record<string, Array<Record<string, unknown>>>;
  }>('/backend/dashboard/reportinfo', { params: query });
}

/**
 * 在线分布汇总（在线总览：场馆 / 设备 / 地区分布）
 *
 * @returns GameResult 场馆在线；DeviceResult 设备平台；MapResult 地区/IP 分布
 * @see views/dashboard/onlineSummary/index.vue
 */
export function fetchOnlineSummaryApi() {
  return requestClient.get<{
    DeviceResult?: Array<Record<string, unknown>>;
    GameResult?: Array<Record<string, unknown>>;
    MapResult?: Array<Record<string, unknown>>;
  }>('/backend/dashboard/onlinesummary');
}

/**
 * 玩家盈亏排行（数据总览「盈利玩家 / 亏损玩家」）
 *
 * 页面用 `Users` 补全账号/渠道后，按 `SumAddGold` 拆分盈亏列表。
 *
 * @param query `GameId` / `StartTime` / `Sort`；总览页传空串，时间由后端默认（通常当日）
 * @returns ItemsWin 盈利玩家；ItemsLose 亏损玩家；Users 玩家基础信息
 * @see views/dashboard/index/components/profit-panels.vue
 */
export function fetchPlayerProfitLossApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    ItemsLose?: Array<Record<string, unknown>>;
    ItemsWin?: Array<Record<string, unknown>>;
    Users?: Array<Record<string, unknown>>;
  }>('/backend/dashboard/goldbyplayergame', { params: query });
}

/**
 * 游戏盈亏排行（数据总览「盈利游戏 / 亏损游戏」）
 *
 * 旧站约定：`ItemsLose` → 盈利游戏，`ItemsWin` → 亏损游戏（展示金额常 * -1）。
 *
 * @param query 总览页当前无参，时间由后端默认
 * @returns ItemsLose 盈利游戏；ItemsWin 亏损游戏
 * @see views/dashboard/index/components/profit-panels.vue
 */
export function fetchGameProfitLossApi(query: Record<string, unknown> = {}) {
  return requestClient.get<{
    ItemsLose?: Array<Record<string, unknown>>;
    ItemsWin?: Array<Record<string, unknown>>;
  }>('/backend/dashboard/rankbygameid', { params: query });
}

/**
 * 团队/渠道报表数据（`reportteamchannelinfo`）
 *
 * 当前前端暂无页面引用；按接口路径预留，供团队渠道相关报表使用。
 *
 * @param query 筛选/分页等查询参数
 * @returns 标准列表结构 CloudListResult（Items + Pagination）
 */
export function fetchTeamChannelDataApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/dashboard/reportteamchannelinfo',
    { params: query },
  );
}

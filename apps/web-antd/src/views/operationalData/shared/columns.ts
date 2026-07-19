import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatAmountFromCent } from '#/utils/format-amount';

const ADMIN_TYPE_MAP: Record<number, string> = {
  1: '超管',
  2: '管理员',
  3: '币商',
  4: '运营',
  5: '客服',
};

function nestedStat(
  row: Record<string, unknown> | undefined,
  key: string,
): number {
  const stats = row?.BoosStatistics as Record<string, unknown> | undefined;
  return Number(stats?.[key] || 0);
}

export const playerRankColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  { field: 'ChannelName', minWidth: 120, title: '渠道名称' },
  {
    field: 'SumAddGold',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '金额',
  },
];

/** 充兑排行金额字段为 SumGold */
export const payRankColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  { field: 'ChannelName', minWidth: 120, title: '渠道名称' },
  {
    field: 'SumGold',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '金额',
  },
];

export const endlessRankColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  { field: 'ChannelName', minWidth: 120, title: '渠道名称' },
  {
    field: 'Award',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '收益',
  },
];

export const gameProfitRankColumns: OperationListConfig['columns'] = [
  { field: 'GameId', minWidth: 100, title: '游戏ID' },
  {
    field: 'SumBet',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '押注',
  },
  {
    field: 'SumWin',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '赢分',
  },
];

export const channelAgentColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '代理账号' },
  { field: 'Agentname', minWidth: 120, title: '代理名称' },
  { field: 'SumDevice', minWidth: 100, title: '新增设备' },
  { field: 'SumReg', minWidth: 100, title: '注册人数' },
  { field: 'SumFirstPayNum', minWidth: 100, title: '首存人数' },
  {
    field: 'SumFirstPayMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '首存金额',
  },
  {
    field: 'SumPayMergerMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '充值金额',
  },
];

export const dailyReportColumns: OperationListConfig['columns'] = [
  { field: 'ReportDay', minWidth: 110, title: '日期' },
  { field: 'SumDevice', minWidth: 100, title: '新增设备' },
  { field: 'SumReg', minWidth: 100, title: '注册人数' },
  { field: 'SumFirstPayNum', minWidth: 100, title: '首存人数' },
  {
    field: 'SumFirstPayMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '首存金额',
  },
  {
    field: 'SumPayMergerMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '充值金额',
  },
  {
    field: 'SumWithdrawMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '兑换金额',
  },
];

export const groupDailyColumns: OperationListConfig['columns'] = [
  { field: 'ReportDay', minWidth: 110, title: '日期' },
  { field: 'GroupName', minWidth: 120, title: '分组' },
  { field: 'SumReg', minWidth: 100, title: '注册人数' },
  {
    field: 'SumPayMergerMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '充值金额',
  },
  {
    field: 'SumWithdrawMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '兑换金额',
  },
];

export const endlessAgentColumns: OperationListConfig['columns'] = [
  { field: 'PlayerName', minWidth: 120, title: '账号' },
  { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
  { field: 'AcSum', minWidth: 100, title: '团队人数' },
  {
    field: 'Award',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '收益',
  },
];

export const betAnalysisColumns: OperationListConfig['columns'] = [
  { field: 'ReportDay', minWidth: 110, title: '日期' },
  { field: 'BetType', minWidth: 100, title: '投注类型' },
  { field: 'BetNumberOfPeople', minWidth: 100, title: '投注人数' },
  { field: 'BetCount', minWidth: 100, title: '投注次数' },
  {
    field: 'BetGold',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '投注金额',
  },
  {
    field: 'WinGold',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '赢分',
  },
  {
    field: 'ValidWater',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '有效投注',
  },
];

export const bossEmployeeColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '账号' },
  {
    field: 'AdminType',
    formatter: (value) => ADMIN_TYPE_MAP[Number(value)] || String(value ?? '-'),
    minWidth: 100,
    title: '账号类型',
  },
  {
    field: 'ReplacementOrder',
    formatter: (_value, row) => String(nestedStat(row, 'ReplacementOrder')),
    minWidth: 100,
    title: '充值补单',
  },
  {
    field: 'GameNoticeAdd',
    formatter: (_value, row) => String(nestedStat(row, 'GameNoticeAdd')),
    minWidth: 100,
    title: '运营公告',
  },
  {
    field: 'CustomerSupport',
    formatter: (_value, row) => String(nestedStat(row, 'CustomerSupport')),
    minWidth: 100,
    title: '客服接待',
  },
  {
    field: 'CoinDealerSupporter',
    formatter: (_value, row) => String(nestedStat(row, 'CoinDealerSupporter')),
    minWidth: 100,
    title: '币商支持',
  },
];

import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

export const statementColumns: OperationListConfig['columns'] = [
  { field: 'ReportDay', minWidth: 110, title: '日期' },
  { field: 'AgentName', minWidth: 120, title: '场馆' },
  { field: 'SumBetNum', minWidth: 100, title: '投注人数' },
  {
    field: 'SelfBetGold',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '投注金额',
  },
  {
    field: 'SelfWinGold',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '赢分金额',
  },
  {
    field: 'ProfitLose',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '盈亏',
  },
];

export const gameStatementColumns: OperationListConfig['columns'] = [
  { field: 'GameTypeName', minWidth: 120, title: '游戏类型' },
  {
    field: 'SumBetMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '投注金额',
  },
  {
    field: 'SumProfit',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '盈利',
  },
  { field: 'SumBetNum', minWidth: 100, title: '投注人数' },
];

export const playerStatisticsColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'PlayerId', minWidth: 110, title: '玩家Id' },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  { field: 'ChannelId', minWidth: 110, title: '所属渠道' },
  {
    field: 'PayMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '充值金额',
  },
  {
    field: 'WithDrawMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '兑换金额',
  },
];

export const userWinLossColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  { field: 'ChannelName', minWidth: 120, title: '所属渠道' },
  {
    field: 'SumBetGold',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '投注额',
  },
  {
    field: 'SumValidWater',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '有效投注',
  },
];

export const playerAnalyzeColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '账号' },
  { field: 'PackageName', minWidth: 120, title: '包体' },
  { field: 'ChannelId', minWidth: 110, title: '渠道' },
  {
    field: 'Profit',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 110,
    title: '盈利',
  },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '注册时间',
  },
];

export const depositWithdrawalColumns: OperationListConfig['columns'] = [
  { field: 'PlayerName', minWidth: 120, title: '登录名' },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  { field: 'PromoterUserName', minWidth: 120, title: '所属代理' },
  {
    field: 'SumDeposit',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '总存款',
  },
  {
    field: 'SumWithdrawal',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '总取款',
  },
];

export const distributionColumns: OperationListConfig['columns'] = [
  { field: 'IpName', minWidth: 140, title: '地区' },
  {
    field: 'CountNum',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '数量',
  },
];

export const virtualReportColumns: OperationListConfig['columns'] = [
  { field: 'Id', minWidth: 80, title: '任务ID' },
  { field: 'TaskName', minWidth: 160, title: '任务名称' },
  { field: 'Creator', minWidth: 100, title: '创建人' },
  {
    field: 'Status',
    formatter: (value) =>
      Number(value) === 1
        ? '运行中'
        : Number(value) === 2
          ? '暂停'
          : String(value ?? '-'),
    minWidth: 100,
    title: '状态',
  },
];

export const liveStatementColumns: OperationListConfig['columns'] = [
  { field: 'ReportDay', minWidth: 110, title: '日期' },
  { field: 'SteamingName', minWidth: 140, title: '直播间' },
  { field: 'ViewCount', minWidth: 100, title: '观看人数' },
  {
    field: 'GiftAmount',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '礼物金额',
  },
];

export const keepDataUserColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  { field: 'PackageName', minWidth: 120, title: '产品包' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const operationDailyWinColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  {
    field: 'SumAddGold',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '盈利',
  },
];

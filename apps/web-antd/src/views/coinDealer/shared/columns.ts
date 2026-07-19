import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

export const coinDealerAccountColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '币商账号' },
  { field: 'Nickname', minWidth: 120, title: '昵称' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '创建时间',
  },
];

export const coinDealerSellColumns: OperationListConfig['columns'] = [
  { field: 'CoinDealerName', minWidth: 120, title: '币商账号' },
  { field: 'OrderId', minWidth: 140, title: '订单编号' },
  {
    field: 'DebitRmb',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '授信金额',
  },
  { field: 'CreateAdminName', minWidth: 100, title: '操作人' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const coinDealerPaybackColumns: OperationListConfig['columns'] = [
  { field: 'CoinDealerName', minWidth: 120, title: '币商账号' },
  { field: 'OrderId', minWidth: 140, title: '订单编号' },
  {
    field: 'PaybackRmb',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '还款金额',
  },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const coinDealerServiceRecordColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '客服账号' },
  { field: 'PlayerName', minWidth: 120, title: '玩家昵称' },
  { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const coinDealerStatisticsColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '客服账号' },
  { field: 'Nickname', minWidth: 120, title: '昵称' },
  { field: 'ServiceCount', minWidth: 100, title: '服务次数' },
  {
    field: 'ServiceMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '服务金额',
  },
];

export const coinDealerSellPlayerColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'PlayerName', minWidth: 100, title: '昵称' },
  {
    field: 'SellMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '售币金额',
  },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const coinDealerEasyReplyColumns: OperationListConfig['columns'] = [
  { field: 'GroupName', minWidth: 140, title: '分组' },
  { field: 'Content', minWidth: 200, title: '内容' },
  { field: 'Sort', minWidth: 80, title: '排序' },
];

export const coinDealerAnnouncementColumns: OperationListConfig['columns'] = [
  { field: 'Content', minWidth: 220, title: '跑马灯内容' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const coinDealerWelcomeColumns: OperationListConfig['columns'] = [
  { field: 'Content', minWidth: 220, title: '欢迎语' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const coinDealerWorkTimeColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '币商账号' },
  { field: 'WorkDate', minWidth: 120, title: '日期' },
  { field: 'OnlineSeconds', minWidth: 100, title: '在线秒数' },
];

import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { TASK_STATUS_MAP } from '#/types/telesales-center';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';
import { vipLevelOpsColumn } from '#/utils/vip-level';

export const taskListColumns: OperationListConfig['columns'] = [
  { field: 'TaskName', minWidth: 140, title: '任务名称' },
  { field: 'AssignedPlayer', minWidth: 120, title: '分配人员' },
  { field: 'AssignMenu', minWidth: 120, title: '分配菜单' },
  { field: 'CreatedBy', minWidth: 100, title: '创建人' },
  {
    field: 'Status',
    formatter: (value) =>
      TASK_STATUS_MAP[Number(value)] || String(value ?? '-'),
    minWidth: 100,
    title: '任务状态',
  },
  { field: 'ClientNumber', minWidth: 100, title: '客户总数' },
  { field: 'UnassignedNumber', minWidth: 100, title: '未分配数' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '创建时间',
  },
];

export const myTaskListColumns: OperationListConfig['columns'] = [
  { field: 'TaskName', minWidth: 140, title: '任务名称' },
  { field: 'AssignMenu', minWidth: 120, title: '分配菜单' },
  { field: 'TotalCall', minWidth: 100, title: '会员数' },
  { field: 'AnswerCall', minWidth: 100, title: '已接听' },
  { field: 'NotCall', minWidth: 100, title: '未拨打' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '创建时间',
  },
];

export const myTaskDetailColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  { field: 'PlayerName', minWidth: 100, title: '姓名' },
  { field: 'PhoneNumber', minWidth: 120, title: '手机号' },
  { field: 'SalesResult', minWidth: 100, title: '行销结果' },
  { field: 'IsCalled', minWidth: 90, title: '是否拨打' },
  { field: 'Remark', minWidth: 160, title: '备注' },
];

export const playerAssignedColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  { field: 'PlayerName', minWidth: 100, title: '姓名' },
  { field: 'PromoterUserName', minWidth: 120, title: '上级代理' },
  { field: 'PlayerPhoneNumber', minWidth: 120, title: '手机号' },
  { field: 'AssignMenu', minWidth: 120, title: '分配菜单' },
  {
    field: 'AssignTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '分配时间',
  },
];

export const autoAssignConfigColumns: OperationListConfig['columns'] = [
  { field: 'MenuName', minWidth: 140, title: '分配菜单' },
  { field: 'AdminName', minWidth: 120, title: '客服账号' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const seatListColumns: OperationListConfig['columns'] = [
  { field: 'SeatNumber', minWidth: 100, title: '坐席号' },
  { field: 'AdminName', minWidth: 120, title: '客服账号' },
  { field: 'ServiceProviderAccount', minWidth: 140, title: '服务商账号' },
  {
    field: 'UpdateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '最后编辑时间',
  },
];

export const salesCategoryColumns: OperationListConfig['columns'] = [
  { field: 'SalesResult', minWidth: 140, title: '行销结果' },
  {
    field: 'UpdateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '最后编辑时间',
  },
  { field: 'UpdateBy', minWidth: 100, title: '更新人' },
];

export const serviceProviderColumns: OperationListConfig['columns'] = [
  { field: 'ServiceProviderName', minWidth: 140, title: '服务商名称' },
  { field: 'Account', minWidth: 120, title: '账号' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const callRecordColumns: OperationListConfig['columns'] = [
  { field: 'SupportName', minWidth: 120, title: '客服账号' },
  { field: 'AccountName', minWidth: 120, title: '玩家账号' },
  { field: 'SeatNumber', minWidth: 100, title: '坐席号' },
  { field: 'CallLength', minWidth: 100, title: '通话时长(秒)' },
  {
    field: 'CallTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '通话时间',
  },
];

export const callStatisticsColumns: OperationListConfig['columns'] = [
  { field: 'SupportName', minWidth: 120, title: '客服账号' },
  { field: 'SeatNumber', minWidth: 100, title: '坐席号' },
  { field: 'TotalCall', minWidth: 100, title: '拨打数' },
  { field: 'AnswerCall', minWidth: 100, title: '接听数' },
  { field: 'CallLength', minWidth: 120, title: '通话时长(秒)' },
];

export const telesalesPlayerColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
  { field: 'RealName', minWidth: 100, title: '姓名' },
  { field: 'PromoterUserName', minWidth: 120, title: '上级代理' },
  { field: 'PhoneNumber', minWidth: 120, title: '手机号' },
  { field: 'SalesResult', minWidth: 100, title: '行销结果' },
  { field: 'TaskName', minWidth: 140, title: '任务名称' },
  {
    field: 'AssignTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '分配时间',
  },
];

export const vipPlayerColumns: OperationListConfig['columns'] = [
  ...telesalesPlayerColumns.slice(0, 4),
  vipLevelOpsColumn,
  ...telesalesPlayerColumns.slice(4),
  {
    field: 'FirstDepositAmount',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '首存金额',
  },
];

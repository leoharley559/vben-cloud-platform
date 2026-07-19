import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatOperationDateTime } from '#/utils/operation-status';

export const liveRoomColumns: OperationListConfig['columns'] = [
  { field: 'Title', minWidth: 140, title: '直播间' },
  { field: 'SteamerName', minWidth: 120, title: '主播' },
  {
    field: 'SteamStatus',
    formatter: (value) =>
      (({ 1: '直播中', 2: '已结束', 0: '未开始' }) as Record<number, string>)[
        Number(value)
      ] || String(value ?? '-'),
    minWidth: 90,
    title: '状态',
  },
  { field: 'Hot', minWidth: 80, title: '热度' },
];

export const streamerColumns: OperationListConfig['columns'] = [
  { field: 'SteamerName', minWidth: 120, title: '主播名' },
  { field: 'Account', minWidth: 120, title: '账号' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const matchScheduleColumns: OperationListConfig['columns'] = [
  { field: 'MatchName', minWidth: 160, title: '赛事' },
  { field: 'HomeName', minWidth: 120, title: '主队' },
  { field: 'AwayName', minWidth: 120, title: '客队' },
  {
    field: 'MatchTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '开赛时间',
  },
];

export const pushOrderColumns: OperationListConfig['columns'] = [
  { field: 'Title', minWidth: 140, title: '标题' },
  { field: 'MatchName', minWidth: 140, title: '赛事' },
  {
    field: 'Status',
    formatter: (value) =>
      (({ 1: '已结束', 2: '进行中', 3: '未开始' }) as Record<number, string>)[
        Number(value)
      ] || String(value ?? '-'),
    minWidth: 90,
    title: '状态',
  },
];

export const landingPageColumns: OperationListConfig['columns'] = [
  { field: 'Name', minWidth: 140, title: '名称' },
  { field: 'Domain', minWidth: 160, title: '域名' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const liveEventColumns: OperationListConfig['columns'] = [
  { field: 'Title', minWidth: 140, title: '活动标题' },
  { field: 'SteamingTitle', minWidth: 120, title: '直播间' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '进行中' : '关闭'),
    minWidth: 90,
    title: '状态',
  },
];

export const pkColumns: OperationListConfig['columns'] = [
  { field: 'ThemeName', minWidth: 140, title: 'PK主题' },
  { field: 'SteamerName', minWidth: 120, title: '主播' },
  {
    field: 'Status',
    minWidth: 90,
    title: '状态',
  },
];

export const guessColumns: OperationListConfig['columns'] = [
  { field: 'Title', minWidth: 140, title: '竞猜主题' },
  { field: 'SteamingTitle', minWidth: 120, title: '直播间' },
  {
    field: 'Status',
    minWidth: 90,
    title: '状态',
  },
];

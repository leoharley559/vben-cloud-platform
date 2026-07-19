import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatOperationDateTime } from '#/utils/operation-status';

export const chatroomRoomColumns: OperationListConfig['columns'] = [
  { field: 'Title', minWidth: 140, title: '聊天室' },
  { field: 'SteamerName', minWidth: 120, title: '主播' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '开启' : '关闭'),
    minWidth: 90,
    title: '状态',
  },
  { field: 'OnlineNum', minWidth: 90, title: '在线' },
];

export const chatroomMuteColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'Remark', minWidth: 140, title: '原因' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const chatroomInterceptColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'Content', minWidth: 180, title: '内容' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const chatroomChatRecordColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'Content', minWidth: 180, title: '消息' },
  { field: 'RoomTitle', minWidth: 120, title: '聊天室' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const chatroomWordColumns: OperationListConfig['columns'] = [
  { field: 'Word', minWidth: 140, title: '敏感词' },
  { field: 'TypeName', minWidth: 120, title: '分类' },
];

export const chatroomPhraseColumns: OperationListConfig['columns'] = [
  { field: 'Content', minWidth: 180, title: '常用语' },
  { field: 'TagName', minWidth: 120, title: '标签' },
];

export const chatroomGiftColumns: OperationListConfig['columns'] = [
  { field: 'GiftName', minWidth: 120, title: '礼物' },
  { field: 'Price', minWidth: 90, title: '价格' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const chatroomWelcomeColumns: OperationListConfig['columns'] = [
  { field: 'PlanName', minWidth: 140, title: '方案' },
  { field: 'Content', minWidth: 200, title: '欢迎语' },
];

export const chatroomStickerColumns: OperationListConfig['columns'] = [
  { field: 'TagName', minWidth: 140, title: '贴图分类' },
  { field: 'Sort', minWidth: 80, title: '排序' },
];

import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatOperationDateTime } from '#/utils/operation-status';

export const serviceAccountColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '客服账号' },
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

export const serviceSeatColumns: OperationListConfig['columns'] = [
  { field: 'SeatName', minWidth: 120, title: '席位' },
  { field: 'Username', minWidth: 120, title: '客服账号' },
  {
    field: 'OnlineStatus',
    formatter: (value) => {
      const map: Record<number, string> = {
        0: '离线',
        1: '在线',
        2: '忙碌',
      };
      return map[Number(value)] || String(value ?? '-');
    },
    minWidth: 90,
    title: '状态',
  },
];

export const serviceWorkTimeColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '客服账号' },
  { field: 'WorkDate', minWidth: 120, title: '日期' },
  { field: 'OnlineSeconds', minWidth: 100, title: '在线秒数' },
  { field: 'BusySeconds', minWidth: 100, title: '忙碌秒数' },
];

export const serviceRecordColumns: OperationListConfig['columns'] = [
  { field: 'PlayerName', minWidth: 120, title: '玩家昵称' },
  { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
  { field: 'Username', minWidth: 120, title: '客服账号' },
  { field: 'QuestionTypeName', minWidth: 120, title: '问题类型' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '进线时间',
  },
];

export const serviceStatisticsColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '客服账号' },
  { field: 'Nickname', minWidth: 120, title: '昵称' },
  { field: 'ServiceCount', minWidth: 100, title: '服务次数' },
  { field: 'AvgDuration', minWidth: 100, title: '平均时长' },
];

export const serviceSatisfactionColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '客服账号' },
  { field: 'Score', minWidth: 90, title: '评分' },
  { field: 'EvalCount', minWidth: 100, title: '评价数' },
];

export const serviceInlineColumns: OperationListConfig['columns'] = [
  { field: 'StatDate', minWidth: 120, title: '日期' },
  { field: 'InlineCount', minWidth: 100, title: '进线数' },
  { field: 'MissCount', minWidth: 100, title: '错过数' },
];

export const easyReplyColumns: OperationListConfig['columns'] = [
  { field: 'Content', minWidth: 200, title: '常用语' },
  { field: 'CategoryName', minWidth: 120, title: '分类' },
  { field: 'Sort', minWidth: 80, title: '排序' },
];

export const blackListColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'Remark', minWidth: 160, title: '备注' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const filterWordColumns: OperationListConfig['columns'] = [
  { field: 'Word', minWidth: 140, title: '敏感词' },
  { field: 'Remark', minWidth: 140, title: '备注' },
];

export const playerMarkColumns: OperationListConfig['columns'] = [
  { field: 'MarkName', minWidth: 120, title: '标记' },
  { field: 'Color', minWidth: 90, title: '颜色' },
  { field: 'Sort', minWidth: 80, title: '排序' },
];

export const evaluationLabelColumns: OperationListConfig['columns'] = [
  { field: 'LabelName', minWidth: 140, title: '标签' },
  { field: 'Score', minWidth: 90, title: '分值' },
];

export const questionTypeColumns: OperationListConfig['columns'] = [
  { field: 'TypeName', minWidth: 140, title: '问题类型' },
  { field: 'Sort', minWidth: 80, title: '排序' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const aiAssistantColumns: OperationListConfig['columns'] = [
  { field: 'Name', minWidth: 140, title: '助手名称' },
  { field: 'CategoryName', minWidth: 120, title: '分类' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const audioEffectColumns: OperationListConfig['columns'] = [
  { field: 'Name', minWidth: 140, title: '音效名称' },
  { field: 'FileName', minWidth: 160, title: '文件' },
];

export const playerOrderColumns: OperationListConfig['columns'] = [
  { field: 'OrderId', minWidth: 140, title: '工单号' },
  { field: 'PlayerName', minWidth: 120, title: '玩家' },
  { field: 'QuestionTypeName', minWidth: 120, title: '问题类型' },
  { field: 'StatusName', minWidth: 100, title: '状态' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '创建时间',
  },
];

export const aiKnowledgeColumns: OperationListConfig['columns'] = [
  { field: 'Question', minWidth: 180, title: '问题' },
  { field: 'Answer', minWidth: 200, title: '答案' },
  { field: 'CategoryName', minWidth: 120, title: '分类' },
];

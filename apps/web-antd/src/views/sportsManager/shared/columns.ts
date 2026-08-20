import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatSportsSource } from '#/types/sports-manager';
import { formatOperationDateTime } from '#/utils/operation-status';

export const matchManagerColumns: OperationListConfig['columns'] = [
  {
    field: 'Srctp',
    formatter: (value) => formatSportsSource(value),
    minWidth: 80,
    title: '来源',
  },
  { field: 'SportId', minWidth: 90, title: '赛事Id' },
  { field: 'NameCn', minWidth: 140, title: '赛事' },
  { field: 'HomeNameCn', minWidth: 120, title: '主场' },
  { field: 'AwayNameCn', minWidth: 120, title: '客场' },
  { field: 'HotLevel', minWidth: 80, title: '热度' },
  {
    field: 'Date',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '开赛时间',
  },
];

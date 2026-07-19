import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

export const roleColumns: OperationListConfig['columns'] = [
  { field: 'Id', minWidth: 80, title: 'ID' },
  { field: 'Name', minWidth: 160, title: '角色名称' },
  { field: 'Description', minWidth: 200, title: '备注' },
];

export const languageGroupColumns: OperationListConfig['columns'] = [
  { field: 'Name', minWidth: 140, title: '群组名称' },
  {
    field: 'Languages',
    formatter: (value) =>
      Array.isArray(value)
        ? value
            .map((item) =>
              typeof item === 'string'
                ? item
                : String((item as Record<string, unknown>).langKey || item),
            )
            .join(', ')
        : String(value ?? '-'),
    minWidth: 220,
    title: '语言',
  },
  {
    field: 'IsOpen',
    formatter: (value) => (value ? '开启' : '关闭'),
    minWidth: 90,
    title: '状态',
  },
];

export const goldSellColumns: OperationListConfig['columns'] = [
  { field: 'AgentName', minWidth: 120, title: '代理账号' },
  {
    field: 'TotalDebitRmb',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '累计授信',
  },
  {
    field: 'TotalPayBackRmb',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '累计追回',
  },
];

export const goldSellRecordColumns: OperationListConfig['columns'] = [
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
  { field: 'AgentName', minWidth: 120, title: '代理账号' },
  {
    field: 'DebitRmb',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '金额',
  },
  { field: 'CreateAdminName', minWidth: 100, title: '操作人' },
];

export const cloudCoinStockColumns: OperationListConfig['columns'] = [
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
  { field: 'IncomeNum', minWidth: 100, title: '入库' },
  { field: 'ConsumeNum', minWidth: 100, title: '消耗' },
  { field: 'RemainNum', minWidth: 100, title: '结余' },
];

export const cloudCoinDailyColumns: OperationListConfig['columns'] = [
  { field: 'Date', minWidth: 120, title: '日期' },
  { field: 'BuyNum', minWidth: 100, title: '购买' },
  { field: 'ConsumeNum', minWidth: 100, title: '消耗' },
  { field: 'RemainNum', minWidth: 100, title: '结余' },
];

export const cloudCoinDetailColumns: OperationListConfig['columns'] = [
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
  { field: 'TypeName', minWidth: 120, title: '类型' },
  { field: 'Num', minWidth: 100, title: '数量' },
  { field: 'Remark', minWidth: 160, title: '备注' },
];

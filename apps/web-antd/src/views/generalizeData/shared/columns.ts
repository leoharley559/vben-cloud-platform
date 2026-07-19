import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatAmountFromCent } from '#/utils/format-amount';

export const channelDatasColumns: OperationListConfig['columns'] = [
  { field: 'NowDate', minWidth: 120, title: '日期' },
  { field: 'SumRegDevice', minWidth: 100, title: '新增设备' },
  { field: 'SumReg', minWidth: 100, title: '新增用户' },
  { field: 'SumLogin', minWidth: 100, title: '登录人数' },
  { field: 'SumPayMergerNum', minWidth: 100, title: '付费人数' },
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
  {
    field: 'SumCostMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '投放成本',
  },
];

export const channelRecoupColumns: OperationListConfig['columns'] = [
  { field: 'RegisterPeriod', minWidth: 120, title: '注册周期' },
  { field: 'RegNum', minWidth: 100, title: '注册人数' },
  { field: 'FirstPayNum', minWidth: 100, title: '首存人数' },
];

export const dataWriteColumns: OperationListConfig['columns'] = [
  { field: 'ReportDate', minWidth: 120, title: '日期' },
  { field: 'ChannelId', minWidth: 100, title: '渠道ID' },
  { field: 'TemplateId', minWidth: 100, title: '落地页ID' },
  {
    field: 'CostMoney',
    formatter: (value) => formatAmountFromCent(Number(value)),
    minWidth: 120,
    title: '投放金额',
  },
  { field: 'ExposureNum', minWidth: 100, title: '曝光' },
  { field: 'ClickNum', minWidth: 100, title: '点击' },
  { field: 'Uv', minWidth: 90, title: 'UV' },
  { field: 'Ip', minWidth: 90, title: 'IP' },
  { field: 'DownloadNum', minWidth: 100, title: '下载' },
];

export const dropChangeColumns: OperationListConfig['columns'] = [
  { field: 'channel_id', minWidth: 120, title: '渠道号' },
  { field: 'download_count', minWidth: 100, title: '点击' },
  { field: 'page_view', minWidth: 100, title: 'UV' },
  { field: 'unique_page_view', minWidth: 100, title: 'IP' },
  { field: 'app_login_count', minWidth: 100, title: '激活' },
  { field: 'device_count', minWidth: 100, title: '新增设备' },
  { field: 'player_count', minWidth: 100, title: '新增用户' },
  { field: 'pay_count', minWidth: 100, title: '付费用户' },
];

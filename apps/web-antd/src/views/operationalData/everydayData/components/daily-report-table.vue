<script lang="ts" setup>
import type { ColumnsType } from 'ant-design-vue/es/table';

import type { DailyReportRow } from '#/utils/everyday-data-calc';

import { computed, h } from 'vue';

import { Table, Tooltip } from 'ant-design-vue';

import {
  formatDevicePlatform,
  formatVipLevel,
} from '#/utils/everyday-report-format';
import { formatAmountFromCent } from '#/utils/format-amount';
import { antTableScrollY } from '#/utils/table-height';

defineOptions({ name: 'DailyReportTable' });

const props = withDefaults(
  defineProps<{
    exchangeRate?: number;
    list: DailyReportRow[];
    loading?: boolean;
    variant?: DailyReportTableVariant;
  }>(),
  {
    exchangeRate: 1,
    loading: false,
    variant: 'standard',
  },
);

export type DailyReportTableVariant = 'device' | 'package' | 'standard' | 'vip';

function money(value: unknown) {
  return formatAmountFromCent(Number(value || 0) * props.exchangeRate);
}

function percent(value: unknown) {
  const text = value == null || value === '' ? '0' : String(value);
  return `${text}%`;
}

function coloredMoney(value: unknown) {
  const num = Number(value || 0);
  const color = num > 0 ? '#059669' : (num < 0 ? '#ef4444' : undefined);
  return h('span', { style: color ? { color } : undefined }, money(value));
}

function leadColumns(): ColumnsType<DailyReportRow> {
  if (props.variant === 'vip') {
    return [
      { dataIndex: 'ReportDay', fixed: 'left', title: '日期', width: 110 },
      {
        customRender: ({ record }) => formatVipLevel(record.VIPLevel),
        title: 'VIP等级',
        width: 110,
      },
      { dataIndex: 'SumLogin', title: '登录账户', width: 110 },
    ];
  }

  const cols: ColumnsType<DailyReportRow> = [
    { dataIndex: 'ReportDay', fixed: 'left', title: '日期', width: 110 },
  ];

  if (props.variant === 'device') {
    cols.push({
      customRender: ({ record }) => formatDevicePlatform(record.DevicePlatform),
      title: '设备类型',
      width: 110,
    });
  }

  cols.push(
    {
      dataIndex: 'SumDevice',
      title: () =>
        h('span', [
          '新增访问 ',
          h(Tooltip, { title: '按设备去重统计新增访问；注册按账号统计' }, () =>
            h('span', { class: 'text-gray-400' }, 'ⓘ'),
          ),
        ]),
      width: 110,
    },
    { dataIndex: 'SumReg', title: '注册账号', width: 110 },
    { dataIndex: 'SumFirstPayNum', title: '首存人数', width: 110 },
    {
      customRender: ({ record }) => percent(record.PercentConversion),
      title: '转化率(%)',
      width: 110,
    },
    {
      customRender: ({ record }) => money(record.SumFirstPayMoney),
      title: '首存金额(元)',
      width: 110,
    },
    {
      customRender: ({ record }) => money(record.AverageFirstPayMoney),
      title: '人均首存(元)',
      width: 110,
    },
    { dataIndex: 'SumLogin', title: '登录账户', width: 110 },
  );

  return cols;
}

function tailColumns(): ColumnsType<DailyReportRow> {
  const incomeTitle = props.variant === 'standard' ? '公司收入' : '推广收入';
  const cols: ColumnsType<DailyReportRow> = [
    { dataIndex: 'SumPayMergerNum', title: '存款人数', width: 110 },
    { dataIndex: 'SumWithdrawNum', title: '取款人数', width: 110 },
    {
      customRender: ({ record }) => money(record.SumPayMergerMoney),
      title: '存款金额(元)',
      width: 110,
    },
    {
      customRender: ({ record }) => money(record.SumWithdrawMoney),
      title: '取款金额(元)',
      width: 110,
    },
    {
      customRender: ({ record }) => coloredMoney(record.DiffPayWithdrawMoney),
      title: '存提差(元)',
      width: 110,
    },
    {
      customRender: ({ record }) => percent(record.PercentPayWithdraw),
      title: '提存率(%)',
      width: 110,
    },
    { dataIndex: 'SumTransBetNum1', title: '投注人数', width: 110 },
    {
      customRender: ({ record }) => money(record.SumTransBetMoney1),
      title: '投注金额(元)',
      width: 110,
    },
    {
      customRender: ({ record }) => money(record.SumTransBetValidMoney1),
      title: '有效投注额(元)',
      width: 110,
    },
    {
      customRender: ({ record }) => money(record.SumTransWinMoney1),
      title: () =>
        h('span', [
          '派送金额 ',
          h(Tooltip, { title: '玩家盈亏' }, () =>
            h('span', { class: 'cursor-help text-gray-400' }, 'ⓘ'),
          ),
        ]),
      width: 110,
    },
    {
      customRender: ({ record }) => coloredMoney(record.CompanyProfitMoney),
      title: '公司输赢',
      width: 110,
    },
    {
      customRender: ({ record }) => percent(record.PercentProfit),
      title: '盈余比例(%)',
      width: 110,
    },
    {
      customRender: ({ record }) =>
        money(-Number(record.SumAccountChangeSumNum || 0)),
      title: '账户调整',
      width: 110,
    },
    {
      customRender: ({ record }) => money(record.SumRedSumNum),
      title: '红利',
      width: 110,
    },
    {
      customRender: ({ record }) => money(record.SumBetWaterMoney),
      title: '返水',
      width: 110,
    },
  ];

  if (props.variant === 'standard') {
    cols.push({
      customRender: ({ record }) => money(record.SumAgentCommissionSumNum),
      title: '代理佣金',
      width: 110,
    });
  }

  cols.push({
    customRender: ({ record }) => coloredMoney(record.CompanyIncomeMoney),
    title: incomeTitle,
    width: 110,
  });

  return cols;
}

const columns = computed<ColumnsType<DailyReportRow>>(() => [
  ...leadColumns(),
  ...tailColumns(),
]);

function rowKey(row: DailyReportRow) {
  if (props.variant === 'device') {
    return `${row.ReportDay}-${row.DevicePlatform}`;
  }
  if (props.variant === 'vip') {
    return `${row.ReportDay}-${row.VIPLevel}`;
  }
  return String(row.ReportDay ?? '');
}
</script>

<template>
  <Table
    :columns="columns"
    :data-source="list"
    :loading="loading"
    :pagination="false"
    :row-key="rowKey"
    :scroll="{ x: variant === 'vip' ? 2200 : 2860, y: antTableScrollY(80) }"
    bordered
    size="small"
  />
</template>

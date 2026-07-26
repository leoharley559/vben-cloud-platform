<script lang="ts" setup>
import type { ColumnsType } from 'ant-design-vue/es/table';

import { computed, h } from 'vue';

import { Table, Tooltip } from 'ant-design-vue';

import { formatAmountFromCent } from '#/utils/format-amount';
import type { GroupDailyRow } from '#/utils/group-daily';
import { antTableScrollY } from '#/utils/table-height';

defineOptions({ name: 'GroupDailyTable' });

const props = withDefaults(
  defineProps<{
    list: GroupDailyRow[];
    loading?: boolean;
    /** true：显示单元代理人数；false：显示代理编号/名称（Level=4） */
    showAgentCount?: boolean;
    /** 1 日报隐藏净输赢/场馆费用；2 月报显示 */
    reportType?: number;
  }>(),
  {
    loading: false,
    reportType: 1,
    showAgentCount: true,
  },
);

const emit = defineEmits<{
  drill: [row: GroupDailyRow, level: 1 | 2 | 3 | 4];
}>();

function money(value: unknown) {
  return formatAmountFromCent(Number(value || 0));
}

function percent(value: unknown) {
  const text = value == null || value === '' ? '0' : String(value);
  return `${text}%`;
}

function coloredMoney(value: unknown) {
  const num = Number(value || 0);
  const color = num > 0 ? '#059669' : num < 0 ? '#ef4444' : undefined;
  return h('span', { style: color ? { color } : undefined }, money(value));
}

function drillCell(
  text: unknown,
  enabled: unknown,
  level: 1 | 2 | 3 | 4,
  row: GroupDailyRow,
) {
  if (!enabled) {
    return h('span', String(text ?? ''));
  }
  return h(
    'span',
    {
      class: 'cursor-pointer text-blue-600 hover:underline',
      onClick: () => emit('drill', row, level),
    },
    String(text ?? ''),
  );
}

const columns = computed<ColumnsType<GroupDailyRow>>(() => {
  const cols: ColumnsType<GroupDailyRow> = [
    {
      dataIndex: 'ReportDay',
      fixed: 'left',
      title: '日期',
      width: 110,
    },
    {
      customRender: ({ record }) =>
        drillCell(record.GroupName1, record.GroupStyle1, 1, record),
      fixed: 'left',
      title: '一级',
      width: 100,
    },
    {
      customRender: ({ record }) =>
        drillCell(record.GroupName2, record.GroupStyle2, 2, record),
      fixed: 'left',
      title: '二级',
      width: 100,
    },
    {
      customRender: ({ record }) =>
        drillCell(record.GroupName3, record.GroupStyle3, 3, record),
      fixed: 'left',
      title: '三级',
      width: 100,
    },
    {
      customRender: ({ record }) =>
        drillCell(record.GroupName, record.GroupStyle, 4, record),
      fixed: 'left',
      title: '四级',
      width: 100,
    },
  ];

  if (props.showAgentCount) {
    cols.push({
      dataIndex: 'AgentCount',
      fixed: 'left',
      title: '单元代理人数',
      width: 110,
    });
  } else {
    cols.push(
      {
        dataIndex: 'Username',
        fixed: 'left',
        title: '代理编号',
        width: 110,
      },
      {
        dataIndex: 'Name',
        fixed: 'left',
        title: '代理名称',
        width: 110,
      },
    );
  }

  cols.push(
    { dataIndex: 'SumReg', title: '注册人数', width: 90 },
    { dataIndex: 'SumFirstPayNum', title: '首存人数', width: 90 },
    {
      customRender: ({ record }) => percent(record.PercentConversion),
      title: '转化率',
      width: 90,
    },
    {
      customRender: ({ record }) => money(record.SumFirstPayMoney),
      title: '首存金额',
      width: 100,
    },
    {
      customRender: ({ record }) => money(record.AverageFirstPayMoney),
      title: '人均首存',
      width: 100,
    },
    { dataIndex: 'SumPayMergerNum', title: '存款人数', width: 90 },
    { dataIndex: 'SumWithdrawNum', title: '取款人数', width: 90 },
    {
      customRender: ({ record }) => money(record.SumPayMergerMoney),
      title: '存款金额',
      width: 100,
    },
    {
      customRender: ({ record }) => money(record.SumWithdrawMoney),
      title: '取款金额',
      width: 100,
    },
    {
      customRender: ({ record }) => coloredMoney(record.DiffPayWithdrawMoney),
      title: '存提差',
      width: 100,
    },
    {
      customRender: ({ record }) => percent(record.PercentPayWithdraw),
      title: '提存率',
      width: 90,
    },
    { dataIndex: 'SumTransBetNum1', title: '投注人数', width: 90 },
    {
      customRender: ({ record }) => money(record.SumTransBetMoney1),
      title: '投注金额',
      width: 100,
    },
    {
      customRender: ({ record }) => money(record.SumTransBetValidMoney1),
      title: '有效投注',
      width: 100,
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
      width: 100,
    },
    {
      customRender: ({ record }) => coloredMoney(record.CompanyProfitMoney),
      title: '公司输赢',
      width: 100,
    },
  );

  if (props.reportType === 2) {
    cols.push({
      customRender: ({ record }) => coloredMoney(record.RealCleanMoney),
      title: '净输赢',
      width: 100,
    });
  }

  cols.push(
    {
      customRender: ({ record }) =>
        money(-Number(record.SumAccountChangeSumNum || 0)),
      title: '账户调整',
      width: 100,
    },
    {
      customRender: ({ record }) => money(record.SumRedSumNum),
      title: '红利',
      width: 90,
    },
    {
      customRender: ({ record }) => money(record.SumBetWaterMoney),
      title: '返水',
      width: 90,
    },
  );

  if (props.reportType === 2) {
    cols.push({
      customRender: ({ record }) => money(record.SumApiFeeSumNum),
      title: '场馆费用',
      width: 100,
    });
  }

  cols.push(
    {
      customRender: ({ record }) => money(record.SumAgentCommissionSumNum),
      title: '代理佣金',
      width: 100,
    },
    {
      customRender: ({ record }) => coloredMoney(record.CompanyIncomeMoney),
      title: '推广收入',
      width: 100,
    },
  );

  return cols;
});

function rowKey(row: GroupDailyRow) {
  return `${row.ReportDay}-${row.GroupId1}-${row.GroupId2}-${row.GroupId3}-${row.GroupId}-${row.Username}`;
}
</script>

<template>
  <Table
    :columns="columns"
    :data-source="list"
    :loading="loading"
    :pagination="false"
    :row-key="rowKey"
    :scroll="{ x: 2800, y: antTableScrollY(80) }"
    bordered
    size="small"
  />
</template>

<script lang="ts" setup>
import type { ColumnsType } from 'ant-design-vue/es/table';

import type { ChannelDim, ChannelRow } from '#/utils/channel-data-calc';

import { computed, h } from 'vue';

import { Table, Tag, Tooltip } from 'ant-design-vue';

import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatAmountFromCent } from '#/utils/format-amount';
import { antTableScrollY } from '#/utils/table-height';

defineOptions({ name: 'ChannelReportTable' });

const props = withDefaults(
  defineProps<{
    dim: ChannelDim;
    list: ChannelRow[];
    loading?: boolean;
    /** today 不显示日期；history 显示 */
    mode?: 'history' | 'today';
    /**
     * 区间报（ReportType=3）日期列展示查询区间，对齐旧站 HistoryAgentData：
     * 行内 BeginTime/EndTime 常为空，应使用查询条件而非 row 字段。
     */
    queryDateLabel?: string;
    /** 月报显示场馆费/净输赢 */
    reportType?: number;
  }>(),
  {
    loading: false,
    mode: 'today',
    queryDateLabel: '',
    reportType: 1,
  },
);

function money(value: unknown) {
  return formatAmountFromCent(Number(value || 0));
}

function percent(value: unknown) {
  const text = value == null || value === '' ? '0.00' : String(value);
  return `${text}%`;
}

function coloredMoney(value: unknown) {
  const num = Number(value || 0);
  const color = num > 0 ? '#059669' : (num < 0 ? '#ef4444' : undefined);
  return h('span', { style: color ? { color } : undefined }, money(value));
}

const columns = computed<ColumnsType<ChannelRow>>(() => {
  const cols: ColumnsType<ChannelRow> = [];

  if (props.mode === 'history') {
    cols.push({
      customRender: ({ record }) => {
        if (Number(props.reportType) === 3) {
          if (props.queryDateLabel) return props.queryDateLabel;
          if (record.BeginTime || record.EndTime) {
            return `${record.BeginTime || ''} ~ ${record.EndTime || ''}`;
          }
          return String(record.ReportDay || '');
        }
        return String(record.ReportDay || '');
      },
      // 代理维仅固定「代理账号」；渠道维仍固定日期
      ...(props.dim === 'channel' ? { fixed: 'left' as const } : {}),
      title: '日期',
      fixed: 'left',
      width: Number(props.reportType) === 3 ? 200 : 120,
    });
  }

  if (props.dim === 'agent') {
    cols.push(
      {
        customRender: ({ record }) =>
          h(AgencyAccountLink, {
            adminId: resolveAgencyAdminId(record as ChannelRow),
            username: record.Username,
          }),
        dataIndex: 'Username',
        fixed: 'left',
        title: '代理账号',
        width: 110,
      },
      {
        dataIndex: 'Agentname',
        title: '代理名称',
        width: 110,
      },
      {
        customRender: ({ record }) => {
          const type = Number(record.AgentType || 0);
          if (!type) return '-';
          return h(Tag, { color: type === 1 ? 'blue' : 'green' }, () =>
            type === 1 ? '普通' : '官方',
          );
        },
        title: '代理类型',
        width: 100,
      },
    );
  } else {
    cols.push(
      {
        dataIndex: 'ChannelId',
        fixed: 'left',
        title: '渠道号',
        width: 100,
      },
      {
        dataIndex: 'Username',
        fixed: 'left',
        title: '所属代理',
        width: 110,
      },
      {
        dataIndex: 'PackageName',
        title: '所属产品',
        width: 120,
      },
    );
  }

  cols.push(
    { dataIndex: 'SumDevice', title: '新增设备', width: 90 },
    { dataIndex: 'SumReg', title: '注册账号', width: 90 },
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
    { dataIndex: 'SumLogin', title: '登录账户', width: 90 },
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
    {
      customRender: ({ record }) => percent(record.PercentProfit),
      title: '盈余比例',
      width: 90,
    },
  );

  if (props.mode === 'history' && props.reportType === 2) {
    cols.push(
      {
        customRender: ({ record }) => money(record.SumApiFeeSumNum),
        title: '场馆费用',
        width: 100,
      },
      {
        customRender: ({ record }) => coloredMoney(record.RealCleanMoney),
        title: '净输赢',
        width: 100,
      },
    );
  }

  cols.push(
    {
      customRender: ({ record }) => money(record.AccountAdjustDisplay),
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
    {
      customRender: ({ record }) => coloredMoney(record.CompanyIncomeMoney),
      title: '公司收入',
      width: 100,
    },
  );

  return cols;
});

function rowKey(row: ChannelRow) {
  return `${row.ReportDay}-${row.Username}-${row.ChannelId}-${row.Agentname}`;
}
</script>

<template>
  <Table
    :columns="columns"
    :data-source="list"
    :loading="loading"
    :pagination="false"
    :row-key="rowKey"
    :scroll="{ x: 2600, y: antTableScrollY(80) }"
    bordered
    size="small"
  />
</template>

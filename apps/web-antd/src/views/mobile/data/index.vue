<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Spin, Table } from 'ant-design-vue';

import { fetchTeamDailyListApi } from '#/api/promotion/team-daily';
import { formatAmountFromCent } from '#/utils/format-amount';

import MobileMvpTip from '../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileDataPanel' });

const loading = ref(false);
const historyItems = ref<Record<string, unknown>[]>([]);

const todayColumns = [
  { dataIndex: 'label', key: 'label', title: '指标' },
  { dataIndex: 'value', key: 'value', title: '数值' },
];

const historyColumns = [
  { dataIndex: 'Date', key: 'Date', title: '日期', width: 110 },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      `${Number(record.SelfReg || 0) + Number(record.NextReg || 0)}`,
    key: 'reg',
    title: '注册',
  },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(
        Number(record.SelfPayMergerMoney || 0) +
          Number(record.NextPayMergerMoney || 0),
      ),
    key: 'pay',
    title: '充值',
  },
];

const todayRows = ref<Array<{ key: string; label: string; value: string }>>([]);

function buildTodayRows(summary?: Record<string, unknown>) {
  const data = summary || {};
  todayRows.value = [
    {
      key: 'reg',
      label: '总注册',
      value: String(Number(data.SelfReg || 0) + Number(data.NextReg || 0)),
    },
    {
      key: 'payNum',
      label: '总充值人数',
      value: String(
        Number(data.SelfPayMergerNum || 0) + Number(data.NextPayMergerNum || 0),
      ),
    },
    {
      key: 'payMoney',
      label: '总充值',
      value: formatAmountFromCent(
        Number(data.SelfPayMergerMoney || 0) +
          Number(data.NextPayMergerMoney || 0),
      ),
    },
    {
      key: 'income',
      label: '总收入',
      value: formatAmountFromCent(
        Number(data.SelfIncomeMoney || 0) + Number(data.NextIncomeMoney || 0),
      ),
    },
  ];
}

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchTeamDailyListApi({
      BeginTime: Math.floor(Date.now() / 1000 - 7 * 86400),
      EndTime: Math.floor(Date.now() / 1000),
      Page: 1,
      PageSize: 20,
    });
    buildTodayRows(
      (result.TodayItems || result.BannerItems) as Record<string, unknown>,
    );
    historyItems.value = (result.HistoryItems || []) as Record<
      string,
      unknown
    >[];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Spin :spinning="loading">
    <MobileMvpTip>完整数据表格、团队类型差异列等待下一迭代迁移。</MobileMvpTip>
    <Card class="mb-3" size="small" title="今日数据">
      <Table
        :columns="todayColumns"
        :data-source="todayRows"
        :pagination="false"
        size="small"
      />
    </Card>
    <Card size="small" title="近7日历史">
      <Table
        :columns="historyColumns"
        :data-source="historyItems"
        :pagination="false"
        :row-key="(row, index) => String(row.Date || index)"
        size="small"
      />
    </Card>
  </Spin>
</template>

<script lang="ts" setup>
import type { GameStatementRow } from '../utils';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Modal,
  Space,
  Spin,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs, { type Dayjs } from 'dayjs';

import {
  fetchClassifiedDetailReportApi,
  fetchGameDetailReportApi,
  fetchSubGameDetailReportApi,
} from '#/api/dataClose/game-statement';
import ReportLineChart from '#/views/dataClose/shared/report-line-chart.vue';
import {
  calcProfit,
  calcProfitRate,
} from '#/views/dataClose/shared/report-utils';

import { disabledDateBeyond90 } from '../utils';

defineOptions({ name: 'GameStatementLineChartModal' });

const props = defineProps<{
  fieldKey: string;
  open: boolean;
  param: Record<string, unknown>;
  reportType: 'classifiedStatement' | 'gameStatement' | 'subGameStatement';
  title: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const dateRange = ref<[Dayjs, Dayjs]>();
const categories = ref<string[]>([]);
const seriesData = ref<number[]>([]);

const visible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

function resolveFetcher() {
  if (props.reportType === 'gameStatement') return fetchGameDetailReportApi;
  if (props.reportType === 'classifiedStatement')
    return fetchClassifiedDetailReportApi;
  return fetchSubGameDetailReportApi;
}

function metricValue(row: GameStatementRow): number {
  switch (props.fieldKey) {
    case 'betPeople': {
      return Number(row.CountBetNum || 0);
    }
    case 'gameDetailsBetCount': {
      return Number(row.CountNum || 0);
    }
    case 'gameDetailsBetMoney': {
      return Number(((Number(row.SumBet || 0) / 100).toFixed(2)));
    }
    case 'giftMoney': {
      return Number(((Number(row.SumWin || 0) / 100).toFixed(2)));
    }
    case 'profitAmt': {
      return Number(
        (calcProfit(row.SumBet, row.SumWin) / 100).toFixed(2),
      );
    }
    case 'profitCompare': {
      const rate = calcProfitRate(row.SumBet, row.SumWin);
      return Number(String(rate).replace('%', '')) || 0;
    }
    case 'validBetAmount': {
      return Number(((Number(row.SumValidBet || 0) / 100).toFixed(2)));
    }
    default: {
      return 0;
    }
  }
}

async function loadChart() {
  loading.value = true;
  try {
    const query = {
      ...props.param,
      BeginTime: dateRange.value?.[0]?.startOf('day').unix() || '',
      EndTime: dateRange.value?.[1]?.endOf('day').unix() || '',
    };
    const data = await resolveFetcher()(query);
    const items = [...(data.Items || [])].sort(
      (a, b) =>
        new Date(String(a.ReportDay || '')).getTime() -
        new Date(String(b.ReportDay || '')).getTime(),
    ) as GameStatementRow[];
    categories.value = items.map((row) => String(row.ReportDay || ''));
    seriesData.value = items.map((row) => metricValue(row));
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  const begin = Number(props.param.BeginTime);
  const end = Number(props.param.EndTime);
  dateRange.value = [
    dayjs.unix(begin).startOf('day'),
    dayjs.unix(end).endOf('day'),
  ];
  void loadChart();
}

watch(
  () => [props.open, props.fieldKey, props.param] as const,
  ([open]) => {
    if (!open) return;
    handleReset();
  },
  { deep: true },
);
</script>

<template>
  <Modal
    v-model:open="visible"
    :title="title"
    width="720px"
    :footer="null"
    destroy-on-close
  >
    <Spin :spinning="loading">
      <Space wrap class="mb-3">
        <QueryDatetimeRangePicker v-model="dateRange" precision="date" :disabled-date="(current) => disabledDateBeyond90(current, dateRange, 'end')" />
        <Button type="primary" @click="loadChart">查询</Button>
        <Button @click="handleReset">重置</Button>
      </Space>
      <ReportLineChart
        :categories="categories"
        :series="[{ data: seriesData, name: title, type: 'line' }]"
        height="300px"
      />
    </Spin>
  </Modal>
</template>

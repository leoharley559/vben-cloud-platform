<script lang="ts" setup>
import type {
  PlayerGoldPeriodItem,
  PlayerGoldPeriodTotal,
} from '#/types/player-detail';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Button, Space, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerGoldTotalApi } from '#/api/operationManage/player';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

defineOptions({ name: 'PlayerCoinPeriodPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const emit = defineEmits<{
  dateChange: [beginTime: number, endTime: number];
}>();

const defaultRange = getCurrentMonthRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const loading = ref(false);
const list = ref<PlayerGoldPeriodItem[]>([]);
const summary = ref<PlayerGoldPeriodTotal>({});
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const beginTime = computed(() => {
  const [begin] = filterDateRange.value || [];
  return begin ? begin.startOf('day').unix() : 0;
});

const endTime = computed(() => {
  const [, end] = filterDateRange.value || [];
  return end ? end.endOf('day').unix() : 0;
});

function formatWinLoss(row: PlayerGoldPeriodItem) {
  const value = Number(row.WinGold || 0) - Number(row.BetGold || 0);
  return formatAmountFromCent(value);
}

function getWinLossClass(row: PlayerGoldPeriodItem) {
  const value = Number(row.WinGold || 0) - Number(row.BetGold || 0);
  return value > 0 ? 'text-green-600' : 'text-red-500';
}

const columns = [
  { dataIndex: 'ReportDay', key: 'ReportDay', title: '日期' },
  { dataIndex: 'WinGold', key: 'WinGold', title: '输赢' },
  { dataIndex: 'BetGold', key: 'BetGold', title: '投注金额' },
  { dataIndex: 'ValidWater', key: 'ValidWater', title: '有效投注' },
  { dataIndex: 'Recharged', key: 'Recharged', title: '充值金额' },
  { dataIndex: 'Withdraw', key: 'Withdraw', title: '提现金额' },
  { dataIndex: 'RedGold', key: 'RedGold', title: '红利' },
  { dataIndex: 'BetWater', key: 'BetWater', title: '返水' },
  { dataIndex: 'ChangeGold', key: 'ChangeGold', title: '账户调整' },
];

const summaryWinLossValue = computed(
  () =>
    Number(summary.value.SumWinGold || 0) -
    Number(summary.value.SumBetGold || 0),
);

const summaryItems = computed(() => [
  {
    label: '输赢合计',
    value: formatAmountFromCent(summaryWinLossValue.value),
    valueClass:
      summaryWinLossValue.value > 0
        ? 'text-green-600'
        : summaryWinLossValue.value < 0
          ? 'text-red-500'
          : '',
  },
  {
    label: '投注合计',
    value: formatAmountFromCent(summary.value.SumBetGold),
  },
  {
    label: '有效投注合计',
    value: formatAmountFromCent(summary.value.SumValidWater),
  },
  {
    label: '充值合计',
    value: formatAmountFromCent(summary.value.SumRecharged),
  },
  {
    label: '提现合计',
    value: formatAmountFromCent(summary.value.SumWithdraw),
  },
  {
    label: '红利合计',
    value: formatAmountFromCent(summary.value.SumRedGold),
  },
  {
    label: '返水合计',
    value: formatAmountFromCent(summary.value.SumBetWater),
  },
  {
    label: '调整合计',
    value: formatAmountFromCent(summary.value.SumChangeGold),
  },
]);

async function loadList() {
  if (!props.playerId) {
    list.value = [];
    summary.value = {};
    pagination.total = 0;
    return;
  }
  loading.value = true;
  try {
    const result = await fetchPlayerGoldTotalApi({
      BeginTime: beginTime.value,
      EndTime: endTime.value,
      Page: pagination.current,
      PageSize: pagination.pageSize,
      PlayerId: String(props.playerId),
    });
    summary.value = (result?.Total || {}) as PlayerGoldPeriodTotal;
    list.value = result?.Items || [];
    pagination.total = result?.Pagination?.MaxCount || 0;
  } finally {
    loading.value = false;
  }
}

function emitDateChange() {
  emit('dateChange', beginTime.value, endTime.value);
}

function handleSearch() {
  pagination.current = 1;
  void loadList();
  emitDateChange();
}

function handleReset() {
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  pagination.current = 1;
  void loadList();
  emitDateChange();
}

function handleTableChange(pager: {
  current?: number;
  pageSize?: number;
}) {
  pagination.current = pager.current || 1;
  pagination.pageSize = pager.pageSize || pagination.pageSize;
  void loadList();
}

watch(
  () => props.playerId,
  () => {
    if (props.playerId) {
      pagination.current = 1;
      void loadList();
      emitDateChange();
    }
  },
);

onMounted(() => {
  if (props.playerId) {
    void loadList();
    emitDateChange();
  }
});
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="filterDateRange"
            precision="date"
          />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Space>
            <Button :loading="loading" type="primary" @click="handleSearch">
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </div>
      </div>
    </div>

    <SummaryCards :items="summaryItems" />

    <Table
      bordered
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="{
        current: pagination.current,
        pageSize: pagination.pageSize,
        pageSizeOptions: TABLE_ANT_PAGE_SIZE_OPTIONS,
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 条`,
        total: pagination.total,
      }"
      row-key="ReportDay"
      size="small"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'WinGold'">
          <span :class="getWinLossClass(record)">
            {{ formatWinLoss(record) }}
          </span>
        </template>
        <template v-else-if="column.key === 'BetGold'">
          {{ formatAmountFromCent(record.BetGold) }}
        </template>
        <template v-else-if="column.key === 'ValidWater'">
          {{ formatAmountFromCent(record.ValidWater) }}
        </template>
        <template v-else-if="column.key === 'Recharged'">
          {{ formatAmountFromCent(record.Recharged) }}
        </template>
        <template v-else-if="column.key === 'Withdraw'">
          {{ formatAmountFromCent(record.Withdraw) }}
        </template>
        <template v-else-if="column.key === 'RedGold'">
          {{ formatAmountFromCent(record.RedGold) }}
        </template>
        <template v-else-if="column.key === 'BetWater'">
          {{ formatAmountFromCent(record.BetWater) }}
        </template>
        <template v-else-if="column.key === 'ChangeGold'">
          {{ formatAmountFromCent(record.ChangeGold) }}
        </template>
      </template>
    </Table>
  </div>
</template>

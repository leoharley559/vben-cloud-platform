<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  PlayerGoldPeriodItem,
  PlayerGoldPeriodTotal,
} from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Card, DatePicker, Descriptions, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerGoldTotalApi } from '#/api/operationManage/player';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLast7CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';

import PlayerCoinSettlePanel from './player-coin-settle.vue';

defineOptions({ name: 'PlayerCoinPeriodPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const emit = defineEmits<{
  dateChange: [beginTime: number, endTime: number];
}>();

const defaultRange = getLast7CalendarDaysRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const summary = ref<PlayerGoldPeriodTotal>({});

const beginTime = computed(() => {
  const [begin] = filterDateRange.value || [];
  return begin ? begin.startOf('day').unix() : defaultRange.BeginTime;
});

const endTime = computed(() => {
  const [, end] = filterDateRange.value || [];
  return end ? end.endOf('day').unix() : defaultRange.EndTime;
});

function formatWinLoss(row: PlayerGoldPeriodItem) {
  const value = Number(row.WinGold || 0) - Number(row.BetGold || 0);
  return formatAmountFromCent(value);
}

function getWinLossClass(row: PlayerGoldPeriodItem) {
  const value = Number(row.WinGold || 0) - Number(row.BetGold || 0);
  return value > 0 ? 'text-green-600' : 'text-red-500';
}

const gridOptions: VxeTableGridOptions<PlayerGoldPeriodItem> = {
  columns: [
    {
      field: 'ReportDay',
      minWidth: 120,
      title: '日期',
    },
    {
      field: 'WinGold',
      minWidth: 110,
      slots: { default: 'winLoss' },
      title: '输赢',
    },
    {
      field: 'BetGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '投注金额',
    },
    {
      field: 'ValidWater',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '有效投注',
    },
    {
      field: 'Recharged',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '充值金额',
    },
    {
      field: 'Withdraw',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '提现金额',
    },
    {
      field: 'RedGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 100,
      title: '红利',
    },
    {
      field: 'BetWater',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 100,
      title: '返水',
    },
    {
      field: 'ChangeGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '账户调整',
    },
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerGoldTotalApi({
          BeginTime: beginTime.value,
          EndTime: endTime.value,
          Page: page.currentPage,
          PageSize: page.pageSize,
          PlayerId: String(props.playerId),
        });

        summary.value = (result?.Total || {}) as PlayerGoldPeriodTotal;

        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const loading = computed(() => gridApi.grid?.loading ?? false);

const summaryWinLoss = computed(() => {
  const value =
    Number(summary.value.SumWinGold || 0) -
    Number(summary.value.SumBetGold || 0);
  return formatAmountFromCent(value);
});

function emitDateChange() {
  emit('dateChange', beginTime.value, endTime.value);
}

function handleSearch() {
  gridApi.reload();
  emitDateChange();
}

function handleReset() {
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
  emitDateChange();
}

watch(
  () => props.playerId,
  () => {
    if (props.playerId) {
      gridApi.reload();
      emitDateChange();
    }
  },
);

onMounted(() => {
  if (props.playerId) {
    gridApi.reload();
    emitDateChange();
  }
});
</script>

<template>
  <div>
    <Card size="small" title="周期数据">
      <div class="mb-4 flex flex-wrap items-end justify-end gap-2">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">日期</span>
          <DatePicker.RangePicker v-model:value="filterDateRange" />
        </div>
        <Space>
          <Button :loading="loading" type="primary" @click="handleSearch">
            查询
          </Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </div>

      <Grid>
        <template #winLoss="{ row }">
          <span :class="getWinLossClass(row)">
            {{ formatWinLoss(row) }}
          </span>
        </template>
      </Grid>

      <Descriptions bordered class="mt-4" :column="4" size="small">
        <Descriptions.Item label="输赢合计">
          {{ summaryWinLoss }}
        </Descriptions.Item>
        <Descriptions.Item label="投注合计">
          {{ formatAmountFromCent(summary.SumBetGold) }}
        </Descriptions.Item>
        <Descriptions.Item label="有效投注合计">
          {{ formatAmountFromCent(summary.SumValidWater) }}
        </Descriptions.Item>
        <Descriptions.Item label="充值合计">
          {{ formatAmountFromCent(summary.SumRecharged) }}
        </Descriptions.Item>
        <Descriptions.Item label="提现合计">
          {{ formatAmountFromCent(summary.SumWithdraw) }}
        </Descriptions.Item>
        <Descriptions.Item label="红利合计">
          {{ formatAmountFromCent(summary.SumRedGold) }}
        </Descriptions.Item>
        <Descriptions.Item label="返水合计">
          {{ formatAmountFromCent(summary.SumBetWater) }}
        </Descriptions.Item>
        <Descriptions.Item label="调整合计">
          {{ formatAmountFromCent(summary.SumChangeGold) }}
        </Descriptions.Item>
      </Descriptions>

      <PlayerCoinSettlePanel
        :begin-time="beginTime"
        :end-time="endTime"
        :player-id="playerId"
      />
    </Card>
  </div>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerBetDateStatItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Select, Space } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { fetchPlayerBetDateStatApi } from '#/api/operationManage/bet-detail';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  BET_STATUS_OPTIONS,
  BET_TIME_TYPE_OPTIONS,
  calcBetWinLoss,
} from '#/utils/bet-detail';
import { getLast7CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'PlayerBetDateStats' });

const props = defineProps<{
  loginAccount?: string;
  playerId: number | string;
}>();

const defaultRange = getLast7CalendarDaysRangeSeconds();
const summary = ref({
  Count: 0,
  SumBetGold: 0,
  SumTotalBetGold: 0,
  SumValidWater: 0,
  SumWinGold: 0,
});

const filterStatus = ref<string>();
const filterSelectTimeType = ref(1);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function getQueryParams(extra?: { Page?: number; PageSize?: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : '',
    DataSearchType: 2,
    EndTime: end ? end.endOf('day').unix() : '',
    LoginAccount: props.loginAccount || '',
    PlayerId: String(props.playerId),
    SelectTimeType: filterSelectTimeType.value,
    Status: filterStatus.value || '',
    ...extra,
  };
}

const gridOptions: VxeTableGridOptions<PlayerBetDateStatItem> = {
  columns: [
    {
      field: 'ReportDay',
      minWidth: 120,
      title: '日期',
    },
    {
      field: 'Count',
      minWidth: 100,
      title: '注单数',
    },
    {
      field: 'SumWinGold',
      minWidth: 120,
      slots: { default: 'winLoss' },
      title: '输赢情况',
    },
    {
      field: 'SumTotalBetGold',
      formatter: ({ cellValue, row }) =>
        formatAmountFromCent(cellValue || row.SumBetGold),
      minWidth: 120,
      title: '投注金额',
    },
    {
      field: 'SumValidWater',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '有效投注',
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
        const result = await fetchPlayerBetDateStatApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });

        summary.value = {
          Count: Number(result?.MoreItems?.Count || 0),
          SumBetGold: Number(result?.MoreItems?.SumBetGold || 0),
          SumTotalBetGold: Number(result?.MoreItems?.SumTotalBetGold || 0),
          SumValidWater: Number(result?.MoreItems?.SumValidWater || 0),
          SumWinGold: Number(result?.MoreItems?.SumWinGold || 0),
        };

        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
  showFooter: true,
  footerMethod: () => [
    [
      '总计',
      String(summary.value.Count),
      formatAmountFromCent(summary.value.SumWinGold - summary.value.SumBetGold),
      formatAmountFromCent(
        summary.value.SumTotalBetGold || summary.value.SumBetGold,
      ),
      formatAmountFromCent(summary.value.SumValidWater),
    ],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterStatus.value = undefined;
  filterSelectTimeType.value = 1;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

watch(
  () => [props.playerId, props.loginAccount],
  () => {
    if (props.playerId) {
      gridApi.reload();
    }
  },
);

onMounted(() => {
  if (props.playerId) {
    gridApi.reload();
  }
});
</script>

<template>
  <div>
    <div class="ops-query-scope mb-4">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">状态</span>
          <Select
            v-model:value="filterStatus"
            allow-clear
            :options="BET_STATUS_OPTIONS"
            placeholder="请选择状态"
          />
        </Space.Compact>
      </div>

      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">时间类型</span>
          <Select
            v-model:value="filterSelectTimeType"
            :options="BET_TIME_TYPE_OPTIONS"
            placeholder="请选择时间类型"
          />
        </Space.Compact>
      </div>

      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" label="日期" precision="date" />
        </div>
        <div class="query-filter-actions">
          <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
        </div>
    </div>
  </div>

    <Grid>
      <template #winLoss="{ row }">
        <span
          :class="
            calcBetWinLoss(1, row.SumWinGold, row.SumBetGold) < 0
              ? 'text-red-500'
              : 'text-green-600'
          "
        >
          {{
            formatAmountFromCent(
              calcBetWinLoss(1, row.SumWinGold, row.SumBetGold),
            )
          }}
        </span>
      </template>
    </Grid>
  </div>
</template>

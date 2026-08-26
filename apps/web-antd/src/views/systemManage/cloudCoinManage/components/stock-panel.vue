<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import { Button, Card } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchCloudCoinStockApi } from '#/api/systemManage/extra';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { formatReportDateTime } from '#/views/dataClose/shared/report-utils';

import CloudCoinBuyModal from './cloud-coin-buy-modal.vue';

defineOptions({ name: 'CloudCoinStockPanel' });

interface StockRow {
  CreateTime?: number | string;
  Date?: number | string;
  Stock?: number | string;
  TotalBuy?: number | string;
  TotalConsume?: number | string;
}

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(11_429));
const banner = ref({
  Buy: 0,
  Consume: 0,
  Stock: 0,
});

/** 默认当月：月初 ～ 今天 */
const defaultRange = getCurrentMonthRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function keepTwoDecimal(value?: number | string) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
  };
}

function applyBanner(
  result: Awaited<ReturnType<typeof fetchCloudCoinStockApi>>,
) {
  const more = (result.MoreItems || {}) as Record<string, unknown>;
  const today = (result.Today || {}) as {
    Buy?: number | string;
    Consume?: number | string;
  };
  banner.value = {
    Buy: Number(today.Buy ?? more.Buy ?? 0),
    Consume: Number(today.Consume ?? more.Consume ?? 0),
    Stock: Number(result.Stock ?? more.Stock ?? 0),
  };
}

const gridOptions: VxeTableGridOptions<StockRow> = {
  columns: [
    {
      field: 'Date',
      formatter: ({ row }) => formatReportDateTime(row.Date ?? row.CreateTime),
      minWidth: 170,
      title: '时间',
    },
    { field: 'TotalBuy', minWidth: 120, title: '总入库' },
    { field: 'TotalConsume', minWidth: 120, title: '总消耗' },
    {
      field: 'Stock',
      formatter: ({ cellValue }) => keepTwoDecimal(cellValue),
      minWidth: 120,
      title: '当日结余',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        if (!canViewTable.value) {
          return { items: [], total: 0 };
        }
        try {
          const result = await fetchCloudCoinStockApi({
            ...getQueryParams(),
            Page: page.currentPage,
            PageSize: page.pageSize,
          });
          applyBanner(result);
          const items = (result.Items || []) as unknown as StockRow[];
          return {
            items,
            total: Number(result.Pagination?.MaxCount || items.length),
          };
        } catch {
          banner.value = { Buy: 0, Consume: 0, Stock: 0 };
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const bannerOverviewCards = computed(() => [
  {
    accent: '#febf5b',
    key: 'stock',
    label: '云币库存',
    value: keepTwoDecimal(banner.value.Stock),
  },
  {
    accent: '#34bfa3',
    key: 'buy',
    label: '今日入库',
    value: keepTwoDecimal(banner.value.Buy),
  },
  {
    accent: '#f4516c',
    key: 'consume',
    label: '今日消耗',
    value: keepTwoDecimal(banner.value.Consume),
  },
]);

async function loadBannerOnly() {
  try {
    const result = await fetchCloudCoinStockApi({
      ...getQueryParams(),
      Page: 1,
      PageSize: 1,
    });
    applyBanner(result);
  } catch {
    banner.value = { Buy: 0, Consume: 0, Stock: 0 };
  }
}

function handleSearch() {
  if (canViewTable.value) {
    gridApi.reload();
  } else {
    void loadBannerOnly();
  }
}

function handleReset() {
  const range = getCurrentMonthRangeSeconds();
  filterDateRange.value = [
    dayjs.unix(range.BeginTime),
    dayjs.unix(range.EndTime),
  ];
  handleSearch();
}

function handleBuySuccess() {
  handleSearch();
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  } else {
    void loadBannerOnly();
  }
});
</script>

<template>
  <div>
    <div class="mb-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div class="text-base font-medium text-gray-800">云币库存</div>
        <CloudCoinBuyModal @success="handleBuySuccess" />
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card
          v-for="card in bannerOverviewCards"
          :key="card.key"
          class="border-0 shadow-sm"
          size="small"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="mb-1 text-xs text-gray-500">{{ card.label }}</div>
              <div class="truncate text-xl font-semibold text-gray-900">
                {{ card.value }}
              </div>
            </div>
            <span
              class="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              :style="{ background: card.accent }"
            ></span>
          </div>
        </Card>
      </div>
    </div>

    <template v-if="canViewTable">
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <div class="query-filter-wide">
            <QueryDatetimeRangePicker
              v-model="filterDateRange"
              label="时间范围"
            />
          </div>
          <div class="query-filter-actions query-filter-actions-single">
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </div>
        </div>
      </div>
      <Grid />
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import { Button, Card, DatePicker, Space, Statistic } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchCloudCoinStockApi } from '#/api/systemManage/extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getLast7DaysToYesterdayRangeSeconds } from '#/utils/date-range';

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

const canViewTable = computed(() => checkPermission(11429));
const loadingBanner = ref(false);
const banner = ref({
  Buy: 0,
  Consume: 0,
  Stock: 0,
});

const defaultRange = getLast7DaysToYesterdayRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function formatDateTime(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const num = Number(value);
  if (!Number.isNaN(num) && num > 0) {
    const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD HH:mm:ss');
    }
  }
  const fallback = dayjs(value);
  return fallback.isValid()
    ? fallback.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function keepTwoDecimal(value?: number | string) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : '0.00';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
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
      formatter: ({ row }) => formatDateTime(row.Date ?? row.CreateTime),
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
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadBannerOnly() {
  loadingBanner.value = true;
  try {
    const result = await fetchCloudCoinStockApi({
      ...getQueryParams(),
      Page: 1,
      PageSize: 1,
    });
    applyBanner(result);
  } finally {
    loadingBanner.value = false;
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
  const range = getLast7DaysToYesterdayRangeSeconds();
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
  <div class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
        <Card size="small">
          <Statistic
            :loading="loadingBanner"
            :precision="2"
            :value="banner.Stock"
            title="云币库存"
          />
        </Card>
        <Card size="small">
          <Statistic
            :loading="loadingBanner"
            :precision="2"
            :value="banner.Buy"
            title="今日入库"
          />
        </Card>
        <Card size="small">
          <Statistic
            :loading="loadingBanner"
            :precision="2"
            :value="banner.Consume"
            title="今日消耗"
          />
        </Card>
      </div>
      <CloudCoinBuyModal @success="handleBuySuccess" />
    </div>

    <template v-if="canViewTable">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-gray-500">库存明细</span>
        <DatePicker.RangePicker
          v-model:value="filterDateRange"
          format="YYYY-MM-DD"
        />
        <Space>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </div>
      <Grid />
    </template>
  </div>
</template>

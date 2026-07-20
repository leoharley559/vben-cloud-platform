<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import { Button, DatePicker, Result, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchCloudCoinDailyListApi } from '#/api/systemManage/extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getLast7DaysToYesterdayRangeSeconds } from '#/utils/date-range';

defineOptions({ name: 'CloudCoinDailyPanel' });

interface DailyRow {
  Date?: number | string;
  Domain?: number | string;
  Give?: number | string;
  Recharge?: number | string;
  Signature?: number | string;
  Sms?: number | string;
  TotalBuy?: number | string;
  TotalConsume?: number | string;
  TotalTakeBack?: number | string;
}

const { checkPermission } = useCloudPermission();
const canViewTable = computed(() => checkPermission(11430));

const defaultRange = getLast7DaysToYesterdayRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function formatDateOnly(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const num = Number(value);
  if (!Number.isNaN(num) && num > 0) {
    const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
  }
  const fallback = dayjs(value);
  return fallback.isValid() ? fallback.format('YYYY-MM-DD') : String(value);
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
  };
}

const gridOptions: VxeTableGridOptions<DailyRow> = {
  columns: [
    {
      field: 'Date',
      formatter: ({ cellValue }) => formatDateOnly(cellValue),
      minWidth: 120,
      title: '时间',
    },
    { field: 'Recharge', minWidth: 100, title: '充值(+)' },
    { field: 'Give', minWidth: 100, title: '赠送(+)' },
    { field: 'TotalTakeBack', minWidth: 100, title: '追回' },
    { field: 'Domain', minWidth: 110, title: '购买域名(-)' },
    { field: 'Sms', minWidth: 110, title: '购买短信(-)' },
    { field: 'Signature', minWidth: 120, title: '购买超级签(-)' },
    { field: 'TotalBuy', minWidth: 100, title: '合计(+)' },
    { field: 'TotalConsume', minWidth: 100, title: '合计(-)' },
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
        const result = await fetchCloudCoinDailyListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        const items = (result.Items || []) as unknown as DailyRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  const range = getLast7DaysToYesterdayRangeSeconds();
  filterDateRange.value = [
    dayjs.unix(range.BeginTime),
    dayjs.unix(range.EndTime),
  ];
  gridApi.reload();
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable" class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-gray-500">云币日报</span>
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
  </div>
  <Result
    v-else
    status="403"
    sub-title="需要权限 11430 才能查看云币日报"
    title="无权限"
  />
</template>

<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { Button, DatePicker, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchSmsMonthlyListApi } from '#/api/gameManage/message-manage';
import SummaryCards from '#/components/global/summary-cards.vue';

defineOptions({ name: 'SmsMonthlyPanel' });

interface MonthRow {
  BuyTimes?: number;
  Consume?: number;
  GiftTimes?: number;
  Month?: string;
}

const monthRange = ref<[Dayjs, Dayjs]>();
const totals = reactive<Record<string, unknown>>({});

const summaryItems = computed(() => [
  {
    label: '购买总数',
    value: Number(totals.TotalBuyTimes || 0),
  },
  {
    label: '消耗总数',
    value: Number(totals.TotalConsume || 0),
  },
]);

const gridOptions: VxeTableGridOptions<MonthRow> = {
  columns: [
    { field: 'Month', minWidth: 140, title: '月份' },
    { field: 'BuyTimes', minWidth: 130, title: '购买数量' },
    { field: 'GiftTimes', minWidth: 130, title: '赠送数量' },
    { field: 'Consume', minWidth: 130, title: '消耗数量' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const [begin, end] = monthRange.value || [];
        const result = await fetchSmsMonthlyListApi({
          BeginTime: begin?.startOf('month').unix() || '',
          EndTime: end?.endOf('month').unix() || '',
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: '',
        });
        Object.assign(totals, result.Total || {});
        const items = (result.Items || []) as MonthRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount ?? items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function reloadFirstPage() {
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

function search() {
  void reloadFirstPage();
}

function reset() {
  monthRange.value = undefined;
  void reloadFirstPage();
}
</script>

<template>
  <div>
    <div class="query-panel">
      <DatePicker.RangePicker
        v-model:value="monthRange"
        picker="month"
        :placeholder="['开始月份', '结束月份']"
      />
      <Space>
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
      </Space>
    </div>
    <SummaryCards :items="summaryItems" />
    <div class="data-grid"><Grid /></div>
  </div>
</template>

<style scoped>
.query-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  margin-bottom: 14px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.data-grid {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}
</style>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WithdrawOrderStatItem } from '#/types/withdraw-extra';

import { computed, onMounted, ref } from 'vue';

import { Button, Result } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { fetchWithdrawOrderStatApi } from '#/api/operationManage/withdraw-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'WithdrawOrderStat' });

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(10_387));

// 对齐旧站 orderStat：默认当月（非昨日）
const defaultRange = getCurrentMonthRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
  };
}

function formatRate(count: unknown, total: unknown) {
  const c = Number(count || 0);
  const t = Number(total || 0);
  if (!t) return '0%';
  return `${((c / t) * 100).toFixed(2)}%`;
}

function formatSeconds(value: unknown) {
  return `${Number(value || 0)} 秒`;
}

const gridOptions: VxeTableGridOptions<WithdrawOrderStatItem> = {
  columns: [
    { field: 'ReportDay', minWidth: 120, title: '时间' },
    { field: 'Count', minWidth: 100, title: '订单总数' },
    {
      field: 'HighCount',
      formatter: ({ row }) =>
        `${row.HighCount ?? 0}/${formatRate(row.HighCount, row.Count)}`,
      minWidth: 140,
      title: '高风险订单/率',
    },
    {
      field: 'MiddleCount',
      formatter: ({ row }) =>
        `${row.MiddleCount ?? 0}/${formatRate(row.MiddleCount, row.Count)}`,
      minWidth: 140,
      title: '中风险订单/率',
    },
    {
      field: 'LowCount',
      formatter: ({ row }) =>
        `${row.LowCount ?? 0}/${formatRate(row.LowCount, row.Count)}`,
      minWidth: 140,
      title: '低风险订单/率',
    },
    {
      field: 'WithdrawCount',
      formatter: ({ row }) =>
        `${row.WithdrawCount ?? 0}/${formatRate(row.WithdrawCount, row.Count)}`,
      minWidth: 140,
      title: '出款订单数/率',
    },
    {
      field: 'RefuseCount',
      formatter: ({ row }) =>
        `${row.RefuseCount ?? 0}/${formatRate(row.RefuseCount, row.Count)}`,
      minWidth: 140,
      title: '拒绝订单数/率',
    },
    {
      field: 'FailCount',
      formatter: ({ row }) =>
        `${row.FailCount ?? 0}/${formatRate(row.FailCount, row.Count)}`,
      minWidth: 140,
      title: '通道失败次数/率',
    },
    {
      field: 'ApplyAmount',
      formatter: ({ cellValue }) =>
        formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '申请金额',
    },
    {
      field: 'WithdrawAmount',
      formatter: ({ cellValue }) =>
        formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '出款金额',
    },
    {
      field: 'RefuseAmount',
      formatter: ({ cellValue }) =>
        formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '拒绝金额',
    },
    {
      field: 'RiskAuditorTime',
      formatter: ({ cellValue }) => formatSeconds(cellValue),
      minWidth: 120,
      title: '风控响应时间',
    },
    {
      field: 'FinanceTime',
      formatter: ({ cellValue }) => formatSeconds(cellValue),
      minWidth: 120,
      title: '财务响应时间',
    },
    {
      field: 'FinishTime',
      formatter: ({ cellValue }) => formatSeconds(cellValue),
      minWidth: 120,
      title: '通道出款时间',
    },
    {
      field: 'AvgTime',
      formatter: ({ cellValue }) => formatSeconds(cellValue),
      minWidth: 120,
      title: '平均出款时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchWithdrawOrderStatApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
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

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
        </div>
    </div>
  </div>

    <Grid />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10387 才能查看订单统计"
    title="无权限"
  />
</template>

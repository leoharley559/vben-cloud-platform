<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RechargeCancelStatsItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import { Button, Result, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchRechargeCancelStatsApi } from '#/api/operationManage/recharge-extra';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';

defineOptions({ name: 'RechargeStatsPanel' });

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(11_618));

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
    Page: 1,
    PageSize: 1000,
  };
}

const gridOptions: VxeTableGridOptions<RechargeCancelStatsItem> = {
  columns: [
    { type: 'seq', width: 60, title: '序号' },
    {
      field: 'CancelReason',
      minWidth: 200,
      showOverflow: 'tooltip',
      title: '取消原因',
    },
    { field: 'SumCount', minWidth: 120, title: '玩家选用次数' },
    {
      field: 'Proportion',
      formatter: ({ cellValue }) => {
        const num = Number(cellValue || 0);
        const percent = num <= 1 ? num * 100 : num;
        return `${percent.toFixed(2)}%`;
      },
      minWidth: 100,
      title: '占比',
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async () => {
        const result = await fetchRechargeCancelStatsApi(getQueryParams());
        return {
          items: result?.Items || [],
          total: result?.Items?.length || 0,
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
          <Space>
            <Button :loading="loading" type="primary" @click="gridApi.reload()">
              查询
            </Button>
            <Button
              @click="
                filterDateRange = [
                  dayjs.unix(defaultRange.BeginTime),
                  dayjs.unix(defaultRange.EndTime),
                ];
                gridApi.reload();
              "
            >
              重置
            </Button>
          </Space>
        </div>
      </div>
    </div>

    <Grid />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 11618 才能查看充值统计"
    title="无权限"
  />
</template>

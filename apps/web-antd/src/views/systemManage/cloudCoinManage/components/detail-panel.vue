<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Result,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchCloudCoinDetailListApi } from '#/api/systemManage/extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getLast7CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatReportDateTime } from '#/views/dataClose/shared/report-utils';

defineOptions({ name: 'CloudCoinDetailPanel' });

interface DetailRow {
  Amount?: number | string;
  BCAmount?: number | string;
  ConsumeType?: number;
  CreateTime?: number | string;
  HandleType?: number;
  HandlerName?: string;
}

const { checkPermission } = useCloudPermission();
const canViewTable = computed(() => checkPermission(11431));

const totalCloudCoin = ref(0);
/** 对齐旧站：近 7 个自然日含今天 */
const defaultRange = getLast7CalendarDaysRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

/** 对齐旧站 detail.vue typeFilter */
function typeFilter(consumeType?: number, handleType?: number) {
  if (handleType === 1) {
    switch (consumeType) {
      case 1:
        return '创建子代';
      case 2:
        return '客服席位';
      case 3:
        return '域名';
      case 4:
        return '超级签';
      case 5:
        return '短信';
      case 6:
        return '追回';
      case 7:
        return '手机实名';
      case 8:
        return '报表次数';
      default:
        return '未知';
    }
  }
  if (handleType === 2) {
    return '充值';
  }
  return '赠送';
}

function resolveTotalCloudCoin(
  result: Awaited<ReturnType<typeof fetchCloudCoinDetailListApi>>,
) {
  const total = result.Total || {};
  const more = (result.MoreItems || {}) as Record<string, unknown>;
  const fromTotal = Number(
    (total as Record<string, unknown>).Total ?? 0,
  );
  if (fromTotal) {
    return fromTotal;
  }
  return Number(
    more['云币合计'] ?? more.TotalCloudCoin ?? more.Total ?? more.total ?? 0,
  );
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    ChannelName: '',
    EndTime: end ? end.unix() : '',
    Keyword: '',
    PromoterName: '',
  };
}

const gridOptions: VxeTableGridOptions<DetailRow> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatReportDateTime(cellValue),
      minWidth: 170,
      title: '时间',
    },
    {
      field: 'ConsumeType',
      formatter: ({ row }) => typeFilter(row.ConsumeType, row.HandleType),
      minWidth: 120,
      title: '类型',
    },
    { field: 'BCAmount', minWidth: 100, title: '参数' },
    {
      field: 'Amount',
      minWidth: 110,
      slots: { default: 'amount' },
      title: '云币',
    },
    { field: 'HandlerName', minWidth: 120, title: '操作人员' },
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
          const result = await fetchCloudCoinDetailListApi({
            ...getQueryParams(),
            Page: page.currentPage,
            PageSize: page.pageSize,
          });
          totalCloudCoin.value = resolveTotalCloudCoin(result);
          const items = (result.Items || []) as unknown as DetailRow[];
          return {
            items,
            total: Number(result.Pagination?.MaxCount || items.length),
          };
        } catch {
          totalCloudCoin.value = 0;
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const summaryItems = computed(() => [
  { label: '云币合计', value: Number(totalCloudCoin.value).toFixed(2) },
]);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  const range = getLast7CalendarDaysRangeSeconds();
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
      <QueryDatetimeRangePicker v-model="filterDateRange" />
      <Space>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #amount="{ row }">
        <span v-if="row.HandleType == 1" class="text-red-500">-{{ row.Amount }}</span>
        <span v-else class="text-green-600">+{{ row.Amount }}</span>
      </template>
    </Grid>
  </div>
  <Result
    v-else
    status="403"
    sub-title="需要权限 11431 才能查看消耗明细"
    title="无权限"
  />
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Card,
  DatePicker,
  Result,
  Space,
  Statistic,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchCloudCoinDetailListApi } from '#/api/systemManage/extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getLast7DaysToYesterdayRangeSeconds } from '#/utils/date-range';

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
  const fromTotal = Number(total.Total ?? 0);
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
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    ChannelName: '',
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    Keyword: '',
    PromoterName: '',
  };
}

const gridOptions: VxeTableGridOptions<DetailRow> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
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
      <DatePicker.RangePicker
        v-model:value="filterDateRange"
        format="YYYY-MM-DD"
      />
      <Space>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </div>

    <Card size="small" class="w-fit min-w-[180px]">
      <Statistic :precision="2" :value="totalCloudCoin" title="云币合计" />
    </Card>

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

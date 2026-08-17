<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerPointsRecordItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, DatePicker, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerPointsRecordApi } from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { POINT_TYPE_MAP, POINT_TYPE_OPTIONS } from '#/utils/player-detail-maps';

defineOptions({ name: 'PlayerPointsPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const defaultRange = getTodayRangeSeconds();

const filterPointType = ref(-1);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function formatPointType(type?: number) {
  if (type === undefined || type === null) {
    return '-';
  }
  return POINT_TYPE_MAP[type] || String(type);
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    ApplyTimeBegin: begin
      ? begin.startOf('day').unix()
      : '',
    ApplyTimeEnd: end ? end.endOf('day').unix() : '',
    Full: true,
    PlayerId: String(props.playerId),
    PointType: filterPointType.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerPointsRecordItem> = {
  columns: [
    {
      field: 'ApplyTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '日期',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'PointType',
      formatter: ({ cellValue }) => formatPointType(cellValue),
      minWidth: 110,
      title: '账变类型',
    },
    {
      field: 'Point',
      minWidth: 100,
      slots: { default: 'point' },
      title: '积分账变',
    },
    {
      field: 'PlayerPoint',
      minWidth: 100,
      title: '当前积分',
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
        const result = await fetchPlayerPointsRecordApi({
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

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterPointType.value = -1;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

watch(
  () => props.playerId,
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">账变类型</span>
        <Select
          v-model:value="filterPointType"
          :options="POINT_TYPE_OPTIONS"
          style="width: 160px"
        />
      </div>

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
      <template #point="{ row }">
        <span
          :class="Number(row.Point) < 0 ? 'text-red-500' : 'text-green-600'"
        >
          {{ row.Point ?? '-' }}
        </span>
      </template>
    </Grid>
  </div>
</template>

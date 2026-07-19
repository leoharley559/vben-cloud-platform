<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerLogItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, DatePicker, Input, Result, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerActionLogsApi } from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';

defineOptions({ name: 'PlayerLogsPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(13313));

const defaultRange = getYesterdayRangeSeconds();

const filterType = ref('');
const filterUsername = ref('');
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

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    PlayerId: String(props.playerId),
    Type: filterType.value,
    Username: filterUsername.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerLogItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      sortable: true,
      title: '操作时间',
    },
    {
      field: 'ActionType',
      minWidth: 120,
      title: '类型',
    },
    {
      field: 'HandlerName',
      minWidth: 140,
      title: '操作人员',
    },
    {
      field: 'Remark',
      minWidth: 240,
      showOverflow: 'tooltip',
      title: '操作内容',
    },
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page, sort }) => {
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam = `${sortField} ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        }

        const result = await fetchPlayerActionLogsApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
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
  filterType.value = '';
  filterUsername.value = '';
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

watch(
  () => props.playerId,
  () => {
    if (props.playerId && canViewTable.value) {
      gridApi.reload();
    }
  },
);

onMounted(() => {
  if (props.playerId && canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterUsername"
        allow-clear
        placeholder="操作人员"
        style="width: 180px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>操作人员</template>
      </Input>

      <Input
        v-model:value="filterType"
        allow-clear
        placeholder="操作类型"
        style="width: 160px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>类型</template>
      </Input>

      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">操作时间</span>
        <DatePicker.RangePicker v-model:value="filterDateRange" />
      </div>

      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </div>

    <Grid />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 13313 才能查看操作日志"
    title="无权限"
  />
</template>

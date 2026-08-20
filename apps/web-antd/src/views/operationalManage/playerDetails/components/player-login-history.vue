<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerLoginIpRecord } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchPlayerLoginIpListApi } from '#/api/operationManage/player';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { formatLoginChannel, formatLoginPlatform } from '#/utils/player-login';

defineOptions({ name: 'PlayerLoginHistory' });

const props = defineProps<{
  playerId: number | string;
}>();

const defaultRange = getCurrentMonthRangeSeconds();
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
    BeginTime: begin ? begin.unix() : '',
    DataSearchType: 2,
    EndTime: end ? end.unix() : '',
    PlayerId: String(props.playerId),
  };
}

const gridOptions: VxeTableGridOptions<PlayerLoginIpRecord> = {
  columns: [
    {
      field: 'Date',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      sortable: true,
      title: '日期',
    },
    {
      field: 'Ip',
      formatter: ({ row }) => {
        const ip = row.Ip || '-';
        const name = row.IpName ? ` ${row.IpName}` : '';
        return `${ip}${name}`;
      },
      minWidth: 180,
      title: '登录 IP',
    },
    {
      field: 'LoginPlatform',
      formatter: ({ cellValue }) =>
        formatLoginPlatform(String(cellValue || '')),
      minWidth: 120,
      title: '登录设备',
    },
    {
      field: 'DeviceModel',
      minWidth: 140,
      title: '登录机型',
    },
    {
      field: 'SystemVersion',
      minWidth: 120,
      title: '系统版本',
    },
    {
      field: 'AppVersion',
      minWidth: 120,
      title: 'App 版本号',
    },
    {
      field: 'ChannelName',
      formatter: ({ row }) =>
        formatLoginChannel(row.ChannelName, row.ChannelId),
      minWidth: 160,
      title: '包渠道',
    },
    {
      field: 'DeviceId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '设备号',
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

        const result = await fetchPlayerLoginIpListApi({
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
  sortConfig: {
    defaultSort: {
      field: 'Date',
      order: 'desc',
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
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
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" label="日期" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Space>
            <Button :loading="loading" type="primary" @click="handleSearch">
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </div>
      </div>
    </div>

    <Grid />
  </div>
</template>

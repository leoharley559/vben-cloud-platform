<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerLogItem, PlayerLogTypeOption } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Input, Result, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchPlayerActionLogsApi } from '#/api/operationManage/player-detail-extra';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';

defineOptions({ name: 'PlayerLogsPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(13_313));

const defaultRange = getCurrentMonthRangeSeconds();

const filterType = ref<number | string>('');
const filterUsername = ref('');
const logTypeList = ref<PlayerLogTypeOption[]>([]);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const logTypeOptions = computed(() => [
  { label: '全部类型', value: '' },
  ...logTypeList.value.map((item) => ({
    label: item.LogType || String(item.ActionType ?? ''),
    value: item.ActionType ?? '',
  })),
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

function formatActionType(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const matched = logTypeList.value.find(
    (item) => String(item.ActionType) === String(value),
  );
  return matched?.LogType || String(value);
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
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
      formatter: ({ cellValue }) => formatActionType(cellValue),
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

        if (Array.isArray(result?.LogType) && result.LogType.length > 0) {
          logTypeList.value = result.LogType;
        }

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
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterUsername"
            allow-clear
            @press-enter="handleSearch"
            placeholder="请输入操作人员"
          >
            <template #addonBefore>操作人员</template>
          </Input>
        </div>

        <Space.Compact>
          <span class="query-field-addon">类型</span>
          <Select
            v-model:value="filterType"
            allow-clear
            :options="logTypeOptions"
            placeholder="请选择类型"
            show-search
            :filter-option="
              (input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
            "
          />
        </Space.Compact>

        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="filterDateRange"
            label="操作时间"
          />
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

  <Result
    v-else
    status="403"
    sub-title="需要权限 13313 才能查看操作日志"
    title="无权限"
  />
</template>

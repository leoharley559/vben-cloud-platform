<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { LogListItem } from '#/types/system-manage';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  DatePicker,
  message,
  Result,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchLogListApi,
  fetchLogTypeOptionsApi,
  fetchLogUserListApi,
} from '#/api/systemManage/logs';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatLogContent } from '#/utils/log-template';

defineOptions({ name: 'SystemLogsManage' });

const { checkPermission } = useCloudPermission();

const canViewList = computed(() => checkPermission(10010));
const canExport = computed(() => checkPermission(10011));

const userOptions = ref<Array<{ label: string; value: number | string }>>([
  { label: '全部账号', value: '' },
]);
const logTypeOptions = ref<Array<{ label: string; value: number | string }>>([
  { label: '全部类型', value: '' },
]);

const filterCreateAdminId = ref<number | string>('');
const filterLogTypeId = ref<number | string>('');
const defaultRange = getYesterdayRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function formatDateTime(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function getQueryParams() {
  const fallback = getYesterdayRangeSeconds();
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : fallback.BeginTime,
    CreateAdminId: filterCreateAdminId.value || '',
    EndTime: end ? end.endOf('day').unix() : fallback.EndTime,
    LogTypeId: filterLogTypeId.value || '',
  };
}

const gridOptions: VxeTableGridOptions<LogListItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      sortable: true,
      title: '操作时间',
    },
    { field: 'Ip', minWidth: 130, title: '登录 IP' },
    { field: 'LogType', minWidth: 140, title: '类型' },
    { field: 'Username', minWidth: 120, title: '操作人员' },
    {
      field: 'LogTemplate',
      formatter: ({ row }) => formatLogContent(row),
      minWidth: 320,
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
        const query = getQueryParams();
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam = `${sortField} ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        }

        const result = await fetchLogListApi({
          ...query,
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
  rowConfig: {
    keyField: 'CreateTime',
  },
  toolbarConfig: {
    refresh: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});

async function loadFilterOptions() {
  const [users, types] = await Promise.all([
    fetchLogUserListApi(),
    fetchLogTypeOptionsApi(),
  ]);

  userOptions.value = [
    { label: '全部账号', value: '' },
    ...(users || []).map((item) => ({
      label: item.Username,
      value: item.CreateAdminId,
    })),
  ];

  logTypeOptions.value = [
    { label: '全部类型', value: '' },
    ...(types || []).map((item) => ({
      label: item.LogType,
      value: item.LogTypeId,
    })),
  ];
}

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  const range = getYesterdayRangeSeconds();
  filterCreateAdminId.value = '';
  filterLogTypeId.value = '';
  filterDateRange.value = [
    dayjs.unix(range.BeginTime),
    dayjs.unix(range.EndTime),
  ];
  gridApi.reload();
}

function handleExport() {
  message.info('Excel 导出将在下一迭代补齐（权限 10011 已预留）');
}

onMounted(async () => {
  if (!canViewList.value) {
    return;
  }
  try {
    await loadFilterOptions();
    gridApi.reload();
  } catch {
    // 错误提示由 request 拦截器处理
  }
});
</script>

<template>
  <Page
    v-if="canViewList"
    auto-content-height
    description="系统管理 · 日志管理"
    title="日志管理"
  >
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Select
        v-model:value="filterCreateAdminId"
        :options="userOptions"
        placeholder="操作人员"
        style="width: 180px"
      />
      <Select
        v-model:value="filterLogTypeId"
        :options="logTypeOptions"
        placeholder="日志类型"
        style="width: 180px"
      />
      <DatePicker.RangePicker
        v-model:value="filterDateRange"
        format="YYYY-MM-DD"
      />
      <Space>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
        <Button v-if="canExport" @click="handleExport">导出 Excel</Button>
      </Space>
    </div>

    <Grid />
  </Page>

  <Page v-else auto-content-height title="日志管理">
    <Result
      status="403"
      sub-title="需要权限 10010 才能访问此页面"
      title="无权限"
    />
  </Page>
</template>

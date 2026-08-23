<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { LogListItem } from '#/types/system-manage';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, message, Result, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchLogListApi,
  fetchLogTypeOptionsApi,
  fetchLogUserListApi,
} from '#/api/systemManage/logs';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { formatLogContent } from '#/utils/log-template';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';

defineOptions({ name: 'SystemLogsManage' });

/** 对齐旧站 SearchTypeTwo limit-number=30 */
const MAX_RANGE_DAYS = 30;

const { adminInfo, checkPermission } = useCloudPermission();

const canViewList = computed(() => checkPermission(10_010));
const canExport = computed(() => checkPermission(10_011));

const exporting = ref(false);

const roleOptions = computed(() => {
  const list = adminInfo.value?.Role || adminInfo.value?.CRole;
  return Array.isArray(list) ? list : [];
});

const userOptions = ref<Array<{ label: string; value: number | string }>>([
  { label: '全部账号', value: '' },
]);
const logTypeOptions = ref<Array<{ label: string; value: number | string }>>([
  { label: '全部类型', value: '' },
]);

const filterCreateAdminId = ref<number | string>('');
const filterLogTypeId = ref<number | string>('');
const defaultRange = getTodayRangeSeconds();
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

function toCloudSort(sort?: { field?: string; order?: null | string }) {
  if (!sort?.field || !sort?.order) {
    return '';
  }
  return sort.order === 'asc' ? sort.field : `-${sort.field}`;
}

function assertDateSpan() {
  const [begin, end] = filterDateRange.value || [];
  if (!begin || !end) {
    message.warning('请选择时间范围');
    return false;
  }
  if (end.startOf('day').diff(begin.startOf('day'), 'day') > MAX_RANGE_DAYS) {
    message.warning(`查询时间跨度不能超过 ${MAX_RANGE_DAYS} 天`);
    return false;
  }
  return true;
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    CreateAdminId: filterCreateAdminId.value || '',
    EndTime: end ? end.unix() : '',
    LogTypeId: filterLogTypeId.value || '',
  };
}

function renderLogContent(row: LogListItem) {
  return formatLogContent(row, {
    roles: roleOptions.value as Array<{ Id: number | string; Name?: string }>,
  });
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
      formatter: ({ row }) => renderLogContent(row),
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
        if (!assertDateSpan()) {
          return { items: [], total: 0 };
        }
        try {
          const query = getQueryParams();
          const result = await fetchLogListApi({
            ...query,
            Page: page.currentPage,
            PageSize: page.pageSize,
            Sort: toCloudSort(sort),
          });

          return {
            items: result?.Items || [],
            total: result?.Pagination?.MaxCount || 0,
          };
        } catch {
          return { items: [], total: 0 };
        }
      },
    },
  },
  rowConfig: {
    keyField: 'Id',
  },
  sortConfig: {
    remote: true,
  },
  toolbarConfig: {
    refresh: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});

async function loadFilterOptions() {
  try {
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
  } catch {
    userOptions.value = [{ label: '全部账号', value: '' }];
    logTypeOptions.value = [{ label: '全部类型', value: '' }];
  }
}

function handleSearch() {
  void gridApi.reload();
}

function handleReset() {
  const range = getTodayRangeSeconds();
  filterCreateAdminId.value = '';
  filterLogTypeId.value = '';
  filterDateRange.value = [
    dayjs.unix(range.BeginTime),
    dayjs.unix(range.EndTime),
  ];
  void gridApi.reload();
}

async function handleExport() {
  if (exporting.value) {
    return;
  }
  if (!assertDateSpan()) {
    return;
  }
  exporting.value = true;
  try {
    const query = getQueryParams();
    const result = await fetchLogListApi({
      ...query,
      IsExp: true,
      Page: 1,
      PageSize: 10_000,
    });
    const rows = (result?.Items || []) as Record<string, unknown>[];
    if (rows.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }
    await exportReportXlsx(
      rows,
      ['操作时间', '登录IP', '类型', '操作人员', '操作内容'],
      '日志管理',
      (row) => {
        const item = row as unknown as LogListItem;
        return [
          formatDateTime(item.CreateTime),
          item.Ip || '',
          item.LogType || '',
          item.Username || '',
          renderLogContent(item),
        ];
      },
    );
  } catch {
    // 错误提示由 request 拦截器处理
  } finally {
    exporting.value = false;
  }
}

onMounted(async () => {
  if (!canViewList.value) {
    return;
  }
  await loadFilterOptions();
  void gridApi.reload();
});
</script>

<template>
  <Page
    v-if="canViewList"
    auto-content-height
    description="系统管理 · 日志管理"
    title="日志管理"
  >
    <Card>
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <Space.Compact>
            <span class="query-field-addon">操作人员</span>
            <Select
              v-model:value="filterCreateAdminId"
              :options="userOptions"
              show-search
              placeholder="请选择操作人员"
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">日志类型</span>
            <Select
              v-model:value="filterLogTypeId"
              :options="logTypeOptions"
              show-search
              placeholder="请选择日志类型"
            />
          </Space.Compact>
          <div class="query-filter-wide">
            <QueryDatetimeRangePicker v-model="filterDateRange" />
          </div>
          <div class="query-filter-actions">
            <Space>
              <Button type="primary" @click="handleSearch">查询</Button>
              <Button @click="handleReset">重置</Button>
              <Button
                v-if="canExport"
                :loading="exporting"
                @click="handleExport"
                >
导出 Excel
</Button>
            </Space>
          </div>
        </div>
      </div>

      <Grid />
    </Card>
  </Page>

  <Page v-else auto-content-height title="日志管理">
    <Result
      status="403"
      sub-title="需要权限 10010 才能访问此页面"
      title="无权限"
    />
  </Page>
</template>

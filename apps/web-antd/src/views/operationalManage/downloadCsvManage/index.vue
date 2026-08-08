<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAppConfig } from '@vben/hooks';

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Result,
  Select,
  Space,
  Switch,
  Tooltip,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDownloadCsvApi,
  downloadCsvCheckApi,
  fetchDownloadCsvListApi,
} from '#/api/operationManage/download-csv';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  DOWNLOAD_CSV_STATUS_MAP,
  formatOperationDateTime,
} from '#/utils/operation-status';
import { DOWNLOAD_CSV_SECURITY_PAGE_ID } from '#/utils/security-page-ids';

defineOptions({ name: 'DownloadCsvManage' });

interface DownloadRow {
  AdminUsername?: string;
  CreateTime?: number | string;
  FileName?: string;
  Id: number | string;
  Name?: string;
  Path?: string;
  Progress?: number;
  Remark?: string;
  Status?: number;
  UpdateTime?: number | string;
}

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const { checkPermission } = useCloudPermission();

const canViewPage = computed(() => checkPermission(12041));
const canDelete = computed(() => checkPermission(12042));
const canAutoRefresh = computed(() => checkPermission(12043));
const canDownload = computed(() => checkPermission(12044));

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const downloadOpen = ref(false);
const downloadSaving = ref(false);
const pendingDownload = reactive({
  FileName: '',
  Id: '' as number | string,
});

const filterId = ref('');
const filterPath = ref('');
const filterStatus = ref<number | string>(-1);
/** 对齐旧站：当月 1 日 00:00:00 ~ 今日 23:59:59（含时分秒） */
function defaultDateRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  return [dayjs().startOf('month'), dayjs().endOf('day')];
}
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(defaultDateRange());
const autoRefresh = ref(false);
let refreshTimer: ReturnType<typeof setTimeout> | undefined;

const statusOptions = [
  { label: '全部', value: -1 },
  { label: '导出中', value: 0 },
  { label: '成功', value: 1 },
  { label: '失败', value: 2 },
];

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  // 对齐旧站：Auto=true 时后端仅支持查当天
  const range = autoRefresh.value
    ? ([dayjs().startOf('day'), dayjs().endOf('day')] as [
        dayjs.Dayjs,
        dayjs.Dayjs,
      ])
    : filterDateRange.value || defaultDateRange();
  const [begin, end] = range;
  return {
    Auto: autoRefresh.value,
    // 保留 RangePicker 时分秒，勿强制 startOf/endOf('day')（非自动刷新时）
    BeginTime: begin ? begin.startOf('day').unix() : '',
    EndTime: end ? end.endOf('day').unix() : '',
    Id: filterId.value.trim(),
    Page: page.currentPage,
    PageSize: page.pageSize,
    Path: filterPath.value.trim(),
    // 对齐实测/旧站列表常用排序
    Sort: '-CreateTime',
    Status: filterStatus.value,
  };
}

function statusColor(status?: number) {
  if (Number(status) === 0) {
    return '#139bd5';
  }
  if (Number(status) === 1) {
    return '#3fba82';
  }
  if (Number(status) === 2) {
    return '#ff0200';
  }
  return undefined;
}

function progressPercent(row: DownloadRow) {
  if (Number(row.Status) === 2) {
    return 0;
  }
  const value = Number(row.Progress);
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.min(100, Math.round(value));
}

function isDeleteDisabled(row: DownloadRow) {
  if (Number(row.Status) !== 0) {
    return false;
  }
  const created = Number(row.CreateTime);
  if (!Number.isFinite(created) || created <= 0) {
    return false;
  }
  return Math.ceil(Date.now() / 1000) - created < 86400;
}

function finishTimeText(row: DownloadRow) {
  if (Number(row.Status) !== 1) {
    return '-';
  }
  return formatOperationDateTime(row.UpdateTime);
}

const gridOptions: VxeTableGridOptions<DownloadRow> = {
  columns: [
    { field: 'Id', minWidth: 110, title: '导出任务编号' },
    {
      field: 'Name',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '所属页面',
    },
    {
      field: 'FileName',
      minWidth: 200,
      showOverflow: 'tooltip',
      title: '导出文件名称',
    },
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'Progress',
      minWidth: 160,
      slots: { default: 'progress' },
      title: '导出进度',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '发起时间',
    },
    {
      field: 'UpdateTime',
      formatter: ({ row }) => finishTimeText(row as DownloadRow),
      minWidth: 170,
      title: '完成时间',
    },
    { field: 'AdminUsername', minWidth: 120, title: '导出发起人' },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchDownloadCsvListApi(getQueryParams(page));
        const items = (result.Items || []) as DownloadRow[];
        const maxCount = result.Pagination?.MaxCount;
        return {
          items,
          total: Number(
            maxCount === undefined || maxCount === null
              ? items.length
              : maxCount,
          ),
        };
      },
    },
  },
  rowConfig: { keyField: 'Id' },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  clearAutoRefreshTimer();
  void gridApi.reload();
  scheduleAutoRefresh();
}

function resetFilters() {
  filterId.value = '';
  filterPath.value = '';
  filterStatus.value = -1;
  filterDateRange.value = defaultDateRange();
  handleSearch();
}

function openDownload(row: DownloadRow) {
  pendingDownload.Id = row.Id;
  pendingDownload.FileName = String(row.FileName || '');
  downloadOpen.value = true;
}

function submitDownloadForm() {
  if (!pendingDownload.FileName.trim()) {
    message.warning('请填写导出文件名称');
    return;
  }
  downloadOpen.value = false;
  passPopupRef.value?.validate(DOWNLOAD_CSV_SECURITY_PAGE_ID, {
    FileName: pendingDownload.FileName.trim(),
    Id: pendingDownload.Id,
  });
}

async function handlePassConfirm(data: Record<string, unknown>) {
  const id = data.Id ?? pendingDownload.Id;
  const fileName = String(data.FileName || pendingDownload.FileName || '');
  if (id === undefined || id === null || id === '') {
    return;
  }
  downloadSaving.value = true;
  try {
    const validCode = String(data.ValidCode || '').trim();
    const result = (await downloadCsvCheckApi({
      FileName: fileName,
      Id: id,
      ...(validCode ? { ValidCode: validCode } : {}),
    })) as { Path?: string };
    const path = String(result?.Path || '');
    if (!path) {
      message.error('未获取到下载路径');
      return;
    }
    // 对齐旧站：BASE_API + /api/download?Path=&FileName=
    const base = String(apiURL || '/api').replace(/\/$/, '');
    window.open(
      `${base}/download?Path=${encodeURIComponent(path)}&FileName=${encodeURIComponent(fileName)}`,
      '_blank',
    );
    message.success('开始下载');
  } catch {
    message.error('下载失败');
  } finally {
    downloadSaving.value = false;
    pendingDownload.Id = '';
    pendingDownload.FileName = '';
  }
}

async function handleDelete(row: DownloadRow) {
  await deleteDownloadCsvApi(row.Id);
  message.success('删除成功');
  handleSearch();
}

function clearAutoRefreshTimer() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
  }
}

function scheduleAutoRefresh() {
  clearAutoRefreshTimer();
  if (!autoRefresh.value || !canAutoRefresh.value) {
    return;
  }
  refreshTimer = setTimeout(() => {
    void gridApi.reload();
    scheduleAutoRefresh();
  }, 15 * 1000);
}

function handleAutoRefreshChange(checked: boolean | string | number) {
  autoRefresh.value = Boolean(checked);
  // 对齐旧站提示：开启自动刷新后仅查当天
  if (autoRefresh.value) {
    filterDateRange.value = [dayjs().startOf('day'), dayjs().endOf('day')];
  }
  handleSearch();
}

onMounted(() => {
  if (canViewPage.value) {
    handleSearch();
  }
});

onUnmounted(() => {
  clearAutoRefreshTimer();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 导出任务管理"
    title="导出管理"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterId"
          allow-clear
          :maxlength="11"
          placeholder="任务编号"
          style="width: 180px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>任务编号</template>
        </Input>
        <Input
          v-model:value="filterPath"
          allow-clear
          placeholder="导出文件名称"
          style="width: 260px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>文件名称</template>
        </Input>
        <Select
          v-model:value="filterStatus"
          :options="statusOptions"
          style="width: 120px"
        />
        <DatePicker.RangePicker
          v-model:value="filterDateRange"
          :disabled="autoRefresh"
          :placeholder="['发起开始', '发起结束']"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="resetFilters">重置</Button>
        <div v-if="canAutoRefresh" class="flex items-center gap-2">
          <span class="text-sm text-gray-500">自动刷新</span>
          <Switch :checked="autoRefresh" @change="handleAutoRefreshChange" />
          <Tooltip title="开启后每 15 秒自动刷新；开启时日期仅能查询当天数据">
            <span class="cursor-help text-xs text-gray-400">说明</span>
          </Tooltip>
        </div>
      </div>

      <Grid>
        <template #status="{ row }">
          <Tooltip
            v-if="Number(row.Status) === 2"
            :title="row.Remark || '导出失败'"
          >
            <span :style="{ color: statusColor(row.Status) }">
              {{ DOWNLOAD_CSV_STATUS_MAP[Number(row.Status)] || '-' }}
            </span>
          </Tooltip>
          <span v-else :style="{ color: statusColor(row.Status) }">
            {{ DOWNLOAD_CSV_STATUS_MAP[Number(row.Status)] || '-' }}
          </span>
        </template>
        <template #progress="{ row }">
          <Progress
            :percent="progressPercent(row)"
            :show-info="true"
            size="small"
            :status="
              Number(row.Status) === 2
                ? 'exception'
                : Number(row.Status) === 0
                  ? 'active'
                  : 'success'
            "
          />
        </template>
        <template #actions="{ row }">
          <Space :size="0">
            <Button
              v-if="canDownload"
              :disabled="Number(row.Status) !== 1"
              size="small"
              type="link"
              @click="openDownload(row)"
            >
              下载
            </Button>
            <Popconfirm
              v-if="canDelete"
              :disabled="isDeleteDisabled(row)"
              title="确认删除该导出任务？"
              @confirm="handleDelete(row)"
            >
              <Button
                :disabled="isDeleteDisabled(row)"
                danger
                size="small"
                type="link"
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </Grid>
    </Card>

    <Modal
      v-model:open="downloadOpen"
      :confirm-loading="downloadSaving"
      destroy-on-close
      title="下载"
      @ok="submitDownloadForm"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="导出文件名称" required>
          <Input
            v-model:value="pendingDownload.FileName"
            allow-clear
            placeholder="请输入文件名称"
          />
        </Form.Item>
      </Form>
    </Modal>

    <PassPopup ref="passPopupRef" @confirm="handlePassConfirm" />
  </Page>
  <Result
    v-else
    status="403"
    sub-title="无导出管理查看权限(12041)"
    title="403"
  />
</template>

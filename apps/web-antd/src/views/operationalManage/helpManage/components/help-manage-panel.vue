<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  agreeHelpRecordApi,
  closeHelpRecordApi,
  fetchHelpManageListApi,
  rejectHelpRecordApi,
} from '#/api/operationManage/help-manage';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import {
  formatOperationDateTime,
  HELP_RECORD_STATUS_MAP,
} from '#/utils/operation-status';

defineOptions({ name: 'HelpManagePanel' });

interface HelpRow {
  ConfirmTime?: number | string;
  CreateTime?: number | string;
  Duration?: number;
  HelperName?: string;
  Id: number | string;
  NeedConfirm?: number;
  Reason?: string;
  Status?: number;
}

const { checkPermission } = useCloudPermission();
const canAgree = computed(() => checkPermission(10_231));
const canReject = computed(() => checkPermission(10_232));
const canClose = computed(() => checkPermission(10_233));

/** 默认当月：月初 00:00:00 ～ 今天 23:59:59 */
function monthRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  const range = getCurrentMonthRangeSeconds();
  return [dayjs.unix(range.BeginTime), dayjs.unix(range.EndTime)];
}

const filterHelperAccount = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(monthRange());
/** 对齐旧站 el-table 列筛选：客户端过滤当前页 */
const filterStatus = ref<number | string>('');
const sortValue = ref('');
const actionId = ref<number | string>();

const statusOptions = [
  { label: '全部', value: '' },
  { label: '申请中', value: 1 },
  { label: '进行中', value: 2 },
  { label: '已关闭', value: 3 },
];

function isOverdue(row: HelpRow) {
  const confirm = Number(row.ConfirmTime || 0);
  const duration = Number(row.Duration || 0);
  if (!confirm) {
    return false;
  }
  return confirm + duration * 3600 <= Date.now() / 1000;
}

function displayStatus(row: HelpRow) {
  if (Number(row.Status) === 3 || isOverdue(row)) {
    return 3;
  }
  return Number(row.Status || 0);
}

function canOperate(row: HelpRow) {
  return Number(row.Status) !== 3 && !isOverdue(row);
}

function statusLabel(row: HelpRow) {
  const status = displayStatus(row);
  if (status === 3) {
    return '已关闭';
  }
  return HELP_RECORD_STATUS_MAP[status] || String(row.Status ?? '-');
}

function statusColor(row: HelpRow) {
  const status = displayStatus(row);
  if (status === 3) {
    return 'error';
  }
  if (status === 2) {
    return 'success';
  }
  return 'default';
}

function matchStatusFilter(row: HelpRow) {
  if (filterStatus.value === '' || filterStatus.value === undefined) {
    return true;
  }
  return displayStatus(row) === Number(filterStatus.value);
}

const gridOptions: VxeTableGridOptions<HelpRow> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      sortable: true,
      title: '申请时间',
    },
    {
      field: 'ConfirmTime',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 0
          ? '-'
          : formatOperationDateTime(cellValue as string),
      minWidth: 160,
      sortable: true,
      title: '同意时间',
    },
    { field: 'HelperName', minWidth: 120, title: '协助账号' },
    { field: 'Reason', minWidth: 180, showOverflow: true, title: '协助内容' },
    {
      field: 'Duration',
      formatter: ({ cellValue }) => `${cellValue ?? '-'}小时`,
      minWidth: 120,
      title: '协助有效期',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 240,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page, sorts }) => {
        const sortItem = sorts?.[0];
        if (sortItem?.field) {
          sortValue.value =
            sortItem.order === 'desc'
              ? `-${sortItem.field}`
              : String(sortItem.field);
        } else {
          sortValue.value = '';
        }

        const [begin, end] = filterDateRange.value || [];
        const result = await fetchHelpManageListApi({
          BeginTime: begin ? begin.unix() : '',
          EndTime: end ? end.unix() : '',
          HelperAccount: filterHelperAccount.value.trim(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortValue.value,
        });
        const items = ((result.Items || []) as unknown as HelpRow[]).filter(
          (row) => matchStatusFilter(row),
        );
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
    sort: true,
  },
  sortConfig: {
    remote: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterHelperAccount.value = '';
  filterStatus.value = '';
  sortValue.value = '';
  filterDateRange.value = monthRange();
  gridApi.reload();
}

function runAction(
  content: string,
  api: (data: { Id: number | string }) => Promise<unknown>,
  row: HelpRow,
) {
  Modal.confirm({
    content,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await api({ Id: row.Id });
        message.success('操作成功');
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '提示',
  });
}

function handleAgree(row: HelpRow) {
  runAction('是否同意此协助订单？', agreeHelpRecordApi, row);
}

function handleReject(row: HelpRow) {
  runAction('是否拒绝此协助订单？', rejectHelpRecordApi, row);
}

function handleClose(row: HelpRow) {
  runAction('是否终止此协助订单？', closeHelpRecordApi, row);
}
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterHelperAccount"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入协助账号"
        >
          <template #addonBefore>协助账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">状态</span>
          <Select
            v-model:value="filterStatus"
            allow-clear
            :options="statusOptions"
            placeholder="请选择状态"
          />
        </Space.Compact>
      </div>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker v-model="filterDateRange" label="申请时间" />
      </div>
      <div class="query-filter-actions query-filter-actions-single">
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>
    </template>
    <Grid>
      <template #status="{ row }">
        <Tag :color="statusColor(row)">{{ statusLabel(row) }}</Tag>
      </template>
      <template #action="{ row }">
        <div v-if="canOperate(row)" class="flex flex-wrap gap-1">
          <Button
            v-if="
              canAgree &&
              Number(row.NeedConfirm) === 1 &&
              Number(row.Status) === 1
            "
            size="small"
            type="primary"
            :loading="actionId === row.Id"
            @click="handleAgree(row)"
          >
            同意协助
          </Button>
          <Button
            v-if="
              canReject &&
              Number(row.NeedConfirm) === 1 &&
              Number(row.Status) === 1
            "
            size="small"
            :loading="actionId === row.Id"
            @click="handleReject(row)"
          >
            拒绝
          </Button>
          <Button
            v-if="canClose && Number(row.Status) === 2"
            danger
            size="small"
            :loading="actionId === row.Id"
            @click="handleClose(row)"
          >
            终止
          </Button>
        </div>
        <span v-else>-</span>
      </template>
    </Grid>
  </OpsListPanel>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { preferences } from '@vben/preferences';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchHelpOrderListApi,
  helpLinkLoginApi,
  helpOrderActionApi,
} from '#/api/operationManage/help-order';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useAuthStore } from '#/store';
import { removeHelpLink, setHelpLink } from '#/utils/auth-token';
import { getTodayRangeSeconds } from '#/utils/date-range';
import {
  HELP_RECORD_STATUS_MAP,
  formatOperationDateTime,
} from '#/utils/operation-status';

defineOptions({ name: 'HelpOrderPanel' });

interface HelpOrderRow {
  AgentName?: string;
  ConfirmTime?: number | string;
  CreateTime?: number | string;
  CreatorName?: string;
  Duration?: number;
  HelperName?: string;
  Id: number | string;
  NeedConfirm?: number;
  Reason?: string;
  Status?: number;
}

type KeywordType = 'All' | 'Creator';

const { checkPermission } = useCloudPermission();
const canHelp = computed(() => checkPermission(10235));
const authStore = useAuthStore();
const router = useRouter();

const actionId = ref<number | string>();
const keywordType = ref<KeywordType>('All');
const keywordValue = ref('');

/**
 * 对齐旧站 helpOrder：getBeforeDateStr(1)～getBeforeDateStr(1,false)
 * （GLOBAL days-1，参数 1 实际为今天）
 */
function todayRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  const range = getTodayRangeSeconds();
  return [dayjs.unix(range.BeginTime), dayjs.unix(range.EndTime)];
}

const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(todayRange());
const filterStatus = ref<number | string>('');
const sortValue = ref('');

const keywordTypeOptions = [
  { label: '全部', value: 'All' },
  { label: '协助账号', value: 'Creator' },
];

const statusOptions = [
  { label: '全部', value: '' },
  { label: '申请中', value: 1 },
  { label: '进行中', value: 2 },
  { label: '已关闭', value: 3 },
];

function isOverdue(row: HelpOrderRow) {
  const confirm = Number(row.ConfirmTime || 0);
  const duration = Number(row.Duration || 0);
  if (!confirm) {
    return false;
  }
  return confirm + duration * 3600 <= Date.now() / 1000;
}

function displayStatus(row: HelpOrderRow) {
  if (Number(row.Status) === 3 || isOverdue(row)) {
    return 3;
  }
  return Number(row.Status || 0);
}

function canAct(row: HelpOrderRow) {
  return Number(row.Status) === 2 && !isOverdue(row);
}

function statusLabel(row: HelpOrderRow) {
  const status = displayStatus(row);
  if (status === 3) {
    return '已关闭';
  }
  return HELP_RECORD_STATUS_MAP[status] || String(row.Status ?? '-');
}

function statusColor(row: HelpOrderRow) {
  const status = displayStatus(row);
  if (status === 3) {
    return 'error';
  }
  if (status === 2) {
    return 'success';
  }
  return 'default';
}

function matchStatusFilter(row: HelpOrderRow) {
  if (filterStatus.value === '' || filterStatus.value === undefined) {
    return true;
  }
  return displayStatus(row) === Number(filterStatus.value);
}

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const fallback = getTodayRangeSeconds();
  const [begin, end] = filterDateRange.value || [];
  const query: Record<string, unknown> = {
    // 对齐旧站 SearchTypeTwo：保留 RangePicker 时分秒
    BeginTime: begin ? begin.startOf('day').unix() : fallback.BeginTime,
    Creator: '',
    EndTime: end ? end.endOf('day').unix() : fallback.EndTime,
    Keyword: '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    Sort: sortValue.value,
  };
  const value = keywordValue.value.trim();
  if (value) {
    if (keywordType.value === 'Creator') {
      query.Creator = value;
    } else {
      query.Keyword = value;
    }
  }
  return query;
}

const gridOptions: VxeTableGridOptions<HelpOrderRow> = {
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
      title: '创建日期',
    },
    {
      field: 'ConfirmTime',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 0
          ? '-'
          : formatOperationDateTime(cellValue as string),
      minWidth: 160,
      sortable: true,
      title: '同意日期',
    },
    { field: 'AgentName', minWidth: 120, title: '需协助代理' },
    { field: 'HelperName', minWidth: 120, title: '协助账号' },
    { field: 'Reason', minWidth: 200, showOverflow: true, title: '协助内容' },
    {
      field: 'Duration',
      formatter: ({ cellValue }) => `${cellValue ?? '-'}小时`,
      minWidth: 110,
      title: '协助有效期',
    },
    {
      field: 'NeedConfirm',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 1 ? '允许' : '不允许',
      minWidth: 100,
      title: '代理允许',
    },
    { field: 'CreatorName', minWidth: 120, title: '添加人员' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 120,
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

        const result = await fetchHelpOrderListApi(buildQuery(page));
        const items = (
          (result.Items || []) as unknown as HelpOrderRow[]
        ).filter(matchStatusFilter);
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
  keywordType.value = 'All';
  keywordValue.value = '';
  filterStatus.value = '';
  sortValue.value = '';
  filterDateRange.value = todayRange();
  gridApi.reload();
}

async function openAssistSession(link: string) {
  setHelpLink(link);
  try {
    const loginResult = await helpLinkLoginApi();
    const token = String(loginResult?.Token || '');
    if (!token) {
      removeHelpLink();
      Modal.info({
        content: link,
        title: '协助链接（登录未返回 Token，请手动使用）',
      });
      return;
    }

    // 对齐旧站：替换当前会话 Token，并新开页进入协助账号后台
    // HelpLink Cookie 保留（旧站不主动清除）
    await authStore.completeLogin(token, async () => {
      const homePath = preferences.app.defaultHomePath || '/dashboard/index';
      const routeUrl = router.resolve({ path: homePath });
      window.open(routeUrl.href, '_blank');
      message.success('协助登录成功，已打开新窗口');
    });
  } catch {
    removeHelpLink();
    Modal.info({
      content: link,
      title: '协助链接（自动登录失败，请手动使用）',
    });
  }
}

function handleHelp(row: HelpOrderRow) {
  Modal.confirm({
    content: '是否协助此协助订单？',
    onOk: async () => {
      actionId.value = row.Id;
      try {
        const result = await helpOrderActionApi({ Id: row.Id });
        const link = String(result?.Link || '');
        if (!link) {
          message.warning('未返回协助链接');
          return;
        }
        await openAssistSession(link);
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '提示',
  });
}
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">关键字</span>
        <div class="flex gap-1">
          <Select
            v-model:value="keywordType"
            style="width: 110px"
            :options="keywordTypeOptions"
          />
          <Input
            v-model:value="keywordValue"
            allow-clear
            placeholder="请输入"
            style="width: 180px"
            @press-enter="handleSearch"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
          placeholder="全部"
          style="width: 140px"
          :options="statusOptions"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">创建日期</span>
        <DatePicker.RangePicker
          v-model:value="filterDateRange"
          format="YYYY-MM-DD"
        />
      </div>
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
    </template>
    <Grid>
      <template #status="{ row }">
        <Tag :color="statusColor(row)">{{ statusLabel(row) }}</Tag>
      </template>
      <template #action="{ row }">
        <Button
          v-if="canHelp && canAct(row)"
          danger
          size="small"
          type="primary"
          :loading="actionId === row.Id"
          @click="handleHelp(row)"
        >
          协助
        </Button>
        <span v-else>-</span>
      </template>
    </Grid>
  </OpsListPanel>
</template>

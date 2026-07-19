<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteGameEmailApi,
  fetchGameEmailListApi,
  fetchGameEmailReadStatusApi,
} from '#/api/operationManage/game-notice';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import AccountSelect from '#/components/global/account-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatOperationDateTime } from '#/utils/operation-status';

import GameEmailFormModal from './game-email-form-modal.vue';

defineOptions({ name: 'GameEmailListPanel' });

interface EmailRow {
  CreateTime?: number | string;
  EmailStatus?: number;
  Icon?: number;
  Id: number | string;
  IsAll?: number;
  IsPush?: number;
  LangText?: Record<string, { Content?: string; Title?: string }> | string;
  LoginAccountList?: string;
  PackageIds?: Array<number | string> | string;
  PushContent?: string;
  PushTitle?: string;
  Sender?: string;
  SendStatus?: number | boolean;
  SendTime?: number | string;
  Type?: number;
  Username?: string;
}

interface ReadPlayerRow {
  IsRead?: boolean | number;
  LoginAccount?: string;
}

/** 旧站 EmailStatus：1未读 2已读 3已删除 */
const EMAIL_STATUS_MAP: Record<number, { color: string; text: string }> = {
  1: { color: 'default', text: '未读' },
  2: { color: 'success', text: '已读' },
  3: { color: 'error', text: '已删除' },
};

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const router = useRouter();

const canViewTable = computed(() => checkPermission(10077));
const canCreate = computed(() => checkPermission(10078));
const canEditOrView = computed(() => checkPermission(10077));
const canDelete = computed(() => checkPermission(13368));

const actionId = ref<number | string>();
const formOpen = ref(false);
const editId = ref<number | string | null>(null);
const formReadonly = ref(false);

/** 与旧站 listQuery 对齐：Sender / Username / 日期 */
const filterSender = ref('');
const filterUsername = ref<string | number | undefined>(undefined);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const readModalOpen = ref(false);
const readLoading = ref(false);
const readPlayers = ref<ReadPlayerRow[]>([]);

const packageNameMap = computed(() => {
  const map = new Map<string, string>();
  for (const item of packageOptions.value) {
    map.set(String(item.PackageId), item.PackageName);
  }
  return map;
});

function parseLangText(raw: EmailRow['LangText']) {
  if (!raw) {
    return {} as Record<string, { Content?: string; Title?: string }>;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<
        string,
        { Content?: string; Title?: string }
      >;
    } catch {
      return {};
    }
  }
  return raw;
}

function resolveLangField(row: EmailRow, field: 'Title' | 'Content') {
  const lang = parseLangText(row.LangText);
  const first = Object.values(lang)[0];
  return first?.[field] || '-';
}

function stripHtml(html: string) {
  return (
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim() || '-'
  );
}

function resolvePackageNames(row: EmailRow) {
  let ids: string[] = [];
  if (Array.isArray(row.PackageIds)) {
    ids = row.PackageIds.map(String);
  } else if (typeof row.PackageIds === 'string' && row.PackageIds) {
    ids = row.PackageIds.split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }
  if (!ids.length) {
    return '-';
  }
  return ids.map((id) => packageNameMap.value.get(id) || id).join(',') || '-';
}

function resolveEmailStatus(row: EmailRow) {
  const status = Number(row.EmailStatus);
  return (
    EMAIL_STATUS_MAP[status] || {
      color: 'default',
      text: String(row.EmailStatus ?? '-'),
    }
  );
}

function usernameParam() {
  const value = filterUsername.value;
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return String(value);
}

const gridOptions: VxeTableGridOptions<EmailRow> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '创建时间',
    },
    {
      field: 'SendTime',
      formatter: ({ cellValue }) => {
        if (!cellValue || Number(cellValue) <= 0) {
          return '-';
        }
        return formatOperationDateTime(cellValue as string);
      },
      minWidth: 160,
      title: '发送时间',
    },
    {
      field: 'Username',
      formatter: ({ cellValue }) => String(cellValue || '-'),
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '代理/推广账号',
    },
    { field: 'Sender', minWidth: 100, title: '发送人' },
    {
      field: 'IsAll',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 1 ? '全部玩家' : '指定玩家',
      minWidth: 100,
      title: '发送方式',
    },
    {
      field: 'LoginAccountList',
      formatter: ({ cellValue }) => String(cellValue || '-'),
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '收件人',
    },
    {
      field: 'PackageIds',
      formatter: ({ row }) => resolvePackageNames(row),
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '生效游戏包',
    },
    {
      field: 'Content',
      formatter: ({ row }) => stripHtml(resolveLangField(row, 'Content')),
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '通知内容',
    },
    {
      field: 'Title',
      minWidth: 140,
      showOverflow: 'tooltip',
      slots: { default: 'title' },
      title: '邮件标题',
    },
    {
      field: 'Type',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '活动' : '通知'),
      minWidth: 90,
      title: '邮件类型',
    },
    {
      field: 'EmailStatus',
      minWidth: 90,
      slots: { default: 'emailStatus' },
      title: '状态',
    },
    {
      field: 'readStatus',
      minWidth: 100,
      slots: { default: 'readStatus' },
      title: '阅读状态',
    },
    {
      field: 'Icon',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '重要' : '普通'),
      minWidth: 90,
      title: '图标标识',
    },
    {
      field: 'IsPush',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '是' : '否'),
      minWidth: 90,
      title: '是否推送',
    },
    {
      field: 'PushTitle',
      formatter: ({ row }) =>
        Number(row.IsPush) === 1 ? String(row.PushTitle || '-') : '-',
      minWidth: 120,
      title: '推送标题',
    },
    {
      field: 'PushContent',
      formatter: ({ row }) =>
        Number(row.IsPush) === 1 ? String(row.PushContent || '-') : '-',
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '推送内容',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 140,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!canViewTable.value) {
          return { items: [], total: 0 };
        }
        const query: Record<string, unknown> = {
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sender: filterSender.value.trim(),
          Username: usernameParam(),
        };
        if (filterDateRange.value?.[0] && filterDateRange.value?.[1]) {
          query.BeginTime = filterDateRange.value[0].startOf('day').unix();
          query.EndTime = filterDateRange.value[1].endOf('day').unix();
        }
        const result = await fetchGameEmailListApi(query);
        const items = (result.Items || []) as unknown as EmailRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function resetFilters() {
  filterSender.value = '';
  filterUsername.value = undefined;
  filterDateRange.value = undefined;
  gridApi.reload();
}

function openCreate() {
  editId.value = null;
  formReadonly.value = false;
  formOpen.value = true;
}

function openEdit(row: EmailRow, readonly = false) {
  editId.value = row.Id;
  formReadonly.value = readonly;
  formOpen.value = true;
}

/** 对齐旧站：点击标题进入邮件访问统计 */
function openVisitStats(row: EmailRow) {
  router.push({
    path: '/operationalManage/emailTitle',
    query: {
      Id: String(row.Id),
      Title: resolveLangField(row, 'Title'),
    },
  });
}

function handleRowAction(row: EmailRow) {
  // 旧站：已发送(SendStatus) → 查看；否则编辑
  if (row.SendStatus) {
    openEdit(row, true);
  } else {
    openEdit(row, false);
  }
}

function canRemove(row: EmailRow) {
  return Number(row.EmailStatus) !== 3;
}

function handleDelete(row: EmailRow) {
  Modal.confirm({
    content: `确认删除邮件「${resolveLangField(row, 'Title')}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await deleteGameEmailApi(row.Id);
        message.success('删除成功');
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '删除邮件',
  });
}

async function openReadPlayers(row: EmailRow) {
  readModalOpen.value = true;
  readLoading.value = true;
  readPlayers.value = [];
  try {
    const result = await fetchGameEmailReadStatusApi(row.Id);
    if (Array.isArray(result)) {
      readPlayers.value = result as ReadPlayerRow[];
    } else if (result && typeof result === 'object') {
      const items =
        (result as { Items?: ReadPlayerRow[] }).Items ||
        (result as { List?: ReadPlayerRow[] }).List ||
        [];
      readPlayers.value = Array.isArray(items) ? items : [];
    }
    if (!readPlayers.value.length) {
      message.info('暂无阅读状态数据');
    }
  } catch {
    readPlayers.value = [];
  } finally {
    readLoading.value = false;
  }
}
</script>

<template>
  <div v-if="canViewTable || canCreate">
    <!-- 查询区与旧站 email.vue 对齐：发送人 / 代理推广账号 / 日期 / 查询重置 / 新增 -->
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterSender"
        allow-clear
        placeholder="请输入"
        style="width: 250px"
      >
        <template #addonBefore>发送人</template>
      </Input>

      <div class="flex items-center gap-0">
        <span
          class="inline-flex h-8 items-center whitespace-nowrap rounded-l border border-r-0 border-gray-300 bg-gray-50 px-2 text-sm text-gray-600"
        >
          代理/推广账号
        </span>
        <AccountSelect v-model="filterUsername" class="w-[250px]" return-name />
      </div>

      <DatePicker.RangePicker v-model:value="filterDateRange" allow-clear />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button v-if="canCreate" type="primary" @click="openCreate">新增</Button>
    </div>

    <Grid v-if="canViewTable">
      <template #title="{ row }">
        <Button type="link" class="!px-0" @click="openVisitStats(row)">
          {{ resolveLangField(row, 'Title') || '-' }}
        </Button>
      </template>
      <template #emailStatus="{ row }">
        <Tag :color="resolveEmailStatus(row).color">
          {{ resolveEmailStatus(row).text }}
        </Tag>
      </template>
      <template #readStatus="{ row }">
        <Button
          v-if="Number(row.IsAll) !== 1"
          size="small"
          type="link"
          @click="openReadPlayers(row)"
        >
          玩家列表
        </Button>
        <span v-else>-</span>
      </template>
      <template #action="{ row }">
        <Space :size="0">
          <Button
            v-if="canEditOrView"
            size="small"
            type="link"
            @click="handleRowAction(row)"
          >
            {{ row.SendStatus ? '查看' : '编辑' }}
          </Button>
          <Button
            v-if="canDelete && canRemove(row)"
            danger
            size="small"
            type="link"
            :loading="actionId === row.Id"
            @click="handleDelete(row)"
          >
            删除
          </Button>
          <span v-if="!canEditOrView && !(canDelete && canRemove(row))">
            -
          </span>
        </Space>
      </template>
    </Grid>
    <div v-else class="py-8 text-center text-gray-400">无列表查看权限</div>

    <GameEmailFormModal
      v-model:open="formOpen"
      :readonly="formReadonly"
      :row-id="editId"
      @success="gridApi.reload()"
    />

    <Modal
      v-model:open="readModalOpen"
      :footer="null"
      title="邮件阅读状态"
      width="420px"
    >
      <Table
        :columns="[
          { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号' },
          { dataIndex: 'IsRead', key: 'IsRead', title: '阅读状态' },
        ]"
        :data-source="readPlayers"
        :loading="readLoading"
        :pagination="false"
        row-key="LoginAccount"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'IsRead'">
            <Tag :color="record.IsRead ? 'success' : 'default'">
              {{ record.IsRead ? '已读' : '未读' }}
            </Tag>
          </template>
        </template>
      </Table>
    </Modal>
  </div>
  <div v-else class="py-8 text-center text-gray-400">无邮件通知权限</div>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  message,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import {
  deleteGameNoticeApi,
  fetchGameNoticeListApi,
  switchGameNoticeApi,
} from '#/api/operationManage/game-notice';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatOperationDateTime } from '#/utils/operation-status';

import GameNoticeFormModal from './game-notice-form-modal.vue';

defineOptions({ name: 'GameNoticeListPanel' });

interface NoticeRow {
  CreateTime?: number | string;
  Creator?: string;
  EndTime?: number | string;
  HandlerName?: string;
  Id: number | string;
  IsOpen?: number;
  IsPush?: number;
  LangText?: Record<string, { Notice?: string; Title?: string }> | string;
  Packages?: string | number;
  ShowIdx?: number;
  ShowStage?: number;
  /** 行内 Status：2=已关闭（与筛选 Status 语义不同） */
  Status?: number;
  StartTime?: number | string;
  UpdateTime?: number | string;
}

/** 旧站 StatusList：筛选参数（非行内 Status 字段） */
const NOTICE_FILTER_STATUS_OPTIONS = [
  { label: '全部', value: '' },
  { label: '待发布', value: 1 },
  { label: '已启用', value: 2 },
  { label: '已停用', value: 3 },
];

const SHOW_STAGE_MAP: Record<number, string> = {
  2: '普通',
  102: '重要',
  1000: '停机',
  1001: '充值',
  1002: '紧急',
};

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();
const router = useRouter();

const canViewTable = computed(() => checkPermission(10073));
const canCreate = computed(() => checkPermission(10074));
const canEdit = computed(() => checkPermission(10075));
const canDelete = computed(() => checkPermission(10076));

/** 对齐旧站 currentLangGroupId：优先 Default，再取首个 */
const currentLangGroupId = computed(() => {
  const groups = projectConfig.value?.LangGroup || [];
  const preferred = groups.find((item) => item.Default) || groups[0];
  return preferred?.Id !== undefined && preferred?.Id !== null
    ? String(preferred.Id)
    : '';
});

const actionId = ref<number | string>();
const formOpen = ref(false);
const editId = ref<number | string | null>(null);

/** 与旧站 listQuery 对齐 */
const filterCreator = ref('');
const filterStatus = ref<number | string>('');
const filterTitle = ref('');
/** 旧站 SearchTypeTwo 默认无日期（defaultDateTime=[]），首次可不带时间 */
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const packageNameMap = computed(() => {
  const map = new Map<string, string>();
  for (const item of packageOptions.value) {
    map.set(String(item.PackageId), item.PackageName);
  }
  return map;
});

function parseLangText(raw: NoticeRow['LangText']) {
  if (!raw) {
    return {} as Record<string, { Notice?: string; Title?: string }>;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<
        string,
        { Notice?: string; Title?: string }
      >;
    } catch {
      return {};
    }
  }
  return raw;
}

function resolveLangField(row: NoticeRow, field: 'Title' | 'Notice'): string {
  const lang = parseLangText(row.LangText);
  const preferred = currentLangGroupId.value
    ? lang[currentLangGroupId.value]
    : undefined;
  if (preferred?.[field]) {
    return String(preferred[field]);
  }
  const first = Object.values(lang)[0];
  return first?.[field] || '-';
}

function resolvePackages(packages: NoticeRow['Packages']) {
  if (packages === undefined || packages === null || packages === '') {
    return '-';
  }
  const ids = String(packages)
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (!ids.length) {
    return '-';
  }
  return ids.map((id) => packageNameMap.value.get(id) || id).join(',') || '-';
}

/** 对齐旧站：Status==2 显示已关闭；否则按 Start/End/IsOpen 计算 */
function resolveRuntimeStatus(row: NoticeRow) {
  if (Number(row.Status) === 2) {
    return { color: 'error' as const, text: '已关闭' };
  }
  const now = Date.now();
  const start = Number(row.StartTime || 0) * 1000;
  const end = Number(row.EndTime || 0) * 1000;
  const isOpen = Number(row.IsOpen);
  if (start > now && isOpen === 1) {
    return { color: 'default' as const, text: '待发布' };
  }
  if (start && now > start && (!end || now < end) && isOpen === 1) {
    return { color: 'success' as const, text: '已启用' };
  }
  return { color: 'warning' as const, text: '已停用' };
}

function stripHtml(html: string) {
  return (
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim() || '-'
  );
}

const gridOptions: VxeTableGridOptions<NoticeRow> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'IsOpen',
      minWidth: 100,
      slots: { default: 'isOpen' },
      title: '开关',
    },
    {
      field: 'StartTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      sortable: true,
      title: '开始日期',
    },
    {
      field: 'EndTime',
      formatter: ({ cellValue }) => {
        if (!cellValue || Number(cellValue) === 0) {
          return '-';
        }
        return formatOperationDateTime(cellValue as string);
      },
      minWidth: 160,
      sortable: true,
      title: '结束日期',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      sortable: true,
      title: '创建时间',
    },
    { field: 'ShowIdx', minWidth: 80, sortable: true, title: '排序' },
    {
      field: 'Packages',
      formatter: ({ row }) => resolvePackages(row.Packages),
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '生效产品',
    },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '操作时间',
    },
    {
      field: 'HandlerName',
      formatter: ({ row }) => String(row.HandlerName || row.Creator || '-'),
      minWidth: 100,
      title: '操作人',
    },
    {
      field: 'ShowStage',
      formatter: ({ cellValue }) =>
        SHOW_STAGE_MAP[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 100,
      title: '公告类型',
    },
    {
      field: 'IsPush',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '是' : '否'),
      minWidth: 90,
      title: '是否推送',
    },
    {
      field: 'Title',
      minWidth: 160,
      showOverflow: 'tooltip',
      slots: { default: 'title' },
      title: '公告标题',
    },
    {
      field: 'Notice',
      formatter: ({ row }) => stripHtml(resolveLangField(row, 'Notice')),
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '公告内容',
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
      query: async ({ page, sort }) => {
        if (!canViewTable.value) {
          return { items: [], total: 0 };
        }
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          // 对齐旧站 sortChange：升序 field，降序 -field
          sortParam =
            sortOrder === 'asc' ? String(sortField) : `-${sortField}`;
        }
        const query: Record<string, unknown> = {
          Creator: filterCreator.value.trim(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
          Status: filterStatus.value ?? '',
          Title: filterTitle.value.trim(),
        };
        if (filterDateRange.value?.[0] && filterDateRange.value?.[1]) {
          query.BeginTime = filterDateRange.value?.[0]?.unix() || '';
          query.EndTime = filterDateRange.value?.[1]?.unix() || '';
        }
        const result = await fetchGameNoticeListApi(query);
        const items = (result.Items || []) as unknown as NoticeRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
  sortConfig: {
    remote: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function resetFilters() {
  filterCreator.value = '';
  filterStatus.value = '';
  filterTitle.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

function openCreate() {
  editId.value = null;
  formOpen.value = true;
}

function openEdit(row: NoticeRow) {
  editId.value = row.Id;
  formOpen.value = true;
}

/** 对齐旧站：点击标题进入公告访问统计 */
function openVisitStats(row: NoticeRow) {
  router.push({
    path: '/operationalManage/noticeTitle',
    query: {
      Id: String(row.Id),
      Title: resolveLangField(row, 'Title'),
    },
  });
}

async function handleSwitch(
  row: NoticeRow,
  checked: boolean | string | number,
) {
  const next = checked === true || checked === 1 ? 1 : 2;
  const prev = Number(row.IsOpen) === 1 ? 1 : 2;
  if (next === prev) {
    return;
  }
  if (next === 1) {
    const end = Number(row.EndTime || 0);
    if (end > 0 && end < Math.floor(Date.now() / 1000)) {
      message.warning('结束时间已过，请先编辑结束时间');
      row.IsOpen = prev;
      return;
    }
  }
  actionId.value = row.Id;
  try {
    await switchGameNoticeApi({ Id: row.Id, IsOpen: next });
    row.IsOpen = next;
    message.success('开关已更新');
    await gridApi.reload();
  } catch {
    row.IsOpen = prev;
  } finally {
    actionId.value = undefined;
  }
}

function handleDelete(row: NoticeRow) {
  Modal.confirm({
    content: `确认删除公告「${resolveLangField(row, 'Title')}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await deleteGameNoticeApi(row.Id);
        message.success('删除成功');
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '删除公告',
  });
}
</script>

<template>
  <div v-if="canViewTable || canCreate">
    <!-- 查询区与旧站 notice.vue Filters 对齐：发布者 / 状态 / 公告标题 / 日期 / 查询重置 / 新增 -->
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterCreator"
          allow-clear
          style="width: 250px"
          placeholder="请输入发布者"
        >
          <template #addonBefore>发布者</template>
        </Input>
      </div>

      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
          class="w-44"
          :options="NOTICE_FILTER_STATUS_OPTIONS"
          placeholder="请选择"
        />
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterTitle"
          allow-clear
          style="width: 280px"
          placeholder="请输入公告标题"
        >
          <template #addonBefore>公告标题</template>
        </Input>
      </div>

      <QueryDatetimeRangePicker v-model="filterDateRange" />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button v-if="canCreate" type="primary" @click="openCreate">新增</Button>
    </div>

    <Grid v-if="canViewTable">
      <template #status="{ row }">
        <Tag :color="resolveRuntimeStatus(row).color">
          {{ resolveRuntimeStatus(row).text }}
        </Tag>
      </template>
      <template #title="{ row }">
        <Button type="link" class="!px-0" @click="openVisitStats(row)">
          {{ resolveLangField(row, 'Title') || '-' }}
        </Button>
      </template>
      <template #isOpen="{ row }">
        <Switch
          :checked="Number(row.IsOpen) === 1"
          :loading="actionId === row.Id"
          checked-children="开"
          un-checked-children="关"
          @change="(checked) => handleSwitch(row, checked)"
        />
      </template>
      <template #action="{ row }">
        <Space :size="0">
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            :loading="actionId === row.Id"
            @click="handleDelete(row)"
          >
            删除
          </Button>
          <span v-if="!canEdit && !canDelete">-</span>
        </Space>
      </template>
    </Grid>
    <div v-else class="py-8 text-center text-gray-400">无列表查看权限</div>

    <GameNoticeFormModal
      v-model:open="formOpen"
      :row-id="editId"
      @success="gridApi.reload()"
    />
  </div>
  <div v-else class="py-8 text-center text-gray-400">无游戏公告权限</div>
</template>

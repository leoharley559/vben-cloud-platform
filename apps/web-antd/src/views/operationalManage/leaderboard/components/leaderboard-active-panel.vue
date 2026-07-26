<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchLeaderboardListApi,
  fetchLeaderboardMainConfigApi,
  offshelfLeaderboardApi,
  switchLeaderboardMainConfigApi,
} from '#/api/operationManage/leaderboard';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import LeaderboardGlobalConfigModal from './leaderboard-global-config-modal.vue';
import LeaderboardRankingsModal from './leaderboard-rankings-modal.vue';
import LeaderboardUpsertModal from './leaderboard-upsert-modal.vue';
import {
  LEADERBOARD_TYPE_OPTIONS,
  formatLeaderboardInactiveMode,
  formatLeaderboardType,
  resolveLeaderboardTitle,
} from './leaderboard-shared';

defineOptions({ name: 'LeaderboardActivePanel' });

const props = defineProps<{
  isHistory?: boolean;
}>();

const emit = defineEmits<{
  checkRecord: [activityId: number | string];
}>();

interface LeaderboardRow {
  ActivityEndTime?: number | string;
  ActivityStartTime?: number | string;
  ActivityType?: number;
  Id: number | string;
  InactiveMode?: number;
  LangText?: unknown;
  NumParticipants?: number;
  Operator?: string;
  Status?: number;
  Title?: string;
  UpdateTime?: number | string;
  ValidPackages?: string;
}

const { checkPermission } = useCloudPermission();

const canConfig = computed(() => checkPermission(13437) && !props.isHistory);
const canCreate = computed(() => checkPermission(13435) && !props.isHistory);
const canOffshelf = computed(() => checkPermission(13438) && !props.isHistory);

const globalActive = ref(false);
const globalLoading = ref(false);
const configOpen = ref(false);
const upsertOpen = ref(false);
const upsertMode = ref<'add' | 'clone' | 'edit'>('add');
const upsertId = ref<number | string>();
const rankingsOpen = ref(false);
const rankingsRow = ref<LeaderboardRow>();
const actionId = ref<number | string>();

const filterId = ref('');
const filterActivityType = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const typeFilterOptions = LEADERBOARD_TYPE_OPTIONS.filter(
  (item) => item.value !== '',
);

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    ActivityType:
      filterActivityType.value === '' ? '' : filterActivityType.value,
    // 测试环境传 YYYY-MM-DD 会 10000；与探测通过的 unix 秒对齐
    EndTime: end ? end.endOf('day').unix() : '',
    Id: filterId.value.trim(),
    IsHistory: Boolean(props.isHistory),
    Page: page.currentPage,
    PageSize: page.pageSize,
    StartTime: begin ? begin.startOf('day').unix() : '',
  };
}

async function loadGlobalConfig() {
  if (!canConfig.value) {
    return;
  }
  globalLoading.value = true;
  try {
    const data = await fetchLeaderboardMainConfigApi();
    globalActive.value = Boolean(data?.IsActive);
  } finally {
    globalLoading.value = false;
  }
}

void loadGlobalConfig();

const gridOptions: VxeTableGridOptions<LeaderboardRow> = {
  columns: [
    { type: 'seq', minWidth: 60, title: '序号' },
    {
      field: 'Id',
      minWidth: 90,
      slots: { default: 'activityId' },
      title: '活动ID',
    },
    {
      field: 'ActivityType',
      formatter: ({ cellValue }) => formatLeaderboardType(cellValue),
      minWidth: 110,
      title: '活动类型',
    },
    {
      field: 'Title',
      formatter: ({ row }) =>
        resolveLeaderboardTitle(row.LangText) || row.Title || '-',
      minWidth: 160,
      title: '活动标题',
    },
    {
      field: 'rankings',
      minWidth: 90,
      slots: { default: 'rankings' },
      title: '排行查看',
    },
    ...(props.isHistory
      ? [
          {
            field: 'InactiveMode',
            formatter: ({ cellValue }: { cellValue?: number | string }) =>
              formatLeaderboardInactiveMode(cellValue),
            minWidth: 110,
            title: '状态',
          },
        ]
      : [
          {
            field: 'Status',
            minWidth: 100,
            slots: { default: 'status' },
            title: '状态',
          },
        ]),
    {
      field: 'ActivityStartTime',
      formatter: ({ cellValue }) => String(cellValue ?? '-'),
      minWidth: 120,
      title: '开始时间',
    },
    {
      field: 'ActivityEndTime',
      formatter: ({ cellValue }) => String(cellValue ?? '-'),
      minWidth: 120,
      title: '结束时间',
    },
    { field: 'NumParticipants', minWidth: 100, title: '参与人数' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: props.isHistory ? 100 : 160,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchLeaderboardListApi(buildQuery(page));
        const items = (result.Items || []) as unknown as LeaderboardRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterId.value = '';
  filterActivityType.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

function openAdd() {
  upsertMode.value = 'add';
  upsertId.value = undefined;
  upsertOpen.value = true;
}

function openEdit(row: LeaderboardRow) {
  upsertMode.value = 'edit';
  upsertId.value = row.Id;
  upsertOpen.value = true;
}

function openClone(row: LeaderboardRow) {
  upsertMode.value = 'clone';
  upsertId.value = row.Id;
  upsertOpen.value = true;
}

function openRankings(row: LeaderboardRow) {
  rankingsRow.value = row;
  rankingsOpen.value = true;
}

function handleCheckRecord(row: LeaderboardRow) {
  emit('checkRecord', row.Id);
}

async function handleToggleGlobal(checked: boolean | string | number) {
  Modal.confirm({
    content: '确认切换排行榜全局开关？',
    onOk: async () => {
      globalLoading.value = true;
      try {
        await switchLeaderboardMainConfigApi();
        globalActive.value = Boolean(checked);
        message.success('切换成功');
        await loadGlobalConfig();
      } catch {
        globalActive.value = !Boolean(checked);
      } finally {
        globalLoading.value = false;
      }
    },
    onCancel: () => {
      globalActive.value = !Boolean(checked);
    },
    title: '活动开关',
  });
}

function canClose(row: LeaderboardRow) {
  return !props.isHistory && Number(row.Status) !== 2;
}

function handleOffshelf(row: LeaderboardRow) {
  Modal.confirm({
    content: `确认下架排行榜「${resolveLeaderboardTitle(row.LangText) || row.Title || row.Id}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await offshelfLeaderboardApi(row.Id);
        message.success('下架成功');
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '下架排行榜',
  });
}

function statusColor(status?: number) {
  if (status === 0) {
    return 'default';
  }
  if (status === 1) {
    return 'success';
  }
  return 'error';
}

function statusLabel(status?: number) {
  if (status === 0) {
    return '未开始';
  }
  if (status === 1) {
    return '进行中';
  }
  if (status === 2) {
    return '已结束';
  }
  return String(status ?? '-');
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div class="flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterId"
          allow-clear
          placeholder="活动ID"
          style="width: 210px"
        >
          <template #addonBefore>活动ID</template>
        </Input>
        <Select
          v-model:value="filterActivityType"
          allow-clear
          class="w-32"
          :options="typeFilterOptions"
          placeholder="活动类型"
        />
        <DatePicker.RangePicker v-model:value="filterDateRange" />
        <Space>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </div>
      <Space v-if="!isHistory">
        <span v-if="canConfig" class="inline-flex items-center gap-2 text-sm">
          活动开关
          <Switch
            :checked="globalActive"
            :loading="globalLoading"
            @change="handleToggleGlobal"
          />
        </span>
        <Button v-if="canConfig" @click="configOpen = true">全局设置</Button>
        <Button v-if="canCreate" type="primary" @click="openAdd">
          新增活动
        </Button>
      </Space>
    </div>

    <Grid>
      <template #activityId="{ row }">
        <Button
          v-if="isHistory"
          size="small"
          type="link"
          @click="handleCheckRecord(row)"
        >
          {{ row.Id }}
        </Button>
        <span v-else>{{ row.Id }}</span>
      </template>
      <template #status="{ row }">
        <Tag :color="statusColor(Number(row.Status))">
          {{ statusLabel(Number(row.Status)) }}
        </Tag>
      </template>
      <template #rankings="{ row }">
        <Button size="small" type="link" @click="openRankings(row)">
          查看
        </Button>
      </template>
      <template #action="{ row }">
        <Space>
          <template v-if="!isHistory">
            <Button size="small" type="link" @click="openEdit(row)">
              编辑
            </Button>
            <Button
              v-if="canOffshelf && canClose(row)"
              danger
              size="small"
              :loading="actionId === row.Id"
              @click="handleOffshelf(row)"
            >
              下架
            </Button>
          </template>
          <Button
            v-if="isHistory"
            size="small"
            type="link"
            @click="openClone(row)"
          >
            克隆
          </Button>
        </Space>
      </template>
    </Grid>

    <LeaderboardGlobalConfigModal v-model:open="configOpen" />
    <LeaderboardUpsertModal
      v-model:open="upsertOpen"
      :leaderboard-id="upsertId"
      :mode="upsertMode"
      @success="gridApi.reload()"
    />
    <LeaderboardRankingsModal
      v-model:open="rankingsOpen"
      :activity-id="rankingsRow?.Id"
      :packages="rankingsRow?.ValidPackages"
    />
  </div>
</template>

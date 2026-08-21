<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  GameTitleBatchEditPayload,
  GameTitleGroupItem,
  GameTitleItem,
} from '#/types/game-title';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Dropdown,
  Input,
  Menu,
  message,
  Modal,
  Result,
  Select,
  Space,
  Switch,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchEditGameTitleApi,
  deleteGameTitleApi,
  fetchGameTitleGroupListApi,
  fetchGameTitleListApi,
  updateGameTitleSwitchApi,
} from '#/api/memberManage/game-title';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  formatGameTitleActiveTime,
  formatGameTitleBudget,
  formatGameTitleDisplayDesc,
  formatGameTitleVip,
} from '#/utils/game-title';
import { getServiceImageUrl } from '#/utils/media';

import GameTitleBatchEditModal from './game-title-batch-edit-modal.vue';
import GameTitleFormModal from './game-title-form-modal.vue';
import GameTitleOwnerModal from './game-title-owner-modal.vue';

defineOptions({ name: 'GameTitleList' });

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(13_137));
const canAdd = computed(() => checkPermission(13_138));
const canEdit = computed(() => checkPermission(13_139));
const canDelete = computed(() => checkPermission(13_140));
const canSwitch = computed(() => checkPermission(13_141));
const canOpenOwner = computed(() => checkPermission(13_142));
const canBatch = computed(() => checkPermission(13_150));

const filterName = ref('');
const filterCategoryId = ref<number | string>(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const groupOptions = ref<GameTitleGroupItem[]>([]);
const ownerModalOpen = ref(false);
const currentTitle = ref<GameTitleItem>();
const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const editingRow = ref<GameTitleItem | null>(null);
const batchOpen = ref(false);
const batchType = ref<'calTime' | 'vip'>('vip');
const batchModalRef = ref<InstanceType<typeof GameTitleBatchEditModal>>();

function formatUnixSeconds(value?: number) {
  if (!value || value === 0) {
    return '长期开放';
  }
  return dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss');
}

function getGroupName(categoryId?: number | string) {
  const target = groupOptions.value.find(
    (item) => String(item.Id) === String(categoryId),
  );
  return target?.Name || '-';
}

function getOwnerCountClass(row: GameTitleItem) {
  const total = Number(row.OwnerNum || 0) + Number(row.QualifiedNum || 0);
  if (row.Budget && row.Budget > 0 && total > row.Budget) {
    return 'text-red-500';
  }
  return 'text-blue-600';
}

async function loadGroupOptions() {
  const result = await fetchGameTitleGroupListApi({
    Page: 1,
    PageSize: 500,
  });
  groupOptions.value = result.Items || [];
}

function openOwnerModal(row: GameTitleItem) {
  currentTitle.value = row;
  ownerModalOpen.value = true;
}

function openCreate() {
  formMode.value = 'create';
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: GameTitleItem) {
  formMode.value = 'edit';
  editingRow.value = row;
  formOpen.value = true;
}

function handleDelete(row: GameTitleItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '此操作将删除该称号，且已获得玩家也会被删除，是否继续？',
    onOk: async () => {
      await deleteGameTitleApi(row.Id!);
      message.success('删除成功');
      gridApi.reload();
    },
    title: '删除确认',
  });
}

function getSelectedRows() {
  return (gridApi.grid?.getCheckboxRecords?.() || []) as GameTitleItem[];
}

function getSelectedIds() {
  return getSelectedRows()
    .map((item) => item.Id)
    .filter((id): id is number | string => id != null && id !== '');
}

async function handleBatchSwitch(nextSwitch: 0 | 1) {
  const ids = getSelectedIds();
  if (ids.length === 0) {
    message.warning('请先勾选称号');
    return;
  }
  Modal.confirm({
    content: nextSwitch === 1 ? '是否开启所选称号？' : '是否关闭所选称号？',
    onOk: async () => {
      await batchEditGameTitleApi({
        BadgeIds: ids.join(','),
        EditType: 1,
        Switch: nextSwitch,
      });
      message.success('批量更新成功');
      gridApi.reload();
    },
    title: '批量确认',
  });
}

function openBatchEdit(type: 'calTime' | 'vip') {
  const ids = getSelectedIds();
  if (ids.length === 0) {
    message.warning('请先勾选称号');
    return;
  }
  batchType.value = type;
  batchOpen.value = true;
}

async function confirmBatchEdit(
  payload: Omit<GameTitleBatchEditPayload, 'BadgeIds'>,
) {
  const ids = getSelectedIds();
  if (ids.length === 0) {
    message.warning('请先勾选称号');
    return;
  }
  batchModalRef.value?.setSubmitting(true);
  try {
    await batchEditGameTitleApi({
      ...payload,
      BadgeIds: ids.join(','),
    });
    message.success('批量编辑成功');
    batchOpen.value = false;
    gridApi.reload();
  } finally {
    batchModalRef.value?.setSubmitting(false);
  }
}

async function handleSwitch(row: GameTitleItem, checked: boolean) {
  if (!row.Id) {
    return;
  }
  const nextSwitch = checked ? 1 : 0;
  const previous = row.Switch;
  row.Switch = nextSwitch;
  try {
    await updateGameTitleSwitchApi({ Id: row.Id, Switch: nextSwitch });
    message.success('状态已更新');
  } catch {
    row.Switch = previous;
  }
}

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : undefined,
    CategoryId: filterCategoryId.value ? filterCategoryId.value : undefined,
    EndTime: end ? end.unix() : undefined,
    Name: filterName.value || undefined,
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<GameTitleItem> = {
  checkboxConfig: { highlight: true },
  columns: [
    { type: 'checkbox', width: 48 },
    {
      field: 'Switch',
      slots: { default: 'switch' },
      title: '状态',
      width: 90,
    },
    { field: 'Id', title: '称号ID', width: 90 },
    { field: 'Ordinal', title: '排序', width: 80 },
    {
      field: 'CategoryId',
      formatter: ({ cellValue }) => getGroupName(cellValue),
      minWidth: 120,
      title: '称号类别',
    },
    { field: 'Name', minWidth: 140, title: '称号名称' },
    {
      field: 'DisplayDesc',
      formatter: ({ cellValue }) => formatGameTitleDisplayDesc(cellValue),
      minWidth: 150,
      title: '游戏内展示',
    },
    {
      field: 'Desc',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '称号描述',
    },
    {
      field: 'Vip',
      formatter: ({ row }) => formatGameTitleVip(row),
      minWidth: 110,
      title: 'VIP 等级',
    },
    {
      field: 'Img',
      minWidth: 180,
      slots: { default: 'image' },
      title: '称号图片',
    },
    {
      field: 'OwnerNum',
      minWidth: 100,
      slots: { default: 'ownerNum' },
      title: '拥有人数',
    },
    {
      field: 'Budget',
      formatter: ({ cellValue }) => formatGameTitleBudget(cellValue),
      minWidth: 100,
      title: '预算',
    },
    {
      field: 'ActivatedStartTime',
      formatter: ({ row }) =>
        formatGameTitleActiveTime(
          row.ActivatedStartTime,
          row.ActivatedEndTime,
          formatUnixSeconds,
        ),
      minWidth: 220,
      title: '生效时间',
    },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 140,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchGameTitleListApi(getQueryParams(page));
        return {
          items: result.Items || [],
          total: Number(result.Pagination?.MaxCount || 0),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function handleOwnerChanged() {
  gridApi.reload();
}

onMounted(async () => {
  if (!canViewTable.value) {
    return;
  }
  await loadGroupOptions();
  gridApi.reload();
});
</script>

<template>
  <OpsListPanel v-if="canViewTable">
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterName"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入称号名称"
        >
          <template #addonBefore>称号名称</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">称号类别</span>
          <Select
            v-model:value="filterCategoryId"
            :options="[
              { label: '全部', value: 0 },
              ...groupOptions.map((item) => ({
                label: item.Name,
                value: item.Id,
              })),
            ]"
            placeholder="请选择称号类别"
          />
        </Space.Compact>
      </div>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker v-model="filterDateRange" label="获得时间" />
      </div>
      <div class="query-filter-actions">
        <Button type="primary" @click="handleSearch">查询</Button>
      </div>
    </template>

    <div
      v-if="canAdd || canBatch"
      class="mb-2 flex flex-wrap items-center justify-end gap-2"
    >
      <Button v-if="canAdd" type="primary" @click="openCreate">
        新增称号
      </Button>
      <Dropdown v-if="canBatch">
        <Button>批量编辑</Button>
        <template #overlay>
          <Menu>
            <Menu.Item key="open" @click="handleBatchSwitch(1)">
              批量开启
            </Menu.Item>
            <Menu.Item key="close" @click="handleBatchSwitch(0)">
              批量关闭
            </Menu.Item>
            <Menu.Item key="cal" @click="openBatchEdit('calTime')">
              批量改计算时间
            </Menu.Item>
            <Menu.Item key="vip" @click="openBatchEdit('vip')">
              批量改 VIP
            </Menu.Item>
          </Menu>
        </template>
      </Dropdown>
    </div>

    <Grid>
      <template #switch="{ row }">
        <Switch
          :checked="row.Switch === 1"
          :disabled="!canSwitch"
          @change="(checked) => handleSwitch(row, Boolean(checked))"
        />
      </template>
      <template #image="{ row }">
        <img
          v-if="row.Img"
          :src="getServiceImageUrl(row.Img)"
          alt="称号图片"
          class="h-10 max-w-[180px] object-contain"
        />
        <span v-else>-</span>
      </template>
      <template #ownerNum="{ row }">
        <Button
          v-if="canOpenOwner"
          size="small"
          type="link"
          :class="getOwnerCountClass(row)"
          @click="openOwnerModal(row)"
        >
          {{ row.OwnerNum ?? 0 }}
        </Button>
        <span v-else :class="getOwnerCountClass(row)">
          {{ row.OwnerNum ?? 0 }}
        </span>
      </template>
      <template #actions="{ row }">
        <Space>
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
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <GameTitleOwnerModal
      v-model:open="ownerModalOpen"
      :game-title="currentTitle"
      @changed="handleOwnerChanged"
    />
    <GameTitleFormModal
      v-model:open="formOpen"
      :group-options="groupOptions"
      :mode="formMode"
      :row="editingRow"
      @success="gridApi.reload()"
    />
    <GameTitleBatchEditModal
      ref="batchModalRef"
      v-model:open="batchOpen"
      :type="batchType"
      @confirm="confirmBatchEdit"
    />
  </OpsListPanel>
  <Result v-else status="403" sub-title="无称号管理查看权限" title="403" />
</template>

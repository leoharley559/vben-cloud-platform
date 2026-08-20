<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import { preferences } from '@vben/preferences';

import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchUpdateSubGameApi,
  fetchSubGameMaintainListApi,
  updateSubGameMaintainApi,
  updateSubGameSortApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'SubGameManagePanel' });

interface SubGameRow {
  GameId?: number | string;
  GameName?: string;
  HotTag?: boolean | number | string;
  Id?: number | string;
  IsBigPrizeGame?: boolean | number | string;
  IsOpen?: number;
  IsSpecialGame?: boolean | number | string;
  Name?: string;
  SortId?: number;
  SubGameId?: number | string;
  UpdateAdminId?: number | string;
  UpdateTime?: number | string;
  [key: string]: unknown;
}

type BatchType = 1 | 2;

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const canEdit = computed(() => checkPermission(12_407));

const filters = reactive({
  GameId: '' as number | string,
  SearchTag: 0,
  SubGameId: '',
  SubGameName: '',
});
const actionKey = ref('');
const editVisible = ref(false);
const batchVisible = ref(false);
const saving = ref(false);
const editForm = reactive({
  GameId: '' as number | string,
  IsBigPrizeGame: false,
  IsOpen: 1,
  IsSpecialGame: false,
  Name: '',
  SortId: 1,
  SubGameId: '' as number | string,
  raw: null as null | SubGameRow,
  HotTag: false,
});
const batchForm = reactive({
  IsOpen: '' as number | string,
  SubGameIds: '',
  Tag: '' as number | string,
  Type: 1 as BatchType,
});

const tagOptions = [
  { label: '热门', value: 2 },
  { label: '特色', value: 3 },
  { label: '大奖', value: 4 },
];
const searchTagOptions = [{ label: '全部标签', value: 0 }, ...tagOptions];
const openOptions = [
  { label: '开启', value: 1 },
  { label: '关闭', value: 0 },
];
const venueOptions = computed(() =>
  Object.entries(gameConfig.value.games)
    .filter(([, game]) => Number(game.ParentId) === 0)
    .map(([id, game]) => ({
      label: game.gameName || id,
      value: id,
    })),
);

const batchTitle = computed(() =>
  batchForm.Type === 1 ? '批量编辑游戏标签' : '批量编辑显示状态',
);

function ensureDefaultVenue() {
  if (filters.GameId !== '' && filters.GameId != null) return;
  const first = venueOptions.value[0];
  if (first) filters.GameId = first.value;
}

function rowKey(row: SubGameRow) {
  return `${row.GameId}-${row.SubGameId}`;
}

const columns: VxeTableGridOptions<SubGameRow>['columns'] = [
  { type: 'checkbox', width: 48 },
  { type: 'seq', title: '序号', width: 60 },
  {
    field: 'IsOpen',
    slots: { default: 'isOpen' },
    title: '是否开启',
    width: 100,
  },
  { field: 'SubGameId', minWidth: 110, title: '游戏 ID' },
  { field: 'Name', minWidth: 160, title: '游戏名称' },
  { field: 'SortId', minWidth: 90, title: '排序' },
  {
    field: 'HotTag',
    minWidth: 170,
    slots: { default: 'tags' },
    title: '游戏标签',
  },
  { field: 'GameName', minWidth: 140, title: '场馆名称' },
  {
    field: 'UpdateTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string),
    minWidth: 170,
    title: '操作时间',
  },
  { field: 'UpdateAdminId', minWidth: 110, title: '操作人' },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    width: 150,
  },
];

const gridOptions: VxeTableGridOptions<SubGameRow> = {
  columns,
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        await ensureGameConfig();
        ensureDefaultVenue();
        const result = await fetchSubGameMaintainListApi({
          GameId: filters.GameId,
          Lang: String(preferences.app.locale || ''),
          Page: page.currentPage,
          PageSize: page.pageSize,
          SearchTag: filters.SearchTag,
          SubGameId: filters.SubGameId,
          SubGameName: filters.SubGameName,
          Sort: '',
        });
        const items = (result.Items || []) as unknown as SubGameRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount ?? items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function selectedRows() {
  return (gridApi.grid?.getCheckboxRecords?.() || []) as SubGameRow[];
}

function isEnabledFlag(value: unknown) {
  return (
    value === true ||
    Number(value) === 1 ||
    String(value).toLowerCase() === 'true'
  );
}

function normalizeTags(row: SubGameRow) {
  return {
    HotTag: isEnabledFlag(row.HotTag),
    IsBigPrizeGame: isEnabledFlag(row.IsBigPrizeGame),
    IsSpecialGame: isEnabledFlag(row.IsSpecialGame),
  };
}

function openEdit(row: SubGameRow) {
  editForm.raw = { ...row };
  editForm.GameId = row.GameId || '';
  editForm.SubGameId = row.SubGameId || '';
  editForm.Name = String(row.Name || '');
  editForm.SortId = Number(row.SortId || 1);
  editForm.IsOpen = Number(row.IsOpen) === 1 ? 1 : 0;
  Object.assign(editForm, normalizeTags(row));
  editVisible.value = true;
}

async function submitEdit() {
  if (!editForm.raw) return;
  if (!Number.isInteger(editForm.SortId) || editForm.SortId <= 0) {
    message.warning('排序值必须为大于 0 的整数');
    return;
  }
  const payload = {
    ...editForm.raw,
    HotTag: editForm.HotTag ? 1 : 0,
    IsBigPrizeGame: editForm.IsBigPrizeGame,
    IsOpen: editForm.IsOpen,
    IsSpecialGame: editForm.IsSpecialGame,
    SortId: editForm.SortId,
  };
  delete payload.Id;
  saving.value = true;
  try {
    await updateSubGameMaintainApi(payload);
    message.success('编辑成功');
    editVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function handleOpenSwitch(row: SubGameRow, checked: boolean) {
  const previous = Number(row.IsOpen) === 1 ? 1 : 0;
  const next = checked ? 1 : 0;
  Modal.confirm({
    content: `确认${next === 1 ? '开启' : '关闭'}“${row.Name || row.SubGameId}”吗？`,
    onCancel() {
      row.IsOpen = previous;
    },
    async onOk() {
      actionKey.value = rowKey(row);
      try {
        const payload = { ...row, IsOpen: next };
        delete payload.Id;
        await updateSubGameMaintainApi(payload);
        message.success('操作成功');
        await gridApi.reload();
      } catch (error) {
        row.IsOpen = previous;
        throw error;
      } finally {
        actionKey.value = '';
      }
    },
    title: '开关确认',
  });
}

async function moveUp(row: SubGameRow) {
  if (!row.GameId || !row.SubGameId || row.GameId === row.SubGameId) return;
  actionKey.value = rowKey(row);
  try {
    await updateSubGameSortApi({
      GameId: row.GameId,
      SubGameId: row.SubGameId,
    });
    message.success('排序已更新');
    await gridApi.reload();
  } finally {
    actionKey.value = '';
  }
}

function openBatch(type: BatchType) {
  const rows = selectedRows();
  if (rows.length === 0) {
    message.warning('请先勾选需要批量编辑的游戏');
    return;
  }
  batchForm.Type = type;
  batchForm.SubGameIds = rows.map((row) => row.SubGameId).join(',');
  batchForm.IsOpen = '';
  batchForm.Tag = '';
  batchVisible.value = true;
}

async function submitBatch() {
  if (batchForm.Type === 1 && batchForm.Tag === '') {
    message.warning('请选择游戏标签');
    return;
  }
  if (batchForm.Type === 2 && batchForm.IsOpen === '') {
    message.warning('请选择显示状态');
    return;
  }
  saving.value = true;
  try {
    await batchUpdateSubGameApi({ ...batchForm });
    message.success('批量编辑成功');
    batchVisible.value = false;
    await gridApi.grid?.clearCheckboxRow?.();
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

async function reloadFirstPage() {
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

function handleSearch() {
  void reloadFirstPage();
}

function handleReset() {
  filters.SearchTag = 0;
  filters.SubGameId = '';
  filters.SubGameName = '';
  filters.GameId = venueOptions.value[0]?.value || '';
  void reloadFirstPage();
}
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <Space.Compact>
          <span class="query-field-addon">游戏 ID</span>
          <Input
            v-model:value="filters.SubGameId"
            allow-clear
            placeholder="请输入游戏 ID"
            @press-enter="handleSearch"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">游戏名称</span>
          <Input
            v-model:value="filters.SubGameName"
            allow-clear
            placeholder="请输入游戏名称"
            @press-enter="handleSearch"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">游戏标签</span>
          <Select
            v-model:value="filters.SearchTag"
            :options="searchTagOptions"
            placeholder="请选择游戏标签"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">场馆名称</span>
          <Select
            v-model:value="filters.GameId"
            :options="venueOptions"
            placeholder="请选择场馆名称"
            show-search
          />
        </Space.Compact>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </div>
      </div>
    </div>

    <div class="mb-3 flex items-center justify-between gap-3">
      <Space wrap>
        <Button v-if="canEdit" type="primary" @click="openBatch(1)">
          批量编辑标签
        </Button>
        <Button v-if="canEdit" @click="openBatch(2)">批量编辑开关</Button>
      </Space>
      <span class="text-xs text-gray-400">
        主场馆行不可关闭或上移；批量操作前请先勾选游戏
      </span>
    </div>

    <div class="game-grid">
      <Grid>
        <template #tags="{ row }">
          <Space :size="4" wrap>
            <Tag v-if="isEnabledFlag(row.HotTag)" color="orange">热门</Tag>
            <Tag v-if="isEnabledFlag(row.IsSpecialGame)" color="blue">特色</Tag>
            <Tag v-if="isEnabledFlag(row.IsBigPrizeGame)" color="purple">
              大奖
            </Tag>
            <span
              v-if="
                !isEnabledFlag(row.HotTag) &&
                !isEnabledFlag(row.IsSpecialGame) &&
                !isEnabledFlag(row.IsBigPrizeGame)
              "
            >
              -
            </span>
          </Space>
        </template>
        <template #isOpen="{ row }">
          <Switch
            v-if="canEdit"
            :checked="Number(row.IsOpen) === 1"
            :disabled="String(row.GameId) === String(row.SubGameId)"
            :loading="actionKey === rowKey(row)"
            @change="(checked) => handleOpenSwitch(row, !!checked)"
          />
          <Tag v-else :color="Number(row.IsOpen) === 1 ? 'green' : 'red'">
            {{ Number(row.IsOpen) === 1 ? '开启' : '关闭' }}
          </Tag>
        </template>
        <template #action="{ row }">
          <Space :size="4">
            <Button
              v-if="canEdit"
              :disabled="String(row.GameId) === String(row.SubGameId)"
              :loading="actionKey === rowKey(row)"
              size="small"
              type="link"
              @click="moveUp(row)"
            >
              上移
            </Button>
            <Button
              v-if="canEdit"
              size="small"
              type="link"
              @click="openEdit(row)"
            >
              编辑
            </Button>
          </Space>
        </template>
      </Grid>
    </div>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑游戏"
      @ok="submitEdit"
    >
      <Form class="pt-3" layout="vertical">
        <div class="form-grid">
          <Form.Item label="游戏 ID">
            <Input :value="String(editForm.SubGameId)" disabled />
          </Form.Item>
          <Form.Item label="游戏名称">
            <Input :value="editForm.Name" disabled />
          </Form.Item>
          <Form.Item label="场馆名称">
            <Input :value="editForm.raw?.GameName" disabled />
          </Form.Item>
          <Form.Item label="是否开启">
            <Select v-model:value="editForm.IsOpen" :options="openOptions" />
          </Form.Item>
          <Form.Item label="排序值" required>
            <InputNumber
              v-model:value="editForm.SortId"
              class="!w-full"
              :max="999999"
              :min="1"
              :precision="0"
            />
          </Form.Item>
        </div>
        <Form.Item label="游戏标签">
          <Space>
            <Checkbox v-model:checked="editForm.HotTag">热门</Checkbox>
            <Checkbox v-model:checked="editForm.IsSpecialGame">特色</Checkbox>
            <Checkbox v-model:checked="editForm.IsBigPrizeGame">大奖</Checkbox>
          </Space>
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="batchVisible"
      :confirm-loading="saving"
      destroy-on-close
      :title="batchTitle"
      @ok="submitBatch"
    >
      <Form class="pt-3" layout="vertical">
        <Form.Item label="已选游戏 ID">
          <Input :value="batchForm.SubGameIds" disabled />
        </Form.Item>
        <Form.Item v-if="batchForm.Type === 1" label="游戏标签" required>
          <Select
            v-model:value="batchForm.Tag"
            :options="[{ label: '无标签', value: 1 }, ...tagOptions]"
            placeholder="请选择标签"
          />
        </Form.Item>
        <Form.Item v-else label="是否开启" required>
          <Select
            v-model:value="batchForm.IsOpen"
            :options="openOptions"
            placeholder="请选择状态"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.game-grid {
  overflow: hidden;
  border-radius: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

@media (max-width: 1000px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

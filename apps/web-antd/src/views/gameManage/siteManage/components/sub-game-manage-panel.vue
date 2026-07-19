<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Switch,
  Tag,
  message,
} from 'ant-design-vue';

import {
  fetchSubGameMaintainListApi,
  updateSubGameMaintainApi,
  updateSubGameSortApi,
} from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'SubGameManagePanel' });

interface SubGameRow {
  GameId?: number | string;
  GameName?: string;
  HotTag?: number;
  Id?: number | string;
  IsBigPrizeGame?: boolean;
  IsOpen?: number;
  IsSpecialGame?: boolean;
  Name?: string;
  SortId?: number;
  SubGameId?: number | string;
  [key: string]: unknown;
}

const { checkPermission } = useCloudPermission();
const canEdit = computed(() => checkPermission(12407));

const filterName = ref('');
const actionKey = ref('');
const editVisible = ref(false);
const saving = ref(false);

const editForm = reactive({
  GameId: '' as number | string,
  HotTag: false,
  IsBigPrizeGame: false,
  IsSpecialGame: false,
  Name: '',
  SortId: 0,
  SubGameId: '' as number | string,
  raw: null as null | SubGameRow,
});

const gridOptions: VxeTableGridOptions<SubGameRow> = {
  columns: [
    { field: 'Name', minWidth: 140, title: '游戏名称' },
    { field: 'GameName', minWidth: 120, title: '场馆' },
    { field: 'SubGameId', minWidth: 100, title: '游戏ID' },
    { field: 'SortId', minWidth: 80, title: '排序' },
    {
      field: 'HotTag',
      slots: { default: 'tags' },
      title: '标签',
      width: 160,
    },
    {
      field: 'IsOpen',
      slots: { default: 'isOpen' },
      title: '显示',
      width: 100,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchSubGameMaintainListApi({
          Page: page.currentPage,
          PageSize: page.pageSize,
          Username: filterName.value,
        });
        const items = (result.Items || []) as unknown as SubGameRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function rowKey(row: SubGameRow) {
  return `${row.GameId}-${row.SubGameId}`;
}

function openEdit(row: SubGameRow) {
  editForm.raw = { ...row };
  editForm.GameId = row.GameId || '';
  editForm.SubGameId = row.SubGameId || '';
  editForm.Name = String(row.Name || row.GameName || '');
  editForm.SortId = Number(row.SortId || 0);
  editForm.HotTag = Boolean(row.HotTag);
  editForm.IsSpecialGame = Boolean(row.IsSpecialGame);
  editForm.IsBigPrizeGame = Boolean(row.IsBigPrizeGame);
  editVisible.value = true;
}

async function submitEdit() {
  if (!editForm.raw) {
    return;
  }
  saving.value = true;
  try {
    const payload = { ...editForm.raw };
    delete payload.Id;
    payload.SortId = editForm.SortId;
    payload.HotTag = editForm.HotTag ? 1 : 0;
    payload.IsSpecialGame = editForm.IsSpecialGame;
    payload.IsBigPrizeGame = editForm.IsBigPrizeGame;
    await updateSubGameMaintainApi(payload);
    message.success('保存成功');
    editVisible.value = false;
    await gridApi.reload();
  } finally {
    saving.value = false;
  }
}

async function handleOpenSwitch(row: SubGameRow, checked: boolean) {
  const prev = Number(row.IsOpen) === 1 ? 1 : 0;
  const next = checked ? 1 : 0;
  Modal.confirm({
    content: `确认${next === 1 ? '开启' : '关闭'}「${row.Name}」？`,
    onCancel: () => {
      row.IsOpen = prev;
    },
    onOk: async () => {
      actionKey.value = rowKey(row);
      try {
        const payload = { ...row, IsOpen: next };
        delete payload.Id;
        await updateSubGameMaintainApi(payload);
        message.success('操作成功');
        await gridApi.reload();
      } catch {
        row.IsOpen = prev;
      } finally {
        actionKey.value = '';
      }
    },
    title: '提示',
  });
}

async function bumpSort(row: SubGameRow) {
  if (!row.GameId || !row.SubGameId) {
    return;
  }
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

function handleSearch() {
  gridApi.reload();
}
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Input
        v-model:value="filterName"
        allow-clear
        class="!w-[240px]"
        placeholder="关键词"
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">查询</Button>
    </div>
    <div class="mb-3 text-xs text-gray-400">
      已支持显示开关、热门/特色/大奖标签编辑、排序上移。
    </div>
    <Grid>
      <template #tags="{ row }">
        <div class="flex flex-wrap gap-1">
          <Tag v-if="row.HotTag" color="orange">热门</Tag>
          <Tag v-if="row.IsSpecialGame" color="blue">特色</Tag>
          <Tag v-if="row.IsBigPrizeGame" color="purple">大奖</Tag>
          <span v-if="!row.HotTag && !row.IsSpecialGame && !row.IsBigPrizeGame">
            -
          </span>
        </div>
      </template>
      <template #isOpen="{ row }">
        <Switch
          v-if="canEdit"
          :checked="Number(row.IsOpen) === 1"
          :disabled="row.GameId === row.SubGameId"
          :loading="actionKey === rowKey(row)"
          @change="(checked) => handleOpenSwitch(row, !!checked)"
        />
        <Tag v-else>{{ Number(row.IsOpen) === 1 ? '开' : '关' }}</Tag>
      </template>
      <template #action="{ row }">
        <div class="flex flex-wrap gap-1">
          <Button v-if="canEdit" size="small" @click="openEdit(row)">
            编辑
          </Button>
          <Button
            v-if="canEdit"
            size="small"
            :loading="actionKey === rowKey(row)"
            @click="bumpSort(row)"
          >
            上移
          </Button>
        </div>
      </template>
    </Grid>

    <Modal
      v-model:open="editVisible"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑子游戏"
      @ok="submitEdit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="游戏">
          <Input :value="editForm.Name" disabled />
        </Form.Item>
        <Form.Item label="排序值">
          <InputNumber v-model:value="editForm.SortId" class="!w-full" />
        </Form.Item>
        <Form.Item label="标签">
          <div class="flex flex-col gap-2">
            <Checkbox v-model:checked="editForm.HotTag">热门</Checkbox>
            <Checkbox v-model:checked="editForm.IsSpecialGame">特色</Checkbox>
            <Checkbox v-model:checked="editForm.IsBigPrizeGame">大奖</Checkbox>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BrokerageSetItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProjectConfigApi } from '#/api/core/project';
import {
  batchUpdateBrokerageSetApi,
  createBrokerageSetApi,
  fetchBrokerageSetListApi,
  resetBrokerageSetApi,
  updateBrokerageSetApi,
} from '#/api/promotion/manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { createRequestHash } from '#/utils/crypto';
import { formatVenueName } from '#/utils/game-config';
import { formatBrokerageGameName } from '#/utils/promotion';

defineOptions({ name: 'BrokerageSet' });

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const canViewTable = computed(() => checkPermission(10_856));
const canEdit = computed(() => checkPermission(10_858));
const canBatch = computed(() => checkPermission(10_859));
const canReset = computed(() => checkPermission(10_860));
const canViewPage = computed(
  () =>
    canViewTable.value ||
    canEdit.value ||
    canBatch.value ||
    canReset.value,
);

const editOpen = ref(false);
const batchOpen = ref(false);
const editLoading = ref(false);
const batchLoading = ref(false);
const resetLoading = ref(false);
const editingRow = ref<BrokerageSetItem>();
const editRate = ref<number>();
const editDesc = ref('');
const batchRate = ref<number>();
const batchGameIds = ref<Array<number | string>>([]);

function buildGameTree(
  overrides: BrokerageSetItem[] = [],
  defaultRate = 0,
) {
  const games = gameConfig.value.games || {};
  const parents: BrokerageSetItem[] = [];
  const children: BrokerageSetItem[] = [];
  for (const [id, game] of Object.entries(games)) {
    const row: BrokerageSetItem = {
      Desc: '',
      GameId: Number.isNaN(Number(id)) ? id : Number(id),
      Name:
        Number(game.ParentId || 0) === 0
          ? formatVenueName(id, gameConfig.value)
          : game.gameName || id,
      ParentId: game.ParentId,
      Rate: defaultRate,
      Type: 'create',
      children: [],
      resType: game.resType,
    };
    if (Number(game.ParentId || 0) === 0) parents.push(row);
    else children.push(row);
  }
  for (const parent of parents) {
    parent.children = children.filter(
      (child) => String(child.ParentId) === String(parent.GameId),
    );
    const configured = overrides.find(
      (item) => String(item.GameId) === String(parent.GameId),
    );
    if (configured) {
      Object.assign(parent, configured, { Type: 'update' });
    }
    for (const child of parent.children) {
      const childConfigured = overrides.find(
        (item) => String(item.GameId) === String(child.GameId),
      );
      if (childConfigured) {
        Object.assign(child, childConfigured, { Type: 'update' });
      } else if (configured) {
        child.Rate = configured.Rate;
      }
    }
  }
  return parents;
}

const gameTree = ref<BrokerageSetItem[]>([]);
const gameSelectOptions = computed(() =>
  gameTree.value.map((item) => ({
    label: item.Name || formatBrokerageGameName(item.GameId, gameConfig.value.games),
    value: item.GameId,
  })),
);

function getQueryParams() {
  // 对齐旧站 listQuery 字段；PageSize 用 500 拉取全量覆盖项（页面无分页，树由游戏配置合并）
  return {
    GameId: '',
    Page: 1,
    PageSize: 500,
    PlayerId: '',
    PlayerName: '',
    Sort: '',
  };
}

function openEdit(row: BrokerageSetItem) {
  if (!canEdit.value || Number(row.resType) === 9) return;
  editingRow.value = row;
  editRate.value =
    row.Rate === undefined ? undefined : Number(row.Rate) / 10;
  editDesc.value = row.Desc || '';
  editOpen.value = true;
}

function openBatch() {
  if (!canBatch.value) return;
  batchGameIds.value = [];
  batchRate.value = undefined;
  batchOpen.value = true;
}

function validRate(value?: number) {
  return (
    value !== undefined &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0 &&
    Number(value) <= 100 &&
    /^\d{1,2}(?:\.\d)?$|^100$/.test(String(value))
  );
}

async function handleSave() {
  if (!canEdit.value || !validRate(editRate.value)) {
    message.warning('佣金系数须为 0-100，最多一位小数');
    return;
  }
  if (!editingRow.value) {
    return;
  }
  if (editDesc.value.length > 255) {
    message.warning('说明最多 255 个字符');
    return;
  }
  editLoading.value = true;
  try {
    const payload = {
      Desc: editDesc.value,
      GameId: editingRow.value.GameId,
      Id: editingRow.value.Id,
      Rate: Math.round(Number(editRate.value) * 10),
    };
    const isUpdate =
      editingRow.value.Type === 'update' || Boolean(editingRow.value.Id);
    if (isUpdate) {
      await updateBrokerageSetApi(payload);
    } else {
      await createBrokerageSetApi({
        ...payload,
        Hash: createRequestHash(),
      });
    }
    if (
      Number(editingRow.value.resType) === 8 &&
      editingRow.value.children?.length
    ) {
      await batchUpdateBrokerageSetApi({
        Desc: editDesc.value,
        GameId: editingRow.value.children
          .map((item) => item.GameId)
          .filter((id): id is number | string => id !== undefined),
        Rate: payload.Rate,
      });
    }
    message.success('保存成功');
    editOpen.value = false;
    await Promise.all([gridApi.reload(), getProjectConfigApi()]);
  } catch {
    // requestClient 已提示业务错误（如 10000/10002）
  } finally {
    editLoading.value = false;
  }
}

async function handleBatchSave() {
  if (batchGameIds.value.length === 0) {
    message.warning('请选择至少一个游戏');
    return;
  }
  if (!canBatch.value || !validRate(batchRate.value)) {
    message.warning('佣金系数须为 0-100，最多一位小数');
    return;
  }
  batchLoading.value = true;
  try {
    const gameIds = new Set<number | string>();
    for (const selectedId of batchGameIds.value) {
      const parent = gameTree.value.find(
        (item) => String(item.GameId) === String(selectedId),
      );
      if (!parent || parent.GameId === undefined) continue;
      gameIds.add(parent.GameId);
      for (const child of parent.children || []) {
        if (child.GameId !== undefined) gameIds.add(child.GameId);
      }
    }
    await batchUpdateBrokerageSetApi({
      Desc: '',
      GameId: [...gameIds],
      Rate: Math.round(Number(batchRate.value) * 10),
    });
    message.success('批量设置成功');
    batchOpen.value = false;
    await Promise.all([gridApi.reload(), getProjectConfigApi()]);
  } catch {
    // requestClient 已提示业务错误
  } finally {
    batchLoading.value = false;
  }
}

function handleReset() {
  if (!canReset.value || resetLoading.value) return;
  Modal.confirm({
    content: '确认恢复默认佣金设置？',
    onOk: async () => {
      resetLoading.value = true;
      try {
        await resetBrokerageSetApi({ Hash: createRequestHash() });
        message.success('已恢复默认设置');
        await Promise.all([gridApi.reload(), getProjectConfigApi()]);
      } catch {
        // requestClient 已提示业务错误
      } finally {
        resetLoading.value = false;
      }
    },
    title: '恢复设置',
  });
}

const columns: VxeTableGridOptions<BrokerageSetItem>['columns'] = [
  { type: 'seq', title: '编号', width: 70 },
  {
    field: 'GameId',
    formatter: ({ cellValue }) =>
      formatBrokerageGameName(cellValue, gameConfig.value.games),
    minWidth: 160,
    title: '子游戏',
  },
  {
    field: 'Rate',
    formatter: ({ cellValue }) =>
      cellValue === undefined || cellValue === null
        ? '-'
        : `${Number(cellValue) / 10}%`,
    minWidth: 110,
    title: '佣金系数',
  },
  { field: 'Desc', minWidth: 180, showOverflow: 'tooltip', title: '说明' },
  // 始终挂载操作列，按钮权限由模板 v-if 控制（避免 setup 时权限未就绪漏列）
  {
    field: 'actions',
    fixed: 'right',
    slots: { default: 'actions' },
    title: '操作',
    width: 100,
  },
];

const gridOptions: VxeTableGridOptions<BrokerageSetItem> = {
  columns,
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async () => {
        try {
          const result = await fetchBrokerageSetListApi(getQueryParams());
          const items = Array.isArray(result.Items) ? result.Items : [];
          gameTree.value = buildGameTree(items, result.TeamGameDefaultRate);
          return { items: gameTree.value, total: gameTree.value.length };
        } catch {
          gameTree.value = buildGameTree([], 0);
          return { items: gameTree.value, total: gameTree.value.length };
        }
      },
    },
  },
  treeConfig: {
    childrenField: 'children',
    transform: false,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

onMounted(async () => {
  if (!canViewPage.value) {
    return;
  }
  try {
    await ensureGameConfig();
  } catch {
    // 游戏配置失败时仍可展示空树 / 默认费率
  }
  if (canViewTable.value) gridApi.reload();
  else gameTree.value = buildGameTree();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 代理设定"
    title="代理设定"
  >
    <div class="brokerage-card">
      <div class="action-bar">
        <div class="text-base font-medium">游戏佣金设置</div>
        <div class="flex gap-2">
          <Button
            v-if="canReset"
            :loading="resetLoading"
            @click="handleReset"
          >
            恢复设置
          </Button>
          <Button v-if="canBatch" type="primary" @click="openBatch">
            批量设置
          </Button>
        </div>
      </div>

      <Grid v-if="canViewTable">
        <template #actions="{ row }">
          <Button
            v-if="canEdit && Number(row.resType) !== 9"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
        </template>
      </Grid>
      <Result
        v-else
        status="403"
        sub-title="无代理设定列表查看权限"
        title="403"
      />
    </div>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="editLoading"
      title="编辑佣金系数"
      @ok="handleSave"
    >
      <Form layout="vertical">
        <Form.Item label="游戏">
          <span>{{
            formatBrokerageGameName(editingRow?.GameId, gameConfig.games)
          }}</span>
        </Form.Item>
        <Form.Item label="佣金系数 (%)" required>
          <InputNumber
            v-model:value="editRate"
            :max="100"
            :min="0"
            :precision="1"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="说明">
          <Input
            v-model:value="editDesc"
            :maxlength="255"
            placeholder="请输入说明"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="batchOpen"
      :confirm-loading="batchLoading"
      title="批量设置佣金系数"
      @ok="handleBatchSave"
    >
      <Form layout="vertical">
        <Form.Item label="子游戏" required>
          <Select
            v-model:value="batchGameIds"
            allow-clear
            class="w-full"
            mode="multiple"
            :options="gameSelectOptions"
            option-filter-prop="label"
            placeholder="请选择游戏"
            show-search
          />
        </Form.Item>
        <Form.Item label="佣金系数 (%)" required>
          <InputNumber
            v-model:value="batchRate"
            :max="100"
            :min="0"
            :precision="1"
            class="w-full"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无代理设定查看权限" title="403" />
</template>

<style scoped>
.brokerage-card {
  min-height: calc(100vh - 180px);
  padding: 16px;
  background: hsl(var(--card));
  border-radius: 12px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 5%);
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: hsl(var(--muted) / 35%);
  border-radius: 10px;
}
</style>

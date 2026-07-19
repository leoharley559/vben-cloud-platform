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
  Modal,
  Result,
  Select,
  message,
} from 'ant-design-vue';

import {
  batchUpdateBrokerageSetApi,
  createBrokerageSetApi,
  fetchBrokerageSetListApi,
  resetBrokerageSetApi,
  updateBrokerageSetApi,
} from '#/api/promotion/manage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { formatBrokerageGameName } from '#/utils/promotion';

defineOptions({ name: 'BrokerageSet' });

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const canViewTable = computed(() => checkPermission(10856));
const canEdit = computed(() => checkPermission(10858));
const canBatch = computed(() => checkPermission(10859));
const canReset = computed(() => checkPermission(10860));
const canViewPage = computed(() => canViewTable.value);

const editOpen = ref(false);
const batchOpen = ref(false);
const editLoading = ref(false);
const batchLoading = ref(false);
const editingRow = ref<BrokerageSetItem>();
const editRate = ref<number>();
const editDesc = ref('');
const batchRate = ref<number>();
const batchDesc = ref('');
const batchGameIds = ref<Array<number | string>>([]);

const gameSelectOptions = computed(() => {
  const games = gameConfig.value.games || {};
  return Object.keys(games).map((id) => ({
    label: formatBrokerageGameName(id, games),
    value: Number.isNaN(Number(id)) ? id : Number(id),
  }));
});

function getQueryParams() {
  return {
    Page: 1,
    PageSize: 500,
  };
}

function openEdit(row: BrokerageSetItem) {
  editingRow.value = row;
  editRate.value = row.Rate ? Number(row.Rate) / 10 : undefined;
  editDesc.value = row.Desc || '';
  editOpen.value = true;
}

function openBatch() {
  batchGameIds.value = [];
  batchRate.value = undefined;
  batchDesc.value = '';
  batchOpen.value = true;
}

async function handleSave() {
  if (editRate.value === undefined || editRate.value === null) {
    message.warning('请输入佣金系数');
    return;
  }
  if (!editingRow.value) {
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
    if (editingRow.value.Type === 'update' || editingRow.value.Id) {
      await updateBrokerageSetApi(payload);
    } else {
      await createBrokerageSetApi({
        ...payload,
        Hash: String(Date.now()),
      });
    }
    message.success('保存成功');
    editOpen.value = false;
    gridApi.reload();
  } finally {
    editLoading.value = false;
  }
}

async function handleBatchSave() {
  if (!batchGameIds.value.length) {
    message.warning('请选择至少一个游戏');
    return;
  }
  if (batchRate.value === undefined || batchRate.value === null) {
    message.warning('请输入佣金系数');
    return;
  }
  batchLoading.value = true;
  try {
    await batchUpdateBrokerageSetApi({
      Desc: batchDesc.value,
      GameId: batchGameIds.value,
      Rate: Math.round(Number(batchRate.value) * 10),
    });
    message.success('批量设置成功');
    batchOpen.value = false;
    gridApi.reload();
  } finally {
    batchLoading.value = false;
  }
}

function handleReset() {
  Modal.confirm({
    content: '确认恢复默认佣金设置？',
    onOk: async () => {
      await resetBrokerageSetApi({ Hash: String(Date.now()) });
      message.success('已恢复默认设置');
      gridApi.reload();
    },
    title: '恢复设置',
  });
}

const gridOptions: VxeTableGridOptions<BrokerageSetItem> = {
  columns: [
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
        cellValue === undefined ? '-' : `${Number(cellValue) / 10}%`,
      minWidth: 110,
      title: '佣金系数',
    },
    { field: 'Desc', minWidth: 180, showOverflow: 'tooltip', title: '说明' },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 100,
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const result = await fetchBrokerageSetListApi(getQueryParams());
        const items = (result.Items || []).map((item) => ({
          ...item,
          Type: 'update',
        }));
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

onMounted(async () => {
  if (!canViewPage.value) {
    return;
  }
  await ensureGameConfig();
  gridApi.reload();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 代理设定"
    title="代理设定"
  >
    <div class="mb-4 flex justify-end gap-2">
      <Button v-if="canReset" @click="handleReset">恢复设置</Button>
      <Button v-if="canBatch" type="primary" @click="openBatch"
        >批量设置</Button
      >
    </div>

    <Grid>
      <template #actions="{ row }">
        <Button
          v-if="canEdit && row.resType !== 9"
          size="small"
          type="link"
          @click="openEdit(row)"
        >
          编辑
        </Button>
      </template>
    </Grid>

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
          <Input v-model:value="editDesc" placeholder="请输入说明" />
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
        <Form.Item label="说明">
          <Input v-model:value="batchDesc" placeholder="请输入说明" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无代理设定查看权限" title="403" />
</template>

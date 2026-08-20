<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Button, message, Modal, Space, Table } from 'ant-design-vue';

import {
  createRewardProductTagApi,
  deleteRewardProductTagApi,
  fetchRewardProductTagListApi,
  switchRewardProductTagSortApi,
  updateRewardProductTagApi,
} from '#/api/operationManage/reward-mall';
import { useCloudPlatformStore } from '#/store/cloud-platform';

import GoodsTagOrderModal from './goods-tag-order-modal.vue';
import GoodsTagUpsertModal from './goods-tag-upsert-modal.vue';
import {
  assembleTagPayload,
  breakupTagDetail,
  resolveLangGroupIds,
  resolveTagName,
  SORT_SWITCH_TYPE,
} from './reward-goods-shared';

defineOptions({ name: 'GoodsTagManageModal' });

const emit = defineEmits<{ changed: [] }>();

const open = defineModel<boolean>('open', { default: false });

interface TagRow {
  Id: number | string;
  LangText?: unknown;
  ProductCount?: number;
}

const cloudStore = useCloudPlatformStore();

const loading = ref(false);
const sortingId = ref<number | string>();
const tags = ref<TagRow[]>([]);

const upsertOpen = ref(false);
const upsertMode = ref<'add' | 'edit'>('add');
const upsertTag = ref<null | Record<string, unknown>>(null);

const orderOpen = ref(false);
const orderTagId = ref<number | string>();

async function loadTags() {
  loading.value = true;
  try {
    const result = await fetchRewardProductTagListApi();
    tags.value = (result.Items || []) as unknown as TagRow[];
  } finally {
    loading.value = false;
  }
}

watch(open, (visible) => {
  if (visible) {
    void loadTags();
  }
});

function openAdd() {
  upsertMode.value = 'add';
  upsertTag.value = null;
  upsertOpen.value = true;
}

function openEdit(row: TagRow) {
  upsertMode.value = 'edit';
  upsertTag.value = breakupTagDetail(
    row as unknown as Record<string, unknown>,
    resolveLangGroupIds(cloudStore.projectConfig),
  );
  upsertOpen.value = true;
}

async function handleUpsertSubmit(formValue: Record<string, unknown>) {
  const payload = assembleTagPayload(formValue, {
    langGroupIds: resolveLangGroupIds(cloudStore.projectConfig),
    mode: upsertMode.value,
  });
  if (upsertMode.value === 'add') {
    await createRewardProductTagApi(payload);
    message.success('新增成功');
  } else {
    await updateRewardProductTagApi(payload);
    message.success('保存成功');
  }
  await loadTags();
  emit('changed');
}

function handleDelete(row: TagRow) {
  Modal.confirm({
    content: `确认删除页签「${resolveTagName(row.LangText)}」？`,
    onOk: async () => {
      await deleteRewardProductTagApi(row.Id);
      message.success('删除成功');
      await loadTags();
      emit('changed');
    },
    title: '删除确认',
  });
}

function openOrder(row: TagRow) {
  orderTagId.value = row.Id;
  orderOpen.value = true;
}

async function handleSort(
  row: TagRow,
  index: number,
  direction: 'bottom' | 'down' | 'top' | 'up',
) {
  let payload: {
    Id1: number | string;
    Id2?: number | string;
    SwitchType: number;
  };
  if (direction === 'top') {
    payload = { Id1: row.Id, SwitchType: SORT_SWITCH_TYPE.TOP };
  } else if (direction === 'bottom') {
    payload = { Id1: row.Id, SwitchType: SORT_SWITCH_TYPE.BOTTOM };
  } else {
    const siblingIndex = direction === 'up' ? index - 1 : index + 1;
    const sibling = tags.value[siblingIndex];
    if (!sibling) {
      return;
    }
    payload = {
      Id1: row.Id,
      Id2: sibling.Id,
      SwitchType: SORT_SWITCH_TYPE.SWAP,
    };
  }
  sortingId.value = row.Id;
  try {
    await switchRewardProductTagSortApi(payload);
    message.success('排序成功');
    await loadTags();
  } finally {
    sortingId.value = undefined;
  }
}

const columns = [
  { key: 'index', title: '序号', width: 60 },
  { key: 'name', title: '商品页签' },
  { key: 'count', title: '商品数量', width: 100 },
  { key: 'sort', title: '页签排序', width: 260 },
  { key: 'action', title: '操作', width: 220 },
];
</script>

<template>
  <Modal v-model:open="open" :footer="null" title="商品页签" width="960px">
    <div class="mb-3 flex justify-end">
      <Button type="primary" @click="openAdd">新增商品页签</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="tags"
      :loading="loading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">{{ index + 1 }}</template>
        <template v-else-if="column.key === 'name'">
          {{ resolveTagName((record as TagRow).LangText) || '-' }}
        </template>
        <template v-else-if="column.key === 'count'">
          {{ (record as TagRow).ProductCount ?? 0 }}
        </template>
        <template v-else-if="column.key === 'sort'">
          <Space :size="4">
            <Button
              :loading="sortingId === (record as TagRow).Id"
              size="small"
              @click="handleSort(record as TagRow, index, 'top')"
            >
              置顶
            </Button>
            <Button
              :loading="sortingId === (record as TagRow).Id"
              size="small"
              @click="handleSort(record as TagRow, index, 'up')"
            >
              上移
            </Button>
            <Button
              :loading="sortingId === (record as TagRow).Id"
              size="small"
              @click="handleSort(record as TagRow, index, 'down')"
            >
              下移
            </Button>
            <Button
              :loading="sortingId === (record as TagRow).Id"
              size="small"
              @click="handleSort(record as TagRow, index, 'bottom')"
            >
              置底
            </Button>
          </Space>
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button
              :disabled="!(record as TagRow).ProductCount"
              size="small"
              @click="openOrder(record as TagRow)"
            >
              商品排序
            </Button>
            <Button
              size="small"
              type="link"
              @click="openEdit(record as TagRow)"
            >
              编辑
            </Button>
            <Button
              danger
              :disabled="Boolean((record as TagRow).ProductCount)"
              size="small"
              type="link"
              @click="handleDelete(record as TagRow)"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>
    <div class="mt-2 text-right text-sm text-gray-400">
      共 {{ tags.length }} 条
    </div>

    <GoodsTagUpsertModal
      v-model:open="upsertOpen"
      :mode="upsertMode"
      :tag="upsertTag"
      @submit="handleUpsertSubmit"
    />
    <GoodsTagOrderModal v-model:open="orderOpen" :tag-id="orderTagId" />
  </Modal>
</template>

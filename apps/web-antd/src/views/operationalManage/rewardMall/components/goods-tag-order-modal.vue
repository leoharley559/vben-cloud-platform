<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Button, message, Modal, Space, Table } from 'ant-design-vue';

import {
  fetchRewardProductListApi,
  switchRewardProductSortApi,
} from '#/api/operationManage/reward-mall';

import { resolveProductName, SORT_SWITCH_TYPE } from './reward-goods-shared';

defineOptions({ name: 'GoodsTagOrderModal' });

const props = defineProps<{
  tagId?: number | string;
}>();

const open = defineModel<boolean>('open', { default: false });

interface GoodsRow {
  Id: number | string;
  LangText?: unknown;
}

const loading = ref(false);
const sortingId = ref<number | string>();
const products = ref<GoodsRow[]>([]);

async function loadProducts() {
  if (!props.tagId) {
    products.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await fetchRewardProductListApi({
      Page: 1,
      PageSize: 999,
      ProductTag: props.tagId,
    });
    products.value = (result.Items || []) as unknown as GoodsRow[];
  } finally {
    loading.value = false;
  }
}

watch(
  () => [open.value, props.tagId] as const,
  ([visible]) => {
    if (visible) {
      void loadProducts();
    }
  },
);

async function handleSort(
  row: GoodsRow,
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
    const sibling = products.value[siblingIndex];
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
    await switchRewardProductSortApi(payload);
    message.success('排序成功');
    await loadProducts();
  } finally {
    sortingId.value = undefined;
  }
}

const columns = [
  { key: 'index', title: '序号', width: 60 },
  { key: 'name', title: '商品名称' },
  { key: 'sort', title: '排序', width: 260 },
];
</script>

<template>
  <Modal v-model:open="open" :footer="null" title="商品排序" width="720px">
    <Table
      :columns="columns"
      :data-source="products"
      :loading="loading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">{{ index + 1 }}</template>
        <template v-else-if="column.key === 'name'">
          {{ resolveProductName((record as GoodsRow).LangText) || '-' }}
        </template>
        <template v-else-if="column.key === 'sort'">
          <Space :size="4">
            <Button
              :loading="sortingId === (record as GoodsRow).Id"
              size="small"
              @click="handleSort(record as GoodsRow, index, 'top')"
            >
              置顶
            </Button>
            <Button
              :loading="sortingId === (record as GoodsRow).Id"
              size="small"
              @click="handleSort(record as GoodsRow, index, 'up')"
            >
              上移
            </Button>
            <Button
              :loading="sortingId === (record as GoodsRow).Id"
              size="small"
              @click="handleSort(record as GoodsRow, index, 'down')"
            >
              下移
            </Button>
            <Button
              :loading="sortingId === (record as GoodsRow).Id"
              size="small"
              @click="handleSort(record as GoodsRow, index, 'bottom')"
            >
              置底
            </Button>
          </Space>
        </template>
      </template>
    </Table>
  </Modal>
</template>

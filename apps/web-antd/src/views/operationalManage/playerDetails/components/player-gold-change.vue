<script lang="ts" setup>
import type { PlayerGoldChangeItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Card, Table } from 'ant-design-vue';

import { fetchPlayerGoldChangeListApi } from '#/api/operationManage/player';
import { useGameConfig } from '#/composables/use-game-config';
import { formatGoldReason } from '#/utils/game-config';

defineOptions({ name: 'PlayerGoldChangePanel' });

const props = defineProps<{
  beginTime: number;
  endTime: number;
  playerId: number | string;
}>();

const { ensureGameConfig, gameConfig } = useGameConfig();
const loading = ref(false);
const list = ref<Array<PlayerGoldChangeItem & { _rowKey: string }>>([]);
const sortOrder = ref<'ascend' | 'descend' | null>(null);

const columns = computed(() => [
  {
    dataIndex: 'Reason',
    key: 'Reason',
    title: '来源',
  },
  {
    dataIndex: 'Total',
    key: 'Total',
    sorter: true,
    sortOrder: sortOrder.value,
    title: '金币',
    width: 140,
  },
]);

async function loadList() {
  if (!props.playerId) {
    list.value = [];
    return;
  }
  loading.value = true;
  try {
    let sortParam = '';
    if (sortOrder.value) {
      sortParam = `Total ${sortOrder.value === 'ascend' ? 'asc' : 'desc'}`;
    }
    const result = await fetchPlayerGoldChangeListApi({
      BeginTime: props.beginTime,
      EndTime: props.endTime,
      Page: 1,
      PageSize: 9999,
      PlayerId: String(props.playerId),
      Sort: sortParam,
    });
    list.value = (result?.Items || []).map((item, index) => ({
      ...item,
      Total: Number(item.Total || 0) / 100,
      _rowKey: `${item.Reason ?? 'row'}-${index}`,
    }));
  } finally {
    loading.value = false;
  }
}

function handleTableChange(
  _pagination: unknown,
  _filters: unknown,
  sorter: { order?: 'ascend' | 'descend' | null } | Array<{ order?: 'ascend' | 'descend' | null }>,
) {
  const current = Array.isArray(sorter) ? sorter[0] : sorter;
  sortOrder.value = current?.order || null;
  loadList();
}

watch(
  () => [props.playerId, props.beginTime, props.endTime],
  () => {
    loadList();
  },
);

onMounted(async () => {
  await ensureGameConfig();
  await loadList();
});
</script>

<template>
  <Card :loading="loading" class="h-full" size="small" title="全局金币变化">
    <Table
      bordered
      :columns="columns"
      :data-source="list"
      :pagination="false"
      row-key="_rowKey"
      :scroll="{ x: 'max-content' }"
      size="small"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'Reason'">
          {{ formatGoldReason(record.Reason, gameConfig.goldSource) }}
        </template>
        <template v-else-if="column.key === 'Total'">
          <span
            :class="Number(record.Total) > 0 ? 'text-green-600' : 'text-red-500'"
          >
            {{ Number(record.Total).toFixed(2) }}
          </span>
        </template>
      </template>
    </Table>
  </Card>
</template>

<script lang="ts" setup>
import type { PlayerSettleItem } from '#/types/player-detail';

import { onMounted, ref, watch } from 'vue';

import { Card, Table } from 'ant-design-vue';

import { fetchPlayerSettleListApi } from '#/api/operationManage/player';
import { useGameConfig } from '#/composables/use-game-config';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatVenueName } from '#/utils/game-config';

defineOptions({ name: 'PlayerCoinSettlePanel' });

const props = defineProps<{
  beginTime: number;
  endTime: number;
  playerId: number | string;
}>();

const { ensureGameConfig, gameConfig } = useGameConfig();
const loading = ref(false);
const list = ref<PlayerSettleItem[]>([]);

const columns = [
  {
    dataIndex: 'GameId',
    key: 'GameId',
    title: '场馆名称',
    width: 180,
  },
  {
    dataIndex: 'Total',
    key: 'Total',
    title: '输赢结算',
    width: 140,
  },
];

function groupSettleItems(items: PlayerSettleItem[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = String(item.GameId ?? '');
    map.set(key, (map.get(key) || 0) + Number(item.Total || 0));
  }
  return [...map.entries()].map(([gameId, total]) => ({
    GameId: gameId,
    Total: total,
  }));
}

async function loadSettleList() {
  if (!props.playerId) {
    list.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await fetchPlayerSettleListApi({
      BeginTime: props.beginTime,
      EndTime: props.endTime,
      Page: 1,
      PageSize: 9999,
      PlayerId: String(props.playerId),
    });
    list.value = groupSettleItems(result?.Items || []);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.playerId, props.beginTime, props.endTime],
  () => {
    loadSettleList();
  },
);

onMounted(async () => {
  await ensureGameConfig();
  await loadSettleList();
});
</script>

<template>
  <Card :loading="loading" class="mt-4 max-w-2xl" size="small" title="场馆结算">
    <Table
      bordered
      :columns="columns"
      :data-source="list"
      :pagination="false"
      row-key="GameId"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'GameId'">
          {{ formatVenueName(record.GameId, gameConfig) }}
        </template>
        <template v-else-if="column.key === 'Total'">
          <span
            :class="
              Number(record.Total) > 0 ? 'text-green-600' : 'text-red-500'
            "
          >
            {{ formatAmountFromCent(record.Total) }}
          </span>
        </template>
      </template>
    </Table>
  </Card>
</template>

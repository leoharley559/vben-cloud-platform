<script lang="ts" setup>
import { computed } from 'vue';

import { Table } from 'ant-design-vue';

import { useGameConfig } from '#/composables/use-game-config';
import { formatGameId } from '#/utils/dashboard';
import { formatAmountFromCent } from '#/utils/format-amount';
import type { RankGameRow } from '#/utils/ranking';
import { antTableScrollY } from '#/utils/table-height';

defineOptions({ name: 'GameRankTable' });

const props = withDefaults(
  defineProps<{
    data: RankGameRow[];
    profitTitle?: string;
    profitTone?: 'danger' | 'success';
    loading?: boolean;
  }>(),
  {
    profitTitle: '盈利金额',
    profitTone: 'success',
    loading: false,
  },
);

const { gameConfig } = useGameConfig();

function profitColor() {
  return props.profitTone === 'danger' ? '#cf1322' : '#389e0d';
}

function gameName(gameId: unknown) {
  return formatGameId(gameId, gameConfig.value.games || {});
}

const columns = computed(() => [
  {
    align: 'center' as const,
    customRender: ({ index }: { index: number }) => index + 1,
    key: 'rank',
    title: '排名',
    width: 70,
  },
  {
    align: 'center' as const,
    dataIndex: 'GameId',
    key: 'GameId',
    title: '游戏',
    width: 140,
  },
  {
    align: 'center' as const,
    dataIndex: 'ProfitAmt',
    key: 'ProfitAmt',
    sorter: (a: RankGameRow, b: RankGameRow) =>
      Number(a.ProfitAmt || 0) - Number(b.ProfitAmt || 0),
    title: props.profitTitle,
    width: 120,
  },
  {
    align: 'center' as const,
    dataIndex: 'SumBet',
    key: 'SumBet',
    title: '押注',
    width: 120,
  },
  {
    align: 'center' as const,
    dataIndex: 'FanJiang',
    key: 'FanJiang',
    title: '返奖',
    width: 120,
  },
  {
    align: 'center' as const,
    dataIndex: 'FanJiangRate',
    key: 'FanJiangRate',
    title: '返奖率',
    width: 100,
  },
]);
</script>

<template>
  <Table
    :columns="columns"
    :data-source="data"
    :loading="loading"
    :pagination="false"
    :scroll="{ x: 660, y: antTableScrollY(120) }"
    bordered
    row-key="GameId"
    size="small"
  >
    <template #bodyCell="{ column, record, text }">
      <template v-if="column.key === 'GameId'">
        {{ gameName(record.GameId) }}
      </template>
      <template v-else-if="column.key === 'ProfitAmt'">
        <span :style="{ color: profitColor() }">
          {{ formatAmountFromCent(Number(text || 0)) }}
        </span>
      </template>
      <template
        v-else-if="column.key === 'SumBet' || column.key === 'FanJiang'"
      >
        {{ formatAmountFromCent(Number(text || 0)) }}
      </template>
      <template v-else-if="column.key === 'FanJiangRate'">
        {{ Number(text || 0) }}%
      </template>
    </template>
  </Table>
</template>

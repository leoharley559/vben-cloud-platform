<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';

import { Col, message, Row, Spin } from 'ant-design-vue';

import { fetchGameProfitLossRankApi } from '#/api/operationalData/ranking';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { formatGameId } from '#/utils/dashboard';
import { exportRowsToCsv, type CsvColumn } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import type { RankGameRow } from '#/utils/ranking';

import GameRankTable from './game-rank-table.vue';
import RankingFilterBar from './ranking-filter-bar.vue';

defineOptions({ name: 'GameRankPanel' });

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const canWin = computed(() => checkPermission(10_647));
const canLose = computed(() => checkPermission(10_648));

const loading = ref(false);
const exportLoading = ref(false);
const winItems = ref<RankGameRow[]>([]);
const loseItems = ref<RankGameRow[]>([]);
const filterBarRef = ref<InstanceType<typeof RankingFilterBar>>();

function gameName(gameId: unknown) {
  return formatGameId(gameId, gameConfig.value.games || {});
}

async function loadData(query?: Record<string, unknown>) {
  if (!canWin.value && !canLose.value) return;
  const params = query || filterBarRef.value?.buildQuery() || {};
  loading.value = true;
  try {
    const data = await fetchGameProfitLossRankApi(params);
    winItems.value = canWin.value ? data.winItems : [];
    loseItems.value = canLose.value ? data.loseItems : [];
  } finally {
    loading.value = false;
  }
}

function handleSearch(query: Record<string, unknown>) {
  void loadData(query);
}

function handleReset(query: Record<string, unknown>) {
  void loadData(query);
}

function handleExport() {
  if (winItems.value.length < 1 && loseItems.value.length < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  exportLoading.value = true;
  try {
    type DualRow = {
      LoseBet?: number;
      LoseFanJiang?: number;
      LoseFanJiangRate?: number;
      LoseGameName?: string;
      LoseProfit?: number;
      WinBet?: number;
      WinFanJiang?: number;
      WinFanJiangRate?: number;
      WinGameName?: string;
      WinProfit?: number;
    };
    const maxLen = Math.max(winItems.value.length, loseItems.value.length);
    const rows: DualRow[] = [];
    for (let i = 0; i < maxLen; i += 1) {
      const win = winItems.value[i];
      const lose = loseItems.value[i];
      rows.push({
        LoseBet: lose ? Number(lose.SumBet || 0) : undefined,
        LoseFanJiang: lose ? Number(lose.FanJiang || 0) : undefined,
        LoseFanJiangRate: lose ? Number(lose.FanJiangRate || 0) : undefined,
        LoseGameName: lose ? gameName(lose.GameId) : undefined,
        LoseProfit: lose ? Number(lose.ProfitAmt || 0) : undefined,
        WinBet: win ? Number(win.SumBet || 0) : undefined,
        WinFanJiang: win ? Number(win.FanJiang || 0) : undefined,
        WinFanJiangRate: win ? Number(win.FanJiangRate || 0) : undefined,
        WinGameName: win ? gameName(win.GameId) : undefined,
        WinProfit: win ? Number(win.ProfitAmt || 0) : undefined,
      });
    }
    const columns: CsvColumn<DualRow>[] = [
      { header: '排名', value: (_row, index) => index + 1 },
      { header: '游戏(盈)', value: (row) => String(row.WinGameName || '') },
      {
        header: '盈利金额(元)',
        value: (row) =>
          row.WinProfit === undefined
            ? ''
            : formatAmountFromCent(row.WinProfit),
      },
      {
        header: '押注(元)',
        value: (row) =>
          row.WinBet === undefined ? '' : formatAmountFromCent(row.WinBet),
      },
      {
        header: '返奖(元)',
        value: (row) =>
          row.WinFanJiang === undefined
            ? ''
            : formatAmountFromCent(row.WinFanJiang),
      },
      {
        header: '返奖率',
        value: (row) =>
          row.WinFanJiangRate === undefined ? '' : `${row.WinFanJiangRate}%`,
      },
      { header: '', value: () => '' },
      { header: '排名', value: (_row, index) => index + 1 },
      { header: '游戏(亏)', value: (row) => String(row.LoseGameName || '') },
      {
        header: '亏损金额(元)',
        value: (row) =>
          row.LoseProfit === undefined
            ? ''
            : formatAmountFromCent(row.LoseProfit),
      },
      {
        header: '押注(元)',
        value: (row) =>
          row.LoseBet === undefined ? '' : formatAmountFromCent(row.LoseBet),
      },
      {
        header: '返奖(元)',
        value: (row) =>
          row.LoseFanJiang === undefined
            ? ''
            : formatAmountFromCent(row.LoseFanJiang),
      },
      {
        header: '返奖率',
        value: (row) =>
          row.LoseFanJiangRate === undefined ? '' : `${row.LoseFanJiangRate}%`,
      },
    ];
    exportRowsToCsv(rows, columns, '游戏排行');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(async () => {
  await ensureGameConfig();
  await nextTick();
  void loadData(filterBarRef.value?.buildQuery());
});
</script>

<template>
  <div class="flex flex-col">
    <RankingFilterBar
      ref="filterBarRef"
      :export-loading="exportLoading"
      :loading="loading"
      @export="handleExport"
      @reset="handleReset"
      @search="handleSearch"
    />
    <Spin :spinning="loading">
      <Row :gutter="16">
        <Col v-if="canWin" :span="canLose ? 12 : 24">
          <div class="mb-2 font-medium">盈利排行</div>
          <GameRankTable
            :data="winItems"
            profit-title="盈利金额"
            profit-tone="success"
          />
        </Col>
        <Col v-if="canLose" :span="canWin ? 12 : 24">
          <div class="mb-2 font-medium">亏损排行</div>
          <GameRankTable
            :data="loseItems"
            profit-title="亏损金额"
            profit-tone="danger"
          />
        </Col>
      </Row>
    </Spin>
  </div>
</template>

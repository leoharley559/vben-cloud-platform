<script lang="ts" setup>
import type { CsvColumn } from '#/utils/export-csv';
import type { RankPlayerRow } from '#/utils/ranking';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Col, message, Row, Spin } from 'ant-design-vue';

import { fetchWinLoseRankApi } from '#/api/operationalData/ranking';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

import PlayerRankTable from './player-rank-table.vue';
import RankingFilterBar from './ranking-filter-bar.vue';

defineOptions({ name: 'WinLossRankPanel' });

const { checkPermission } = useCloudPermission();
const canWin = computed(() => checkPermission(10_642));
const canLose = computed(() => checkPermission(10_643));

const loading = ref(false);
const exportLoading = ref(false);
const winItems = ref<RankPlayerRow[]>([]);
const loseItems = ref<RankPlayerRow[]>([]);
const filterBarRef = ref<InstanceType<typeof RankingFilterBar>>();
const lastQuery = ref<Record<string, unknown>>({});

async function loadData(query?: Record<string, unknown>) {
  if (!canWin.value && !canLose.value) return;
  const params = query || filterBarRef.value?.buildQuery() || lastQuery.value;
  lastQuery.value = params;
  loading.value = true;
  try {
    const data = await fetchWinLoseRankApi(params);
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
  if (winItems.value.length === 0 && loseItems.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  exportLoading.value = true;
  try {
    type DualRow = RankPlayerRow & {
      LoseAmount?: number;
      LoseChannelName?: string;
      LoseLoginAccount?: string;
      LosePackageName?: string;
      WinAmount?: number;
    };
    const maxLen = Math.max(winItems.value.length, loseItems.value.length);
    const rows: DualRow[] = [];
    for (let i = 0; i < maxLen; i += 1) {
      const win = winItems.value[i];
      const lose = loseItems.value[i];
      rows.push({
        ChannelName: win?.ChannelName,
        LoginAccount: win?.LoginAccount,
        LoseAmount: lose ? Number(lose.SumAddGold || 0) : undefined,
        LoseChannelName: lose?.ChannelName,
        LoseLoginAccount: lose?.LoginAccount,
        LosePackageName: lose?.PackageName,
        PackageName: win?.PackageName,
        WinAmount: win ? Number(win.SumAddGold || 0) : undefined,
      });
    }
    const columns: CsvColumn<DualRow>[] = [
      { header: '排名', value: (_row, index) => index + 1 },
      {
        header: '游戏账号(赢)',
        value: (row) => String(row.LoginAccount || ''),
      },
      { header: '所属产品(赢)', value: (row) => String(row.PackageName || '') },
      { header: '渠道名称(赢)', value: (row) => String(row.ChannelName || '') },
      {
        header: '盈利(元)',
        value: (row) =>
          row.WinAmount === undefined
            ? ''
            : formatAmountFromCent(row.WinAmount),
      },
      { header: '', value: () => '' },
      { header: '排名', value: (_row, index) => index + 1 },
      {
        header: '游戏账号(输)',
        value: (row) => String(row.LoseLoginAccount || ''),
      },
      {
        header: '所属产品(输)',
        value: (row) => String(row.LosePackageName || ''),
      },
      {
        header: '渠道名称(输)',
        value: (row) => String(row.LoseChannelName || ''),
      },
      {
        header: '亏损(元)',
        value: (row) =>
          row.LoseAmount === undefined
            ? ''
            : formatAmountFromCent(row.LoseAmount),
      },
    ];
    exportRowsToCsv(rows, columns, '输赢排行');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(async () => {
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
          <div class="mb-2 font-medium">赢分排行</div>
          <PlayerRankTable
            :data="winItems"
            amount-field="SumAddGold"
            amount-title="盈利"
            amount-tone="success"
          />
        </Col>
        <Col v-if="canLose" :span="canWin ? 12 : 24">
          <div class="mb-2 font-medium">输分排行</div>
          <PlayerRankTable
            :data="loseItems"
            amount-field="SumAddGold"
            amount-title="亏损"
            amount-tone="danger"
          />
        </Col>
      </Row>
    </Spin>
  </div>
</template>

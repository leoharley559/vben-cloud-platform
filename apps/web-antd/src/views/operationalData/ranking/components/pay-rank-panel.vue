<script lang="ts" setup>
import type { CsvColumn } from '#/utils/export-csv';
import type { RankPlayerRow } from '#/utils/ranking';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Col, message, Row, Spin } from 'ant-design-vue';

import { fetchPayWithdrawRankApi } from '#/api/operationalData/payranking';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

import PlayerRankTable from './player-rank-table.vue';
import RankingFilterBar from './ranking-filter-bar.vue';

defineOptions({ name: 'PayRankPanel' });

const { checkPermission } = useCloudPermission();
const canPay = computed(() => checkPermission(10_644));
const canOut = computed(() => checkPermission(10_645));

const loading = ref(false);
const exportLoading = ref(false);
const payItems = ref<RankPlayerRow[]>([]);
const outItems = ref<RankPlayerRow[]>([]);
const filterBarRef = ref<InstanceType<typeof RankingFilterBar>>();

async function loadData(query?: Record<string, unknown>) {
  if (!canPay.value && !canOut.value) return;
  const params = query || filterBarRef.value?.buildQuery() || {};
  loading.value = true;
  try {
    const data = await fetchPayWithdrawRankApi(params);
    payItems.value = canPay.value ? data.payItems : [];
    outItems.value = canOut.value ? data.outItems : [];
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
  if (payItems.value.length === 0 && outItems.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  exportLoading.value = true;
  try {
    type DualRow = RankPlayerRow & {
      OutAmount?: number;
      OutChannelName?: string;
      OutLoginAccount?: string;
      OutPackageName?: string;
      PayAmount?: number;
    };
    const maxLen = Math.max(payItems.value.length, outItems.value.length);
    const rows: DualRow[] = [];
    for (let i = 0; i < maxLen; i += 1) {
      const pay = payItems.value[i];
      const out = outItems.value[i];
      rows.push({
        ChannelName: pay?.ChannelName,
        LoginAccount: pay?.LoginAccount,
        OutAmount: out ? Number(out.SumGold || 0) : undefined,
        OutChannelName: out?.ChannelName,
        OutLoginAccount: out?.LoginAccount,
        OutPackageName: out?.PackageName,
        PackageName: pay?.PackageName,
        PayAmount: pay ? Number(pay.SumGold || 0) : undefined,
      });
    }
    const columns: CsvColumn<DualRow>[] = [
      { header: '排名', value: (_row, index) => index + 1 },
      {
        header: '游戏账号(充)',
        value: (row) => String(row.LoginAccount || ''),
      },
      { header: '所属产品(充)', value: (row) => String(row.PackageName || '') },
      { header: '渠道名称(充)', value: (row) => String(row.ChannelName || '') },
      {
        header: '充值金额(元)',
        value: (row) =>
          row.PayAmount === undefined
            ? ''
            : formatAmountFromCent(row.PayAmount),
      },
      { header: '', value: () => '' },
      { header: '排名', value: (_row, index) => index + 1 },
      {
        header: '游戏账号(兑)',
        value: (row) => String(row.OutLoginAccount || ''),
      },
      {
        header: '所属产品(兑)',
        value: (row) => String(row.OutPackageName || ''),
      },
      {
        header: '渠道名称(兑)',
        value: (row) => String(row.OutChannelName || ''),
      },
      {
        header: '兑换金额(元)',
        value: (row) =>
          row.OutAmount === undefined
            ? ''
            : formatAmountFromCent(row.OutAmount),
      },
    ];
    exportRowsToCsv(rows, columns, '充兑排行');
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
        <Col v-if="canPay" :span="canOut ? 12 : 24">
          <div class="mb-2 font-medium">充值排行</div>
          <PlayerRankTable
            :data="payItems"
            amount-field="SumGold"
            amount-title="充值金额"
            amount-tone="success"
          />
        </Col>
        <Col v-if="canOut" :span="canPay ? 12 : 24">
          <div class="mb-2 font-medium">兑换排行</div>
          <PlayerRankTable
            :data="outItems"
            amount-field="SumGold"
            amount-title="兑换金额"
            amount-tone="danger"
          />
        </Col>
      </Row>
    </Spin>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Table } from 'ant-design-vue';

import { formatAmountFromCent } from '#/utils/format-amount';
import { buildPlayerDetailPath } from '#/utils/player-detail-route';
import type { RankPlayerRow } from '#/utils/ranking';
import { antTableScrollY } from '#/utils/table-height';

defineOptions({ name: 'PlayerRankTable' });

const props = withDefaults(
  defineProps<{
    data: RankPlayerRow[];
    amountField?: string;
    amountTitle?: string;
    amountTone?: 'danger' | 'success';
    loading?: boolean;
    linkAccount?: boolean;
  }>(),
  {
    amountField: 'SumAddGold',
    amountTitle: '金额',
    amountTone: 'success',
    loading: false,
    linkAccount: true,
  },
);

const router = useRouter();

function amountColor() {
  return props.amountTone === 'danger' ? '#cf1322' : '#389e0d';
}

function goPlayerDetail(row: RankPlayerRow) {
  if (!row.PlayerId) return;
  void router.push(
    buildPlayerDetailPath(row.PlayerId, String(row.LoginAccount || '')),
  );
}

const columns = [
  {
    align: 'center' as const,
    customRender: ({ index }: { index: number }) => index + 1,
    key: 'rank',
    title: '排名',
    width: 70,
  },
  {
    align: 'center' as const,
    dataIndex: 'LoginAccount',
    key: 'LoginAccount',
    title: '游戏账号',
    width: 140,
  },
  {
    align: 'center' as const,
    dataIndex: 'PackageName',
    key: 'PackageName',
    title: '所属产品',
    width: 120,
  },
  {
    align: 'center' as const,
    dataIndex: 'ChannelName',
    key: 'ChannelName',
    title: '渠道名称',
    width: 120,
  },
  {
    align: 'center' as const,
    dataIndex: props.amountField,
    key: 'amount',
    sorter: (a: RankPlayerRow, b: RankPlayerRow) =>
      Number(a[props.amountField!] || 0) - Number(b[props.amountField!] || 0),
    title: props.amountTitle,
    width: 120,
  },
];
</script>

<template>
  <Table
    :columns="columns"
    :data-source="data"
    :loading="loading"
    :pagination="false"
    :scroll="{ x: 560, y: antTableScrollY(120) }"
    bordered
    row-key="PlayerId"
    size="small"
  >
    <template #bodyCell="{ column, record, text }">
      <template v-if="column.key === 'LoginAccount'">
        <a
          v-if="linkAccount && record.LoginAccount"
          class="cursor-pointer"
          @click="goPlayerDetail(record as RankPlayerRow)"
        >
          {{ record.LoginAccount }}
        </a>
        <span v-else>{{ record.LoginAccount || '-' }}</span>
      </template>
      <template v-else-if="column.key === 'amount'">
        <span :style="{ color: amountColor() }">
          {{ formatAmountFromCent(Number(text || 0)) }}
        </span>
      </template>
    </template>
  </Table>
</template>

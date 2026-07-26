<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Spin, Table } from 'ant-design-vue';

import { fetchMobileGameDetailListApi } from '#/api/mobile';
import { formatAmountFromCent } from '#/utils/format-amount';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileQueryGameDetail' });

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);

const columns = [
  { dataIndex: 'GameName', key: 'game', title: '游戏' },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(Number(record.BetMoney || 0)),
    key: 'bet',
    title: '投注',
  },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(Number(record.WinMoney || 0)),
    key: 'win',
    title: '输赢',
  },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchMobileGameDetailListApi({
      BeginTime: Math.floor(Date.now() / 1000 - 7 * 86400),
      EndTime: Math.floor(Date.now() / 1000),
      Page: 1,
      PageSize: 30,
    });
    list.value = result.Items || [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Spin :spinning="loading">
    <MobileMvpTip />
    <Card size="small">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.GameId ?? row.GameName ?? '')"
        size="small"
      />
    </Card>
  </Spin>
</template>

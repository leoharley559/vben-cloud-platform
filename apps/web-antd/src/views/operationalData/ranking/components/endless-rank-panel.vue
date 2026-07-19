<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';

import { Spin } from 'ant-design-vue';

import { fetchEndlessRankListApi } from '#/api/operationalData/ranking';
import type { RankPlayerRow } from '#/utils/ranking';

import PlayerRankTable from './player-rank-table.vue';
import RankingFilterBar from './ranking-filter-bar.vue';

defineOptions({ name: 'EndlessRankPanel' });

const loading = ref(false);
const list = ref<RankPlayerRow[]>([]);
const filterBarRef = ref<InstanceType<typeof RankingFilterBar>>();

async function loadData(query?: Record<string, unknown>) {
  const params = query || filterBarRef.value?.buildQuery() || {};
  loading.value = true;
  try {
    const data = await fetchEndlessRankListApi(params);
    list.value = (data.Items || []) as RankPlayerRow[];
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

onMounted(async () => {
  await nextTick();
  void loadData(filterBarRef.value?.buildQuery());
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <RankingFilterBar
      ref="filterBarRef"
      :loading="loading"
      :show-export="false"
      show-data-search-type
      @reset="handleReset"
      @search="handleSearch"
    />
    <Spin :spinning="loading">
      <div class="mb-2 font-medium">无限代理排行</div>
      <PlayerRankTable
        :data="list"
        :link-account="false"
        amount-field="Award"
        amount-title="收益"
        amount-tone="success"
      />
    </Spin>
  </div>
</template>

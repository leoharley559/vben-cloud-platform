<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerGoldChangeItem } from '#/types/player-detail';

import { computed, onMounted, watch } from 'vue';

import { Card } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
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

const gridOptions: VxeTableGridOptions<PlayerGoldChangeItem> = {
  columns: [
    {
      field: 'Reason',
      formatter: ({ cellValue }) =>
        formatGoldReason(cellValue, gameConfig.value.goldSource),
      minWidth: 180,
      title: '来源',
    },
    {
      field: 'Total',
      minWidth: 120,
      slots: { default: 'total' },
      sortable: true,
      title: '金币',
    },
  ],
  height: 'auto',
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ sort }) => {
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam = `${sortField} ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        }

        const result = await fetchPlayerGoldChangeListApi({
          BeginTime: props.beginTime,
          EndTime: props.endTime,
          Page: 1,
          PageSize: 9999,
          PlayerId: String(props.playerId),
          Sort: sortParam,
        });

        const items = (result?.Items || []).map((item) => ({
          ...item,
          Total: Number(item.Total || 0) / 100,
        }));

        return {
          items,
          total: items.length,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const loading = computed(() => gridApi.grid?.loading ?? false);

function reload() {
  if (props.playerId) {
    gridApi.reload();
  }
}

watch(
  () => [props.playerId, props.beginTime, props.endTime],
  () => {
    reload();
  },
);

onMounted(async () => {
  await ensureGameConfig();
  reload();
});
</script>

<template>
  <Card :loading="loading" size="small" title="全局金币变化">
    <Grid class="max-w-2xl">
      <template #total="{ row }">
        <span
          :class="Number(row.Total) > 0 ? 'text-green-600' : 'text-red-500'"
        >
          {{ Number(row.Total).toFixed(2) }}
        </span>
      </template>
    </Grid>
  </Card>
</template>

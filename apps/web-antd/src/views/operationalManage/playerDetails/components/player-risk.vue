<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  PlayerRiskAnalysisGameItem,
  PlayerRiskAnalysisItem,
} from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Card, Result, Tag } from 'ant-design-vue';

import {
  fetchPlayerRiskAnalysisApi,
  fetchPlayerRiskAnalysisGameApi,
} from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatVenueName } from '#/utils/game-config';
import {
  RISK_BEHAVIOR_TYPE_MAP,
  RISK_WARN_LEVEL_MAP,
} from '#/utils/player-detail-maps';

defineOptions({ name: 'PlayerRiskPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const canView = computed(() => checkPermission(12377));
const loading = ref(false);

function formatBehaviorType(type?: number) {
  if (type === undefined || type === null) {
    return '-';
  }
  return RISK_BEHAVIOR_TYPE_MAP[type] || String(type);
}

function formatRiskLevel(level?: number) {
  if (level === undefined || level === null) {
    return '-';
  }
  return RISK_WARN_LEVEL_MAP[level] || String(level);
}

function getRiskLevelColor(level?: number) {
  const num = Number(level);
  if (num === -99) {
    return 'success';
  }
  if (num === 4) {
    return 'error';
  }
  if (num === 3) {
    return 'warning';
  }
  if (num === 2) {
    return 'processing';
  }
  return 'default';
}

const behaviorGridOptions: VxeTableGridOptions<PlayerRiskAnalysisItem> = {
  columns: [
    {
      field: 'Type',
      formatter: ({ cellValue }) => formatBehaviorType(cellValue),
      minWidth: 140,
      title: '行为',
    },
    {
      field: 'Content',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '内容',
    },
    {
      field: 'RiskWarnLevel',
      minWidth: 100,
      slots: { default: 'riskLevel' },
      title: '风控分析',
    },
  ],
  height: 'auto',
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async () => {
        const result = await fetchPlayerRiskAnalysisApi(props.playerId);
        const items = result?.Items || [];
        return {
          items,
          total: items.length,
        };
      },
    },
  },
};

const gameGridOptions: VxeTableGridOptions<PlayerRiskAnalysisGameItem> = {
  columns: [
    {
      field: 'GameId',
      formatter: ({ cellValue }) =>
        formatVenueName(cellValue, gameConfig.value),
      minWidth: 140,
      title: '场馆名称',
    },
    {
      field: 'BetGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '投注金额',
    },
    {
      field: 'WinGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '返奖金额',
    },
    {
      field: 'RiskWarnLevel',
      minWidth: 100,
      slots: { default: 'riskLevel' },
      title: '风控分析',
    },
  ],
  height: 'auto',
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async () => {
        const result = await fetchPlayerRiskAnalysisGameApi(props.playerId);
        const items = result?.Items || [];
        return {
          items,
          total: items.length,
        };
      },
    },
  },
};

const [BehaviorGrid, behaviorGridApi] = useVbenVxeGrid({
  gridOptions: behaviorGridOptions,
});
const [GameGrid, gameGridApi] = useVbenVxeGrid({
  gridOptions: gameGridOptions,
});

async function reloadAll() {
  if (!props.playerId || !canView.value) {
    return;
  }
  loading.value = true;
  try {
    await Promise.all([behaviorGridApi.reload(), gameGridApi.reload()]);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.playerId,
  () => {
    reloadAll();
  },
);

onMounted(async () => {
  await ensureGameConfig();
  reloadAll();
});
</script>

<template>
  <div v-if="canView">
    <Card class="mb-4" :loading="loading" title="近期行为">
      <BehaviorGrid>
        <template #riskLevel="{ row }">
          <Tag :color="getRiskLevelColor(row.RiskWarnLevel)">
            {{ formatRiskLevel(row.RiskWarnLevel) }}
          </Tag>
        </template>
      </BehaviorGrid>
    </Card>

    <Card :loading="loading" title="场馆投注风控">
      <GameGrid>
        <template #riskLevel="{ row }">
          <Tag :color="getRiskLevelColor(row.RiskWarnLevel)">
            {{ formatRiskLevel(row.RiskWarnLevel) }}
          </Tag>
        </template>
      </GameGrid>
    </Card>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12377 才能查看风控分析"
    title="无权限"
  />
</template>

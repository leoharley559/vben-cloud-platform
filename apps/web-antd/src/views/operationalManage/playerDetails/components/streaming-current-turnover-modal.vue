<script lang="ts" setup>
import type { PlayerDrawWaterSummary } from '#/types/player-detail';

import { computed } from 'vue';

import { Card, Modal, Table } from 'ant-design-vue';

import { useGameConfig } from '#/composables/use-game-config';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatGameName } from '#/utils/game-config';

defineOptions({ name: 'StreamingCurrentTurnoverModal' });

const props = defineProps<{
  detail: PlayerDrawWaterSummary;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { gameConfig } = useGameConfig();

const currentTotal = computed(() =>
  formatAmountFromCent(props.detail.CurrentTotInCompletedDrawWater || 0),
);

const gameTypeRows = computed(() => {
  const source = props.detail.SelectedGameTypesInCompletedDrawWater || {};
  return Object.entries(source).map(([key, value]) => ({
    key,
    turnover: formatAmountFromCent(value),
    typeLabel: formatGameTypeLabel(key),
  }));
});

const gameVenueRows = computed(() => {
  const source = props.detail.SelectedGamesInCompletedDrawWater || {};
  return Object.entries(source).map(([key, value]) => ({
    key,
    turnover: formatAmountFromCent(value),
    venueLabel: formatVenueLabel(key),
  }));
});

function formatGameTypeLabel(rawKey: string) {
  try {
    const types = JSON.parse(rawKey) as Array<number | string>;
    return types
      .map((type) => gameConfig.value.platformGameType[String(type)] || type)
      .join(', ');
  } catch {
    return rawKey;
  }
}

function formatVenueLabel(rawKey: string) {
  try {
    const ids = JSON.parse(rawKey) as Array<number | string>;
    return ids
      .map((id) => formatGameName(id, gameConfig.value.games))
      .join(', ');
  } catch {
    return formatGameName(rawKey, gameConfig.value.games);
  }
}

function closeModal() {
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    :title="`当前流水：${currentTotal}`"
    width="640px"
    @cancel="closeModal"
  >
    <Card class="mb-3" size="small" title="所有场馆">
      <div class="text-right font-medium">
        {{ formatAmountFromCent(detail.TotAllGamesInCompletedDrawWater || 0) }}
      </div>
    </Card>

    <Card class="mb-3" size="small" title="指定场馆类型">
      <template #extra>
        {{
          formatAmountFromCent(
            detail.TotalSelectedGameTypesInCompletedDrawWater || 0,
          )
        }}
      </template>
      <Table
        :columns="[
          { dataIndex: 'typeLabel', title: '场馆类型' },
          { dataIndex: 'turnover', title: '流水', width: 120 },
        ]"
        :data-source="gameTypeRows"
        :pagination="false"
        row-key="key"
        size="small"
      />
    </Card>

    <Card size="small" title="指定场馆">
      <template #extra>
        {{
          formatAmountFromCent(
            detail.TotalSelectedGamesInCompletedDrawWater || 0,
          )
        }}
      </template>
      <Table
        :columns="[
          { dataIndex: 'venueLabel', title: '场馆' },
          { dataIndex: 'turnover', title: '流水', width: 120 },
        ]"
        :data-source="gameVenueRows"
        :pagination="false"
        row-key="key"
        size="small"
      />
    </Card>
  </Modal>
</template>

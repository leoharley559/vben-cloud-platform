<script lang="ts" setup>
import type { AgentFanDianConfig, AgentFanDianLine } from '#/types/netcash';

import { computed } from 'vue';

import { InputNumber } from 'ant-design-vue';

import {
  fanDianRebateAsPercent,
  formatAgentFanDianGradeEffectiveFlow,
  formatAgentFanDianGradeTitle,
  getAgentFanDianLines,
  setFanDianRebatePercent,
} from '#/utils/netcash';

defineOptions({ name: 'AgencyFanDianFormPanel' });

const model = defineModel<AgentFanDianConfig | null>({ default: null });

const gradeKeys = computed(() =>
  model.value ? Object.keys(model.value) : [],
);

function gradeLines(gradeKey: string) {
  return getAgentFanDianLines(model.value?.[gradeKey]);
}

function gradeTitle(gradeKey: string) {
  const name = model.value?.[gradeKey]?.name;
  return name ? String(name) : formatAgentFanDianGradeTitle(gradeKey);
}

function gradeFlow(gradeKey: string) {
  return formatAgentFanDianGradeEffectiveFlow(model.value?.[gradeKey]);
}

function updateRebate(line: AgentFanDianLine, value: null | number) {
  setFanDianRebatePercent(line, value);
}
</script>

<template>
  <div
    v-if="model && gradeKeys.length > 0"
    class="agent-fan-dian-panel grid grid-cols-1 gap-4 md:grid-cols-2"
  >
    <div
      v-for="gradeKey in gradeKeys"
      :key="gradeKey"
      class="rounded border border-border p-3"
    >
      <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span class="font-medium">{{ gradeTitle(gradeKey) }}</span>
        <span v-if="gradeFlow(gradeKey)" class="text-muted-foreground">
          所需有效流水 ≥ {{ gradeFlow(gradeKey) }}
        </span>
      </div>
      <div class="grid gap-2">
        <div
          v-for="line in gradeLines(gradeKey)"
          :key="`${gradeKey}-${line.id}`"
          class="flex items-center justify-between gap-3"
        >
          <span class="min-w-0 flex-1 truncate text-sm">
            {{ line.name || line.type }}
          </span>
          <div class="flex shrink-0 items-center gap-1">
            <InputNumber
              :max="100"
              :min="0"
              :precision="2"
              :step="0.01"
              :value="fanDianRebateAsPercent(line.rebate)"
              size="small"
              style="width: 120px"
              @update:value="(value) => updateRebate(line, value as number | null)"
            />
            <span class="text-sm text-muted-foreground">%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

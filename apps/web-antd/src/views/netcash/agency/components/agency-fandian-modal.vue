<script lang="ts" setup>
import type { AgencyListItem } from '#/types/netcash';

import { computed } from 'vue';

import { Empty, Modal } from 'ant-design-vue';

import {
  formatAgentFanDianFlow,
  formatAgentFanDianGradeTitle,
  formatAgentFanDianRebate,
  getAgentFanDianLines,
  parseAgentFanDianConfig,
} from '#/utils/netcash';

defineOptions({ name: 'AgencyFanDianModal' });

const props = defineProps<{
  open: boolean;
  row?: AgencyListItem | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const visible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const config = computed(() => parseAgentFanDianConfig(props.row?.AgentFanDianConfig));

const grades = computed(() =>
  Object.entries(config.value || {}).map(([key, grade]) => ({
    flow: formatAgentFanDianFlow(grade.effectiveFlow),
    key,
    lines: getAgentFanDianLines(grade),
    title: grade.name || formatAgentFanDianGradeTitle(key),
  })),
);
</script>

<template>
  <Modal
    v-model:open="visible"
    :footer="null"
    destroy-on-close
    title="游戏返水配置"
    width="720px"
  >
    <div
      v-if="row?.Name || row?.Username"
      class="mb-3 flex flex-wrap gap-4 text-sm text-gray-500"
    >
      <span v-if="row?.Name">姓名：{{ row.Name }}</span>
      <span v-if="row?.Username">代理账号：{{ row.Username }}</span>
    </div>

    <div v-if="grades.length" class="max-h-[60vh] overflow-y-auto">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          v-for="grade in grades"
          :key="grade.key"
          class="overflow-hidden rounded border border-gray-200 dark:border-gray-700"
        >
          <div
            class="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold dark:border-gray-800 dark:bg-gray-800"
          >
            <span>{{ grade.title }}</span>
            <span v-if="grade.flow" class="text-xs font-normal text-gray-500">
              所需流水 {{ grade.flow }}
            </span>
          </div>
          <div
            v-for="(line, index) in grade.lines"
            :key="`${grade.key}-${line.id ?? index}`"
            class="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 dark:border-gray-800"
          >
            <span>{{ line.name || line.type || '-' }}</span>
            <span class="font-medium">
              {{ formatAgentFanDianRebate(line.rebate) }}
            </span>
          </div>
          <div
            v-if="!grade.lines.length"
            class="px-3 py-2 text-sm text-gray-400"
          >
            暂无场馆返水项
          </div>
        </div>
      </div>
    </div>
    <Empty v-else description="暂无返水配置数据" />
  </Modal>
</template>

<script lang="ts" setup>
import type { AgencyListItem, AgentFanDianLine } from '#/types/netcash';

import { computed } from 'vue';

import { Empty, Modal, Table } from 'ant-design-vue';

import venueConfig from '#/config/venue-config.json';
import { useGameConfig } from '#/composables/use-game-config';
import { formatVenueName } from '#/utils/game-config';
import {
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

const { gameConfig } = useGameConfig();
const GRADE_ORDER = ['grade_S', 'grade_A', 'grade_B', 'grade_C'];

const visible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const config = computed(() =>
  parseAgentFanDianConfig(props.row?.AgentFanDianConfig),
);

/** grade_S → S级 */
function shortGradeLabel(gradeKey: string) {
  const matched = /^grade_(.+)$/i.exec(gradeKey);
  const code = matched?.[1];
  return `${code ? code.toUpperCase() : gradeKey}级`;
}

/** 有效流水展示：100,000,000 */
function formatFlowDisplay(effectiveFlow?: number | string) {
  const value = Number(effectiveFlow);
  if (
    effectiveFlow === '' ||
    effectiveFlow === undefined ||
    effectiveFlow === null ||
    Number.isNaN(value)
  ) {
    return '-';
  }
  return Math.round(value).toLocaleString('en-US');
}

/** 分类下的场馆中文名（熊猫体育、DB棋牌…） */
function resolveVenueNames(gameIdList: number[]) {
  return gameIdList
    .map((gameId) => {
      const name = formatVenueName(gameId, gameConfig.value);
      if (!name || name === '-' || name === String(gameId)) return '';
      return name;
    })
    .filter(Boolean)
    .join('、');
}

/** 从等级配置行里匹配该分类的返点 */
function matchCategoryLine(
  lines: AgentFanDianLine[],
  category: (typeof venueConfig.fanDianCategories)[number],
) {
  const typeCode = String(category.type || '').trim();
  const typeName = String(category.name || '').trim();
  const gameIds = new Set(category.gameIdList.map(Number));

  return (
    lines.find((line) => {
      const type = String(line.type || '').trim();
      const id = Number(line.id);
      return (
        (typeCode && type === typeCode) ||
        (typeName && type === typeName) ||
        (!Number.isNaN(id) && gameIds.has(id))
      );
    }) || null
  );
}

const gradeColumns = computed(() => {
  const raw = config.value;
  if (!raw) return [];
  return Object.keys(raw)
    .toSorted((a, b) => {
      const ia = GRADE_ORDER.indexOf(a);
      const ib = GRADE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map((key) => ({
      flow: formatFlowDisplay(raw[key]?.effectiveFlow),
      key,
      label: shortGradeLabel(key),
      lines: getAgentFanDianLines(raw[key]),
    }));
});

/**
 * 以本地 fanDianCategories 为行结构：
 * 游戏类型名 + venue-config 场馆名；返点从 AgentFanDianConfig 匹配
 */
const tableRows = computed(() => {
  if (gradeColumns.value.length === 0) return [];

  return venueConfig.fanDianCategories.map((category) => {
    const rebates: Record<string, string> = {};
    for (const grade of gradeColumns.value) {
      const line = matchCategoryLine(grade.lines, category);
      rebates[grade.key] = line
        ? formatAgentFanDianRebate(line.rebate)
        : '-';
    }
    const venuesFromConfig = resolveVenueNames(category.gameIdList);
    // 配置未命中时，回退接口行里的 name
    const fallbackVenues = (() => {
      if (venuesFromConfig.length > 0) return '';
      const names = new Set<string>();
      for (const grade of gradeColumns.value) {
        const line = matchCategoryLine(grade.lines, category);
        const name = String(line?.name || '').trim();
        if (name) names.add(name);
      }
      return [...names].join('、');
    })();

    return {
      key: String(category.id ?? category.type),
      rebates,
      type: category.name,
      venues: venuesFromConfig || fallbackVenues,
    };
  });
});

const columns = computed(() => [
  {
    align: 'center' as const,
    dataIndex: 'type',
    key: 'type',
    title: '游戏类型',
    width: 200,
  },
  ...gradeColumns.value.map((grade) => ({
    align: 'center' as const,
    dataIndex: ['rebates', grade.key],
    key: grade.key,
    title: `${grade.label}返点`,
    width: 120,
  })),
]);
</script>

<template>
  <Modal
    v-model:open="visible"
    :footer="null"
    destroy-on-close
    title="代理返点配置"
    width="860px"
  >
    <div v-if="gradeColumns.length > 0" class="space-y-4">
      <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span v-for="grade in gradeColumns" :key="grade.key">
          <span class="font-medium text-foreground">{{ grade.label }}</span>
          有效流水：≥ {{ grade.flow }}
        </span>
      </div>

      <Table
        bordered
        class="fan-dian-table"
        :columns="columns"
        :data-source="tableRows"
        :pagination="false"
        row-key="key"
        size="small"
        :scroll="{ x: 720 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <div class="text-center">
              <div class="text-sm text-foreground">{{ record.type }}</div>
              <div
                v-if="record.venues"
                class="mt-0.5 text-xs leading-5 text-gray-400"
              >
                {{ record.venues }}
              </div>
            </div>
          </template>
          <template v-else>
            {{ record.rebates[String(column.key)] || '-' }}
          </template>
        </template>
      </Table>
    </div>
    <Empty v-else description="暂无返水配置数据" />
  </Modal>
</template>

<style scoped>
.fan-dian-table :deep(.ant-table-thead > tr > th),
.fan-dian-table :deep(.ant-table-tbody > tr > td) {
  padding-top: 8px;
  padding-bottom: 8px;
}
</style>

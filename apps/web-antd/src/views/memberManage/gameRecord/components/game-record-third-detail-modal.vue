<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Descriptions, Modal, Spin, Tag, message } from 'ant-design-vue';

import { fetchGameRecordThirdDetailApi } from '#/api/memberManage/game-record';
import { useGameConfig } from '#/composables/use-game-config';
import { formatVenueName } from '#/utils/game-config';
import type { GameInfo } from '#/utils/game-config';
import {
  buildDetailSections,
  getDetailModeLabel,
} from '#/utils/third-detail-display.js';

defineOptions({ name: 'GameRecordThirdDetailModal' });

interface BetRow {
  Detail?: unknown;
  GameId?: number | string;
  GameType?: number | string;
  RoundId?: string;
  SubGameId?: number | string;
  TransactionId?: string;
  TransactionTime?: number | string;
  [key: string]: unknown;
}

interface LegacyItem {
  Name?: string;
  Type?: string;
  Value?: unknown;
}

interface DetailSection {
  fields?: Array<{ key: string; label: string; value: string }>;
  items?: Array<{
    groups: Array<{
      fields: Array<{ key: string; label: string; value: string }>;
      title: string;
    }>;
    index: number;
    title: string;
  }>;
  title: string;
  type?: string;
}

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{
  games?: Record<string, GameInfo>;
  row?: BetRow | null;
}>();

const { gameConfig } = useGameConfig();
const loading = ref(false);
const displayMode = ref<'legacy' | 'structured'>('legacy');
const detailMode = ref('default');
const detailSections = ref<DetailSection[]>([]);
const extraDetails = ref<LegacyItem[]>([]);

const titleText = computed(() => {
  const gameName = formatVenueName(props.row?.GameId, {
    ...gameConfig.value,
    games: props.games || gameConfig.value.games,
  });
  return `${gameName} - 三方详情`;
});

const modeLabel = computed(() => getDetailModeLabel(detailMode.value) || '');

function resetView() {
  displayMode.value = 'legacy';
  detailMode.value = 'default';
  detailSections.value = [];
  extraDetails.value = [];
}

async function loadDetail() {
  resetView();
  const row = props.row;
  if (!row) {
    return;
  }

  let detail = row.Detail;
  if (typeof detail === 'string' && detail) {
    try {
      detail = JSON.parse(detail);
    } catch {
      // keep string
    }
  }

  if (detail) {
    loading.value = true;
    try {
      const built = buildDetailSections(detail, { ...row, Detail: detail });
      displayMode.value = 'structured';
      detailMode.value = built.mode || 'default';
      detailSections.value = (built.sections || []) as DetailSection[];
    } finally {
      loading.value = false;
    }
    return;
  }

  loading.value = true;
  try {
    const data = await fetchGameRecordThirdDetailApi({
      BeginTime: row.TransactionTime,
      GameType: row.GameType,
      OrderId: row.TransactionId,
      RoundCode: row.RoundId,
      SubGameId: row.SubGameId,
    });
    extraDetails.value = Array.isArray(data) ? data : [];
    displayMode.value = 'legacy';
    if (!extraDetails.value.length) {
      message.info('暂无三方详情');
    }
  } catch {
    extraDetails.value = [];
  } finally {
    loading.value = false;
  }
}

function iframeSrc(value: unknown) {
  if (Array.isArray(value) && value[0]) {
    return String(value[0]);
  }
  return String(value || '');
}

watch(open, (visible) => {
  if (visible) {
    void loadDetail();
  }
});
</script>

<template>
  <Modal
    v-model:open="open"
    :footer="null"
    destroy-on-close
    width="960px"
    @cancel="resetView"
  >
    <template #title>
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-semibold">{{ titleText }}</span>
        <Tag v-if="modeLabel" color="blue">{{ modeLabel }}</Tag>
      </div>
    </template>

    <Spin :spinning="loading">
      <div class="max-h-[70vh] overflow-y-auto">
        <template v-if="displayMode === 'structured'">
          <div
            v-for="section in detailSections"
            :key="section.title"
            class="mb-3 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
          >
            <div
              class="border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm font-semibold dark:border-gray-800 dark:bg-gray-800"
            >
              {{ section.title }}
            </div>
            <div class="p-3">
              <template v-if="section.type === 'orderDetailList'">
                <div
                  v-for="item in section.items"
                  :key="item.index"
                  class="mb-3 rounded border border-gray-100 p-2 dark:border-gray-800"
                >
                  <div class="mb-2 text-sm">
                    第 {{ item.index }} 关 · {{ item.title }}
                  </div>
                  <div
                    v-for="group in item.groups"
                    :key="`${item.index}-${group.title}`"
                    class="mb-1"
                  >
                    <div
                      v-if="item.groups.length > 1"
                      class="mb-1 text-xs text-gray-500"
                    >
                      {{ group.title }}
                    </div>
                    <Descriptions bordered :column="2" size="small">
                      <Descriptions.Item
                        v-for="field in group.fields"
                        :key="field.key"
                        :label="field.label"
                      >
                        {{ field.value }}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </div>
              </template>
              <Descriptions v-else bordered :column="2" size="small">
                <Descriptions.Item
                  v-for="field in section.fields || []"
                  :key="field.key"
                  :label="field.label"
                >
                  {{ field.value }}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
          <div
            v-if="!detailSections.length"
            class="py-8 text-center text-gray-400"
          >
            暂无详情
          </div>
        </template>

        <template v-else>
          <div
            v-for="(item, index) in extraDetails"
            :key="index"
            class="mb-3 border-b border-gray-100 pb-3 dark:border-gray-800"
          >
            <template v-if="item.Type === 'html'">
              <div class="mb-1 text-xs text-gray-500">{{ item.Name }}</div>
              <div v-html="String(item.Value || '')" />
            </template>
            <template v-else-if="item.Type === 'Iframe' || item.Type === 'url'">
              <div class="mb-1 text-xs text-gray-500">{{ item.Name }}</div>
              <iframe
                class="h-[360px] w-full rounded border"
                :src="iframeSrc(item.Value)"
              />
            </template>
            <template v-else-if="item.Type === 'string'">
              <div class="flex gap-2 text-sm">
                <span class="text-gray-500">{{ item.Name }}</span>
                <span>{{ item.Value }}</span>
              </div>
            </template>
            <template v-else>
              <div class="flex gap-2 text-sm">
                <span class="text-gray-500">{{ item.Name || item.Type }}</span>
                <span>{{ item.Value }}</span>
              </div>
            </template>
          </div>
          <div
            v-if="!extraDetails.length"
            class="py-8 text-center text-gray-400"
          >
            暂无详情
          </div>
        </template>
      </div>
    </Spin>
  </Modal>
</template>

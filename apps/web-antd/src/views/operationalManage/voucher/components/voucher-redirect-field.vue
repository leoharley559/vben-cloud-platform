<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Input, Select } from 'ant-design-vue';

import {
  fetchAdActivityJumpListApi,
  fetchAdNoticeJumpListApi,
} from '#/api/operationManage/game-notice';
import { useGameConfig } from '#/composables/use-game-config';
import { formatVenueName } from '#/utils/game-config';

import { REDIRECT_TYPE, REDIRECT_TYPE_OPTIONS } from './voucher-shared';

defineOptions({ name: 'VoucherRedirectField' });

const props = withDefaults(
  defineProps<{
    allowedTypes?: number[];
    disabled?: boolean;
  }>(),
  {
    allowedTypes: () => Object.values(REDIRECT_TYPE),
    disabled: false,
  },
);

const type = defineModel<number>('type', { default: REDIRECT_TYPE.NONE });
const param = defineModel<number | string>('param', { default: '' });

const typeOptions = computed(() =>
  REDIRECT_TYPE_OPTIONS.filter((item) =>
    props.allowedTypes.includes(item.value),
  ),
);

const noticeOptions = ref<Array<{ label: string; value: number | string }>>([]);
const activityOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);
const { ensureGameConfig, gameConfig } = useGameConfig();

const venueOptions = computed(() =>
  Object.entries(gameConfig.value.platformGameList).map(([gameId]) => ({
    label: formatVenueName(gameId, gameConfig.value),
    value: Number(gameId),
  })),
);

onMounted(() => {
  void ensureGameConfig();
  void loadNoticeOptions();
  void loadActivityOptions();
});

function extractLangTitle(raw: unknown, fallback: string) {
  if (!raw) {
    return fallback;
  }
  try {
    const lang = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const first = Object.values(lang as Record<string, { Title?: string }>)[0];
    return first?.Title || fallback;
  } catch {
    return fallback;
  }
}

async function loadNoticeOptions() {
  try {
    const result = await fetchAdNoticeJumpListApi();
    const list = Array.isArray(result)
      ? result
      : (result as { Items?: unknown[] })?.Items || [];
    noticeOptions.value = (list as Array<Record<string, unknown>>)
      .filter(Boolean)
      .map((item) => ({
        label: `${extractLangTitle(item.LangText, String(item.Title || item.Id))} (${item.Id})`,
        value: item.Id as number,
      }));
  } catch {
    noticeOptions.value = [];
  }
}

async function loadActivityOptions() {
  try {
    const result = await fetchAdActivityJumpListApi();
    const list = Array.isArray(result)
      ? result
      : (result as { Items?: unknown[] })?.Items || [];
    activityOptions.value = (list as Array<Record<string, unknown>>)
      .filter(Boolean)
      .map((item) => ({
        label: `${extractLangTitle(item.LangText, String(item.Name || item.Title || item.Id))} (${item.Id})`,
        value: item.Id as number,
      }));
  } catch {
    activityOptions.value = [];
  }
}

function handleTypeChange() {
  param.value = '';
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Select
      v-model:value="type"
      :disabled="disabled"
      :options="typeOptions"
      style="width: 160px"
      @change="handleTypeChange"
    />

    <template v-if="type === REDIRECT_TYPE.URL">
      <Input
        v-model:value="param as string"
        :disabled="disabled"
        placeholder="请输入网址"
        style="width: 260px"
      />
    </template>

    <template v-else-if="type === REDIRECT_TYPE.ACTIVITY">
      <Select
        v-if="activityOptions.length"
        v-model:value="param"
        allow-clear
        :disabled="disabled"
        :options="activityOptions"
        placeholder="请选择活动"
        show-search
        style="width: 260px"
      />
      <Input
        v-else
        v-model:value="param as string"
        :disabled="disabled"
        style="width: 260px"
        placeholder="请输入活动列表加载失败，可输入活动ID"
      />
    </template>

    <template v-else-if="type === REDIRECT_TYPE.UI_PAGE">
      <Input
        v-model:value="param as string"
        :disabled="disabled"
        placeholder="请输入功能页面标识"
        style="width: 260px"
      />
    </template>

    <template v-else-if="type === REDIRECT_TYPE.NOTICE">
      <Select
        v-if="noticeOptions.length"
        v-model:value="param"
        allow-clear
        :disabled="disabled"
        :options="noticeOptions"
        placeholder="请选择公告"
        show-search
        style="width: 260px"
      />
      <Input
        v-else
        v-model:value="param as string"
        :disabled="disabled"
        style="width: 260px"
        placeholder="请输入公告列表加载失败，可输入公告ID"
      />
    </template>

    <template v-else-if="type === REDIRECT_TYPE.VENUE">
      <Select
        v-if="venueOptions.length"
        v-model:value="param"
        allow-clear
        :disabled="disabled"
        :options="venueOptions"
        placeholder="请选择场馆"
        show-search
        style="width: 260px"
      />
      <Input
        v-else
        v-model:value="param as string"
        :disabled="disabled"
        style="width: 260px"
        placeholder="请输入场馆列表加载失败，可输入场馆ID"
      />
    </template>
  </div>
</template>

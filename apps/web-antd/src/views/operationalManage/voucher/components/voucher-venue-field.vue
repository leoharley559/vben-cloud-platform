<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { Input, Radio, Select } from 'ant-design-vue';

import { useGameConfig } from '#/composables/use-game-config';
import { formatVenueName } from '#/utils/game-config';

import { VENUE_PICK_MODE_OPTIONS } from './voucher-shared';

defineOptions({ name: 'VoucherVenueField' });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    /** categories/venues 的存储格式: array(number[]) 或 csv(逗号分隔字符串) */
    format?: 'array' | 'csv';
  }>(),
  {
    disabled: false,
    format: 'array',
  },
);

const pickMode = defineModel<number>('pickMode', { default: 0 });
const categoriesModel = defineModel<number[] | string>('categories', {
  default: () => [],
});
const venuesModel = defineModel<number[] | string>('venues', {
  default: () => [],
});

const { ensureGameConfig, gameConfig } = useGameConfig();

onMounted(() => {
  void ensureGameConfig();
});

function toArray(value: number[] | string | undefined): number[] {
  if (Array.isArray(value)) {
    return value.map(Number).filter((item) => !Number.isNaN(item));
  }
  if (typeof value === 'string' && value) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map(Number)
      .filter((item) => !Number.isNaN(item));
  }
  return [];
}

const categoriesArray = computed<number[]>({
  get: () => toArray(categoriesModel.value),
  set: (val) => {
    categoriesModel.value = props.format === 'csv' ? val.join(',') : val;
  },
});

const venuesArray = computed<number[]>({
  get: () => toArray(venuesModel.value),
  set: (val) => {
    venuesModel.value = props.format === 'csv' ? val.join(',') : val;
  },
});

const categoriesCsvFallback = computed<string>({
  get: () => categoriesArray.value.join(','),
  set: (val) => {
    categoriesArray.value = toArray(val);
  },
});

const venuesCsvFallback = computed<string>({
  get: () => venuesArray.value.join(','),
  set: (val) => {
    venuesArray.value = toArray(val);
  },
});

const categoryOptions = computed(() =>
  Object.entries(gameConfig.value.platformGameType).map(([value]) => ({
    label: formatVenueName(value, gameConfig.value),
    value: Number(value),
  })),
);

const venueOptions = computed(() =>
  Object.entries(gameConfig.value.platformGameList).map(([gameId]) => ({
    label: formatVenueName(gameId, gameConfig.value),
    value: Number(gameId),
  })),
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <Radio.Group
      v-model:value="pickMode"
      :disabled="disabled"
      :options="VENUE_PICK_MODE_OPTIONS"
    />

    <template v-if="pickMode === 1">
      <Select
        v-if="categoryOptions.length"
        v-model:value="categoriesArray"
        :disabled="disabled"
        mode="multiple"
        :options="categoryOptions"
        placeholder="请选择场馆类型"
        style="width: 100%; max-width: 480px"
      />
      <Input
        v-else
        v-model:value="categoriesCsvFallback"
        :disabled="disabled"
        style="max-width: 480px"
        placeholder="请输入场馆类型列表加载失败，可手动输入类型ID，逗号分隔"
      />
    </template>

    <template v-if="pickMode === 2">
      <Select
        v-if="venueOptions.length"
        v-model:value="venuesArray"
        allow-clear
        :disabled="disabled"
        mode="multiple"
        :options="venueOptions"
        placeholder="请选择场馆"
        show-search
        style="width: 100%; max-width: 480px"
      />
      <Input
        v-else
        v-model:value="venuesCsvFallback"
        :disabled="disabled"
        style="max-width: 480px"
        placeholder="请输入场馆列表加载失败，可手动输入场馆ID，逗号分隔"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { ChannelInfoOption } from '#/types/config';

import { computed, onMounted, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';
import { useDebounceFn } from '@vueuse/core';

import { fetchChildChannelInfoApi } from '#/api/config/index';
import { useCloudPlatformStore } from '#/store/cloud-platform';

defineOptions({ name: 'ChannelSelect' });

const props = withDefaults(
  defineProps<{
    multiple?: boolean;
    returnName?: boolean;
  }>(),
  {
    multiple: true,
    returnName: false,
  },
);

const modelValue = defineModel<Array<number | string> | number | string>();

const cloudStore = useCloudPlatformStore();
const loading = ref(false);
const channelList = ref<ChannelInfoOption[]>([]);

function getOptionValue(item: ChannelInfoOption) {
  return props.returnName ? item.ChannelName : item.ChannelId;
}

const selectOptions = computed(() =>
  channelList.value.map((item) => ({
    label: `${item.ChannelId}(${item.ChannelName || '-'})`,
    value: getOptionValue(item),
  })),
);

function loadFromProjectConfig() {
  const list = cloudStore.projectConfig?.ChildChannelInfo;
  if (Array.isArray(list) && list.length) {
    channelList.value = list as ChannelInfoOption[];
  }
}

const handleSearch = useDebounceFn(async (query: string) => {
  if (!query) {
    loadFromProjectConfig();
    return;
  }
  loading.value = true;
  try {
    const result = await fetchChildChannelInfoApi({ ChannelId: query });
    channelList.value = result?.ChildChannelInfo || [];
  } finally {
    loading.value = false;
  }
}, 300);

watch(
  () => cloudStore.projectConfig?.ChildChannelInfo,
  () => {
    if (!channelList.value.length) {
      loadFromProjectConfig();
    }
  },
  { immediate: true },
);

watch(modelValue, (value) => {
  if (props.multiple && value === '') {
    modelValue.value = [];
  }
});

onMounted(() => {
  loadFromProjectConfig();
});
</script>

<template>
  <Select
    v-model:value="modelValue"
    allow-clear
    class="w-full"
    :filter-option="false"
    :loading="loading"
    :mode="multiple ? 'multiple' : undefined"
    :options="selectOptions"
    placeholder="请输入渠道 ID 搜索"
    show-search
    @search="handleSearch"
  />
</template>

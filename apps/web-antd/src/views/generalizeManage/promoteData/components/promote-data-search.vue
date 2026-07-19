<script lang="ts" setup>
import { ref } from 'vue';

import { Button, DatePicker, Input, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import ChannelSelect from '#/components/global/channel-select.vue';

defineOptions({ name: 'PromoteDataSearch' });

const props = withDefaults(
  defineProps<{
    showLanding?: boolean;
    showSearchButton?: boolean;
  }>(),
  {
    showLanding: false,
    showSearchButton: true,
  },
);

const emit = defineEmits<{
  reset: [];
  search: [
    payload: {
      AdminIds: string;
      BeginTime: string;
      ChannelIds: Array<number | string>;
      EndTime: string;
      TemplateId: string;
    },
  ];
}>();

const defaultBegin = dayjs().subtract(7, 'day');
const defaultEnd = dayjs();

const filterAdminIds = ref('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterTemplateId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);

function buildPayload() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminIds: filterAdminIds.value,
    BeginTime: begin
      ? begin.format('YYYY-MM-DD')
      : defaultBegin.format('YYYY-MM-DD'),
    ChannelIds: filterChannelIds.value,
    EndTime: end ? end.format('YYYY-MM-DD') : defaultEnd.format('YYYY-MM-DD'),
    TemplateId: filterTemplateId.value,
  };
}

function handleSearch() {
  emit('search', buildPayload());
}

function handleReset() {
  filterAdminIds.value = '';
  filterChannelIds.value = [];
  filterTemplateId.value = '';
  filterDateRange.value = [defaultBegin, defaultEnd];
  emit('reset');
  emit('search', buildPayload());
}

defineExpose({
  buildPayload,
});
</script>

<template>
  <div class="mb-4 flex flex-wrap items-end gap-2">
    <Input
      v-model:value="filterAdminIds"
      allow-clear
      placeholder="推广账号 ID，多个逗号分隔"
      style="width: 260px"
      @press-enter="handleSearch"
    >
      <template #addonBefore>推广账号</template>
    </Input>
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">渠道</span>
      <ChannelSelect v-model="filterChannelIds" style="width: 260px" />
    </div>
    <Input
      v-if="showLanding"
      v-model:value="filterTemplateId"
      allow-clear
      placeholder="落地页 ID"
      style="width: 180px"
    >
      <template #addonBefore>落地页</template>
    </Input>
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">日期</span>
      <DatePicker.RangePicker v-model:value="filterDateRange" />
    </div>
    <Space v-if="showSearchButton">
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
    </Space>
    <slot />
  </div>
</template>

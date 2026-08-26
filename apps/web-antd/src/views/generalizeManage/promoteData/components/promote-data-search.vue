<script lang="ts" setup>
import { ref } from 'vue';

import { Button, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';

defineOptions({ name: 'PromoteDataSearch' });

withDefaults(
  defineProps<{
    landingOptions?: Array<{
      label: string;
      value: number | string | undefined;
    }>;
    /** 可选日期跨度上限（天），对齐旧站 limit-number；0 表示不限制 */
    maxRangeDays?: number;
    showLanding?: boolean;
    showSearchButton?: boolean;
  }>(),
  {
    showLanding: false,
    showSearchButton: true,
    maxRangeDays: 0,
    landingOptions: () => [],
  },
);

const emit = defineEmits<{
  reset: [];
  search: [
    payload: {
      AdminIds: Array<number | string>;
      BeginTime: string;
      ChannelIds: Array<number | string>;
      EndTime: string;
      TemplateId: string;
    },
  ];
}>();

// 默认当月：月初 ～ 今天
function currentMonthRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  return [dayjs().startOf('month'), dayjs()];
}

const filterAdminIds = ref<Array<number | string>>([]);
const filterChannelIds = ref<Array<number | string>>([]);
const filterTemplateId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(currentMonthRange());
function buildPayload() {
  const [begin, end] = filterDateRange.value || [];
  const fallback = currentMonthRange();
  return {
    AdminIds: filterAdminIds.value,
    BeginTime: begin
      ? begin.format('YYYY-MM-DD')
      : fallback[0].format('YYYY-MM-DD'),
    ChannelIds: filterChannelIds.value,
    EndTime: end ? end.format('YYYY-MM-DD') : fallback[1].format('YYYY-MM-DD'),
    TemplateId: filterTemplateId.value,
  };
}

function handleSearch() {
  emit('search', buildPayload());
}

function handleReset() {
  filterAdminIds.value = [];
  filterChannelIds.value = [];
  filterTemplateId.value = '';
  filterDateRange.value = currentMonthRange();
  emit('reset');
  emit('search', buildPayload());
}

defineExpose({
  buildPayload,
});
</script>

<template>
  <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
      <Space.Compact>
        <span class="query-field-addon">账号</span>
        <AccountSelect v-model="filterAdminIds" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道</span>
        <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
      </Space.Compact>
      <Space.Compact v-if="showLanding">
        <span class="query-field-addon">落地页</span>
        <Select
          v-model:value="filterTemplateId"
          allow-clear
          :options="landingOptions"
          placeholder="请选择落地页"
          show-search
        />
      </Space.Compact>
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker
          v-model="filterDateRange"
          :max-range-days="maxRangeDays"
          precision="date"
        />
      </div>
      <slot></slot>
      <div
        v-if="showSearchButton"
        class="query-filter-actions query-filter-actions-single"
      >
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>
    </div>
  </div>
</template>

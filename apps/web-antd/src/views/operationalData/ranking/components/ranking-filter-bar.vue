<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, ref, watch } from 'vue';

import { Button, Input, Select, Space } from 'ant-design-vue';

import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { normalizeSearchValue } from '#/utils/everyday-report-format';
import { defaultRankingDateRange, toUnixRange } from '#/utils/ranking';

defineOptions({ name: 'RankingFilterBar' });

const props = withDefaults(
  defineProps<{
    exportLoading?: boolean;
    loading?: boolean;
    showDataSearchType?: boolean;
    showExport?: boolean;
  }>(),
  {
    loading: false,
    exportLoading: false,
    showExport: true,
    showDataSearchType: false,
  },
);

const emit = defineEmits<{
  export: [];
  reset: [query: Record<string, unknown>];
  search: [query: Record<string, unknown>];
}>();

const dateRange = ref<[Dayjs, Dayjs]>(defaultRankingDateRange());
const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminSearch = ref<Array<number | string> | number | string>([]);
const channelSearch = ref<Array<number | string> | number | string>([]);
const dataSearchType = ref(0);

const dataSearchTypeOptions = [
  { label: '正式', value: 0 },
  { label: '测试', value: 1 },
  { label: '全部', value: 2 },
];

function buildQuery(): Record<string, unknown> {
  const adminValue = normalizeSearchValue(
    adminSearch.value,
    adminSearchType.value,
  );
  const channelValue = normalizeSearchValue(
    channelSearch.value,
    channelSearchType.value,
  );
  const { BeginTime, EndTime } = toUnixRange(dateRange.value);
  return {
    AdminGroupIds: '',
    AdminIds: adminValue,
    AdminSearch: adminValue,
    AdminSearchType: adminSearchType.value,
    BeginTime,
    ChannelIds: channelValue,
    ChannelSearch: channelValue,
    ChannelSearchType: channelSearchType.value,
    EndTime,
    Limit: '100',
    ...(props.showDataSearchType
      ? { DataSearchType: dataSearchType.value }
      : {}),
  };
}

function handleSearch() {
  emit('search', buildQuery());
}

function handleReset() {
  dateRange.value = defaultRankingDateRange();
  adminSearchType.value = 0;
  channelSearchType.value = 0;
  adminSearch.value = [];
  channelSearch.value = [];
  dataSearchType.value = 0;
  emit('reset', buildQuery());
}

watch(adminSearchType, (type) => {
  adminSearch.value = type === 0 ? [] : '';
});

watch(channelSearchType, (type) => {
  channelSearch.value = type === 0 ? [] : '';
});

defineExpose({
  buildQuery,
  getQuery: buildQuery,
});

const exportDisabled = computed(() => props.loading || props.exportLoading);
</script>

<template>
  <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
      <div class="query-filter-wide">
        <QueryDatetimeRangePicker v-model="dateRange" precision="date" />
      </div>

      <Space.Compact>
        <Select
          class="query-auto-select"
          :popup-match-select-width="false"
          v-model:value="adminSearchType"
          :options="[
            { label: '账号模糊', value: 0 },
            { label: '账号精准', value: 1 },
          ]"
        />
        <AccountSelect v-if="adminSearchType === 0" v-model="adminSearch" />
        <Input
          v-else
          v-model:value="adminSearch as string"
          allow-clear
          placeholder="请输入账号"
        />
      </Space.Compact>

      <Space.Compact>
        <Select
          class="query-auto-select"
          :popup-match-select-width="false"
          v-model:value="channelSearchType"
          :options="[
            { label: '渠道模糊', value: 0 },
            { label: '渠道精准', value: 1 },
          ]"
        />
        <ChannelSelect
          v-if="channelSearchType === 0"
          v-model="channelSearch"
          placeholder="请输入渠道号"
        />
        <Input
          v-else
          v-model:value="channelSearch as string"
          allow-clear
          placeholder="请输入渠道"
        />
      </Space.Compact>

      <Space.Compact v-if="showDataSearchType">
        <span class="query-field-addon">数据类型</span>
        <Select
          v-model:value="dataSearchType"
          :options="dataSearchTypeOptions"
          placeholder="请选择数据类型"
        />
      </Space.Compact>
      <div class="query-filter-actions">
        <Space>
          <Button :loading="loading" type="primary" @click="handleSearch">
            查询
          </Button>
          <Button :disabled="loading" @click="handleReset">重置</Button>
          <Button
            v-if="showExport"
            :disabled="exportDisabled"
            :loading="exportLoading"
            @click="emit('export')"
          >
            导出 Excel
          </Button>
        </Space>
      </div>
    </div>
  </div>
</template>

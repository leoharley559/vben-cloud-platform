<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, reactive } from 'vue';

import { Button, message, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import { arrayToCsvParam } from '#/views/dataClose/shared/report-utils';

import { defaultKeepDateRange, disabledKeepDate } from '../utils';

defineOptions({ name: 'KeepQueryBar' });

const emit = defineEmits<{
  search: [query: Record<string, unknown>];
}>();

const { projectConfig } = useCloudPermission();
const { iosAppStoreOptions, packageOptions } = useReportOptions();

const filters = reactive({
  AdminGroupIds: [] as Array<number | string>,
  AdminIds: [] as Array<number | string>,
  AppUrl: [] as string[],
  ChannelIds: [] as Array<number | string>,
  PackageId: '' as number | string,
  dateRange: [...defaultKeepDateRange()] as [Dayjs, Dayjs],
});

const pickingDate = reactive({ value: null as Dayjs | null });

const packageSelectOptions = computed(() => [
  { label: '全部产品', value: '' },
  ...packageOptions.value,
]);

const adminGroupOptions = computed(() =>
  (
    (projectConfig.value?.AdminGroups || []) as Array<{
      GroupName?: string;
      Id?: number | string;
    }>
  ).map((item) => ({
    label: item.GroupName || String(item.Id),
    value: item.Id!,
  })),
);

function onCalendarChange(dates: [Dayjs, Dayjs] | [string, string] | null) {
  pickingDate.value = dates?.[0] ? dayjs(dates[0]) : null;
}

function onOpenChange(open: boolean) {
  if (!open) pickingDate.value = null;
}

function buildQuery() {
  const range = filters.dateRange;
  return {
    AdminGroupIds: arrayToCsvParam(filters.AdminGroupIds) || '',
    AdminIds: arrayToCsvParam(filters.AdminIds) || '',
    AppUrl: arrayToCsvParam(filters.AppUrl) || '',
    BeginTime: range?.[0]?.format('YYYY-MM-DD') || '',
    ChannelIds: arrayToCsvParam(filters.ChannelIds) || '',
    EndTime: range?.[1]?.format('YYYY-MM-DD') || '',
    PackageId: filters.PackageId || '',
  };
}

function handleSearch() {
  const range = filters.dateRange;
  if (!range?.[0] || !range?.[1]) {
    message.warning('请选择日期');
    return;
  }
  const days = range[1].startOf('day').diff(range[0].startOf('day'), 'day');
  if (days > 29) {
    message.warning('查询区间最长 30 天');
    return;
  }
  emit('search', buildQuery());
}

function handleReset() {
  filters.AdminGroupIds = [];
  filters.AdminIds = [];
  filters.AppUrl = [];
  filters.ChannelIds = [];
  filters.PackageId = '';
  filters.dateRange = [...defaultKeepDateRange()] as [Dayjs, Dayjs];
  emit('search', buildQuery());
}

defineExpose({ buildQuery, handleSearch });
</script>

<template>
  <ReportQueryCard actions-single title="查询条件">
    <Space.Compact>
      <span class="query-field-addon">代理模板</span>
      <Select
        v-model:value="filters.AdminGroupIds"
        :max-tag-count="1"
        :options="adminGroupOptions"
        allow-clear
        class="min-w-[180px]"
        mode="multiple"
        placeholder="请选择代理模板"
      />
    </Space.Compact>
    <Space.Compact>
      <span class="query-field-addon">账号</span>
      <AccountSelect v-model="filters.AdminIds" class="min-w-[200px]" />
    </Space.Compact>
    <Space.Compact>
      <span class="query-field-addon">渠道号</span>
      <ChannelSelect
        v-model="filters.ChannelIds"
        class="min-w-[200px]"
        placeholder="请输入渠道号"
      />
    </Space.Compact>
    <Space.Compact>
      <span class="query-field-addon">产品</span>
      <Select
        v-model:value="filters.PackageId"
        :options="packageSelectOptions"
        allow-clear
        class="w-44"
        show-search
        placeholder="请选择产品"
      />
    </Space.Compact>
    <Space.Compact>
      <span class="query-field-addon">上架包</span>
      <Select
        v-model:value="filters.AppUrl"
        :max-tag-count="1"
        :options="iosAppStoreOptions"
        allow-clear
        class="min-w-[160px]"
        mode="multiple"
        placeholder="请选择上架包"
      />
    </Space.Compact>
    <div class="query-filter-wide">
      <QueryDatetimeRangePicker
        v-model="filters.dateRange"
        precision="date"
        :disabled-date="
          (current) => disabledKeepDate(current, pickingDate.value)
        "
      />
    </div>
    <template #actions>
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
    </template>
    <template #extra>
      <div class="text-xs text-gray-500">默认近 7 天至今天，最长 30 天</div>
    </template>
  </ReportQueryCard>
</template>

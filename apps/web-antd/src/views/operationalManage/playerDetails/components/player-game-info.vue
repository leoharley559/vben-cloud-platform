<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerGameDetailItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, DatePicker, Input, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerGameDetailListApi } from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useGameConfig } from '#/composables/use-game-config';
import { getLast7CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatGoldReason } from '#/utils/game-config';

defineOptions({ name: 'PlayerGameInfoPanel' });

const props = defineProps<{ playerId: number | string }>();

const { ensureGameConfig, gameConfig } = useGameConfig();
const defaultRange = getLast7CalendarDaysRangeSeconds();
const sumAddGold = ref(0);

const filterLogId = ref('');
const filterReasons = ref<number[]>([]);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const reasonOptions = computed(() =>
  gameConfig.value.goldSource.map((item) => ({
    label: item.Name || String(item.Key),
    value: Number(item.Key),
  })),
);

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) return '-';
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function parseExInfo(value?: string | Record<string, unknown>) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return { Remark: value };
  }
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : '',
    DataSearchType: 2,
    EndTime: end ? end.endOf('day').unix() : '',
    LogId: filterLogId.value,
    PlayerId: String(props.playerId),
    Reason: filterReasons.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerGameDetailItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '日期',
    },
    { field: 'LogId', minWidth: 180, title: '订单编号' },
    { field: 'Username', minWidth: 100, title: '推广账号' },
    { field: 'PackageName', minWidth: 110, title: '所属产品' },
    { field: 'ChannelName', minWidth: 120, title: '渠道名称' },
    {
      field: 'Reason',
      formatter: ({ cellValue }) =>
        formatGoldReason(cellValue, gameConfig.value.goldSource),
      minWidth: 120,
      title: '账变类型',
    },
    {
      field: 'ExInfo',
      formatter: ({ row }) => String(parseExInfo(row.ExInfo).OrderId || '-'),
      minWidth: 180,
      title: '账变关联单号',
    },
    {
      field: 'AddGold',
      minWidth: 110,
      slots: { default: 'addGold' },
      title: '账变金额',
    },
    {
      field: 'OldGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '账变前金额',
    },
    {
      field: 'NewGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '账变后金额',
    },
    {
      field: 'Remark',
      formatter: ({ row }) =>
        String(parseExInfo(row.ExInfo).Remark || row.Remark || '-'),
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '备注',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerGameDetailListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        sumAddGold.value = Number(result?.MoreItems?.SumAddGold || 0);
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

const summaryItems = computed(() => [
  {
    label: '账变总额',
    value: formatAmountFromCent(sumAddGold.value),
  },
]);

watch(
  () => props.playerId,
  () => props.playerId && gridApi.reload(),
);
onMounted(async () => {
  await ensureGameConfig();
  if (props.playerId) gridApi.reload();
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterLogId"
        allow-clear
        placeholder="订单编号"
        style="width: 220px"
      >
        <template #addonBefore>订单编号</template>
      </Input>
      <Select
        v-model:value="filterReasons"
        allow-clear
        mode="multiple"
        :max-tag-count="1"
        :options="reasonOptions"
        placeholder="账变类型"
        style="width: 220px"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Space>
        <Button :loading="loading" type="primary" @click="gridApi.reload()"
          >查询</Button
        >
        <Button
          @click="
            filterLogId = '';
            filterReasons = [];
            filterDateRange = [
              dayjs.unix(defaultRange.BeginTime),
              dayjs.unix(defaultRange.EndTime),
            ];
            gridApi.reload();
          "
          >重置</Button
        >
      </Space>
    </div>
    <SummaryCards :items="summaryItems" />
    <Grid>
      <template #addGold="{ row }">
        <span
          :class="Number(row.AddGold) < 0 ? 'text-red-500' : 'text-green-600'"
        >
          {{ (Number(row.AddGold || 0) / 100).toFixed(2) }}
        </span>
      </template>
    </Grid>
  </div>
</template>

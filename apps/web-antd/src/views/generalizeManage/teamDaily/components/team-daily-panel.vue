<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TeamDailyHistoryItem, TeamDailySummary } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { DatePicker, Input, Result, Statistic } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchTeamDailyListApi } from '#/api/promotion/team-daily';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatTeamQueryMoney } from '#/utils/promotion';

const props = defineProps<{
  teamType: 1 | 2;
}>();

const { checkPermission } = useCloudPermission();

const canViewToday = computed(() =>
  props.teamType === 1 ? checkPermission(10872) : checkPermission(10874),
);
const canViewHistory = computed(() =>
  props.teamType === 1 ? checkPermission(10873) : checkPermission(10875),
);

const defaultBegin = dayjs().subtract(31, 'day').startOf('day');
const defaultEnd = dayjs().subtract(1, 'day').endOf('day');

const filterAdminId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const todayData = ref<TeamDailySummary>({});
const historySummary = ref<TeamDailySummary>({});

const isProfitMode = computed(() => props.teamType === 2);

function getSelfIncome(row: TeamDailyHistoryItem) {
  return isProfitMode.value
    ? row.SumSelfProfitIncomeMoney
    : row.SumSelfIncomeMoney;
}

function getNextIncome(row: TeamDailyHistoryItem) {
  return isProfitMode.value
    ? row.SumNextProfitIncomeMoney
    : row.SumNextIncomeMoney;
}

function getTodaySelfIncome() {
  return isProfitMode.value
    ? todayData.value.SelfProfitIncomeMoney
    : todayData.value.SelfIncomeMoney;
}

function getTodayNextIncome() {
  return isProfitMode.value
    ? todayData.value.NextProfitIncomeMoney
    : todayData.value.NextIncomeMoney;
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminId: filterAdminId.value,
    BeginTime: begin ? begin.startOf('day').unix() : defaultBegin.unix(),
    EndTime: end ? end.endOf('day').unix() : defaultEnd.unix(),
    Page: 1,
    PageSize: 200,
    TeamType: props.teamType,
  };
}

async function loadData() {
  const result = await fetchTeamDailyListApi(getQueryParams());
  todayData.value = result.TodayItems || {};
  historySummary.value = result.BannerItems || {};
  return result.HistoryItems || [];
}

const gridOptions: VxeTableGridOptions<TeamDailyHistoryItem> = {
  columns: [
    { field: 'ReportDay', minWidth: 120, title: '日期' },
    { field: 'SumSelfReg', minWidth: 90, title: '自营注册' },
    {
      field: 'SumSelfPayMergerMoney',
      formatter: ({ cellValue }) => formatTeamQueryMoney(cellValue),
      minWidth: 110,
      title: '自营充值',
    },
    {
      field: 'SumSelfBetGameMoney',
      formatter: ({ cellValue }) => formatTeamQueryMoney(cellValue),
      minWidth: 110,
      title: '自营流水',
    },
    {
      field: 'SumSelfGameTax',
      formatter: ({ cellValue }) => formatTeamQueryMoney(cellValue),
      minWidth: 100,
      title: '自营税收',
    },
    {
      field: 'selfIncome',
      formatter: ({ row }) => formatTeamQueryMoney(getSelfIncome(row)),
      minWidth: 110,
      title: isProfitMode.value ? '自营利润收入' : '自营收入',
    },
    { field: 'SumNextReg', minWidth: 90, title: '下级注册' },
    {
      field: 'SumNextPayMergerMoney',
      formatter: ({ cellValue }) => formatTeamQueryMoney(cellValue),
      minWidth: 110,
      title: '下级充值',
    },
    {
      field: 'SumNextBetGameMoney',
      formatter: ({ cellValue }) => formatTeamQueryMoney(cellValue),
      minWidth: 110,
      title: '下级流水',
    },
    {
      field: 'SumNextGameTax',
      formatter: ({ cellValue }) => formatTeamQueryMoney(cellValue),
      minWidth: 100,
      title: '下级税收',
    },
    {
      field: 'nextIncome',
      formatter: ({ row }) => formatTeamQueryMoney(getNextIncome(row)),
      minWidth: 120,
      title: isProfitMode.value ? '下级利润收入' : '下级贡献收入',
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await loadData();
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

onMounted(() => {
  if (canViewHistory.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewToday || canViewHistory">
    <div v-if="canViewToday" class="mb-4">
      <div class="mb-2 text-base font-medium">今日数据</div>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Statistic title="自营注册" :value="todayData.SelfReg || 0" />
        <Statistic
          title="自营充值"
          :value="formatTeamQueryMoney(todayData.SelfPayMergerMoney)"
        />
        <Statistic
          title="自营流水"
          :value="formatTeamQueryMoney(todayData.SelfBetGameMoney)"
        />
        <Statistic
          title="自营税收"
          :value="formatTeamQueryMoney(todayData.SelfGameTax)"
        />
        <Statistic
          :title="isProfitMode ? '自营利润收入' : '自营收入'"
          :value="formatTeamQueryMoney(getTodaySelfIncome())"
        />
        <Statistic title="下级注册" :value="todayData.NextReg || 0" />
        <Statistic
          title="下级充值"
          :value="formatTeamQueryMoney(todayData.NextPayMergerMoney)"
        />
        <Statistic
          title="下级流水"
          :value="formatTeamQueryMoney(todayData.NextBetGameMoney)"
        />
        <Statistic
          title="下级税收"
          :value="formatTeamQueryMoney(todayData.NextGameTax)"
        />
        <Statistic
          :title="isProfitMode ? '下级利润收入' : '下级收入'"
          :value="formatTeamQueryMoney(getTodayNextIncome())"
        />
      </div>
    </div>

    <div v-if="canViewHistory">
      <div class="mb-3 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterAdminId"
          allow-clear
          placeholder="推广账号 ID"
          style="width: 200px"
        />
        <DatePicker.RangePicker v-model:value="filterDateRange" />
        <a class="text-primary" @click.prevent="gridApi.reload()">查询</a>
      </div>

      <div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
        <Statistic
          title="历史自营注册"
          :value="historySummary.SumSelfReg || 0"
        />
        <Statistic
          title="历史下级注册"
          :value="historySummary.SumNextReg || 0"
        />
        <Statistic
          title="历史自营充值"
          :value="formatTeamQueryMoney(historySummary.SumSelfPayMergerMoney)"
        />
        <Statistic
          title="历史下级充值"
          :value="formatTeamQueryMoney(historySummary.SumNextPayMergerMoney)"
        />
        <Statistic
          title="历史自营流水"
          :value="formatTeamQueryMoney(historySummary.SumSelfBetGameMoney)"
        />
      </div>

      <Grid />
    </div>
  </div>
  <Result v-else status="403" sub-title="无代理日报查看权限" title="403" />
</template>

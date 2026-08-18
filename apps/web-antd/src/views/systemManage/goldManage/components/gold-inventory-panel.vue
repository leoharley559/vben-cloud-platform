<script lang="ts" setup>
import type { Dayjs } from 'dayjs';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import { Button, Tooltip } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchGoldInventoryApi,
  fetchGoldInventoryDetailApi,
} from '#/api/systemManage/extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import { toUnixRange } from '#/views/dataClose/shared/report-utils';

defineOptions({ name: 'GoldInventoryPanel' });

interface InventoryRow {
  HistoryScores?: number;
  InParentAgentScores?: number;
  InPlatformScores?: number;
  OutSellAgent?: number;
  OutSellCoinDealer?: number;
  ReportDay?: string;
  SelfPayMoney?: number;
  SelfWithdrawMoney?: number;
  [key: string]: unknown;
}

interface TotalSum {
  SumInParentAgentScores: number;
  SumInPlatformScores: number;
  SumNotSelfWithdrawMoney: number;
  SumOutSellAgent: number;
  SumOutSellCoinDealer: number;
  SumSelfPayMoney: number;
  SumSelfWithdrawMoney: number;
}

const emptyTotalSum = (): TotalSum => ({
  SumInParentAgentScores: 0,
  SumInPlatformScores: 0,
  SumNotSelfWithdrawMoney: 0,
  SumOutSellAgent: 0,
  SumOutSellCoinDealer: 0,
  SumSelfPayMoney: 0,
  SumSelfWithdrawMoney: 0,
});

const { checkPermission } = useCloudPermission();

const bannerScoreChange = ref({
  AvailScores: 0,
  IncomeScores: 0,
  OutAgentScores: 0,
  OutCoinDealerScores: 0,
});
const bannerScoreCount = ref({
  SelfPayMoney: 0,
  SelfWithdrawMoney: 0,
});

const dateRange = ref<[Dayjs, Dayjs]>([
  dayjs().startOf('month'),
  dayjs().endOf('month'),
]);
const totalData = ref<TotalSum>(emptyTotalSum());

const canBanner = computed(() => checkPermission(11432));
const canDetail = computed(() => checkPermission(11433));

const bannerPlayerOut = computed(
  () =>
    (Number(bannerScoreCount.value.SelfPayMoney || 0) -
      Number(bannerScoreCount.value.SelfWithdrawMoney || 0)) /
    100,
);

const summaryIncoming = computed(
  () =>
    Number(totalData.value.SumInPlatformScores || 0) +
    Number(totalData.value.SumInParentAgentScores || 0),
);

const summaryPlayerOut = computed(
  () =>
    Number(totalData.value.SumSelfPayMoney || 0) / 100 -
    Number(totalData.value.SumSelfWithdrawMoney || 0) / 100 -
    Number(totalData.value.SumNotSelfWithdrawMoney || 0) / 100,
);

const summaryShipments = computed(
  () =>
    Number(totalData.value.SumOutSellAgent || 0) +
    Number(totalData.value.SumOutSellCoinDealer || 0) +
    summaryPlayerOut.value,
);

const bannerSummaryItems = computed(() => [
  { label: '剩余库存', value: bannerScoreChange.value.AvailScores },
  {
    label: '今日进货(上级包网)',
    value: bannerScoreChange.value.IncomeScores,
  },
  { label: '今日出货(玩家)', value: bannerPlayerOut.value.toFixed(2) },
  {
    label: '今日出货(币商)',
    value: bannerScoreChange.value.OutCoinDealerScores,
  },
  {
    label: '今日出货(子包网)',
    value: bannerScoreChange.value.OutAgentScores,
  },
]);

const detailSummaryItems = computed(() => [
  { label: '进货合计', value: summaryIncoming.value },
  { label: '出货合计', value: summaryShipments.value },
  { label: '出货玩家', value: summaryPlayerOut.value.toFixed(2) },
  {
    label: '出货币商',
    value: totalData.value.SumOutSellCoinDealer,
  },
  { label: '出货子包网', value: totalData.value.SumOutSellAgent },
]);

function num(row: InventoryRow, key: string) {
  return Number(row[key] || 0);
}

function rowIncoming(row: InventoryRow) {
  return num(row, 'InPlatformScores') + num(row, 'InParentAgentScores');
}

function rowPlayerOut(row: InventoryRow) {
  return num(row, 'SelfPayMoney') - num(row, 'SelfWithdrawMoney');
}

function rowOutGoods(row: InventoryRow) {
  return (
    rowPlayerOut(row) / 100 +
    num(row, 'OutSellCoinDealer') +
    num(row, 'OutSellAgent')
  );
}

function resetBanner() {
  bannerScoreChange.value = {
    AvailScores: 0,
    IncomeScores: 0,
    OutAgentScores: 0,
    OutCoinDealerScores: 0,
  };
  bannerScoreCount.value = {
    SelfPayMoney: 0,
    SelfWithdrawMoney: 0,
  };
}

async function loadBanner() {
  if (!canBanner.value) return;
  try {
    const result = await fetchGoldInventoryApi({
      BeginTime: '',
      EndTime: '',
      Page: 1,
      PageSize: 20,
      Sort: '',
    });
    const more = (result.MoreItems || {}) as Record<string, unknown>;
    const change = (more.BannerScoreChange || {}) as Record<string, number>;
    const count = (more.BannerScoreCount || {}) as Record<string, number>;
    bannerScoreChange.value = {
      AvailScores: Number(change.AvailScores || 0),
      IncomeScores: Number(change.IncomeScores || 0),
      OutAgentScores: Number(change.OutAgentScores || 0),
      OutCoinDealerScores: Number(change.OutCoinDealerScores || 0),
    };
    bannerScoreCount.value = {
      SelfPayMoney: Number(count.SelfPayMoney || 0),
      SelfWithdrawMoney: Number(count.SelfWithdrawMoney || 0),
    };
  } catch {
    resetBanner();
  }
}

const gridOptions: VxeTableGridOptions<InventoryRow> = {
  columns: [
    {
      align: 'center',
      field: 'ReportDay',
      minWidth: 120,
      title: '日期',
    },
    {
      align: 'center',
      field: 'inGoods',
      formatter: ({ row }) => String(rowIncoming(row)),
      minWidth: 120,
      title: '进货',
    },
    {
      align: 'center',
      field: 'outGoods',
      formatter: ({ row }) => rowOutGoods(row).toFixed(2),
      minWidth: 140,
      slots: { header: 'outGoodsHeader' },
      title: '出货',
    },
    {
      align: 'center',
      field: 'userExpend',
      formatter: ({ row }) => formatAmountFromCent(rowPlayerOut(row)),
      minWidth: 140,
      slots: { header: 'userExpendHeader' },
      title: '出货(玩家)',
    },
    {
      align: 'center',
      field: 'OutSellCoinDealer',
      minWidth: 120,
      title: '出货(币商)',
    },
    {
      align: 'center',
      field: 'OutSellAgent',
      minWidth: 120,
      title: '出货(子包网)',
    },
    {
      align: 'center',
      field: 'HistoryScores',
      minWidth: 120,
      title: '当日库存',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }) => {
        if (!canDetail.value) {
          totalData.value = emptyTotalSum();
          return { items: [], total: 0 };
        }
        // 对齐旧站：明细默认当月；清空日期时回退当月，避免无参窗与当月窗数据不一致
        if (!dateRange.value?.[0] || !dateRange.value?.[1]) {
          dateRange.value = [dayjs().startOf('month'), dayjs().endOf('month')];
        }
        const { BeginTime, EndTime } = toUnixRange(dateRange.value);
        try {
          const result = await fetchGoldInventoryDetailApi({
            BeginTime,
            EndTime,
            Keyword: '',
            Page: page.currentPage,
            PageSize: page.pageSize,
            Sort:
              sort?.field && sort?.order
                ? `${sort.order === 'desc' ? '-' : ''}${sort.field}`
                : '',
          });
          const more = (result.MoreItems || {}) as Record<string, unknown>;
          const sum = (more.TotalSum || {}) as Partial<TotalSum>;
          totalData.value = { ...emptyTotalSum(), ...sum };
          const items = (result.Items || []) as unknown as InventoryRow[];
          return {
            items,
            total: Number(result.Pagination?.MaxCount || items.length),
          };
        } catch {
          totalData.value = emptyTotalSum();
          return { items: [], total: 0 };
        }
      },
    },
    autoLoad: false,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  void gridApi.reload();
}

function handleReset() {
  dateRange.value = [dayjs().startOf('month'), dayjs().endOf('month')];
  void gridApi.reload();
}

onMounted(() => {
  void loadBanner();
  if (canDetail.value) {
    void gridApi.reload();
  }
});
</script>

<template>
  <div>
    <div class="mb-4">
      <div class="mb-3 text-sm font-medium text-gray-700">
        今日金币库存变化
      </div>
      <SummaryCards :items="bannerSummaryItems" />
    </div>

    <div v-if="canDetail">
      <ReportQueryCard title="库存明细">
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" />
        </div>
        <template #actions>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </template>
        <template #extra>
          <SummaryCards :items="detailSummaryItems" />
        </template>
      </ReportQueryCard>

      <Grid>
        <template #outGoodsHeader>
          <Tooltip title="出货量=出货（玩家）+出货（币商）+出货（子包网）">
            <span class="cursor-help">出货</span>
          </Tooltip>
        </template>
        <template #userExpendHeader>
          <Tooltip title="出货（玩家）=玩家充值（不含币商充值）-玩家兑换">
            <span class="cursor-help">出货(玩家)</span>
          </Tooltip>
        </template>
      </Grid>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Modal, Table } from 'ant-design-vue';

import { fetchDayStatementSonDetailApi } from '#/api/dataClose/day-statement';
import { useReportOptions } from '#/composables/use-report-options';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import {
  asNumber,
  dayDetailUnix,
  displayAmount,
  displayCent,
  fromCent,
  type StatementRow,
  venueName,
} from '#/views/dataClose/shared/statement-helpers';

defineOptions({ name: 'DaySonDetailModal' });

const props = defineProps<{
  inquireId: number | string;
  open: boolean;
  row: null | StatementRow;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { ensureGameConfig, platformGameTypeMap } = useReportOptions();

const loading = ref(false);
const detailTable = ref<StatementRow[]>([]);
const detailTotal = ref({
  NegativeProfit: 0,
  NegativeProfitCount: 0,
  PositiveProfit: 0,
  PositiveProfitCount: 0,
});

const summaryItems = computed(() => [
  { title: '正盈亏数量', value: detailTotal.value.PositiveProfitCount },
  {
    title: '正盈亏总计',
    value: displayCent(detailTotal.value.PositiveProfit),
  },
  { title: '负盈亏数量', value: detailTotal.value.NegativeProfitCount },
  {
    title: '负盈亏总计',
    value: displayCent(detailTotal.value.NegativeProfit),
  },
]);

const columns = [
  { align: 'center' as const, dataIndex: 'ReportDay', key: 'ReportDay', title: '时间' },
  { align: 'center' as const, key: 'AgentName', title: '子代理名称' },
  { align: 'center' as const, dataIndex: 'PlatforName', key: 'PlatforName', title: '产品名称' },
  { align: 'center' as const, key: 'SelfBetGold', title: '投注金币' },
  { align: 'center' as const, key: 'SelfWinGold', title: '派送金币' },
  { align: 'center' as const, key: 'SelfOtherGold', title: '其它金币消耗' },
  { align: 'center' as const, key: 'ProfitLoss', title: '盈亏' },
  { align: 'center' as const, key: 'PositiveProfit', title: '正盈亏' },
  { align: 'center' as const, key: 'NegativeProfit', title: '负盈亏' },
];

function resetDetail() {
  detailTable.value = [];
  detailTotal.value = {
    NegativeProfit: 0,
    NegativeProfitCount: 0,
    PositiveProfit: 0,
    PositiveProfitCount: 0,
  };
}

async function loadDetail() {
  if (!props.row) return;
  loading.value = true;
  resetDetail();
  try {
    await ensureGameConfig();
    const time = dayDetailUnix(props.row.ReportDay);
    const result = await fetchDayStatementSonDetailApi({
      AdminId: props.row.AgentId,
      BeginTime: time.BeginTime,
      EndTime: time.EndTime,
      PlatformGameType: props.row.PlatformGameType,
    });
    const items = Array.isArray(result.Items) ? result.Items : [];
    let positiveCount = 0;
    let negativeCount = 0;
    detailTable.value = items.map((item, index) => {
      const SelfBetGold = fromCent(item.SelfBetGold);
      const SelfWinGold = fromCent(item.SelfWinGold);
      const SelfOtherGold = fromCent(item.SelfOtherGold);
      const PositiveProfit = fromCent(item.PositiveProfit);
      const NegativeProfit = fromCent(item.NegativeProfit);
      if (PositiveProfit > 0) positiveCount += 1;
      if (NegativeProfit > 0) negativeCount += 1;
      return {
        ...item,
        PlatforName: venueName(
          platformGameTypeMap.value,
          item.PlatformGameType,
        ),
        ProfitLoss: Number((SelfBetGold - SelfWinGold).toFixed(2)),
        NegativeProfit,
        PositiveProfit,
        SelfBetGold,
        SelfOtherGold,
        SelfWinGold,
        _rowKey: `${item.AgentId}-${item.PlatformGameType}-${index}`,
      };
    });
    const more = result.MoreItems as StatementRow | undefined;
    const total =
      more?.TotalSum && typeof more.TotalSum === 'object'
        ? (more.TotalSum as StatementRow)
        : {};
    detailTotal.value = {
      NegativeProfit: asNumber(total.NegativeProfit),
      NegativeProfitCount: negativeCount,
      PositiveProfit: asNumber(total.PositiveProfit),
      PositiveProfitCount: positiveCount,
    };
  } finally {
    loading.value = false;
  }
}

function close() {
  emit('update:open', false);
  resetDetail();
}

watch(
  () => [props.open, props.row] as const,
  ([open]) => {
    if (open && props.row) {
      void loadDetail();
    }
  },
);
</script>

<template>
  <Modal
    :open="open"
    title="代理详情"
    width="960px"
    :footer="null"
    destroy-on-close
    @cancel="close"
  >
    <div>
      <ReportSummaryCards :items="summaryItems" />
      <Table
        :columns="columns"
        :data-source="detailTable"
        :loading="loading"
        :pagination="false"
        :scroll="{ y: 420 }"
        bordered
        row-key="_rowKey"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'AgentName'">
            <span
              v-if="String(record.AgentId) === String(inquireId)"
              class="mr-1 text-red-500"
            >
              自营
            </span>
            {{ record.AgentName }}
          </template>
          <template v-else-if="column.key === 'SelfBetGold'">
            {{ displayAmount(record.SelfBetGold) }}
          </template>
          <template v-else-if="column.key === 'SelfWinGold'">
            {{ displayAmount(record.SelfWinGold) }}
          </template>
          <template v-else-if="column.key === 'SelfOtherGold'">
            {{ displayAmount(record.SelfOtherGold) }}
          </template>
          <template v-else-if="column.key === 'ProfitLoss'">
            {{ displayAmount(record.ProfitLoss) }}
          </template>
          <template v-else-if="column.key === 'PositiveProfit'">
            {{ displayAmount(record.PositiveProfit) }}
          </template>
          <template v-else-if="column.key === 'NegativeProfit'">
            {{ displayAmount(record.NegativeProfit) }}
          </template>
        </template>
      </Table>
    </div>
  </Modal>
</template>

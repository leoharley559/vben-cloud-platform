<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  message,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import { fetchMonthStatementListApi } from '#/api/dataClose/month-statement';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam, toMonthRange } from '#/views/dataClose/shared/report-utils';
import {
  asNumber,
  defaultMonthRange,
  displayAmount,
  displayCent,
  ensureMonthSpan,
  fromCent,
  joinParam,
  profitClass,
  type StatementRow,
  venueName,
} from '#/views/dataClose/shared/statement-helpers';

defineOptions({ name: 'MonthStatementSelfPanel' });

const { checkPermission } = useCloudPermission();
const {
  ensureGameConfig,
  gameConfig,
  iosAppStoreOptions,
  packageOptions,
  platformGameTypeOptions,
} = useReportOptions();

const loading = ref(false);
const tableData = ref<StatementRow[]>([]);
const totalSum = ref({
  SumProfitLose: 0,
  SumSelfBetGold: 0,
  SumSelfValidWater: 0,
  SumSelfWinGold: 0,
});
const adminIds = ref<Array<number | string>>([]);
const channelIds = ref<Array<number | string>>([]);
const appUrls = ref<string[]>([]);
const packageId = ref<number | string | undefined>();
const venueTypes = ref<Array<number | string>>([]);
const monthRange = ref<[Dayjs, Dayjs]>(defaultMonthRange());

/** 列表：created 用 10510；模板误用日报 10499，新项目纠正为 10510 */
const canList = computed(() => checkPermission(10_510));
/** 导出：按月报权限序号用 10511（旧模板误用日报 10500） */
const canExport = computed(() => checkPermission(10_511));

const summaryItems = computed(() => [
  { title: '投注总计', value: displayCent(totalSum.value.SumSelfBetGold) },
  { title: '派送总计', value: displayCent(totalSum.value.SumSelfWinGold) },
  {
    title: '盈亏总计',
    value: displayAmount(totalSum.value.SumProfitLose),
  },
]);

const columns = [
  { align: 'center' as const, dataIndex: 'ReportMonth', key: 'ReportMonth', title: '时间' },
  { align: 'center' as const, dataIndex: 'AgentName', key: 'AgentName', title: '场馆名称' },
  {
    align: 'center' as const,
    dataIndex: 'SumSelfCountNum',
    key: 'SumSelfCountNum',
    title: '投注人数',
  },
  {
    align: 'center' as const,
    dataIndex: 'SumSelfCountNum2',
    key: 'SumSelfCountNum2',
    title: '投注次数',
  },
  { align: 'center' as const, key: 'SelfBetGold', title: '投注金币' },
  { align: 'center' as const, key: 'SelfWinGold', title: '派送金币' },
  { align: 'center' as const, key: 'SumSelfValidWater', title: '有效投注' },
  { align: 'center' as const, key: 'ProfitLose', title: '盈亏' },
  { align: 'center' as const, key: 'Percent', title: '盈余比例' },
];

function buildQuery() {
  const { BeginTime, EndTime } = toMonthRange(monthRange.value);
  return {
    AdminId: joinParam(adminIds.value),
    AppUrl: arrayToCsvParam(appUrls.value) || '',
    BeginTime,
    ChannelId: joinParam(channelIds.value),
    EndTime,
    PackageId: packageId.value ?? '',
    PageType: 'self',
    PlatformGameType: joinParam(venueTypes.value),
  };
}

async function loadList() {
  if (!canList.value) return;
  if (!ensureMonthSpan(monthRange.value, 180)) return;
  loading.value = true;
  try {
    await ensureGameConfig();
    const result = await fetchMonthStatementListApi(buildQuery());
    const items = Array.isArray(result.Items) ? result.Items : [];
    const nextTotal = {
      SumProfitLose: 0,
      SumSelfBetGold: 0,
      SumSelfValidWater: 0,
      SumSelfWinGold: 0,
    };
    tableData.value = items.map((row, index) => {
      const SelfBetGold = fromCent(row.SumSelfBetGold);
      const SelfWinGold = fromCent(row.SumSelfWinGold);
      const SelfOtherGold = fromCent(row.SumSelfOtherGold);
      const ProfitLose = Number(
        (SelfBetGold - SelfWinGold + SelfOtherGold).toFixed(2),
      );
      const Percent =
        ProfitLose === 0 || !SelfBetGold
          ? '0%'
          : `${((ProfitLose / SelfBetGold) * 100).toFixed(2)}%`;
      nextTotal.SumProfitLose += ProfitLose;
      nextTotal.SumSelfBetGold += asNumber(row.SumSelfBetGold);
      nextTotal.SumSelfWinGold += asNumber(row.SumSelfWinGold);
      nextTotal.SumSelfValidWater += asNumber(row.SumSelfValidWater);
      return {
        ...row,
        AgentName: venueName(gameConfig.value, row.PlatformGameType),
        Percent,
        ProfitLose,
        SelfBetGold,
        SelfOtherGold,
        SelfWinGold,
        _rowKey: `${row.ReportMonth}-${row.PlatformGameType}-${index}`,
      };
    });
    totalSum.value = nextTotal;
  } catch {
    tableData.value = [];
    totalSum.value = {
      SumProfitLose: 0,
      SumSelfBetGold: 0,
      SumSelfValidWater: 0,
      SumSelfWinGold: 0,
    };
  } finally {
    loading.value = false;
  }
}

function reset() {
  adminIds.value = [];
  channelIds.value = [];
  appUrls.value = [];
  packageId.value = undefined;
  venueTypes.value = [];
  monthRange.value = defaultMonthRange();
  void loadList();
}

async function handleExport() {
  if (tableData.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  const total = totalSum.value;
  const rows: StatementRow[] = [
    ...tableData.value,
    {
      AgentName: '-',
      Percent: '-',
      ProfitLose: displayAmount(total.SumProfitLose),
      ReportMonth: '总计:',
      SelfBetGold: displayCent(total.SumSelfBetGold),
      SelfWinGold: displayCent(total.SumSelfWinGold),
      SumSelfCountNum: '-',
      SumSelfCountNum2: '-',
      SumSelfValidWater: displayCent(total.SumSelfValidWater),
      _isTotal: true,
    },
  ];
  await exportReportXlsx(
    rows,
    [
      '时间',
      '场馆名称',
      '投注人数',
      '投注次数',
      '投注金币',
      '派送金币',
      '有效投注',
      '盈亏',
      '盈余比例',
    ],
    '自营报表',
    (row) => [
      row.ReportMonth,
      row.AgentName,
      row.SumSelfCountNum,
      row.SumSelfCountNum2,
      row._isTotal ? row.SelfBetGold : displayAmount(row.SelfBetGold),
      row._isTotal ? row.SelfWinGold : displayAmount(row.SelfWinGold),
      row._isTotal
        ? row.SumSelfValidWater
        : displayCent(row.SumSelfValidWater),
      row._isTotal ? row.ProfitLose : displayAmount(row.ProfitLose),
      row.Percent,
    ],
  );
  void fetchMonthStatementListApi({ ...buildQuery(), IsExp: true }).catch(
    () => undefined,
  );
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div>
    <ReportQueryCard>
      <Space.Compact>
        <span class="query-field-addon">账号</span>
        <AccountSelect v-model="adminIds" class="w-56" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model="channelIds" class="w-56" placeholder="请输入渠道号" />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">产品</span>
        <Select
          v-model:value="packageId"
          allow-clear
          class="w-44"
          :options="packageOptions"
          placeholder="请选择产品"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">上架包</span>
        <Select
          v-model:value="appUrls"
          allow-clear
          class="w-48"
          mode="multiple"
          :options="iosAppStoreOptions"
          :max-tag-count="1"
          placeholder="请选择上架包"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">场馆</span>
        <Select
          v-model:value="venueTypes"
          allow-clear
          class="w-48"
          mode="multiple"
          :options="platformGameTypeOptions"
          :max-tag-count="1"
          placeholder="请选择场馆"
        />
      </Space.Compact>
      <div class="query-filter-wide">
        <Space.Compact>
          <span class="query-field-addon">时间范围</span>
          <DatePicker.RangePicker v-model:value="monthRange" picker="month" />
        </Space.Compact>
      </div>
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadList">查询</Button>
        <Button :disabled="loading" @click="reset">重置</Button>
        <Button v-if="canExport" :disabled="loading" @click="handleExport">
          导出 Excel
        </Button>
      </template>
      <template #extra>
        <div class="text-xs text-muted-foreground">
          默认近三月（整月），最长约 180 天
        </div>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

    <Table
      v-if="canList"
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="_rowKey"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'SelfBetGold'">
          {{ displayAmount(record.SelfBetGold) }}
        </template>
        <template v-else-if="column.key === 'SelfWinGold'">
          {{ displayAmount(record.SelfWinGold) }}
        </template>
        <template v-else-if="column.key === 'SumSelfValidWater'">
          {{ displayCent(record.SumSelfValidWater) }}
        </template>
        <template v-else-if="column.key === 'ProfitLose'">
          <span :class="profitClass(record.ProfitLose)">
            {{ displayAmount(record.ProfitLose) }}
          </span>
        </template>
        <template v-else-if="column.key === 'Percent'">
          {{ record.Percent }}
        </template>
      </template>
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell :index="0">总计:</Table.Summary.Cell>
            <Table.Summary.Cell :index="1">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="2">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="3">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ displayCent(totalSum.SumSelfBetGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              {{ displayCent(totalSum.SumSelfWinGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{ displayCent(totalSum.SumSelfValidWater) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              <span :class="profitClass(totalSum.SumProfitLose)">
                {{ displayAmount(totalSum.SumProfitLose) }}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="8">-</Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>
    <div v-else class="py-8 text-center text-muted-foreground">无列表权限</div>
  </div>
</template>

<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  message,
  Popover,
  Select,
  Table,
  Tooltip,
} from 'ant-design-vue';

import { fetchMonthStatementTotalListApi } from '#/api/dataClose/month-statement';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam, toMonthRange } from '#/views/dataClose/shared/report-utils';
import {
  defaultMonthRange,
  displayAmount,
  displayCent,
  ensureMonthSpan,
  footerProfitFromTotal,
  formatCrossLabel,
  joinParam,
  mapMonthMoneyRow,
  parseServiceRate,
  profitClass,
  resolveTotalSum,
  type StatementRow,
} from '#/views/dataClose/shared/statement-helpers';

defineOptions({ name: 'MonthStatementTotalPanel' });

const { checkPermission } = useCloudPermission();
const {
  ensureGameConfig,
  iosAppStoreOptions,
  packageOptions,
  platformGameTypeMap,
  platformGameTypeOptions,
} = useReportOptions();

const loading = ref(false);
const tableData = ref<StatementRow[]>([]);
const totalSum = ref<StatementRow>({});
const adminIds = ref<Array<number | string>>([]);
const channelIds = ref<Array<number | string>>([]);
const appUrls = ref<string[]>([]);
const packageId = ref<number | string | undefined>();
const venueTypes = ref<Array<number | string>>([]);
const monthRange = ref<[Dayjs, Dayjs]>(defaultMonthRange());

const canList = computed(() => checkPermission(10_508));
const canExport = computed(() => checkPermission(10_509));

const summaryItems = computed(() => [
  { title: '投注总计', value: displayCent(totalSum.value.SumSelfBetGold) },
  { title: '派送总计', value: displayCent(totalSum.value.SumSelfWinGold) },
  { title: '正盈利总计', value: displayCent(totalSum.value.SumPositive) },
  { title: '负盈利总计', value: displayCent(totalSum.value.SumNegative) },
  {
    title: '抽成总计',
    value: displayCent(totalSum.value.SumMustGetTaxMoney),
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
  { align: 'center' as const, key: 'SumSelfBetGold', title: '投注金币' },
  { align: 'center' as const, key: 'SumSelfWinGold', title: '派送金币' },
  { align: 'center' as const, key: 'ProfitLose', title: '盈亏' },
  { align: 'center' as const, key: 'SumPositive', title: '正盈利' },
  { align: 'center' as const, key: 'SumNegative', title: '负盈利' },
  { align: 'center' as const, key: 'ServiceRateDynamic', title: '抽成比例' },
  { align: 'center' as const, key: 'MustGetTaxMoney', title: '应抽成金额' },
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
    PlatformGameType: joinParam(venueTypes.value),
  };
}

async function loadList() {
  if (!canList.value) return;
  if (!ensureMonthSpan(monthRange.value, 180)) return;
  loading.value = true;
  try {
    await ensureGameConfig();
    const result = await fetchMonthStatementTotalListApi(buildQuery());
    const items = Array.isArray(result.Items) ? result.Items : [];
    tableData.value = items.map((row, index) => ({
      ...mapMonthMoneyRow(row, platformGameTypeMap.value),
      _rowKey: `${row.ReportMonth}-${row.PlatformGameType}-${index}`,
    }));
    totalSum.value = resolveTotalSum(result.MoreItems);
  } catch {
    tableData.value = [];
    totalSum.value = {};
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
      MustGetTaxMoney: displayCent(total.SumMustGetTaxMoney),
      ProfitLose: displayCent(footerProfitFromTotal(total)),
      ReportMonth: '总计:',
      ServiceRateDynamic: '-',
      SumNegative: displayCent(total.SumNegative),
      SumPositive: displayCent(total.SumPositive),
      SumSelfBetGold: displayCent(total.SumSelfBetGold),
      SumSelfCountNum: total.SumSelfCountNum ?? '-',
      SumSelfWinGold: displayCent(total.SumSelfWinGold),
      _isTotal: true,
    },
  ];
  await exportReportXlsx(
    rows,
    [
      '时间',
      '场馆名称',
      '投注人数',
      '投注金币',
      '派送金币',
      '盈亏',
      '正盈利',
      '负盈利',
      '抽成比例',
      '应抽成金额',
    ],
    '汇总报表',
    (row) => [
      row.ReportMonth,
      row.AgentName,
      row.SumSelfCountNum,
      row._isTotal ? row.SumSelfBetGold : displayAmount(row.SumSelfBetGold),
      row._isTotal ? row.SumSelfWinGold : displayAmount(row.SumSelfWinGold),
      row._isTotal ? row.ProfitLose : displayAmount(row.ProfitLose),
      row._isTotal ? row.SumPositive : displayAmount(row.SumPositive),
      row._isTotal ? row.SumNegative : displayAmount(row.SumNegative),
      row.ServiceRateDynamic ?? '-',
      row._isTotal ? row.MustGetTaxMoney : displayAmount(row.MustGetTaxMoney),
    ],
  );
  void fetchMonthStatementTotalListApi({ ...buildQuery(), IsExp: true }).catch(
    () => undefined,
  );
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div>
    <ReportSummaryCards :items="summaryItems" />
    <ReportQueryCard>
      <AccountSelect v-model="adminIds" class="w-56" />
      <ChannelSelect v-model="channelIds" class="w-56" />
      <Select
        v-model:value="packageId"
        allow-clear
        class="w-44"
        :options="packageOptions"
        placeholder="产品"
      />
      <Select
        v-model:value="appUrls"
        allow-clear
        class="w-48"
        mode="multiple"
        :options="iosAppStoreOptions"
        placeholder="上架包"
        :max-tag-count="1"
      />
      <Select
        v-model:value="venueTypes"
        allow-clear
        class="w-48"
        mode="multiple"
        :options="platformGameTypeOptions"
        placeholder="场馆"
        :max-tag-count="1"
      />
      <DatePicker.RangePicker v-model:value="monthRange" picker="month" />
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
      <template #headerCell="{ column }">
        <template v-if="column.key === 'MustGetTaxMoney'">
          <Tooltip title="应抽成金额">
            <span>应抽成金额</span>
          </Tooltip>
        </template>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'SumSelfBetGold'">
          {{ displayAmount(record.SumSelfBetGold) }}
        </template>
        <template v-else-if="column.key === 'SumSelfWinGold'">
          {{ displayAmount(record.SumSelfWinGold) }}
        </template>
        <template v-else-if="column.key === 'ProfitLose'">
          <span :class="profitClass(record.ProfitLose)">
            {{ displayAmount(record.ProfitLose) }}
          </span>
        </template>
        <template v-else-if="column.key === 'SumPositive'">
          {{ displayAmount(record.SumPositive) }}
        </template>
        <template v-else-if="column.key === 'SumNegative'">
          {{ displayAmount(record.SumNegative) }}
        </template>
        <template v-else-if="column.key === 'ServiceRateDynamic'">
          <Popover title="利润阶梯" trigger="hover">
            <template #content>
              <ul class="m-0 list-none space-y-1 p-0 text-sm">
                <li
                  v-for="item in parseServiceRate(record.ServiceRateDynamic)"
                  :key="`${item[0]}-${item[1]}`"
                >
                  盈利&lt;={{ formatCrossLabel(item[0]) }} 费率{{ item[1] }}%
                </li>
              </ul>
            </template>
            <Button type="link" size="small">抽成比例</Button>
          </Popover>
        </template>
        <template v-else-if="column.key === 'MustGetTaxMoney'">
          {{ displayAmount(record.MustGetTaxMoney) }}
        </template>
      </template>
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell :index="0">总计:</Table.Summary.Cell>
            <Table.Summary.Cell :index="1">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="2">
              {{ totalSum.SumSelfCountNum ?? 0 }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="3">
              {{ displayCent(totalSum.SumSelfBetGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ displayCent(totalSum.SumSelfWinGold) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              <span :class="profitClass(footerProfitFromTotal(totalSum))">
                {{ displayCent(footerProfitFromTotal(totalSum)) }}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{ displayCent(totalSum.SumPositive) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              {{ displayCent(totalSum.SumNegative) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="8">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="9">
              {{ displayCent(totalSum.SumMustGetTaxMoney) }}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>
    <div v-else class="py-8 text-center text-muted-foreground">无列表权限</div>
  </div>
</template>

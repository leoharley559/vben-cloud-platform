<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { GameStatementRow } from '../utils';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  Input,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import {
  fetchGameStatementListApi,
  fetchVenueFeeConfigListApi,
  fetchVenueTemplateListApi,
} from '#/api/dataClose/game-statement';
import AccountSelect from '#/components/global/account-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatVenueName } from '#/utils/game-config';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam, cents } from '#/views/dataClose/shared/report-utils';

import {
  applyVenueFee,
  buildCommonQuery,
  defaultTodayRange,
  disabledDateBeyond90,
  getGameCategoryName,
  parseMyPlatformGameTypes,
  profitClass,
  profitRateText,
  profitText,
} from '../utils';
import DetailView from './detail-view.vue';
import UpdateReportBtn from './update-report-btn.vue';

defineOptions({ name: 'GameReportPanel' });

const { projectConfig } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const { packageOptions } = useOperationOptions();

const loading = ref(false);
const showDetails = ref(false);
const currentParam = ref<Record<string, unknown>>({});
const currentGameType = ref<number | string>('');
const tableData = ref<GameStatementRow[]>([]);
const total = ref<GameStatementRow>({});
const totalCost = ref(0);
const isNegativeWinCount = ref(false);
const venueList = ref<Array<{ Id?: number | string; TemplateName?: string }>>(
  [],
);
const venueRates = ref<Array<{ ApiName?: number | string; Fee?: number }>>([]);

const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminSearch = ref<Array<number | string> | number | string>([]);
const channelSearch = ref<Array<number | string> | number | string>([]);
const packageId = ref<number | string>('');
const adminGroupIds = ref<Array<number | string>>([]);
const gamePlatformType = ref<Array<number | string>>([]);
const gameType = ref<Array<number | string>>([]);
const templateId = ref<number | string>('');
const appUrl = ref<Array<number | string>>([]);
const dateRange = ref<[Dayjs, Dayjs]>(defaultTodayRange());

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

const categoryOptions = computed(() =>
  Object.entries(gameConfig.value.GameTypeLangGroup).map(([value]) => ({
    label: getGameCategoryName(value, gameConfig.value.GameTypeLangGroup),
    value,
  })),
);

const venueOptions = computed(() => {
  const keys = parseMyPlatformGameTypes(
    projectConfig.value?.MyPlatformGameType,
  );
  return keys.map((value) => ({
    label: formatVenueName(value, gameConfig.value),
    value,
  }));
});

const appUrlOptions = computed(() =>
  (
    (projectConfig.value?.IosAppStoreItems || []) as Array<{
      AppName?: string;
      AppUrl?: string;
      Id?: number | string;
    }>
  ).map((item) => ({
    label: item.AppName || item.AppUrl || String(item.Id),
    value: item.AppUrl || '',
  })),
);

const summaryItems = computed(() => [
  { title: '投注总额', value: cents(total.value.SumBet) },
  { title: '派送总额', value: cents(total.value.SumWin) },
  {
    title: '系统盈利',
    value: cents(
      Number(total.value.SumBet || 0) -
        Number(total.value.SumWin || 0) +
        Number(total.value.SumOther || 0),
    ),
  },
]);

const columns = [
  { key: 'GameType', title: '场馆名称', width: 140 },
  { dataIndex: 'CountBetNum', key: 'CountBetNum', title: '投注人数' },
  { dataIndex: 'CountNum', key: 'CountNum', title: '投注次数' },
  { key: 'SumBet', title: '投注金币' },
  { key: 'SumWin', title: '实际派送' },
  { key: 'SumValidBet', title: '有效投注' },
  { key: 'Profit', title: '盈利金额' },
  { key: 'ProfitRate', title: '盈余比例' },
  { key: 'Cost', title: '场馆费' },
];

function buildQuery(extra?: Record<string, unknown>) {
  return {
    ...buildCommonQuery({
      adminGroupIds: adminGroupIds.value,
      adminSearch: adminSearch.value,
      adminSearchType: adminSearchType.value,
      appUrl: appUrl.value,
      channelSearch: channelSearch.value,
      channelSearchType: channelSearchType.value,
      dateRange: dateRange.value,
      packageId: packageId.value,
    }),
    GamePlatformType: arrayToCsvParam(gamePlatformType.value) || '',
    GameType: arrayToCsvParam(gameType.value) || '',
    TemplateId: templateId.value || '',
    ...extra,
  };
}

async function loadVenueTemplates() {
  const data = await fetchVenueTemplateListApi();
  venueList.value = data?.Items || [];
}

async function loadVenueRates() {
  if (!templateId.value) {
    venueRates.value = [];
    return;
  }
  const data = await fetchVenueFeeConfigListApi({
    TemplateId: templateId.value,
  });
  venueRates.value = Array.isArray(data) ? data : [];
}

function formatWithFee(rows: GameStatementRow[]) {
  const result = applyVenueFee(
    rows,
    venueRates.value,
    isNegativeWinCount.value,
  );
  tableData.value = result.rows;
  totalCost.value = result.totalCost;
}

async function loadList() {
  loading.value = true;
  try {
    const query = buildQuery();
    currentParam.value = query;
    const data = await fetchGameStatementListApi(query);
    total.value = (data.Total || {}) as GameStatementRow;
    isNegativeWinCount.value = Boolean(data.IsNegativeWinCount);
    formatWithFee((data.Items || []) as GameStatementRow[]);
  } catch {
    tableData.value = [];
    total.value = {};
    totalCost.value = 0;
  } finally {
    loading.value = false;
  }
}

async function onTemplateChange() {
  await loadVenueRates();
  formatWithFee(tableData.value.map(({ Cost: _c, ...rest }) => rest));
}

function handleReset() {
  adminSearchType.value = 0;
  channelSearchType.value = 0;
  adminSearch.value = [];
  channelSearch.value = [];
  packageId.value = '';
  adminGroupIds.value = [];
  gamePlatformType.value = [];
  gameType.value = [];
  templateId.value = '';
  appUrl.value = [];
  dateRange.value = defaultTodayRange();
  venueRates.value = [];
  void loadList();
}

async function handleExport() {
  await fetchGameStatementListApi(buildQuery({ IsExp: true }));
  await exportReportXlsx(
    tableData.value,
    [
      '游戏名称',
      '投注人数',
      '投注次数',
      '投注金币',
      '实际派送金币',
      '有效投注',
      '盈利金额',
      '盈余比例',
      '场馆费',
    ],
    '游戏报表',
    (row) => [
      formatVenueName(row.GameType, gameConfig.value),
      row.CountBetNum,
      row.CountNum,
      cents(row.SumBet),
      cents(row.SumWin),
      cents(row.SumValidBet),
      profitText(row),
      profitRateText(row),
      cents(row.Cost),
    ],
  );
}

function openDetail(row: GameStatementRow) {
  currentGameType.value = row.GameType || '';
  showDetails.value = true;
}

function venueLabel(gameType: unknown) {
  return formatVenueName(
    gameType as number | string | null | undefined,
    gameConfig.value,
  );
}

watch(adminSearchType, (type) => {
  adminSearch.value = type === 0 ? [] : '';
});
watch(channelSearchType, (type) => {
  channelSearch.value = type === 0 ? [] : '';
});

onMounted(async () => {
  await ensureGameConfig(true);
  await loadVenueTemplates();
  await loadList();
});
</script>

<template>
  <DetailView
    v-if="showDetails"
    report-type="gameStatement"
    :param="currentParam"
    :dim-value="currentGameType"
    @back="showDetails = false"
  />
  <div v-else>
    <ReportQueryCard actions-single>
      <Space.Compact>
        <Select
          class="query-auto-select"
          :popup-match-select-width="false"
          v-model:value="adminSearchType"
          :options="[
            { label: '代理模糊', value: 0 },
            { label: '代理精准', value: 1 },
          ]"
        />
        <AccountSelect
          v-if="adminSearchType === 0"
          v-model="adminSearch"
          style="width: 180px"
        />
        <Input
          v-else
          v-model:value="adminSearch"
          style="width: 180px"
          allow-clear
          placeholder="请输入代理账号"
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
          style="width: 180px"
          placeholder="请输入渠道号"
        />
        <Input
          v-else
          v-model:value="channelSearch"
          style="width: 180px"
          allow-clear
          placeholder="请输入渠道"
          />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">产品</span>
        <Select
          v-model:value="packageId"
          :options="packageOptions.map((item) => ({
            label: item.PackageName,
            value: item.PackageId,
          }))"
          style="width: 160px"
          show-search
          allow-clear
          placeholder="请选择产品"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">代理模板</span>
        <Select
          v-model:value="adminGroupIds"
          :options="adminGroupOptions"
          mode="multiple"
          style="width: 180px"
          allow-clear
          :max-tag-count="1"
          placeholder="请选择代理模板"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">场馆分类</span>
        <Select
          v-model:value="gamePlatformType"
          :options="categoryOptions"
          mode="multiple"
          style="width: 160px"
          allow-clear
          :max-tag-count="1"
          placeholder="请选择场馆分类"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">场馆</span>
        <Select
          v-model:value="gameType"
          :options="venueOptions"
          mode="multiple"
          style="width: 160px"
          allow-clear
          :max-tag-count="1"
          placeholder="请选择场馆"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">费率模板</span>
        <Select
          v-model:value="templateId"
          :options="
            venueList.map((item) => ({
              label: item.TemplateName,
              value: item.Id,
            }))
          "
          style="width: 180px"
          allow-clear
          show-search
          @change="onTemplateChange"
          placeholder="请选择费率模板"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">上架包</span>
        <Select
          v-model:value="appUrl"
          :options="appUrlOptions"
          mode="multiple"
          style="width: 160px"
          allow-clear
          :max-tag-count="1"
          placeholder="请选择上架包"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" precision="date" :disabled-date="(current) => disabledDateBeyond90(current, dateRange, 'end')" />
        </div>
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadList">查询</Button>
        <Button @click="handleReset">重置</Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems">
      <template #extra>
        <UpdateReportBtn />
        <Button type="primary" ghost @click="handleExport">导出 Excel</Button>
      </template>
    </ReportSummaryCards>

    <Table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="GameType"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'GameType'">
          <a @click="openDetail(record)">
            {{ venueLabel(record.GameType) }}
          </a>
        </template>
        <template v-else-if="column.key === 'SumBet'">
          {{ cents(record.SumBet) }}
        </template>
        <template v-else-if="column.key === 'SumWin'">
          {{ cents(record.SumWin) }}
        </template>
        <template v-else-if="column.key === 'SumValidBet'">
          {{ cents(record.SumValidBet) }}
        </template>
        <template v-else-if="column.key === 'Profit'">
          <span :class="profitClass(record)">{{ profitText(record) }}</span>
        </template>
        <template v-else-if="column.key === 'ProfitRate'">
          {{ profitRateText(record) }}
        </template>
        <template v-else-if="column.key === 'Cost'">
          {{ cents(record.Cost) }}
        </template>
      </template>
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell :index="0">合计</Table.Summary.Cell>
            <Table.Summary.Cell :index="1">
              {{ total.CountBetNum ?? '-' }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="2">
              {{ total.CountNum ?? '-' }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="3">
              {{ cents(total.SumBet) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ cents(Number(total.SumWin || 0) - Number(total.SumProfit || 0)) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              {{ cents(total.SumValidBet) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{ profitText(total) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              {{ profitRateText(total) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="8">
              {{ cents(totalCost) }}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>
  </div>
</template>

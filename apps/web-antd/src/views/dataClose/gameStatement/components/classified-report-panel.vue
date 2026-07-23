<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { GameStatementRow } from '../utils';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import { fetchClassifiedReportListApi } from '#/api/dataClose/game-statement';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam, cents } from '#/views/dataClose/shared/report-utils';

import {
  buildCommonQuery,
  defaultTodayRange,
  disabledDateBeyond90,
  getGameCategoryName,
  profitClass,
  profitRateText,
  profitText,
} from '../utils';
import DetailView from './detail-view.vue';
import UpdateReportBtn from './update-report-btn.vue';

defineOptions({ name: 'ClassifiedReportPanel' });

const { projectConfig } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const { packageOptions } = useOperationOptions();

const loading = ref(false);
const showDetails = ref(false);
const currentParam = ref<Record<string, unknown>>({});
const currentPlatformType = ref<number | string>('');
const tableData = ref<GameStatementRow[]>([]);
const total = ref<GameStatementRow>({});

const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminSearch = ref<Array<number | string> | number | string>([]);
const channelSearch = ref<Array<number | string> | number | string>([]);
const packageId = ref<number | string>('');
const adminGroupIds = ref<Array<number | string>>([]);
const gamePlatformType = ref<Array<number | string>>([]);
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
  { title: '系统盈利', value: profitText(total.value) },
]);

const columns = [
  { key: 'GamePlatformType', title: '场馆分类', width: 140 },
  { dataIndex: 'CountBetNum', key: 'CountBetNum', title: '投注人数' },
  { dataIndex: 'CountNum', key: 'CountNum', title: '投注次数' },
  { key: 'SumBet', title: '投注金币' },
  { key: 'SumWin', title: '实际派送' },
  { key: 'SumValidBet', title: '有效投注' },
  { key: 'Profit', title: '盈利金额' },
  { key: 'ProfitRate', title: '盈余比例' },
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
    ...extra,
  };
}

async function loadList() {
  loading.value = true;
  try {
    const query = buildQuery();
    currentParam.value = query;
    const data = await fetchClassifiedReportListApi(query);
    total.value = (data.Total || {}) as GameStatementRow;
    tableData.value = (data.Items || []) as GameStatementRow[];
  } catch {
    tableData.value = [];
    total.value = {};
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  adminSearchType.value = 0;
  channelSearchType.value = 0;
  adminSearch.value = [];
  channelSearch.value = [];
  packageId.value = '';
  adminGroupIds.value = [];
  gamePlatformType.value = [];
  appUrl.value = [];
  dateRange.value = defaultTodayRange();
  void loadList();
}

async function handleExport() {
  await fetchClassifiedReportListApi(buildQuery({ IsExp: true }));
  await exportReportXlsx(
    tableData.value,
    [
      '场馆类型',
      '投注人数',
      '投注次数',
      '投注金币',
      '实际派送金币',
      '有效投注',
      '盈利金额',
      '盈余比例',
    ],
    '分类报表',
    (row) => [
      getGameCategoryName(
        row.GamePlatformType,
        gameConfig.value.GameTypeLangGroup,
      ),
      row.CountBetNum,
      row.CountNum,
      cents(row.SumBet),
      cents(row.SumWin),
      cents(row.SumValidBet),
      profitText(row),
      profitRateText(row),
    ],
  );
}

function openDetail(row: GameStatementRow) {
  currentPlatformType.value = row.GamePlatformType || '';
  showDetails.value = true;
}

watch(adminSearchType, (type) => {
  adminSearch.value = type === 0 ? [] : '';
});
watch(channelSearchType, (type) => {
  channelSearch.value = type === 0 ? [] : '';
});

onMounted(async () => {
  await ensureGameConfig();
  await loadList();
});
</script>

<template>
  <DetailView
    v-if="showDetails"
    report-type="classifiedStatement"
    :param="currentParam"
    :dim-value="currentPlatformType"
    @back="showDetails = false"
  />
  <div v-else>
    <ReportQueryCard>
      <Space.Compact>
        <Select
          v-model:value="adminSearchType"
          :options="[
            { label: '代理模糊', value: 0 },
            { label: '代理精准', value: 1 },
          ]"
          style="width: 110px"
        />
        <AccountSelect
          v-if="adminSearchType === 0"
          v-model="adminSearch"
          style="width: 180px"
        />
        <Input
          v-else
          v-model:value="adminSearch"
          placeholder="代理账号"
          style="width: 180px"
          allow-clear
        />
      </Space.Compact>
      <Space.Compact>
        <Select
          v-model:value="channelSearchType"
          :options="[
            { label: '渠道模糊', value: 0 },
            { label: '渠道精准', value: 1 },
          ]"
          style="width: 110px"
        />
        <ChannelSelect
          v-if="channelSearchType === 0"
          v-model="channelSearch"
          style="width: 180px"
        />
        <Input
          v-else
          v-model:value="channelSearch"
          placeholder="渠道"
          style="width: 180px"
          allow-clear
        />
      </Space.Compact>
      <Select
        v-model:value="packageId"
        :options="
          packageOptions.map((item) => ({
            label: item.PackageName,
            value: item.PackageId,
          }))
        "
        placeholder="产品"
        style="width: 160px"
        show-search
        allow-clear
      />
      <Select
        v-model:value="adminGroupIds"
        :options="adminGroupOptions"
        mode="multiple"
        placeholder="代理模板"
        style="width: 180px"
        allow-clear
        :max-tag-count="1"
      />
      <Select
        v-model:value="gamePlatformType"
        :options="categoryOptions"
        mode="multiple"
        placeholder="场馆分类"
        style="width: 160px"
        allow-clear
        :max-tag-count="1"
      />
      <Select
        v-model:value="appUrl"
        :options="appUrlOptions"
        mode="multiple"
        placeholder="上架包"
        style="width: 160px"
        allow-clear
        :max-tag-count="1"
      />
      <DatePicker.RangePicker
        v-model:value="dateRange"
        :disabled-date="(current) => disabledDateBeyond90(current, dateRange, 'end')"
      />
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadList">查询</Button>
        <Button @click="handleReset">重置</Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

    <div class="mb-3 flex flex-wrap items-center justify-end gap-2">
      <UpdateReportBtn />
      <Button type="primary" ghost @click="handleExport">导出 Excel</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="GamePlatformType"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'GamePlatformType'">
          <a @click="openDetail(record)">
            {{
              getGameCategoryName(
                record.GamePlatformType,
                gameConfig.GameTypeLangGroup,
              )
            }}
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
              {{ cents(total.SumWin) }}
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
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>
  </div>
</template>

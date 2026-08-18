<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  RadioButton,
  RadioGroup,
  Result,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

import { fetchGameAnalysisReportApi } from '#/api/operationalData/game-details';
import AccountSelect from '#/components/global/account-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { defaultReportBeginTime } from '#/utils/everyday-data-date';
import { joinMultiValue, normalizeSearchValue } from '#/utils/everyday-report-format';
import { formatAmountFromCent } from '#/utils/format-amount';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';

import BetAnalysisChart, {
  type BetAnalysisRow,
  type BetMetric,
} from './components/bet-analysis-chart.vue';

defineOptions({ name: 'OperationalGameDetails' });

const BET_TYPE_MAP: Record<number, string> = {
  0: '投注记录',
  1: '首页',
  2: '详情单',
  3: '直播页',
  4: '推单',
};

/** 对齐旧站 betDetails radio：投注额/人数/盈利/次数/有效投注/盈余比例 */
const METRICS: Array<{ key: BetMetric; label: string }> = [
  { key: 'betMoney', label: '投注额' },
  { key: 'betNum', label: '人数' },
  { key: 'profit', label: '盈利' },
  { key: 'betCount', label: '次数' },
  { key: 'validBet', label: '有效投注' },
  { key: 'profitRatio', label: '盈余比例' },
];

const { adminInfo, checkPermission, projectConfig } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewPage = computed(() => checkPermission(12_155));

const realAdminType = computed(() => {
  const parent = projectConfig.value?.ParentInfo as
    | undefined
    | { AdminType?: number };
  const admin = adminInfo.value as
    | undefined
    | { Admin?: { AdminType?: number }; realAdminType?: number };
  return Number(
    admin?.realAdminType ??
      admin?.Admin?.AdminType ??
      parent?.AdminType ??
      1,
  );
});

const devicePlatformOptions = computed(() => {
  const cfg = projectConfig.value as
    | undefined
    | {
        DevicePlatformAll?: Record<string, string>;
        DevicePlatformMy?: Record<string, string> | string[];
      };
  const source =
    realAdminType.value === 1
      ? cfg?.DevicePlatformAll || {}
      : cfg?.DevicePlatformMy || cfg?.DevicePlatformAll || {};
  if (Array.isArray(source)) {
    return source.map((value) => ({ label: String(value), value }));
  }
  return Object.entries(source).map(([value, label]) => ({
    label: String(label),
    value,
  }));
});

const loading = ref(false);
const list = ref<BetAnalysisRow[]>([]);
const chartRows = ref<BetAnalysisRow[]>([]);
const metric = ref<BetMetric>('betMoney');

const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminIds = ref<Array<number | string> | number | string>([]);
const channelIds = ref<Array<number | string> | number | string>([]);
const packageId = ref<number | string>('');
const devicePlatform = ref<Array<number | string>>([]);
const betType = ref<number | string | undefined>(undefined);
/** 0=正式数据（旧版默认），2=全部 */
const dataSearchType = ref(0);
const dateRange = ref<[Dayjs, Dayjs]>();

function initDateRange() {
  // 对齐旧站：GLOBAL.defaultDate（当月1日）~ getBeforeDateStr(1,false,false)=今天
  dateRange.value = [dayjs(defaultReportBeginTime()), dayjs().endOf('day')];
}

function calcProfitRatio(betGold: number, winGold: number) {
  if (!betGold) return '0.00';
  return (((betGold - winGold) / betGold) * 100).toFixed(2);
}

function buildQuery() {
  const adminValue = normalizeSearchValue(adminIds.value, adminSearchType.value);
  const channelValue = normalizeSearchValue(
    channelIds.value,
    channelSearchType.value,
  );
  return {
    AdminIds: adminValue,
    BeginTime: dateRange.value?.[0]?.format('YYYY-MM-DD') || '',
    BetType: betType.value ?? '',
    ChannelIds: channelValue,
    DataSearchType: dataSearchType.value,
    DevicePlatform: joinMultiValue(devicePlatform.value),
    EndTime: dateRange.value?.[1]?.format('YYYY-MM-DD') || '',
    PackageId: packageId.value || '',
  };
}

async function loadList() {
  loading.value = true;
  try {
    const data = await fetchGameAnalysisReportApi(buildQuery());
    const items = (data?.Items || []).map((row, index) => {
      const betGold = Number(row.BetGold || 0);
      const winGold = Number(row.WinGold || 0);
      return {
        ...row,
        Profit: formatAmountFromCent(betGold - winGold),
        ProfitRatio: calcProfitRatio(betGold, winGold),
        rowKey: `${row.ReportDay}-${row.BetType}-${index}`,
      } as BetAnalysisRow;
    });
    list.value = items;
    chartRows.value = [...items].toSorted(
      (a, b) =>
        new Date(String(a.ReportDay || '')).getTime() -
        new Date(String(b.ReportDay || '')).getTime(),
    );
  } catch {
    list.value = [];
    chartRows.value = [];
    message.error('查询失败');
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  adminSearchType.value = 0;
  channelSearchType.value = 0;
  adminIds.value = [];
  channelIds.value = [];
  packageId.value = '';
  devicePlatform.value = [];
  betType.value = undefined;
  dataSearchType.value = 0;
  initDateRange();
  void loadList();
}

async function handleExport() {
  if (!list.value.length) {
    message.warning('暂无数据可导出');
    return;
  }
  try {
    await exportReportXlsx(
      list.value,
      [
        '日期',
        '投注入口',
        '投注人数',
        '投注次数',
        '投注金币',
        '实际派送金币',
        '有效投注',
        '盈利金额',
        '盈余比例',
      ],
      '投注行为报表',
      (row) => [
        row.ReportDay,
        BET_TYPE_MAP[Number(row.BetType)] || row.BetType,
        row.BetNumberOfPeople,
        row.BetCount,
        formatAmountFromCent(Number(row.BetGold || 0)),
        formatAmountFromCent(Number(row.WinGold || 0)),
        formatAmountFromCent(Number(row.ValidWater || 0)),
        row.Profit,
        `${row.ProfitRatio}%`,
      ],
    );
  } catch {
    message.error('导出失败');
  }
}

const columns = [
  { dataIndex: 'ReportDay', key: 'ReportDay', title: '日期' },
  { key: 'BetType', title: '投注入口' },
  { dataIndex: 'BetNumberOfPeople', key: 'BetNumberOfPeople', title: '投注人数' },
  { dataIndex: 'BetCount', key: 'BetCount', title: '投注次数' },
  { key: 'BetGold', title: '投注金币' },
  { key: 'WinGold', title: '实际派送' },
  { key: 'ValidWater', title: '有效投注' },
  { key: 'Profit', title: '盈利金额' },
  { key: 'ProfitRatio', title: '盈余比例' },
];

watch(adminSearchType, (type) => {
  adminIds.value = type === 0 ? [] : '';
});
watch(channelSearchType, (type) => {
  channelIds.value = type === 0 ? [] : '';
});

onMounted(() => {
  initDateRange();
  void loadList();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营数据 · 投注行为报表"
    title="投注行为报表"
  >
    <Card>
      <ReportQueryCard>
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
            v-model="adminIds"
            style="width: 180px"
          />
          <Input
            v-else
            v-model:value="adminIds"
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
            v-model="channelIds"
            style="width: 180px"
            placeholder="请输入渠道号"
          />
          <Input
            v-else
            v-model:value="channelIds"
            style="width: 180px"
            allow-clear
            placeholder="请输入渠道"
            />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">产品</span>
          <Select
            v-model:value="packageId"
            :options="
              packageOptions.map((item) => ({
                label: item.PackageName,
                value: item.PackageId,
              }))
            "
            style="width: 160px"
            show-search
            allow-clear
            placeholder="请选择产品"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">注册/设备平台</span>
          <Select
            v-model:value="devicePlatform"
            :options="devicePlatformOptions"
            mode="multiple"
            style="width: 180px"
            allow-clear
            :max-tag-count="1"
            placeholder="请选择注册/设备平台"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">投注入口</span>
          <Select
            v-model:value="betType"
            :options="
              Object.entries(BET_TYPE_MAP).map(([value, label]) => ({
                label,
                value: Number(value),
              }))
            "
            style="width: 140px"
            allow-clear
            placeholder="请选择投注入口"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">数据类型</span>
          <Select
            v-model:value="dataSearchType"
            :options="[
              { label: '正式数据', value: 0 },
              { label: '全部', value: 2 },
            ]"
            style="width: 130px"
            placeholder="请选择数据类型"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" precision="date" />
        </div>
        <template #actions>
          <Button type="primary" :loading="loading" @click="loadList">
            查询
          </Button>
          <Button @click="handleReset">重置</Button>
          <Button type="primary" ghost @click="handleExport">导出 Excel</Button>
        </template>
      </ReportQueryCard>

      <div class="mb-3">
        <RadioGroup v-model:value="metric" button-style="solid" size="small">
          <RadioButton
            v-for="item in METRICS"
            :key="item.key"
            :value="item.key"
          >
            {{ item.label }}
          </RadioButton>
        </RadioGroup>
      </div>

      <BetAnalysisChart :rows="chartRows" :metric="metric" />

      <div class="mb-2 mt-4 font-medium">明细数据</div>
      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        bordered
        row-key="rowKey"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'BetType'">
            {{ BET_TYPE_MAP[Number(record.BetType)] || record.BetType }}
          </template>
          <template v-else-if="column.key === 'BetGold'">
            {{ formatAmountFromCent(Number(record.BetGold || 0)) }}
          </template>
          <template v-else-if="column.key === 'WinGold'">
            {{ formatAmountFromCent(Number(record.WinGold || 0)) }}
          </template>
          <template v-else-if="column.key === 'ValidWater'">
            {{ formatAmountFromCent(Number(record.ValidWater || 0)) }}
          </template>
          <template v-else-if="column.key === 'Profit'">
            <span
              :class="
                Number(record.BetGold || 0) - Number(record.WinGold || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-500'
              "
            >
              {{ record.Profit }}
            </span>
          </template>
          <template v-else-if="column.key === 'ProfitRatio'">
            {{ record.ProfitRatio }}%
          </template>
        </template>
      </Table>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无投注行为报表查看权限" title="403" />
</template>

<script lang="ts" setup>
import type { TableColumnType, TableProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  Pagination,
  Result,
  Select,
  Space,
  Table,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchUserWinLossListApi } from '#/api/dataClose/player-report';
import AccountSelect from '#/components/global/account-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { useReportOptions } from '#/composables/use-report-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatVenueName } from '#/utils/game-config';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam, resolveReportRange } from '#/views/dataClose/shared/report-utils';

defineOptions({ name: 'UserWinLoss' });

type Row = Record<string, unknown>;

/** 对齐旧站 validLoginAccount */
const LOGIN_ACCOUNT_RE = /^[a-zA-Z0-9]{4,20}$/;

const VIEW_BY_OPTIONS = [
  { label: '分场馆模式', value: 'game' },
  { label: '合并场馆模式', value: 'player' },
];

const { checkPermission, projectConfig } = useCloudPermission();
const { ensureGameConfig, gameConfig, packageOptions } = useReportOptions();

const canView = computed(() => checkPermission(10_492));
const canExport = computed(() => checkPermission(10_493));

const loading = ref(false);
const exportLoading = ref(false);
const tableData = ref<Row[]>([]);
const moreItems = ref<Row>({});
const total = ref(0);
const sort = ref('');

const filters = reactive({
  VenuesTemp: [] as Array<string>,
  LoginAccount: '',
  AdminIds: [] as Array<number | string>,
  ChannelId: [] as Array<number | string>,
  PackageId: undefined as number | string | undefined,
  AppUrl: [] as Array<string>,
  ViewBy: 'game' as string,
  dateRange: [...resolveReportRange('today')] as [Dayjs, Dayjs],
});

const page = reactive({ current: 1, pageSize: 20 });

const gameGroupOptions = computed(() => {
  const groups = (projectConfig.value?.GameGroups || []) as Array<{
    GroupName?: string;
    Id?: number | string;
    PlatformGameType?: number | string;
  }>;
  return groups.map((item) => ({
    label: item.GroupName || String(item.Id || ''),
    value: String(item.PlatformGameType ?? ''),
  }));
});

const appStoreOptions = computed(() => {
  const list = (projectConfig.value?.IosAppStoreItems ||
    projectConfig.value?.IosAppStoreList ||
    []) as Array<{ AppName?: string; AppUrl?: string; Name?: string }>;
  return list.map((item) => ({
    label: item.AppName || item.Name || item.AppUrl || '-',
    value: item.AppUrl || '',
  }));
});

const packageSelectOptions = computed(() => [
  { label: '全部产品', value: '' },
  ...packageOptions.value,
]);

function num(value: unknown) {
  return Number(value || 0);
}

/** 实际派送 = SumWinGold - SumProfitGold */
function deliveryGold(row: Row) {
  return num(row.SumWinGold) - num(row.SumProfitGold);
}

function formatVenue(gameType: unknown) {
  if (filters.ViewBy !== 'game') return '-';
  return formatVenueName(gameType as number | string, gameConfig.value);
}

function rowKey(row: Row) {
  return `${row.LoginAccount ?? ''}-${row.GameType ?? ''}-${row.PackageName ?? ''}`;
}

function disabledDate(current: Dayjs) {
  if (!current) return false;
  return current.isAfter(dayjs().endOf('day'));
}

function normalizeLoginAccount() {
  // 对齐旧站 SearchTypeFour：去空格、转小写
  filters.LoginAccount = filters.LoginAccount.replace(/\s/g, '').toLowerCase();
}

function validateLoginAccount() {
  normalizeLoginAccount();
  const account = filters.LoginAccount;
  if (!account) return true;
  if (!LOGIN_ACCOUNT_RE.test(account)) {
    message.warning('游戏账号需为 4-20 位字母或数字');
    return false;
  }
  return true;
}

function validateDateRange(range: [Dayjs, Dayjs] | null | undefined) {
  if (!range?.[0] || !range?.[1]) {
    message.warning('请选择日期');
    return false;
  }
  const days = range[1].startOf('day').diff(range[0].startOf('day'), 'day');
  if (days > 29) {
    message.warning('查询区间最长 30 天');
    return false;
  }
  return true;
}

function platformGameTypeParam() {
  return filters.VenuesTemp.filter(Boolean).join(',') || undefined;
}

function buildQuery(isExp = false) {
  const range = filters.dateRange;
  return {
    ChannelIds: arrayToCsvParam(filters.ChannelId),
    AdminIds: arrayToCsvParam(filters.AdminIds),
    PackageId: filters.PackageId || undefined,
    PlatformGameType: platformGameTypeParam(),
    IsExp: isExp,
    AppUrl: arrayToCsvParam(filters.AppUrl),
    Page: page.current,
    PageSize: page.pageSize,
    BeginTime: range?.[0]?.startOf('day').unix() || '',
    EndTime: range?.[1]?.endOf('day').unix() || '',
    Sort: sort.value || undefined,
    ViewBy: filters.ViewBy,
    LoginAccount: filters.LoginAccount || undefined,
  };
}

const summaryItems = computed(() => {
  const m = moreItems.value;
  return [
    { title: '投注总计', value: formatAmountFromCent(m.SumBetGold) },
    { title: '有效投注总计', value: formatAmountFromCent(m.SumValidWater) },
    {
      title: '派送总计',
      value: formatAmountFromCent(num(m.SumWinGold) - num(m.SumProfitGold)),
    },
    
    {
      title: '玩家盈亏总计',
      value: formatAmountFromCent(m.SumWinGold),
    },
  ];
});

const columns = computed<TableColumnType<Row>[]>(() => [
  {
    align: 'center',
    dataIndex: 'LoginAccount',
    key: 'LoginAccount',
    title: '游戏账号',
  },
  {
    align: 'center',
    dataIndex: 'PackageName',
    key: 'PackageName',
    title: '所属产品',
  },
  {
    align: 'center',
    dataIndex: 'ChannelName',
    key: 'ChannelName',
    title: '所属渠道',
  },
  {
    align: 'center',
    dataIndex: 'Username',
    key: 'Username',
    title: '所属账号',
  },
  {
    align: 'center',
    customRender: ({ record }) => formatVenue(record.GameType),
    key: 'GameType',
    title: '场馆名称',
  },
  {
    align: 'center',
    customRender: ({ record }) => formatAmountFromCent(record.SumBetGold),
    dataIndex: 'SumBetGold',
    key: 'SumBetGold',
    sorter: true,
    title: '投注额',
  },
  {
    align: 'center',
    dataIndex: 'SumBetCount',
    key: 'SumBetCount',
    title: '注单数',
  },
  {
    align: 'center',
    customRender: ({ record }) => formatAmountFromCent(record.SumValidWater),
    dataIndex: 'SumValidWater',
    key: 'SumValidWater',
    sorter: true,
    title: '有效投注',
  },
  {
    align: 'center',
    customRender: ({ record }) => formatAmountFromCent(deliveryGold(record)),
    key: 'DeliveryGold',
    title: '实际派送',
  },
  {
    align: 'center',
    dataIndex: 'SumBetWin',
    key: 'SumBetWin',
    sorter: true,
    title: '玩家盈亏',
  },
]);

function getSummary() {
  const m = moreItems.value;
  return [
    '合计:',
    '-',
    '-',
    '-',
    '-',
    formatAmountFromCent(m.SumBetGold),
    String(m.SumBetCount ?? '-'),
    formatAmountFromCent(m.SumValidWater),
    formatAmountFromCent(num(m.SumWinGold) - num(m.SumProfitGold)),
    formatAmountFromCent(m.SumWinGold),
  ];
}

async function fetchList() {
  if (!canView.value) return;
  if (!validateLoginAccount()) return;
  if (!validateDateRange(filters.dateRange)) return;
  loading.value = true;
  try {
    const result = await fetchUserWinLossListApi(buildQuery(false));
    tableData.value = result.Items || [];
    moreItems.value = result.MoreItems || {};
    total.value = Number(result.Pagination?.MaxCount || 0);
  } catch {
    tableData.value = [];
    moreItems.value = {};
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.current = 1;
  void fetchList();
}

function handleReset() {
  filters.VenuesTemp = [];
  filters.LoginAccount = '';
  filters.AdminIds = [];
  filters.ChannelId = [];
  filters.PackageId = undefined;
  filters.AppUrl = [];
  filters.ViewBy = 'game';
  filters.dateRange = [...resolveReportRange('today')] as [Dayjs, Dayjs];
  sort.value = '';
  handleSearch();
}

const handleTableChange: TableProps['onChange'] = (_pag, _filters, sorter) => {
  const s = Array.isArray(sorter) ? sorter[0] : sorter;
  const field = String(s?.field || s?.columnKey || '');
  if (s?.order === 'ascend') {
    sort.value = field;
  } else if (s?.order === 'descend') {
    sort.value = `-${field}`;
  } else {
    sort.value = '';
  }
  page.current = 1;
  void fetchList();
};

function handlePageChange(current: number, pageSize: number) {
  page.current = current;
  page.pageSize = pageSize;
  void fetchList();
}

async function handleExport() {
  if (!validateLoginAccount()) return;
  if (!validateDateRange(filters.dateRange)) return;
  exportLoading.value = true;
  try {
    const result = await fetchUserWinLossListApi(buildQuery(true));
    const list = [...(result.Items || [])];
    if (list.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }
    const m =
      result.MoreItems && Object.keys(result.MoreItems).length > 0
        ? result.MoreItems
        : moreItems.value;
    const totalRow: Row = {
      LoginAccount: '合计:',
      PackageName: '-',
      ChannelName: '-',
      Username: '-',
      GameType: '-',
      SumBetGold: m.SumBetGold,
      SumBetCount: m.SumBetCount,
      SumValidWater: m.SumValidWater,
      SumWinGold: m.SumWinGold,
      SumProfitGold: m.SumProfitGold,
      __isTotal: true,
    };
    list.push(totalRow);

    await exportReportXlsx(
      list,
      [
        '游戏账号',
        '所属产品',
        '所属渠道',
        '所属账号',
        '场馆',
        '投注额',
        '注单数',
        '有效投注',
        '实际派送',
        '玩家盈亏',
      ],
      '玩家盈亏报表',
      (row) => {
        const isTotal = Boolean(row.__isTotal);
        return [
          row.LoginAccount,
          row.PackageName,
          row.ChannelName,
          row.Username,
          isTotal ? '-' : formatVenue(row.GameType),
          formatAmountFromCent(row.SumBetGold),
          row.SumBetCount,
          formatAmountFromCent(row.SumValidWater),
          formatAmountFromCent(deliveryGold(row)),
          formatAmountFromCent(row.SumWinGold),
        ];
      },
    );
  } finally {
    exportLoading.value = false;
  }
}

onMounted(async () => {
  await ensureGameConfig();
  if (canView.value) {
    void fetchList();
  }
});
</script>

<template>
  <Page
    v-if="canView"
    auto-content-height
    description="数据闭环 · 玩家盈亏报表"
    title="玩家盈亏报表"
  >
    <Card>
      <ReportQueryCard title="查询条件">
        <Space.Compact>
          <span class="query-field-addon">场馆模版</span>
          <Select
            v-model:value="filters.VenuesTemp"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            :options="gameGroupOptions"
            style="min-width: 180px"
            placeholder="请选择场馆模版"
          />
        </Space.Compact>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filters.LoginAccount"
            allow-clear
            style="width: 220px"
            @blur="normalizeLoginAccount"
            @press-enter="handleSearch"
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">账号</span>
          <AccountSelect v-model="filters.AdminIds" style="min-width: 200px" />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">渠道号</span>
          <ChannelSelect v-model="filters.ChannelId" style="min-width: 180px" placeholder="请输入渠道号" />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">产品</span>
          <Select
            v-model:value="filters.PackageId"
            allow-clear
            :options="packageSelectOptions"
            style="min-width: 160px"
            show-search
            option-filter-prop="label"
            placeholder="请选择产品"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">上架包</span>
          <Select
            v-model:value="filters.AppUrl"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            :options="appStoreOptions"
            style="min-width: 160px"
            placeholder="请选择上架包"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">数据显示模式</span>
          <Select
            v-model:value="filters.ViewBy"
            :options="VIEW_BY_OPTIONS"
            style="min-width: 150px"
            placeholder="请选择数据显示模式"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filters.dateRange" precision="date" :disabled-date="disabledDate" />
        </div>
        <template #actions>
          <Button type="primary" :loading="loading" @click="handleSearch"> 查询 </Button>
          <Button @click="handleReset">重置</Button>
          <Button
            v-if="canExport"
            type="primary"
            ghost
            :loading="exportLoading"
            @click="handleExport"
          >
            导出 Excel
          </Button>
        </template>
        <template #extra>
          <div class="text-xs text-gray-500">默认今天，最长 30 天；今天的数据将每小时更新一次</div>
        </template>
      </ReportQueryCard>

      <ReportSummaryCards :items="summaryItems" />

      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 'max-content' }"
        bordered
        :row-key="rowKey"
        size="small"
        @change="handleTableChange"
      >
        <template #headerCell="{ column }">
          <template v-if="column.key === 'SumBetGold'">
            <Tooltip title="投注额为玩家在游戏中的总投注金额">
              <span>投注额</span>
            </Tooltip>
          </template>
          <template v-else-if="column.key === 'DeliveryGold'">
            <Tooltip title="实际派送金币=玩家在游戏中实际赢取的金币数量">
              <span>实际派送</span>
            </Tooltip>
          </template>
        </template>
        <template #bodyCell="{ column, record }">
          <PlayerAccountLink
            v-if="column.key === 'LoginAccount'"
            :login-account="String(record.LoginAccount || '')"
            :player-id="record.PlayerId as number | string | undefined"
          />
          <AgencyAccountLink
            v-else-if="column.key === 'Username'"
            :admin-id="resolveAgencyAdminId(record)"
            :username="record.Username"
          />
          <template v-else-if="column.key === 'SumBetWin'">
            <span
              :style="{
                color: num(record.SumWinGold) < 0 ? '#f5222d' : '#52c41a',
              }"
            >
              {{ formatAmountFromCent(record.SumWinGold) }}
            </span>
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell
                v-for="(value, index) in getSummary()"
                :key="index"
                :index="index"
              >
                <span class="text-red-500">{{ value }}</span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>

      <div v-if="total > 0" class="mt-4 flex justify-end">
        <Pagination
          :current="page.current"
          :page-size="page.pageSize"
          :total="total"
          show-size-changer
          show-quick-jumper
          @change="handlePageChange"
          @show-size-change="handlePageChange"
        />
      </div>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无玩家盈亏报表查看权限" title="403" />
</template>

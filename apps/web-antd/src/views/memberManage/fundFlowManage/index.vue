<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FundFlowListItem } from '#/types/fund-flow';
import type { GoldLogTemplateItem } from '#/utils/fund-flow';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  Result,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchFundFlowListApi } from '#/api/memberManage/fund-flow';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import { enrichFundFlowItems, formatFundFlowRemark } from '#/utils/fund-flow';
import { formatGoldReason } from '#/utils/game-config';

defineOptions({ name: 'FundFlowManage' });

/** 对齐旧站 validLoginAccount */
const LOGIN_ACCOUNT_RE = /^[a-zA-Z0-9]{4,20}$/;
/** SearchTypeTwo limit-number=180 */
const MAX_RANGE_DAYS = 180;

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const { packageOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const canViewPage = computed(() => checkPermission(12_208));
const canOpenPlayer = computed(() => checkPermission(12_209));

function todayRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  const range = getTodayRangeSeconds();
  return [dayjs.unix(range.BeginTime), dayjs.unix(range.EndTime)];
}

const summary = ref({ SumAddGold: 0 });
const hasQueried = ref(false);

const summaryItems = computed(() => [
  {
    label: '账变总金额',
    value: formatAmountFromCent(summary.value.SumAddGold),
  },
]);

const filterLogId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterReason = ref<Array<number | string>>([]);
/** 对齐旧站：0 正式 / 2 全部 */
const filterDataSearchType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(todayRange());

const reasonOptions = computed(() =>
  gameConfig.value.goldSource.map((item) => ({
    label: item.Name || String(item.Key),
    value: item.Key,
  })),
);

const packageSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
]);

const dataSearchTypeOptions = [
  { label: '全部', value: 2 },
  { label: '正式数据', value: 0 },
];

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function normalizeLoginAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
}

function getQueryParams(extra?: { Page?: number; PageSize?: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    DataSearchType: filterDataSearchType.value,
    EndTime: end ? end.unix() : '',
    LogId: filterLogId.value.trim(),
    LoginAccount: normalizeLoginAccount(filterLoginAccount.value),
    PackageId: filterPackageId.value,
    Reason: filterReason.value,
    ...extra,
  };
}

function validateBeforeQuery() {
  const logId = filterLogId.value.trim();
  const account = normalizeLoginAccount(filterLoginAccount.value);
  if (!logId && !account) {
    message.warning('请输入订单号或游戏账号');
    return false;
  }
  if (account && !LOGIN_ACCOUNT_RE.test(account)) {
    message.warning('请输入正确的游戏账号');
    return false;
  }
  const [begin, end] = filterDateRange.value || [];
  if (begin && end) {
    const days = end.startOf('day').diff(begin.startOf('day'), 'day');
    if (days > MAX_RANGE_DAYS) {
      message.warning(`查询时间范围不能超过 ${MAX_RANGE_DAYS} 天`);
      return false;
    }
  }
  return true;
}

const gridOptions: VxeTableGridOptions<FundFlowListItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '时间',
    },
    { field: 'LogId', minWidth: 180, title: '订单号' },
    { field: 'Username', minWidth: 120, title: '推广账号' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'ChannelName', minWidth: 120, title: '渠道名称' },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'Reason',
      formatter: ({ cellValue }) =>
        formatGoldReason(cellValue, gameConfig.value.goldSource),
      minWidth: 140,
      title: '账变类型',
    },
    {
      field: 'AddGold',
      minWidth: 120,
      slots: { default: 'addGold' },
      title: '账变金额',
    },
    {
      field: 'OldGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '账变前余额',
    },
    {
      field: 'NewGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '账变后余额',
    },
    {
      field: 'remark',
      formatter: ({ row }) => formatFundFlowRemark(row),
      minWidth: 220,
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
        if (!hasQueried.value) {
          return { items: [], total: 0 };
        }
        const result = await fetchFundFlowListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        const templates = (projectConfig.value?.GoldLogTemplate ||
          []) as GoldLogTemplateItem[];
        const items = enrichFundFlowItems(
          (result.Items || []) as FundFlowListItem[],
          templates,
          gameConfig.value,
        );
        summary.value = {
          SumAddGold: Number(result.MoreItems?.SumAddGold || 0),
        };
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  if (!validateBeforeQuery()) {
    return;
  }
  hasQueried.value = true;
  gridApi.reload();
}

function handleReset() {
  filterLogId.value = '';
  filterLoginAccount.value = '';
  filterPackageId.value = '';
  filterReason.value = [];
  filterDataSearchType.value = 0;
  filterDateRange.value = todayRange();
  hasQueried.value = false;
  summary.value = { SumAddGold: 0 };
  try {
    gridApi.grid?.loadData([]);
  } catch {
    // ignore
  }
}

onMounted(async () => {
  if (canViewPage.value) {
    await ensureGameConfig();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="会员管理 · 资金流管理"
    title="资金流管理"
  >
    <Card>
      <OpsListPanel>
        <template #filters>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterLogId"
              allow-clear
              @press-enter="handleSearch"
              placeholder="请输入订单号"
            >
              <template #addonBefore>订单号</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterLoginAccount"
              allow-clear
              @press-enter="handleSearch"
              placeholder="请输入游戏账号"
            >
              <template #addonBefore>游戏账号</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">所属产品</span>
              <Select
                v-model:value="filterPackageId"
                show-search
                option-filter-prop="label"
                :options="packageSelectOptions"
                placeholder="请选择所属产品"
              />
            </Space.Compact>
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">账变类型</span>
              <Select
                v-model:value="filterReason"
                allow-clear
                mode="multiple"
                :max-tag-count="1"
                show-search
                option-filter-prop="label"
                :options="reasonOptions"
                placeholder="请选择账变类型"
              />
            </Space.Compact>
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">数据类型</span>
              <Select
                v-model:value="filterDataSearchType"
                :options="dataSearchTypeOptions"
                placeholder="请选择数据类型"
              />
            </Space.Compact>
          </div>
          <div class="query-filter-wide">
            <QueryDatetimeRangePicker
              v-model="filterDateRange"
              label="时间范围"
              :max-range-days="MAX_RANGE_DAYS"
            />
          </div>
          <div class="query-filter-actions query-filter-actions-single">
            <Button :loading="loading" type="primary" @click="handleSearch">
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
          </div>
        </template>

        <template #summary>
          <SummaryCards :items="summaryItems" />
        </template>

        <Grid>
          <template #loginAccount="{ row }">
            <PlayerAccountLink
              v-if="canOpenPlayer && row.LoginAccount"
              :login-account="String(row.LoginAccount)"
              :permission-id="12209"
              :player-id="row.PlayerId"
            />
            <span v-else>{{ row.LoginAccount || '-' }}</span>
          </template>
          <template #addGold="{ row }">
            <span
              :class="
                Number(row.AddGold) < 0 ? 'text-red-500' : 'text-emerald-600'
              "
            >
              {{ formatAmountFromCent(row.AddGold) }}
            </span>
          </template>
        </Grid>
      </OpsListPanel>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无资金流管理查看权限" title="403" />
</template>

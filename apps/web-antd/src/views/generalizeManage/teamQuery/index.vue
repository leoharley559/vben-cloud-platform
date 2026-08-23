<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TeamQueryItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Breadcrumb,
  Button,
  Card,
  Input,
  message,
  Result,
  Space,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchTeamQueryListApi } from '#/api/promotion/team-query';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  formatCommissionRate,
  formatTeamQueryMoney,
  sumTeamQueryStats,
} from '#/utils/promotion';

defineOptions({ name: 'TeamQuery' });

const { adminInfo, checkPermission } = useCloudPermission();

const canViewPage = computed(() => checkPermission(10_867));

const defaultBegin = dayjs().subtract(30, 'day').startOf('day');
const defaultEnd = dayjs().endOf('day');

const filterAdminUsername = ref('');
const filterAdminId = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const breadcrumbItems = ref<Array<{ id: number | string; name: string }>>([]);
const summary = ref(sumTeamQueryStats());
let latestRequestId = 0;
let latestResult: { items: TeamQueryItem[]; total: number } = {
  items: [],
  total: 0,
};

function getAdminName() {
  const admin = adminInfo.value?.Admin as undefined | { Username?: string };
  return admin?.Username || String(adminInfo.value?.Account || '我的账号');
}

function resetBreadcrumb() {
  breadcrumbItems.value = [{ id: '', name: getAdminName() }];
  filterAdminId.value = '';
}

function getQueryParams(page?: { currentPage?: number; pageSize?: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminId: filterAdminId.value ?? '',
    AdminUsername: filterAdminUsername.value.trim(),
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    Page: page?.currentPage || 1,
    PageSize: page?.pageSize || 20,
    Sort: '',
  };
}

async function loadData(page?: { currentPage?: number; pageSize?: number }) {
  const requestId = ++latestRequestId;
  const [begin, end] = filterDateRange.value || [];
  if (!begin || !end) {
    message.warning('请选择统计时间');
    latestResult = { items: [], total: 0 };
    summary.value = sumTeamQueryStats();
    return { items: [], total: 0 };
  }
  if (end.diff(begin, 'day') > 30) {
    message.warning('统计时间最多选择 31 个自然日');
    latestResult = { items: [], total: 0 };
    summary.value = sumTeamQueryStats();
    return { items: [], total: 0 };
  }
  try {
    const result = await fetchTeamQueryListApi(getQueryParams(page));
    if (requestId !== latestRequestId) return latestResult;
    const items = Array.isArray(result.Items) ? result.Items : [];
    latestResult = {
      items,
      total: Number(result.Pagination?.MaxCount ?? items.length),
    };
    summary.value = sumTeamQueryStats(items);
    return latestResult;
  } catch {
    if (requestId === latestRequestId) {
      latestResult = { items: [], total: 0 };
      summary.value = sumTeamQueryStats();
    }
    return { items: [], total: 0 };
  }
}

const gridOptions: VxeTableGridOptions<TeamQueryItem> = {
  columns: [
    {
      field: 'AdminUsername',
      minWidth: 140,
      slots: { default: 'adminUsername' },
      title: '推广账号',
    },
    { field: 'AdminName', minWidth: 120, title: '推广名称' },
    {
      field: 'CommissionRate',
      formatter: ({ cellValue }) => formatCommissionRate(cellValue),
      minWidth: 110,
      title: '分成比例',
    },
    {
      field: 'SumNextReg',
      formatter: ({ row }) =>
        String(Number(row.SumNextReg || 0) + Number(row.SumSelfReg || 0)),
      minWidth: 100,
      title: '注册人数',
    },
    {
      field: 'SumNextPayMergerNum',
      formatter: ({ row }) =>
        String(
          Number(row.SumNextPayMergerNum || 0) +
            Number(row.SumSelfPayMergerNum || 0),
        ),
      minWidth: 100,
      title: '充值人数',
    },
    {
      field: 'SumNextPayMergerMoney',
      formatter: ({ row }) =>
        formatTeamQueryMoney(
          Number(row.SumNextPayMergerMoney || 0) +
            Number(row.SumSelfPayMergerMoney || 0),
        ),
      minWidth: 120,
      title: '充值金额',
    },
    {
      field: 'SumNextBetGameMoney',
      formatter: ({ row }) =>
        formatTeamQueryMoney(
          Number(row.SumNextBetGameMoney || 0) +
            Number(row.SumSelfBetGameMoney || 0),
        ),
      minWidth: 120,
      title: '流水金额',
    },
    {
      field: 'SumNextGameTax',
      formatter: ({ row }) =>
        formatTeamQueryMoney(
          Number(row.SumNextGameTax || 0) + Number(row.SumSelfGameTax || 0),
        ),
      minWidth: 120,
      slots: { header: 'taxHeader' },
      title: '税收',
    },
    {
      field: 'SumNextIncomeMoney',
      formatter: ({ row }) =>
        formatTeamQueryMoney(
          Number(row.SumNextIncomeMoney || 0) +
            Number(row.SumSelfIncomeMoney || 0),
        ),
      minWidth: 120,
      title: '收入',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => loadData(page),
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const summaryItems = computed(() => [
  { label: '注册人数总计', value: summary.value.reg },
  { label: '充值人数总计', value: summary.value.pay },
  {
    label: '充值金额总计',
    value: formatTeamQueryMoney(summary.value.payMoney),
  },
  {
    label: '流水金额总计',
    value: formatTeamQueryMoney(summary.value.betMoney),
  },
  {
    label: '预计税收总计',
    value: formatTeamQueryMoney(summary.value.taxMoney),
  },
  {
    label: '预计收入总计',
    value: formatTeamQueryMoney(summary.value.incomeMoney),
  },
]);

function handleSearch() {
  resetBreadcrumb();
  gridApi.reload();
}

function handleReset() {
  filterAdminUsername.value = '';
  filterDateRange.value = [defaultBegin, defaultEnd];
  resetBreadcrumb();
  gridApi.reload();
}

function handleBreadcrumbClick(index: number) {
  const item = breadcrumbItems.value[index];
  if (!item) {
    return;
  }
  breadcrumbItems.value = breadcrumbItems.value.slice(0, index + 1);
  filterAdminId.value = item.id;
  gridApi.reload();
}

onMounted(() => {
  if (canViewPage.value) {
    resetBreadcrumb();
    gridApi.reload();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 分销列表"
    title="分销列表"
  >
    <Card size="small">
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <Space.Compact>
            <span class="query-field-addon">推广账号</span>
            <Input
              v-model:value="filterAdminUsername"
              allow-clear
              placeholder="请输入推广账号"
              @keydown.space.prevent
              @press-enter="handleSearch"
            />
          </Space.Compact>
          <div class="query-filter-wide">
            <QueryDatetimeRangePicker
              v-model="filterDateRange"
              label="统计时间"
              :max-range-days="30"
            />
          </div>
          <div class="query-filter-actions query-filter-actions-single">
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </div>
        </div>
      </div>

      <div class="hierarchy-panel">
        <div class="mb-2 text-sm text-gray-500">层级关系</div>
        <Breadcrumb>
          <Breadcrumb.Item
            v-for="(item, index) in breadcrumbItems"
            :key="`${item.id}-${index}`"
          >
            <a @click.prevent="handleBreadcrumbClick(index)">{{ item.name }}</a>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <SummaryCards :items="summaryItems" />

      <div class="mb-3 text-base font-medium">下级列表</div>
      <Grid>
        <template #taxHeader>
          <span class="inline-flex items-center gap-1">
            税收
            <Tooltip title="税收：单人游戏按流水的 1.5%，多人游戏按流水的 2.5%；收入按税收与分成比例计算。">
              <span class="cursor-help text-gray-400">ⓘ</span>
            </Tooltip>
          </span>
        </template>
        <template #adminUsername="{ row }">
          <AgencyAccountLink
            :admin-id="row.AdminId"
            :username="row.AdminUsername"
          />
        </template>
      </Grid>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无分销列表查看权限" title="403" />
</template>

<style scoped>
.hierarchy-panel {
  padding: 12px 16px;
  margin-bottom: 16px;
  background: hsl(var(--muted) / 25%);
  border-left: 3px solid hsl(var(--primary));
  border-radius: 8px;
}
</style>

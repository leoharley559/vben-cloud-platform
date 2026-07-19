<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TeamQueryItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Breadcrumb,
  Button,
  DatePicker,
  Input,
  Result,
  Statistic,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchTeamQueryListApi } from '#/api/promotion/team-query';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  formatCommissionRate,
  formatTeamQueryMoney,
  sumTeamQueryStats,
} from '#/utils/promotion';

defineOptions({ name: 'TeamQuery' });

const { adminInfo, checkPermission, projectConfig } = useCloudPermission();

const canViewPage = computed(() => checkPermission(10867));

const defaultBegin = dayjs().subtract(31, 'day').startOf('day');
const defaultEnd = dayjs().subtract(1, 'day').endOf('day');

const filterAdminUsername = ref('');
const filterAdminId = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const breadcrumbItems = ref<Array<{ id: number | string; name: string }>>([]);
const summary = ref(sumTeamQueryStats());

const canDrillDown = computed(() => {
  const accountInfo = projectConfig.value?.AccountInfo as
    | { AdminId?: number | string }
    | undefined;
  const agentAccount = projectConfig.value?.AgentAccount as
    | { Id?: number | string }
    | undefined;
  return String(accountInfo?.AdminId) === String(agentAccount?.Id);
});

function getAdminName() {
  const admin = adminInfo.value?.Admin as { Username?: string } | undefined;
  return admin?.Username || String(adminInfo.value?.Account || '我的账号');
}

function resetBreadcrumb() {
  breadcrumbItems.value = [{ id: '', name: getAdminName() }];
  filterAdminId.value = '';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminId: filterAdminId.value,
    AdminUsername: filterAdminUsername.value,
    BeginTime: begin ? begin.startOf('day').unix() : defaultBegin.unix(),
    EndTime: end ? end.endOf('day').unix() : defaultEnd.unix(),
    Page: 1,
    PageSize: 200,
  };
}

async function loadData() {
  const result = await fetchTeamQueryListApi(getQueryParams());
  const items = result.Items || [];
  summary.value = sumTeamQueryStats(items);
  return items;
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
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const items = await loadData();
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  resetBreadcrumb();
  gridApi.reload();
}

function handleDrillDown(row: TeamQueryItem) {
  if (!canDrillDown.value || !row.AdminId) {
    return;
  }
  filterAdminId.value = row.AdminId;
  breadcrumbItems.value.push({
    id: row.AdminId,
    name: row.AdminName || row.AdminUsername || String(row.AdminId),
  });
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterAdminUsername"
        allow-clear
        placeholder="推广账号"
        style="width: 240px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>推广账号</template>
      </Input>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">统计时间</span>
        <DatePicker.RangePicker v-model:value="filterDateRange" />
      </div>
      <Button type="primary" @click="handleSearch">查询</Button>
    </div>

    <div class="mb-4 rounded bg-gray-50 p-3">
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

    <div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <Statistic title="注册人数总计" :value="summary.reg" />
      <Statistic title="充值人数总计" :value="summary.pay" />
      <Statistic
        title="充值金额总计"
        :value="formatTeamQueryMoney(summary.payMoney)"
      />
      <Statistic
        title="流水金额总计"
        :value="formatTeamQueryMoney(summary.betMoney)"
      />
      <Statistic
        title="预计税收总计"
        :value="formatTeamQueryMoney(summary.taxMoney)"
      />
      <Statistic
        title="预计收入总计"
        :value="formatTeamQueryMoney(summary.incomeMoney)"
      />
    </div>

    <Grid>
      <template #adminUsername="{ row }">
        <Button
          v-if="canDrillDown"
          size="small"
          type="link"
          @click="handleDrillDown(row)"
        >
          {{ row.AdminUsername }}
        </Button>
        <span v-else>{{ row.AdminUsername }}</span>
      </template>
    </Grid>
  </Page>
  <Result v-else status="403" sub-title="无分销列表查看权限" title="403" />
</template>

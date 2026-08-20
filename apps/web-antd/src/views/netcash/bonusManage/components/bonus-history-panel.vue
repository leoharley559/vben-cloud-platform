<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BonusManageItem } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import { Button, Input, message, Select, Space, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchBonusHistoryListApi } from '#/api/netcash/bonus-manage';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

import {
  bonusOptions,
  exportWorkbook,
  statusColor,
  statusOptions,
  statusText,
  todayRange,
  walletOptions,
} from '../shared';

defineOptions({ name: 'BonusHistoryPanel' });

const { checkPermission } = useCloudPermission();
const canExportHistory = computed(() => checkPermission(11_367));

const historyFilters = reactive({
  ApplyDesc: '',
  ApplyName: '',
  Approve: '' as number | string,
  ApproveDesc: '',
  ApproveName: '',
  BonusType: '' as number | string,
  Username: '',
  WalletType: '' as number | string,
});
const historyApplyRange = ref(todayRange());
const historyApproveRange = ref(todayRange());
const historyTotalAmount = ref(0);
const historyTotalRealAmount = ref(0);
const exportLoading = ref(false);

const historySummaryItems = computed(() => [
  {
    label: '申请金额汇总',
    value: formatAmountFromCent(historyTotalAmount.value),
  },
  {
    label: '支付金额汇总',
    value: formatAmountFromCent(historyTotalRealAmount.value),
  },
]);

function historyQuery(
  page?: { currentPage: number; pageSize: number },
  isExport = false,
) {
  const [applyBegin, applyEnd] = historyApplyRange.value || [];
  const [approveBegin, approveEnd] = historyApproveRange.value || [];
  return {
    ...historyFilters,
    ApproveBeginTime: approveBegin ? approveBegin.unix() : '',
    ApproveEndTime: approveEnd ? approveEnd.unix() : '',
    BeginTime: applyBegin ? applyBegin.unix() : '',
    EndTime: applyEnd ? applyEnd.unix() : '',
    IsExp: isExport,
    Page: isExport ? 1 : (page?.currentPage ?? 1),
    PageSize: isExport ? 10_000 : (page?.pageSize ?? 20),
  };
}

const gridOptions: VxeTableGridOptions<BonusManageItem> = {
  columns: [
    {
      field: 'Approve',
      minWidth: 100,
      slots: { default: 'approve' },
      title: '状态',
    },
    {
      field: 'OrderId',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'Username',
      minWidth: 130,
      slots: { default: 'username' },
      title: '代理账号',
    },
    {
      field: 'WalletType',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 1 ? '佣金钱包' : '-',
      minWidth: 110,
      title: '钱包类型',
    },
    {
      field: 'BonusType',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 1 ? '代理红利' : '-',
      minWidth: 110,
      title: '红利类型',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    { field: 'ApplyName', minWidth: 120, title: '申请账号' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '申请金额',
    },
    {
      field: 'ApplyDesc',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '申请备注',
    },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
    { field: 'ApproveName', minWidth: 120, title: '审核账号' },
    {
      field: 'RealAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '支付金额',
    },
    {
      field: 'ApproveDesc',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '审核备注',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchBonusHistoryListApi(historyQuery(page));
        historyTotalAmount.value = Number(result?.Total?.Total || 0);
        historyTotalRealAmount.value = Number(result?.Total?.TotalReal || 0);
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
  showFooter: true,
  footerMethod: () => [
    [
      '合计',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      formatAmountFromCent(historyTotalAmount.value),
      '-',
      '-',
      '-',
      formatAmountFromCent(historyTotalRealAmount.value),
      '-',
    ],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function resetHistory() {
  Object.assign(historyFilters, {
    ApplyDesc: '',
    ApplyName: '',
    Approve: '',
    ApproveDesc: '',
    ApproveName: '',
    BonusType: '',
    Username: '',
    WalletType: '',
  });
  historyApplyRange.value = todayRange();
  historyApproveRange.value = todayRange();
  gridApi.reload();
}

async function exportHistory() {
  exportLoading.value = true;
  try {
    const result = await fetchBonusHistoryListApi(
      historyQuery(undefined, true),
    );
    const rows = result.Items || [];
    if (rows.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }
    exportWorkbook(
      rows.map((row) => [
        statusText(row.Approve),
        String(row.OrderId || ''),
        String(row.Username || ''),
        Number(row.WalletType) === 1
          ? '佣金钱包'
          : String(row.WalletType || ''),
        Number(row.BonusType) === 1 ? '代理红利' : String(row.BonusType || ''),
        formatNetcashDateTime(row.CreateTime),
        String(row.ApplyName || ''),
        Number((Number(row.Amount || 0) / 100).toFixed(2)),
        String(row.ApplyDesc || ''),
        formatNetcashDateTime(row.ApproveTime),
        String(row.ApproveName || ''),
        Number((Number(row.RealAmount || 0) / 100).toFixed(2)),
        String(row.ApproveDesc || ''),
      ]),
      [
        '状态',
        '订单编号',
        '代理账号',
        '钱包类型',
        '红利类型',
        '申请时间',
        '申请账号',
        '申请金额',
        '申请备注',
        '审核时间',
        '审核账号',
        '支付金额',
        '审核备注',
      ],
      `红利历史记录_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`,
    );
  } catch {
    message.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  gridApi.reload();
});
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="historyFilters.Username"
            allow-clear
            placeholder="请输入代理账号"
          >
            <template #addonBefore>代理账号</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">钱包类型</span>
          <Select
            v-model:value="historyFilters.WalletType"
            :options="walletOptions"
            placeholder="请选择钱包类型"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">红利类型</span>
          <Select
            v-model:value="historyFilters.BonusType"
            :options="bonusOptions"
            placeholder="请选择红利类型"
          />
        </Space.Compact>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="historyFilters.ApplyName"
            allow-clear
            placeholder="请输入申请账号"
          >
            <template #addonBefore>申请账号</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="historyFilters.ApplyDesc"
            allow-clear
            placeholder="请输入申请备注"
          >
            <template #addonBefore>申请备注</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">审核状态</span>
          <Select
            v-model:value="historyFilters.Approve"
            :options="statusOptions"
            placeholder="请选择审核状态"
          />
        </Space.Compact>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="historyFilters.ApproveName"
            allow-clear
            placeholder="请输入审核账号"
          >
            <template #addonBefore>审核账号</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="historyFilters.ApproveDesc"
            allow-clear
            placeholder="请输入审核备注"
          >
            <template #addonBefore>审核备注</template>
          </Input>
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="historyApplyRange"
            label="申请时间"
          />
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="historyApproveRange"
            label="审核时间"
          />
        </div>
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
            查询
          </Button>
          <Button @click="resetHistory">重置</Button>
          <Button
            v-if="canExportHistory"
            :loading="exportLoading"
            @click="exportHistory"
          >
            导出 Excel
          </Button>
        </div>
      </div>
    </div>

    <SummaryCards :items="historySummaryItems" />

    <Grid>
      <template #approve="{ row }">
        <Tag :color="statusColor(row.Approve)">
          {{ statusText(row.Approve) }}
        </Tag>
      </template>
      <template #username="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :username="row.Username"
        />
      </template>
    </Grid>
  </div>
</template>

<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { BonusManageItem } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  message,
  Pagination,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchBonusHistoryListApi } from '#/api/netcash/bonus-manage';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
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
const historyApplyRange = ref<[Dayjs, Dayjs]>(todayRange());
const historyApproveRange = ref<[Dayjs, Dayjs]>(todayRange());
const historyRows = ref<BonusManageItem[]>([]);
const historyLoading = ref(false);
const historyExporting = ref(false);
const historyPage = ref(1);
const historyPageSize = ref(20);
const historyTotal = ref(0);
const historyTotalAmount = ref(0);
const historyTotalRealAmount = ref(0);

const historySummaryItems = computed(() => [
  {
    label: '申请金额汇总',
    value: formatAmountFromCent(historyTotalAmount.value),
    valueClass: 'text-red-500',
  },
  {
    label: '支付金额汇总',
    value: formatAmountFromCent(historyTotalRealAmount.value),
    valueClass: 'text-red-500',
  },
]);

function historyQuery(isExport = false) {
  const [applyBegin, applyEnd] = historyApplyRange.value || todayRange();
  const [approveBegin, approveEnd] = historyApproveRange.value || todayRange();
  return {
    ...historyFilters,
    ApproveBeginTime: approveBegin.startOf('day').unix(),
    ApproveEndTime: approveEnd.endOf('day').unix(),
    BeginTime: applyBegin.startOf('day').unix(),
    EndTime: applyEnd.endOf('day').unix(),
    IsExp: isExport,
    Page: isExport ? 1 : historyPage.value,
    PageSize: isExport ? 9999 : historyPageSize.value,
  };
}

async function loadHistory() {
  historyLoading.value = true;
  try {
    const result = await fetchBonusHistoryListApi(historyQuery());
    historyRows.value = result.Items || [];
    historyTotal.value = Number(result.Pagination?.MaxCount || 0);
    historyTotalAmount.value = Number(result.Total?.Total || 0);
    historyTotalRealAmount.value = Number(result.Total?.TotalReal || 0);
  } catch {
    historyRows.value = [];
    historyTotal.value = 0;
    historyTotalAmount.value = 0;
    historyTotalRealAmount.value = 0;
  } finally {
    historyLoading.value = false;
  }
}

function searchHistory() {
  historyPage.value = 1;
  void loadHistory();
}

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
  searchHistory();
}

async function exportHistory() {
  historyExporting.value = true;
  try {
    const result = await fetchBonusHistoryListApi(historyQuery(true));
    const rows = result.Items || [];
    if (rows.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }
    exportWorkbook(
      rows.map((row) => [
        statusText(row.Approve),
        String(row.OrderId || ''),
        String(row.Username || ''),
        Number(row.WalletType) === 1 ? '佣金钱包' : String(row.WalletType || ''),
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
    historyExporting.value = false;
  }
}

const historyColumns = [
  {
    customRender: ({ index }: { index: number }) =>
      (historyPage.value - 1) * historyPageSize.value + index + 1,
    key: 'index',
    title: '序号',
    width: 70,
  },
  { dataIndex: 'Approve', key: 'Approve', title: '状态', width: 100 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单编号', width: 160 },
  { dataIndex: 'Username', key: 'Username', title: '代理账号', width: 130 },
  { dataIndex: 'WalletType', key: 'WalletType', title: '钱包类型', width: 110 },
  { dataIndex: 'BonusType', key: 'BonusType', title: '红利类型', width: 110 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '申请时间', width: 170 },
  { dataIndex: 'ApplyName', key: 'ApplyName', title: '申请账号', width: 120 },
  { dataIndex: 'Amount', key: 'Amount', title: '申请金额', width: 120 },
  { dataIndex: 'ApplyDesc', key: 'ApplyDesc', title: '申请备注', width: 180 },
  { dataIndex: 'ApproveTime', key: 'ApproveTime', title: '审核时间', width: 170 },
  { dataIndex: 'ApproveName', key: 'ApproveName', title: '审核账号', width: 120 },
  { dataIndex: 'RealAmount', key: 'RealAmount', title: '支付金额', width: 120 },
  { dataIndex: 'ApproveDesc', key: 'ApproveDesc', title: '审核备注', width: 180 },
];

onMounted(() => {
  void loadHistory();
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Input
        v-model:value="historyFilters.Username"
        allow-clear
        placeholder="代理账号"
        style="width: 220px"
      >
        <template #addonBefore>代理账号</template>
      </Input>
      <Select
        v-model:value="historyFilters.WalletType"
        class="w-36"
        :options="walletOptions"
      />
      <Select
        v-model:value="historyFilters.BonusType"
        class="w-36"
        :options="bonusOptions"
      />
      <Input
        v-model:value="historyFilters.ApplyName"
        allow-clear
        placeholder="申请账号"
        style="width: 220px"
      >
        <template #addonBefore>申请账号</template>
      </Input>
      <Input
        v-model:value="historyFilters.ApplyDesc"
        allow-clear
        placeholder="申请备注"
        style="width: 220px"
      >
        <template #addonBefore>申请备注</template>
      </Input>
      <Select
        v-model:value="historyFilters.Approve"
        class="w-36"
        :options="statusOptions"
      />
      <Input
        v-model:value="historyFilters.ApproveName"
        allow-clear
        placeholder="审核账号"
        style="width: 220px"
      >
        <template #addonBefore>审核账号</template>
      </Input>
      <Input
        v-model:value="historyFilters.ApproveDesc"
        allow-clear
        placeholder="审核备注"
        style="width: 220px"
      >
        <template #addonBefore>审核备注</template>
      </Input>
      <span class="text-gray-500">申请时间</span>
      <DatePicker.RangePicker v-model:value="historyApplyRange" />
      <span class="text-gray-500">审核时间</span>
      <DatePicker.RangePicker v-model:value="historyApproveRange" />
      <Button type="primary" @click="searchHistory">查询</Button>
      <Button @click="resetHistory">重置</Button>
    </div>
    <div class="mb-3 flex items-center justify-between">
      <SummaryCards :items="historySummaryItems" />
      <Button
        v-if="canExportHistory"
        type="primary"
        :loading="historyExporting"
        @click="exportHistory"
      >
        导出 Excel
      </Button>
    </div>
    <Table
      :columns="historyColumns"
      :data-source="historyRows"
      :loading="historyLoading"
      :pagination="false"
      :row-key="(row: BonusManageItem) => String(row.Id || row.OrderId || '')"
      :scroll="{ x: 1900 }"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <Tag v-if="column.key === 'Approve'" :color="statusColor(record.Approve)">
          {{ statusText(record.Approve) }}
        </Tag>
        <template v-else-if="column.key === 'Username'">
          <AgencyAccountLink
            :admin-id="resolveAgencyAdminId(record)"
            :username="record.Username"
          />
        </template>
        <template v-else-if="column.key === 'WalletType'">
          {{ Number(record.WalletType) === 1 ? '佣金钱包' : '-' }}
        </template>
        <template v-else-if="column.key === 'BonusType'">
          {{ Number(record.BonusType) === 1 ? '代理红利' : '-' }}
        </template>
        <template
          v-else-if="
            column.key === 'CreateTime' || column.key === 'ApproveTime'
          "
        >
          {{ formatNetcashDateTime(record[column.key]) }}
        </template>
        <template
          v-else-if="column.key === 'Amount' || column.key === 'RealAmount'"
        >
          {{ formatAmountFromCent(Number(record[column.key] || 0)) }}
        </template>
      </template>
    </Table>
    <div class="mt-4 flex justify-end">
      <Pagination
        v-model:current="historyPage"
        v-model:page-size="historyPageSize"
        :total="historyTotal"
        show-size-changer
        show-quick-jumper
        @change="loadHistory"
      />
    </div>
  </div>
</template>

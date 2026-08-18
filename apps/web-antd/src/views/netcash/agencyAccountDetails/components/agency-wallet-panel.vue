<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Card,
  DatePicker,
  Empty,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';

import {
  fetchAgentBonusInfoApi,
  fetchAgentCommissionInfoApi,
  fetchAgentWalletBalanceApi,
  fetchAgentWalletLogApi,
} from '#/api/netcash/agency-account-details';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

const props = defineProps<{
  adminId: string;
  wallet: 'commission' | 'credit';
}>();
const { checkPermission } = useCloudPermission();
type DataRow = Record<string, unknown>;

const isCommission = computed(() => props.wallet === 'commission');
const activeTab = ref('account');
const loading = ref(false);
const exporting = ref(false);
const balance = ref(0);
const rows = ref<DataRow[]>([]);
const totalData = ref<Record<string, number>>({});
const pager = reactive({ current: 1, pageSize: 20, total: 0 });
const month = ref<Dayjs | undefined>(dayjs().subtract(1, 'month'));
const bonusType = ref<number | string>('');
const approve = ref<number | string>('');
const transferType = ref<number | string>('');
/** 帐变记录默认近 7 天（旧站 transactionLog 同样带时间窗） */
const logDateRange = ref<[Dayjs, Dayjs]>([
  dayjs().subtract(7, 'day').startOf('day'),
  dayjs().endOf('day'),
]);
/** 对齐旧站 bonusInfo：默认今天 */
const bonusDateRange = ref<[Dayjs, Dayjs]>([
  dayjs().startOf('day'),
  dayjs().endOf('day'),
]);

const transferTypeMap: Record<number, string> = {
  1: '代理转账',
  2: '代理代存-代充',
  3: '额度调整',
  4: '推广红利',
  5: '代客充值',
  6: '佣金提款',
  7: '佣金发放',
  8: '手动还款',
  9: '佣金发放抵扣',
  10: '代理代存-红利',
  11: '佣金调整',
};
const transferOptions = computed(() => {
  const types = isCommission.value ? [1, 2, 4, 6, 7, 10, 11] : [1, 2, 3, 10];
  return [
    { label: '全部', value: '' },
    ...types.map((value) => ({ label: transferTypeMap[value], value })),
  ];
});

const tabs = computed(() => {
  // 对齐旧站：外层按钮权限控制 Tab 可见；内容区各自再校验内层权限
  if (isCommission.value) {
    return [
      {
        contentPerm: 11_773,
        key: 'account',
        label: '代理账户信息',
        visible: checkPermission(11_769),
      },
      {
        contentPerm: 11_774,
        key: 'commission',
        label: '佣金信息',
        visible: checkPermission(11_770),
      },
      {
        contentPerm: 11_776,
        key: 'bonus',
        label: '红利信息',
        visible: checkPermission(11_771),
      },
      {
        contentPerm: 11_778,
        key: 'log',
        label: '帐变记录',
        visible: checkPermission(11_772),
      },
    ].filter((item) => item.visible);
  }
  return [
    {
      contentPerm: 11_780,
      key: 'account',
      label: '代理账户信息',
      visible: checkPermission(11_740),
    },
    {
      contentPerm: 11_782,
      key: 'log',
      label: '帐变记录',
      visible: checkPermission(11_741),
    },
  ].filter((item) => item.visible);
});

const canActiveContent = computed(() => {
  const tab = tabs.value.find((item) => item.key === activeTab.value);
  return tab ? checkPermission(tab.contentPerm) : false;
});

const commissionColumns = [
  { dataIndex: 'ReportMonth', key: 'ReportMonth', title: '佣金月份' },
  { dataIndex: 'Members', key: 'Members', title: '下线会员' },
  { dataIndex: 'ActivityUserNum', key: 'ActivityUserNum', title: '活跃会员' },
  { dataIndex: 'DepositAmount', key: 'DepositAmount', title: '存款金额' },
  { dataIndex: 'WithdrawAmount', key: 'WithdrawAmount', title: '提款金额' },
  { dataIndex: 'WinLoss', key: 'WinLoss', title: '总输赢' },
  { dataIndex: 'ApiFeeTotal', key: 'ApiFeeTotal', title: '场馆费' },
  { dataIndex: 'RedGold', key: 'RedGold', title: '红利' },
  { dataIndex: 'BackWaterGold', key: 'BackWaterGold', title: '返水' },
  { dataIndex: 'MoneyChange', key: 'MoneyChange', title: '账户调整' },
  { dataIndex: 'CleanBetWinTotal', key: 'CleanBetWinTotal', title: '净输赢' },
  {
    dataIndex: 'LastMonthCleanBetWinTotal',
    key: 'LastMonthCleanBetWinTotal',
    title: '上月结余',
  },
  {
    dataIndex: 'CleanBetWinLoss',
    key: 'CleanBetWinLoss',
    title: '冲正后净输赢',
  },
  { dataIndex: 'CommissionRate', key: 'CommissionRate', title: '佣金比例' },
  {
    dataIndex: 'CommissionChangeAmount',
    key: 'CommissionChangeAmount',
    title: '佣金调整',
  },
  { dataIndex: 'Commission', key: 'Commission', title: '佣金' },
  { dataIndex: 'SettlementName', key: 'SettlementName', title: '发放人员' },
  { dataIndex: 'SettlementTime', key: 'SettlementTime', title: '发放时间' },
];
const bonusColumns = [
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单号' },
  { dataIndex: 'Approve', key: 'Approve', title: '订单状态' },
  { dataIndex: 'BonusType', key: 'BonusType', title: '红利类型' },
  { dataIndex: 'Amount', key: 'Amount', title: '红利金额' },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '申请时间' },
  { dataIndex: 'ApplyDesc', key: 'ApplyDesc', title: '申请备注' },
  { dataIndex: 'ApproveDesc', key: 'ApproveDesc', title: '审核备注' },
  { dataIndex: 'ApproveName', key: 'ApproveName', title: '发放人' },
  { dataIndex: 'ApproveTime', key: 'ApproveTime', title: '发放时间' },
];
const logColumns = [
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单号' },
  { dataIndex: 'TransferType', key: 'TransferType', title: '帐变类型' },
  {
    dataIndex: 'AdjustAmountBef',
    key: 'AdjustAmountBef',
    title: '帐变前金额',
  },
  { dataIndex: 'AdjustAmount', key: 'AdjustAmount', title: '帐变金额' },
  {
    dataIndex: 'AdjustAmountAft',
    key: 'AdjustAmountAft',
    title: '帐变后金额',
  },
  { dataIndex: 'UpdateTime', key: 'UpdateTime', title: '帐变时间' },
  { dataIndex: 'ReviewNote', key: 'ReviewNote', title: '备注' },
];
const columns = computed(() =>
  activeTab.value === 'commission'
    ? commissionColumns
    : (activeTab.value === 'bonus'
      ? bonusColumns
      : logColumns),
);
const amountFields = new Set([
  'AdjustAmount',
  'AdjustAmountAft',
  'AdjustAmountBef',
  'Amount',
  'ApiFeeTotal',
  'BackWaterGold',
  'CleanBetWinLoss',
  'CleanBetWinTotal',
  'Commission',
  'CommissionChangeAmount',
  'DepositAmount',
  'LastMonthCleanBetWinTotal',
  'MoneyChange',
  'RedGold',
  'WinLoss',
  'WithdrawAmount',
]);

function query(isExp = false) {
  const base = {
    AdminId: props.adminId,
    IsExp: isExp,
    Page: pager.current,
    PageSize: pager.pageSize,
  };
  if (activeTab.value === 'commission') {
    return { ...base, ReportMonth: month.value?.format('YYYY-MM') || '' };
  }
  if (activeTab.value === 'bonus') {
    return {
      ...base,
      ApplyEndTime: bonusDateRange.value?.[1]?.unix() || '',
      ApplyStartTime: bonusDateRange.value?.[0]?.unix() || '',
      Approve: approve.value,
      BonusType: bonusType.value,
    };
  }
  return {
    ...base,
    TransferEndTime: logDateRange.value?.[1]?.unix() || '',
    TransferStartTime: logDateRange.value?.[0]?.unix() || '',
    TransferType: transferType.value,
    WalletType: isCommission.value ? 1 : 2,
  };
}

async function loadAccount(showMessage = false) {
  if (!canActiveContent.value) {
    balance.value = 0;
    return;
  }
  loading.value = true;
  try {
    const result = await fetchAgentWalletBalanceApi(props.adminId);
    balance.value = Number(
      result[isCommission.value ? 'Money' : 'Credit'] || 0,
    );
    if (showMessage) {
      const { message } = await import('ant-design-vue');
      message.success('余额已刷新');
    }
  } catch {
    balance.value = 0;
  } finally {
    loading.value = false;
  }
}

async function fetchRows(isExp = false) {
  if (activeTab.value === 'commission') {
    return fetchAgentCommissionInfoApi(query(isExp));
  }
  if (activeTab.value === 'bonus') {
    return fetchAgentBonusInfoApi(query(isExp));
  }
  return fetchAgentWalletLogApi(query(isExp));
}

async function load() {
  if (activeTab.value === 'account') {
    await loadAccount();
    return;
  }
  if (!canActiveContent.value) {
    rows.value = [];
    pager.total = 0;
    return;
  }
  loading.value = true;
  try {
    const result = await fetchRows();
    rows.value = result.Items || [];
    totalData.value = result.Total || {};
    pager.total = Number(result.Pagination?.MaxCount ?? rows.value.length);
  } catch {
    rows.value = [];
    totalData.value = {};
    pager.total = 0;
  } finally {
    loading.value = false;
  }
}

function canExport() {
  if (activeTab.value === 'commission') return checkPermission(11_775);
  if (activeTab.value === 'bonus') return checkPermission(11_777);
  return checkPermission(isCommission.value ? 11_779 : 11_783);
}

function displayValue(row: DataRow, key: string) {
  const value = row[key];
  if (amountFields.has(key)) return formatAmountFromCent(Number(value || 0));
  if (key === 'CommissionRate') return `${Number(value || 0)}%`;
  if (key === 'TransferType')
    return transferTypeMap[Number(value)] || String(value ?? '-');
  if (key === 'Approve')
    return (
      ({ 1: '待处理', 2: '已发放', 3: '已拒绝' } as Record<number, string>)[
        Number(value)
      ] || String(value ?? '-')
    );
  if (key === 'BonusType')
    return Number(value) === 1 ? '代理红利' : String(value ?? '-');
  if (
    ['ApproveTime', 'CreateTime', 'SettlementTime', 'UpdateTime'].includes(key)
  )
    return formatNetcashDateTime(value as number | string);
  return String(value ?? '-');
}

function summaryValue(key: string, index: number) {
  if (index === 0) return '总计';
  let totalKey: string | undefined;
  if (activeTab.value === 'commission') {
    totalKey = (
      {
        ApiFeeTotal: 'TotalApiFee',
        BackWaterGold: 'TotalBackWaterGold',
        CleanBetWinLoss: 'TotalCleanBetWinLoss',
        CleanBetWinTotal: 'TotalCleanBetWin',
        Commission: 'TotalCommission',
        CommissionChangeAmount: 'TotalCommissionChangeAmount',
        DepositAmount: 'TotalDepositAmount',
        LastMonthCleanBetWinTotal: 'TotalLastMonthCleanBetWin',
        MoneyChange: 'TotalMoneyChange',
        RedGold: 'TotalRedGold',
        WinLoss: 'TotalWinLoss',
        WithdrawAmount: 'TotalWithdrawalAmount',
      } as Record<string, string>
    )[key];
  } else if (activeTab.value === 'bonus') {
    totalKey = key === 'Amount' ? 'TotalBonusAmount' : undefined;
  } else {
    totalKey = (
      {
        AdjustAmount: 'TotalAdjustAmount',
        AdjustAmountAft: 'TotalAfterAdjustAmount',
        AdjustAmountBef: 'TotalBeforeAdjustAmount',
      } as Record<string, string>
    )[key];
  }
  return totalKey
    ? formatAmountFromCent(Number(totalData.value[totalKey] || 0))
    : '-';
}

async function exportRows() {
  exporting.value = true;
  try {
    const result = await fetchRows(true);
    const exportData = (result.Items || []).map((row) =>
      Object.fromEntries(
        columns.value.map((column) => [
          String(column.title),
          displayValue(row, String(column.key)),
        ]),
      ),
    );
    if (exportData.length === 0) return;
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(exportData),
      '数据',
    );
    XLSX.writeFile(
      book,
      `${isCommission.value ? '佣金钱包' : '代存钱包'}_${activeTab.value}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
    );
  } finally {
    exporting.value = false;
  }
}

function resetFilters() {
  pager.current = 1;
  month.value = dayjs().subtract(1, 'month');
  bonusType.value = '';
  approve.value = '';
  transferType.value = '';
  bonusDateRange.value = [dayjs().startOf('day'), dayjs().endOf('day')];
  logDateRange.value = [
    dayjs().subtract(7, 'day').startOf('day'),
    dayjs().endOf('day'),
  ];
  void load();
}

watch(
  tabs,
  (items) => {
    if (!items.some((item) => item.key === activeTab.value)) {
      activeTab.value = items[0]?.key || 'account';
    }
  },
  { immediate: true },
);
watch(activeTab, () => {
  pager.current = 1;
  rows.value = [];
  void load();
});
watch(() => props.adminId, load);
onMounted(load);
</script>

<template>
  <Tabs v-model:active-key="activeTab" type="line" size="small">
    <Tabs.TabPane
      v-for="item in tabs"
      :key="item.key"
      :tab="item.label"
    />
  </Tabs>

  <Card v-if="activeTab === 'account'" :loading="loading" size="small">
    <Empty
      v-if="!canActiveContent"
      description="无账户信息查看权限"
    />
    <Space v-else direction="vertical">
      <Statistic
        :precision="2"
        :title="isCommission ? '佣金账户余额（元）' : '代存钱包余额（元）'"
        :value="balance / 100"
      />
      <Button type="primary" @click="loadAccount(true)">刷新余额</Button>
    </Space>
  </Card>

  <div v-else class="space-y-3">
    <Empty
      v-if="!canActiveContent"
      :description="`无${activeTab === 'commission' ? '佣金' : activeTab === 'bonus' ? '红利' : '帐变'}查看权限`"
    />
    <template v-else>
    <div class="ops-query-scope mb-4">
    <div class="ops-query-filters">
            <DatePicker
        v-if="activeTab === 'commission'"
        v-model:value="month"
        picker="month"
        placeholder="佣金月份"
      />
      <template v-else-if="activeTab === 'bonus'">
        <Select
          v-model:value="bonusType"
          :options="[
            { label: '全部红利类型', value: '' },
            { label: '代理红利', value: 1 },
          ]"
        />
        <Select
          v-model:value="approve"
          :options="[
            { label: '全部订单状态', value: '' },
            { label: '待处理', value: 1 },
            { label: '已发放', value: 2 },
            { label: '已拒绝', value: 3 },
          ]"
        />
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="bonusDateRange" label="申请时间" />
        </div>
      </template>
      <template v-else>
        <Select
          v-model:value="transferType"
          :options="transferOptions"
        />
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="logDateRange" label="账变时间" />
        </div>
      </template>
        <div class="query-filter-actions">
          <Button type="primary" @click="load">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button
        v-if="canExport()"
        :loading="exporting"
        @click="exportRows"
      >
        导出全部
      </Button>
        </div>
    </div>
  </div>

    <Table
      bordered
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="{
        current: pager.current,
        pageSize: pager.pageSize,
        total: pager.total,
        showSizeChanger: true,
      }"
      :row-key="(row) => String(row.Id ?? row.OrderId ?? '')"
      :scroll="{ x: activeTab === 'commission' ? 2500 : 1100 }"
      size="small"
      @change="
        (page) => {
          pager.current = page.current || 1;
          pager.pageSize = page.pageSize || 20;
          load();
        }
      "
    >
      <template #bodyCell="{ column, record }">
        <span
          :class="
            amountFields.has(String(column.key)) &&
            Number(record[String(column.key)]) < 0
              ? 'text-red-500'
              : ''
          "
        >
          {{ displayValue(record, String(column.key)) }}
        </span>
      </template>
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell
              v-for="(column, index) in columns"
              :key="String(column.key)"
              :index="index"
            >
              {{ summaryValue(String(column.key), index) }}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>
    </template>
  </div>
</template>

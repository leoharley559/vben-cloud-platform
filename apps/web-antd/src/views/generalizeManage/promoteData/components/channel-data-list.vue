<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { ChannelDataItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Result, Select, Table, Tooltip } from 'ant-design-vue';

import {
  fetchChannelDataListApi,
  fetchExchangeRateListApi,
} from '#/api/promotion/promote-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  calcArppu,
  calcPercent,
  formatPromoteMoney,
  getPayMoney,
  getPayUserCount,
} from '#/utils/promotion-data';

import PromoteDataSearch from './promote-data-search.vue';

defineOptions({ name: 'ChannelDataList' });

interface ChannelDataRow extends ChannelDataItem {
  RowKey?: string;
  children?: ChannelDataRow[];
}

const { checkPermission } = useCloudPermission();
const canViewTable = computed(() => checkPermission(10_901));
const loading = ref(false);
const currentRate = ref(1);
const rateOptions = ref<Array<{ label: string; value: number }>>([]);
const searchRef = ref<InstanceType<typeof PromoteDataSearch>>();
const rows = ref<ChannelDataRow[]>([]);
const expandedKeys = ref<string[]>([]);

function numeric(row: ChannelDataItem, field: string) {
  return Number(
    (row as unknown as Record<string, unknown>)[field] || 0,
  );
}

function plainValue(row: ChannelDataRow, field: string) {
  return (row as unknown as Record<string, unknown>)[field] ?? '-';
}

function findTotal(
  totals: ChannelDataItem[],
  date: string,
  field: keyof ChannelDataItem,
) {
  return totals.find((item) => item.RegisterDate === date)?.[field];
}

function buildTree(
  items: ChannelDataItem[] = [],
  costs: Array<{ ReportDate?: string; SumCostMoney?: number }> = [],
  totals: ChannelDataItem[] = [],
) {
  const groups = new Map<string, ChannelDataItem[]>();
  for (const item of items) {
    const date = item.RegisterDate || item.NowDate || '-';
    groups.set(date, [...(groups.get(date) || []), item]);
  }
  for (const item of costs) {
    if (item.ReportDate && !groups.has(item.ReportDate)) {
      groups.set(item.ReportDate, []);
    }
  }
  return [...groups.entries()].map(([date, children]) => {
    const cost =
      costs.find((item) => item.ReportDate === date)?.SumCostMoney || 0;
    const childRows = children.map((item, index) => ({
      ...item,
      RowKey: `${date}-${item.NowDate || index}`,
      SumCostMoney: cost,
    }));
    const last = children.at(-1);
    const aggregate: ChannelDataRow = {
      NowDate: date,
      RegisterDate: date,
      RowKey: date,
      SumAgentPayMoney: children.reduce(
        (sum, item) => sum + Number(item.SumAgentPayMoney || 0),
        0,
      ),
      SumAgentPayNum: 0,
      SumCostMoney: cost,
      SumLogin: Number(last?.SumLogin || 0),
      SumPayMergerMoney: Number(
        findTotal(totals, date, 'SumPayMergerMoney') || 0,
      ),
      SumPayMergerNum: Number(
        findTotal(totals, date, 'SumPayMergerNum') || 0,
      ),
      SumPayMoney: children.reduce(
        (sum, item) => sum + Number(item.SumPayMoney || 0),
        0,
      ),
      SumPayNum: '-',
      SumReg: Number(last?.SumReg || 0),
      SumRegDevice: Number(last?.SumRegDevice || 0),
      SumWithdrawMoney: Number(
        findTotal(totals, date, 'SumWithdrawMoney') || 0,
      ),
      children: childRows,
    };
    return aggregate;
  });
}

async function loadRates() {
  const list = await fetchExchangeRateListApi();
  rateOptions.value = (Array.isArray(list) ? list : []).map((item) => ({
    label: item.Country || String(item.Rate),
    value: Number(item.Rate || 1),
  }));
}

async function loadData() {
  loading.value = true;
  try {
    const query = searchRef.value?.buildPayload() || {};
    const result = await fetchChannelDataListApi(query);
    rows.value = buildTree(
      result.Items || [],
      result.ItemsCost || [],
      result.ItemsTotal || [],
    );
    expandedKeys.value = rows.value.map((item) => String(item.RowKey));
  } finally {
    loading.value = false;
  }
}

function money(value: number) {
  return formatPromoteMoney(value, currentRate.value);
}

const columns: TableColumnsType<ChannelDataRow> = [
  { dataIndex: 'NowDate', fixed: 'left', key: 'NowDate', title: '日期', width: 150 },
  { dataIndex: 'SumRegDevice', key: 'SumRegDevice', title: '新增设备', width: 100 },
  { dataIndex: 'SumReg', key: 'SumReg', title: '新增用户', width: 100 },
  { key: 'devicePercent', title: '设备比', width: 100 },
  { dataIndex: 'SumLogin', key: 'SumLogin', title: '登录人数', width: 100 },
  { key: 'retention', title: '留存', width: 100 },
  { key: 'payUsers', title: '付费人数', width: 100 },
  { key: 'payMoney', title: '充值金额', width: 120 },
  { key: 'withdrawMoney', title: '兑换金额', width: 120 },
  { key: 'profit', title: '利润', width: 120 },
  { key: 'payRate', title: '付费率', width: 100 },
  { key: 'arppu', title: 'ARPPU', width: 100 },
  { key: 'arpu', title: 'ARPU', width: 100 },
  { key: 'ltv', title: 'LTV', width: 100 },
  { key: 'cost', title: '成本', width: 110 },
  { key: 'payRoi', title: '充值ROI', width: 120 },
  { key: 'profitRoi', title: '利润ROI', width: 120 },
];

function cellValue(row: ChannelDataRow, key: string) {
  const payMoney = getPayMoney(row);
  const payUsers = getPayUserCount(row);
  const cost = Number(row.SumCostMoney || 0);
  switch (key) {
    case 'arppu': {
      return calcArppu(payUsers, payMoney * currentRate.value);
    }
    case 'arpu': {
      return calcArppu(Number(row.SumLogin || 0), payMoney * currentRate.value);
    }
    case 'cost': {
      return (cost * currentRate.value).toFixed(2);
    }
    case 'devicePercent': {
      return calcPercent(Number(row.SumRegDevice || 0), Number(row.SumReg || 0));
    }
    case 'ltv': {
      return calcArppu(Number(row.SumReg || 0), payMoney * currentRate.value);
    }
    case 'payMoney': {
      return money(Number(row.SumPayMergerMoney || 0));
    }
    case 'payRate': {
      return calcPercent(payUsers, Number(row.SumReg || 0));
    }
    case 'payRoi': {
      return calcPercent(
        payMoney * currentRate.value,
        cost * currentRate.value * 100,
      );
    }
    case 'payUsers': {
      return payUsers;
    }
    case 'profit': {
      return money(
        Number(row.SumPayMergerMoney || 0) -
          Number(row.SumWithdrawMoney || 0),
      );
    }
    case 'profitRoi': {
      return calcPercent(
        (payMoney - Number(row.SumWithdrawMoney || 0)) * currentRate.value,
        cost * currentRate.value * 100,
      );
    }
    case 'retention': {
      return calcPercent(Number(row.SumLogin || 0), Number(row.SumReg || 0));
    }
    case 'withdrawMoney': {
      return money(Number(row.SumWithdrawMoney || 0));
    }
    default: {
      return numeric(row, key);
    }
  }
}

function customRow(row: ChannelDataRow) {
  return {
    onClick: () => {
      if (!row.children?.length || !row.RowKey) return;
      expandedKeys.value = expandedKeys.value.includes(row.RowKey)
        ? expandedKeys.value.filter((key) => key !== row.RowKey)
        : [...expandedKeys.value, row.RowKey];
    },
  };
}

onMounted(async () => {
  if (!canViewTable.value) return;
  await Promise.allSettled([loadRates(), loadData()]);
});
</script>

<template>
  <div v-if="canViewTable">
    <PromoteDataSearch ref="searchRef" @search="loadData">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">汇率</span>
        <Select
          v-model:value="currentRate"
          allow-clear
          class="w-32"
          :options="rateOptions"
          placeholder="默认"
          @change="currentRate = Number(currentRate || 1)"
        />
      </div>
    </PromoteDataSearch>
    <Table
      :columns="columns"
      :custom-row="customRow"
      :data-source="rows"
      :expanded-row-keys="expandedKeys"
      :loading="loading"
      :pagination="false"
      :row-key="(row) => String(row.RowKey)"
      :scroll="{ x: 1900 }"
      bordered
      children-column-name="children"
      size="small"
      @expanded-rows-change="(keys) => (expandedKeys = keys.map(String))"
    >
      <template #headerCell="{ column }">
        <Tooltip
          v-if="column.key === 'payRoi'"
          title="充值金额 ÷ 投放成本"
        >
          充值ROI ⓘ
        </Tooltip>
        <Tooltip
          v-else-if="column.key === 'profitRoi'"
          title="充值减兑换后的利润 ÷ 投放成本"
        >
          利润ROI ⓘ
        </Tooltip>
        <span v-else>{{ column.title }}</span>
      </template>
      <template #bodyCell="{ column, record }">
        <span
          v-if="
            column.key &&
            ![
              'NowDate',
              'SumRegDevice',
              'SumReg',
              'SumLogin',
            ].includes(String(column.key))
          "
        >
          {{ cellValue(record, String(column.key)) }}
        </span>
        <span v-else>{{ plainValue(record, String(column.key)) }}</span>
      </template>
    </Table>
  </div>
  <Result v-else status="403" sub-title="无账户数据查看权限" title="403" />
</template>

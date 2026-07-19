<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ChannelDataItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Result, Select } from 'ant-design-vue';

import {
  fetchChannelDataListApi,
  fetchExchangeRateListApi,
} from '#/api/promotion/promote-data';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
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

const { checkPermission } = useCloudPermission();
const canViewTable = computed(() => checkPermission(10901));

const currentRate = ref(1);
const rateOptions = ref<Array<{ label: string; value: number }>>([]);
const searchRef = ref<InstanceType<typeof PromoteDataSearch>>();

async function loadRates() {
  const list = await fetchExchangeRateListApi();
  const items = Array.isArray(list) ? list : [];
  rateOptions.value = items.map((item) => ({
    label: item.Country || String(item.Rate),
    value: Number(item.Rate || 1),
  }));
}

function getQueryParams() {
  return (
    searchRef.value?.buildPayload() || {
      AdminIds: '',
      BeginTime: '',
      ChannelIds: [],
      EndTime: '',
      TemplateId: '',
    }
  );
}

const gridOptions: VxeTableGridOptions<ChannelDataItem> = {
  columns: [
    { field: 'NowDate', minWidth: 120, title: '日期' },
    { field: 'SumRegDevice', minWidth: 100, title: '新增设备' },
    { field: 'SumReg', minWidth: 100, title: '新增用户' },
    {
      field: 'devicePercent',
      formatter: ({ row }) => calcPercent(row.SumReg, row.SumRegDevice),
      minWidth: 100,
      title: '设备比',
    },
    { field: 'SumLogin', minWidth: 100, title: '登录人数' },
    {
      field: 'retention',
      formatter: ({ row }) => calcPercent(row.SumLogin, row.SumReg),
      minWidth: 100,
      title: '留存',
    },
    {
      field: 'payUsers',
      formatter: ({ row }) => String(getPayUserCount(row)),
      minWidth: 100,
      title: '付费人数',
    },
    {
      field: 'payMoney',
      formatter: ({ row }) =>
        formatPromoteMoney(row.SumPayMergerMoney, currentRate.value),
      minWidth: 120,
      title: '充值金额',
    },
    {
      field: 'withdrawMoney',
      formatter: ({ row }) =>
        formatPromoteMoney(row.SumWithdrawMoney, currentRate.value),
      minWidth: 120,
      title: '兑换金额',
    },
    {
      field: 'profit',
      formatter: ({ row }) =>
        formatPromoteMoney(
          Number(row.SumPayMergerMoney || 0) -
            Number(row.SumWithdrawMoney || 0),
          currentRate.value,
        ),
      minWidth: 120,
      title: '利润',
    },
    {
      field: 'payRate',
      formatter: ({ row }) => calcPercent(getPayUserCount(row), row.SumReg),
      minWidth: 100,
      title: '付费率',
    },
    {
      field: 'arppu',
      formatter: ({ row }) =>
        calcArppu(getPayUserCount(row), getPayMoney(row) * currentRate.value),
      minWidth: 100,
      title: 'ARPPU',
    },
    {
      field: 'arpu',
      formatter: ({ row }) =>
        calcArppu(row.SumLogin, getPayMoney(row) * currentRate.value),
      minWidth: 100,
      title: 'ARPU',
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const result = await fetchChannelDataListApi(getQueryParams());
        const items = result.Items || [];
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

onMounted(async () => {
  if (!canViewTable.value) {
    return;
  }
  await loadRates();
  gridApi.reload();
});
</script>

<template>
  <div v-if="canViewTable">
    <PromoteDataSearch ref="searchRef" @search="handleSearch">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">汇率</span>
        <Select
          allow-clear
          class="w-32"
          :options="rateOptions"
          placeholder="默认"
          @change="
            (value) => {
              currentRate = Number(value || 1);
            }
          "
        />
      </div>
    </PromoteDataSearch>
    <Grid />
  </div>
  <Result v-else status="403" sub-title="无账户数据查看权限" title="403" />
</template>

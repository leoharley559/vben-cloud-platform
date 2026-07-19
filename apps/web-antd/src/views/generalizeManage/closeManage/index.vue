<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloseManageItem, WithdrawAccountItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Result,
  Select,
  Statistic,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchCloseManageListApi,
  fetchWithdrawAccountListApi,
  fetchWithdrawUserInfoApi,
} from '#/api/promotion/close-manage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import {
  WITHDRAW_MONEY_TYPE_MAP,
  formatDateTime,
  formatTeamQueryMoney,
} from '#/utils/promotion';

import WithdrawAccountModal from './components/withdraw-account-modal.vue';
import WithdrawModal from './components/withdraw-modal.vue';

defineOptions({ name: 'CloseManage' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canViewList = computed(() => checkPermission(10924));
const canWithdraw = computed(() => checkPermission(10927));
const canManageAccount = computed(() => checkPermission(10929));
const canViewPage = computed(
  () => canViewList.value || canWithdraw.value || canManageAccount.value,
);

const defaultBegin = dayjs().subtract(31, 'day').startOf('day');
const defaultEnd = dayjs().endOf('day');

const filterMoneyType = ref<number | string>();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const useMoney = ref(0);
const noCloseMoney = ref(0);
const accountList = ref<WithdrawAccountItem[]>([]);
const accountRate = ref<
  Array<{
    MaxMoney?: number;
    MinMoney?: number;
    Rate?: number;
    Type?: number;
  }>
>([]);
const minMoney = ref(0);
const maxMoney = ref(0);
const userInfo = ref<Record<string, unknown>>({});
const withdrawOpen = ref(false);
const accountOpen = ref(false);

const payPeriod = computed(() => {
  const info = projectConfig.value?.AccountTeamInfo as
    | { PayPeriod?: number | string }
    | undefined;
  return info?.PayPeriod ?? '-';
});

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultBegin.unix(),
    EndTime: end ? end.endOf('day').unix() : defaultEnd.unix(),
    MoneyType: filterMoneyType.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<CloseManageItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 160,
      title: '时间',
    },
    {
      field: 'AddMoney',
      minWidth: 120,
      slots: { default: 'addMoney' },
      title: '可用资金变化',
    },
    {
      field: 'MoneyType',
      formatter: ({ cellValue }) =>
        WITHDRAW_MONEY_TYPE_MAP[Number(cellValue)] || String(cellValue || '-'),
      minWidth: 120,
      title: '类型',
    },
    { field: 'Desc', minWidth: 180, title: '说明' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchCloseManageListApi(getQueryParams(page));
        useMoney.value = result.MoreItems?.Money || 0;
        noCloseMoney.value = result.MoreItems?.FreezeMoney || 0;
        accountRate.value = result.MoreItems?.PayRate || [];
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadMeta() {
  const [accounts, info] = await Promise.all([
    fetchWithdrawAccountListApi(),
    fetchWithdrawUserInfoApi(),
  ]);
  accountList.value = accounts.Items || [];
  userInfo.value = info || {};
}

function handleWithdrawSuccess() {
  gridApi.reload();
}

onMounted(async () => {
  await loadMeta();
  if (canViewList.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 收益结算"
    title="收益结算"
  >
    <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <Statistic title="可用余额" :value="formatTeamQueryMoney(useMoney)" />
        <div class="mt-2 text-sm text-gray-500">
          未结算资金：{{ formatTeamQueryMoney(noCloseMoney) }}
          <Tooltip
            :title="`结算周期 ${payPeriod} 天，最近 ${payPeriod} 天未结算资金暂不可提现`"
          >
            <span class="ml-1 cursor-help">ⓘ</span>
          </Tooltip>
        </div>
        <Button
          v-if="canWithdraw"
          class="mt-3"
          type="primary"
          @click="withdrawOpen = true"
        >
          提现
        </Button>
      </Card>
      <Card>
        <div class="mb-2 text-sm text-gray-500">提现银行卡/支付宝</div>
        <div :class="accountList.length ? 'text-green-600' : 'text-red-500'">
          {{ accountList.length ? '已设置' : '未设置' }}
        </div>
        <Button
          v-if="canManageAccount"
          class="mt-3"
          type="primary"
          @click="accountOpen = true"
        >
          设置
        </Button>
      </Card>
      <Card>
        <div class="mb-2 text-sm text-gray-500">取款密码</div>
        <div
          :class="
            Number(userInfo.IsSetPrivatePassword) === 1
              ? 'text-green-600'
              : 'text-red-500'
          "
        >
          {{
            Number(userInfo.IsSetPrivatePassword) === 1 ? '已设置' : '未设置'
          }}
        </div>
        <div class="mt-3 text-xs text-gray-400">请在个人中心设置</div>
      </Card>
      <Card>
        <div class="mb-2 text-sm text-gray-500">绑定手机</div>
        <div :class="userInfo.Phone ? 'text-green-600' : 'text-red-500'">
          {{ userInfo.Phone ? '已设置' : '未设置' }}
        </div>
        <div class="mt-3 text-xs text-gray-400">请在个人中心设置</div>
      </Card>
    </div>

    <Card v-if="canViewList">
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Select
          v-model:value="filterMoneyType"
          allow-clear
          class="w-40"
          :options="[
            { label: '日结账单', value: 1 },
            { label: '提现', value: 2 },
            { label: '提现退回', value: 3 },
          ]"
          placeholder="资金类型"
        />
        <DatePicker.RangePicker v-model:value="filterDateRange" />
        <Button type="primary" @click="gridApi.reload()">查询</Button>
      </div>
      <Grid>
        <template #addMoney="{ row }">
          <span
            :class="
              Number(row.AddMoney) > 0 ? 'text-green-600' : 'text-red-500'
            "
          >
            {{ row.AddMoney }}
          </span>
        </template>
      </Grid>
    </Card>

    <WithdrawModal
      v-model:open="withdrawOpen"
      :account-list="accountList"
      :account-rate="accountRate"
      :max-money="maxMoney"
      :min-money="minMoney"
      @success="handleWithdrawSuccess"
    />
    <WithdrawAccountModal v-model:open="accountOpen" @change="loadMeta" />
  </Page>
  <Result v-else status="403" sub-title="无收益结算查看权限" title="403" />
</template>

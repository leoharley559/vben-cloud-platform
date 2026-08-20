<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloseManageItem, WithdrawAccountItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Result,
  Select,
  Space,
  Statistic,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchCloseManageListApi,
  fetchWithdrawAccountListApi,
  fetchWithdrawUserInfoApi,
} from '#/api/promotion/close-manage';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import {
  formatTeamQueryMoney,
  WITHDRAW_MONEY_TYPE_MAP,
} from '#/utils/promotion';

import SecuritySettingModal from './components/security-setting-modal.vue';
import WithdrawAccountModal from './components/withdraw-account-modal.vue';
import WithdrawModal from './components/withdraw-modal.vue';

defineOptions({ name: 'CloseManage' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canViewList = computed(() => checkPermission(10_924));
const canWithdraw = computed(() => checkPermission(10_927));
const canManageAccount = computed(() => checkPermission(10_929));
const canViewPage = computed(
  () => canViewList.value || canWithdraw.value || canManageAccount.value,
);

const filterMoneyType = ref<number[]>([]);
const filterDateRange = ref<[Dayjs, Dayjs]>();
const useMoney = ref(0);
const noCloseMoney = ref(0);
const accountList = ref<WithdrawAccountItem[]>([]);
const accountRate = ref<
  Array<{
    MaxAmount?: number;
    MaxMoney?: number;
    MinAmount?: number;
    MinMoney?: number;
    PayType?: number;
    Rate?: number;
    ServiceRate?: number;
    Type?: number;
  }>
>([]);
const minMoney = ref(0);
const maxMoney = ref(0);
const userInfo = ref<Record<string, unknown>>({});
const withdrawOpen = ref(false);
const accountOpen = ref(false);
const securityOpen = ref(false);
const securitySection = ref<'phone' | 'private-password'>('phone');

const payPeriod = computed(() => {
  const info = projectConfig.value?.AccountTeamInfo as
    | undefined
    | { PayPeriod?: number | string };
  return info?.PayPeriod ?? '-';
});

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin?.startOf('day').unix() || '',
    EndTime: end?.endOf('day').unix() || '',
    // allow-clear 后可能为 undefined，需兜底避免 join 崩溃
    MoneyType: (filterMoneyType.value || []).join(','),
    Page: page.currentPage,
    PageSize: page.pageSize,
    Sort: '',
  };
}

function formatCloseManageDate(value?: number | string) {
  if (value === undefined || value === null || value === '') return '';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return dayjs(String(value).length > 10 ? numeric : numeric * 1000).format(
    'YYYY-MM-DD HH:mm:ss',
  );
}

let latestListRequestId = 0;
let latestGridResult: { items: CloseManageItem[]; total: number } = {
  items: [],
  total: 0,
};

const gridOptions: VxeTableGridOptions<CloseManageItem> = {
  columns: [
    { type: 'seq', title: '序号', width: 70 },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatCloseManageDate(cellValue),
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
    { field: 'NewMoney', minWidth: 120, title: '可用余额' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const requestId = ++latestListRequestId;
        try {
          const result = await fetchCloseManageListApi(getQueryParams(page));
          if (requestId !== latestListRequestId) return latestGridResult;
          const items = Array.isArray(result.Items) ? result.Items : [];
          const more = result.MoreItems || {};
          useMoney.value = Number(more.Money || 0);
          noCloseMoney.value = Number(more.FreezeMoney || 0);
          accountRate.value = Array.isArray(more.PayRate) ? more.PayRate : [];
          latestGridResult = {
            items,
            total: Number(result.Pagination?.MaxCount ?? items.length),
          };
          return latestGridResult;
        } catch {
          // 失败清空列表，不重抛避免表格二次报错
          if (requestId === latestListRequestId) {
            useMoney.value = 0;
            noCloseMoney.value = 0;
            accountRate.value = [];
            latestGridResult = { items: [], total: 0 };
          }
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadMeta() {
  // 账户列表与登录信息互相独立，避免一侧失败拖垮整页卡片状态
  const [accountsResult, infoResult] = await Promise.allSettled([
    fetchWithdrawAccountListApi(),
    fetchWithdrawUserInfoApi(),
  ]);
  accountList.value =
    accountsResult.status === 'fulfilled'
      ? accountsResult.value.Items || []
      : [];
  userInfo.value =
    infoResult.status === 'fulfilled' ? infoResult.value || {} : {};
}

function handleWithdrawSuccess() {
  gridApi.reload();
}

function handleReset() {
  filterMoneyType.value = [];
  filterDateRange.value = undefined;
  gridApi.reload();
}

function openSecurity(section: 'phone' | 'private-password') {
  securitySection.value = section;
  securityOpen.value = true;
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
    <div class="settlement-card-grid">
      <Card class="summary-card" :bordered="false">
        <Statistic title="可用余额" :value="useMoney" />
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
      <Card class="summary-card" :bordered="false">
        <div class="mb-2 text-sm text-gray-500">提现银行卡/支付宝</div>
        <div
          :class="accountList.length > 0 ? 'text-green-600' : 'text-red-500'"
        >
          {{ accountList.length > 0 ? '已设置' : '未设置' }}
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
      <Card class="summary-card" :bordered="false">
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
        <Button
          class="mt-3"
          type="primary"
          @click="openSecurity('private-password')"
        >
          设置
        </Button>
      </Card>
      <Card class="summary-card" :bordered="false">
        <div class="mb-2 text-sm text-gray-500">绑定手机</div>
        <div :class="userInfo.Phone ? 'text-green-600' : 'text-red-500'">
          {{ userInfo.Phone ? '已设置' : '未设置' }}
        </div>
        <Button class="mt-3" type="primary" @click="openSecurity('phone')">
          设置
        </Button>
      </Card>
    </div>

    <Card v-if="canViewList" size="small">
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <Space.Compact>
            <span class="query-field-addon">资金类型</span>
            <Select
              v-model:value="filterMoneyType"
              allow-clear
              mode="multiple"
              :options="[
                { label: '日结账单', value: 1 },
                { label: '提现', value: 2 },
                { label: '提现退回', value: 3 },
              ]"
              placeholder="请选择资金类型"
            />
          </Space.Compact>
          <div class="query-filter-wide">
            <QueryDatetimeRangePicker v-model="filterDateRange" />
          </div>
          <div class="query-filter-actions query-filter-actions-single">
            <Button type="primary" @click="gridApi.reload()">查询</Button>
            <Button @click="handleReset">重置</Button>
          </div>
        </div>
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
    <SecuritySettingModal
      v-model:open="securityOpen"
      :info="userInfo"
      :section="securitySection"
      @success="loadMeta"
    />
  </Page>
  <Result v-else status="403" sub-title="无收益结算查看权限" title="403" />
</template>

<style scoped>
.settlement-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  border-radius: 12px;
}

@media (max-width: 1200px) {
  .settlement-card-grid {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }
}

@media (max-width: 700px) {
  .settlement-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>

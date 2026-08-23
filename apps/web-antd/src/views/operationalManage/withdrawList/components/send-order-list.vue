<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WithdrawFinanceItem } from '#/types/withdraw-extra';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchSendOrderListApi,
  updateSendOrderListApi,
} from '#/api/operationManage/withdraw-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  calcWithdrawStatusText,
  formatRiskStatus,
  getRiskStatusColor,
} from '#/utils/withdraw-status';

import SendOrderActionModal from './send-order-action-modal.vue';

defineOptions({ name: 'SendOrderListPanel' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10_377));
const canApprove = computed(() => checkPermission(10_378));
const canReject = computed(() => checkPermission(10_379));
const canHangup = computed(() => checkPermission(10_380));

const defaultRange = getYesterdayRangeSeconds();
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterOrderId = ref('');
const filterRiskStatus = ref<number | string>(-1);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const actionOpen = ref(false);
const actionMode = ref<'hangup' | 'reject'>('reject');
const actionRow = ref<null | WithdrawFinanceItem>(null);

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

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    Keyword: filterOrderId.value,
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value,
    RiskStatus: filterRiskStatus.value,
  };
}

function canOperateRow(row: WithdrawFinanceItem) {
  return Number(row.RiskStatus) === -1;
}

function openAction(row: WithdrawFinanceItem, mode: 'hangup' | 'reject') {
  actionRow.value = row;
  actionMode.value = mode;
  actionOpen.value = true;
}

function handleApprove(row: WithdrawFinanceItem) {
  Modal.confirm({
    content: '确认通过该派单订单的风控审核？',
    title: '审核通过',
    onOk: async () => {
      await updateSendOrderListApi({
        Id: row.Id,
        RiskStatus: 1,
      });
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

const gridOptions: VxeTableGridOptions<WithdrawFinanceItem> = {
  columns: [
    {
      field: 'RiskStatus',
      minWidth: 100,
      slots: { default: 'riskStatus' },
      title: '风控状态',
    },
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'RealName', minWidth: 100, title: '真实姓名' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '提现金额',
    },
    { field: 'HandlerName', minWidth: 120, title: '处理人' },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchSendOrderListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

onMounted(() => {
  filterPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterLoginAccount"
            allow-clear
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
        </div>
        <Select
          v-model:value="filterPackageId"
          :options="
            packageOptions
              .filter((item) => item.PackageId !== '')
              .map((item) => ({
                label: item.PackageName,
                value: item.PackageId,
              }))
          "
        />
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterOrderId"
            allow-clear
            placeholder="请输入订单编号"
          >
            <template #addonBefore>订单编号</template>
          </Input>
        </div>
        <Select
          v-model:value="filterRiskStatus"
          :options="[
            { label: '未处理', value: -1 },
            { label: '通过', value: 1 },
            { label: '不通过', value: 2 },
            { label: '挂起', value: 3 },
            { label: '全部', value: '' },
          ]"
        />
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
            查询
          </Button>
        </div>
      </div>
    </div>

    <Grid>
      <template #riskStatus="{ row }">
        <Tag :color="getRiskStatusColor(row.RiskStatus)">
          {{ formatRiskStatus(row.RiskStatus) }}
        </Tag>
      </template>
      <template #status="{ row }">
        <Tag>{{ calcWithdrawStatusText(row.Status) }}</Tag>
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
      <template #actions="{ row }">
        <Space :size="0" wrap>
          <Button
            v-if="canApprove && canOperateRow(row)"
            size="small"
            type="link"
            @click="handleApprove(row)"
          >
            审核通过
          </Button>
          <Button
            v-if="canReject && canOperateRow(row)"
            danger
            size="small"
            type="link"
            @click="openAction(row, 'reject')"
          >
            拒绝出款
          </Button>
          <Button
            v-if="canHangup && canOperateRow(row)"
            size="small"
            type="link"
            @click="openAction(row, 'hangup')"
          >
            挂起
          </Button>
        </Space>
      </template>
    </Grid>

    <SendOrderActionModal
      v-model:open="actionOpen"
      :mode="actionMode"
      :row="actionRow"
      @success="gridApi.reload()"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10377 才能查看派单列表"
    title="无权限"
  />
</template>

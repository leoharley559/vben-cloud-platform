<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WithdrawListItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  Modal,
  Result,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  approveWithdrawRiskApi,
  batchDenyWithdrawApi,
  batchManualWithdrawApi,
  addWithdrawRemarkApi,
  checkThirdPartyWithdrawApi,
  fetchWithdrawListApi,
  transitionPendingWithdrawApi,
  updateWithdrawReceivedStatusApi,
  withdrawNoticeApi,
} from '#/api/operationManage/withdraw';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLast3CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  calcWithdrawStatusText,
  formatReceivedStatus,
  formatRiskStatus,
  getReceivedStatusColor,
  getRiskStatusColor,
  WITHDRAW_STATUS_OPTIONS,
  WITHDRAW_TIME_TYPE_OPTIONS,
} from '#/utils/withdraw-status';
import {
  canShowWithdrawAutoPay,
  canShowWithdrawCheckThirdParty,
  canShowWithdrawManualPay,
  canShowWithdrawNotice,
  canShowWithdrawReceivedFix,
  canShowWithdrawReject,
  canShowWithdrawRiskApprove,
  canShowWithdrawTransitionPending,
  isWithdrawRiskBlockingPay,
  WITHDRAW_RISK_SECURITY_PAGE_ID,
} from '#/utils/withdraw-actions';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

import WithdrawActionModal from './withdraw-action-modal.vue';

defineOptions({ name: 'WithdrawRedeemList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10352));
const canManualPay = computed(() => checkPermission(10353));
const canAutoPay = computed(() => checkPermission(10354));
const canRiskApprove = computed(() => checkPermission(10355));
const canRejectPay = computed(() => checkPermission(10356));
const canEditRemark = computed(() => checkPermission(10365));
const canWithdrawNotice = computed(() => checkPermission(11551));
const canCheckThirdParty = computed(() => checkPermission(12151));
const canTransitionPending = computed(() => checkPermission(12152));
const canBatchManual = computed(() => checkPermission(12258));
const canBatchReject = computed(() => checkPermission(12259));

const selectedRows = ref<WithdrawListItem[]>([]);
const actionOpen = ref(false);
const actionMode = ref<'agree' | 'manual' | 'reject'>('manual');
const actionRow = ref<WithdrawListItem | null>(null);
const batchLoading = ref(false);
const remarkOpen = ref(false);
const remarkSaving = ref(false);
const remarkRow = ref<WithdrawListItem | null>(null);
const remarkText = ref('');

const defaultRange = getLast3CalendarDaysRangeSeconds();
const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterOrderId = ref('');
const filterAccountNum = ref('');
const filterRealName = ref('');
const filterHandlerName = ref('');
const filterRiskAuditorName = ref('');
const filterShowName = ref('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterPackageId = ref<number | string>('');
const filterWithdrawStatus = ref<number | string>();
const filterRiskStatus = ref<number | string>('');
const filterSelectTimeType = ref(1);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

/** 列表上方统计，对齐旧站 withdrawList/list Total */
const totalData = ref({
  Amount: 0,
  HangupCount: 0,
  PendingCount: 0,
  RefundAmount: 0,
  ReserveCount: 0,
  WithdrawAmount: 0,
});

const summaryItems = computed(() => [
  {
    label: '总出款',
    value: formatAmountFromCent(totalData.value.Amount),
  },
  {
    label: '实际出款',
    value: formatAmountFromCent(totalData.value.WithdrawAmount),
  },
  {
    label: '退回金额',
    value: formatAmountFromCent(totalData.value.RefundAmount),
  },
  {
    cardClass:
      totalData.value.PendingCount > 0
        ? 'border-red-400 bg-red-50 text-red-600'
        : '',
    label: '未处理订单数量',
    onClick: filterUntreatedOrders,
    value: totalData.value.PendingCount,
    valueClass: totalData.value.PendingCount > 0 ? 'font-semibold' : '',
  },
  {
    cardClass:
      totalData.value.HangupCount > 0
        ? 'border-red-400 bg-red-50 text-red-600'
        : '',
    label: '挂起订单数量',
    onClick: filterHangupOrders,
    value: totalData.value.HangupCount,
    valueClass: totalData.value.HangupCount > 0 ? 'font-semibold' : '',
  },
  {
    label: '30分钟结束预约单量',
    value: totalData.value.ReserveCount,
  },
]);

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
    AccountNum: filterAccountNum.value,
    BeginTime: begin ? begin.unix() : '',
    ChannelIds: filterChannelIds.value,
    EndTime: end ? end.unix() : '',
    HandlerName: filterHandlerName.value,
    LoginAccount: filterLoginAccount.value,
    OrderId: filterOrderId.value,
    PackageId: filterPackageId.value,
    PlayerId: filterPlayerId.value,
    RealName: filterRealName.value,
    RiskAuditorName: filterRiskAuditorName.value,
    RiskStatus: filterRiskStatus.value,
    SelectTimeType: filterSelectTimeType.value,
    ShowName: filterShowName.value,
    WithdrawStatus: filterWithdrawStatus.value ?? '',
  };
}

const gridOptions: VxeTableGridOptions<WithdrawListItem> = {
  checkboxConfig: {
    checkMethod: ({ row }) => Number(row.Status) === 1,
    reserve: true,
  },
  columns: [
    { type: 'checkbox', width: 48 },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'PlayerId',
      minWidth: 100,
      title: '玩家ID',
    },
    {
      field: 'Status',
      minWidth: 110,
      slots: { default: 'withdrawStatus' },
      title: '状态',
    },
    {
      field: 'RiskStatus',
      minWidth: 100,
      slots: { default: 'riskStatus' },
      title: '风控状态',
    },
    {
      field: 'ReceivedStatus',
      minWidth: 110,
      slots: { default: 'receivedStatus' },
      title: '到账状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      sortable: true,
      title: '申请时间',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      sortable: true,
      title: '申请金额',
    },
    {
      field: 'ShowName',
      minWidth: 140,
      title: '出款通道',
    },
    {
      field: 'AccountNum',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '出款账号',
    },
    {
      field: 'RealName',
      minWidth: 100,
      title: '真实姓名',
    },
    {
      field: 'ChannelName',
      minWidth: 120,
      title: '渠道名称',
    },
    {
      field: 'PackageName',
      minWidth: 120,
      title: '所属产品',
    },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP ${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    {
      field: 'RiskAuditorName',
      minWidth: 110,
      title: '风控人员',
    },
    {
      field: 'HandlerName',
      minWidth: 110,
      title: '操作人员',
    },
    {
      field: 'Remark',
      minWidth: 140,
      slots: { default: 'remark' },
      title: '备注',
    },
    {
      field: 'FinishTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '结束时间',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 360,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page, sort }) => {
        const query = getQueryParams();
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          // 对齐旧站 withdrawList/list：升序 field，降序 -field（`field desc` 会导致 Items=null）
          sortParam =
            sortOrder === 'asc' ? String(sortField) : `-${sortField}`;
        }

        const result = await fetchWithdrawListApi({
          ...query,
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        const total = (result?.Total || {}) as Record<string, unknown>;
        totalData.value = {
          Amount: Number(total.Amount || 0),
          HangupCount: Number(total.HangupCount || 0),
          PendingCount: Number(total.PendingCount || 0),
          RefundAmount: Number(total.RefundAmount || 0),
          ReserveCount: Number(total.ReserveCount || 0),
          WithdrawAmount: Number(total.WithdrawAmount || 0),
        };

        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
  sortConfig: {
    defaultSort: {
      field: 'CreateTime',
      order: 'desc',
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: WithdrawListItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: WithdrawListItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);
const hasSelection = computed(() => selectedRows.value.length > 0);

function openWithdrawAction(
  row: WithdrawListItem,
  mode: 'agree' | 'manual' | 'reject',
) {
  if (
    (mode === 'agree' || mode === 'manual') &&
    isWithdrawRiskBlockingPay(row)
  ) {
    message.warning('风控状态未审核，无法出款');
    return;
  }
  actionRow.value = row;
  actionMode.value = mode;
  actionOpen.value = true;
}

function handleRiskApprove(row: WithdrawListItem) {
  Modal.confirm({
    title: '审核通过',
    content: '确定将该订单风控状态设为通过吗？',
    onOk: async () => {
      await approveWithdrawRiskApi({
        Id: row.Id,
        RiskStatus: 1,
      });
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

function handleWithdrawNotice(row: WithdrawListItem) {
  Modal.confirm({
    title: '提现通知',
    content: '确定发送提现通知吗？',
    onOk: async () => {
      await withdrawNoticeApi({ Id: row.Id, OrderId: row.OrderId });
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

function handleCheckThirdParty(row: WithdrawListItem) {
  if (!row.OrderId) {
    return;
  }
  Modal.confirm({
    title: '查询三方',
    content: `确定查询订单 ${row.OrderId} 的三方状态吗？`,
    onOk: async () => {
      await checkThirdPartyWithdrawApi(row.OrderId as string);
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

function handleTransitionPending(row: WithdrawListItem) {
  Modal.confirm({
    title: '转待处理',
    content: '确定将该订单转为待处理状态吗？',
    onOk: async () => {
      await transitionPendingWithdrawApi({ Id: row.Id });
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

function handleReceivedStatusFix(row: WithdrawListItem) {
  Modal.confirm({
    title: '处理到账异常',
    content: '确定将该订单到账状态标记为已处理吗？',
    onOk: async () => {
      await updateWithdrawReceivedStatusApi({ Id: row.Id });
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

function openRemark(row: WithdrawListItem) {
  remarkRow.value = row;
  remarkText.value = String(row.Remark || '');
  remarkOpen.value = true;
}

async function saveRemark() {
  if (!remarkRow.value?.Id) {
    return;
  }
  const text = remarkText.value.trim();
  if (!text || text.length > 400) {
    message.warning('备注长度需为 1–400 字');
    return;
  }
  remarkSaving.value = true;
  try {
    await addWithdrawRemarkApi({
      Id: remarkRow.value.Id,
      Remark: text,
    });
    message.success('备注已保存');
    remarkOpen.value = false;
    gridApi.reload();
  } finally {
    remarkSaving.value = false;
  }
}

async function handleBatchManual() {
  if (!hasSelection.value) {
    return;
  }
  Modal.confirm({
    title: '批量人工出款',
    content: `确定对选中的 ${selectedRows.value.length} 条订单执行批量人工出款吗？`,
    onOk: async () => {
      batchLoading.value = true;
      try {
        await batchManualWithdrawApi({
          Ids: selectedRows.value.map((item) => item.Id).join(','),
        });
        message.success('批量操作成功');
        selectedRows.value = [];
        gridApi.reload();
      } finally {
        batchLoading.value = false;
      }
    },
  });
}

async function handleBatchReject() {
  if (!hasSelection.value) {
    return;
  }
  Modal.confirm({
    title: '批量拒绝出款',
    content: `确定拒绝选中的 ${selectedRows.value.length} 条订单并退币吗？`,
    onOk: async () => {
      batchLoading.value = true;
      try {
        await batchDenyWithdrawApi({
          Ids: selectedRows.value.map((item) => item.Id).join(','),
          RefundScore: 1,
        });
        message.success('批量操作成功');
        selectedRows.value = [];
        gridApi.reload();
      } finally {
        batchLoading.value = false;
      }
    },
  });
}

function handleSearch() {
  gridApi.reload();
}

/** 对齐旧站 untreated：筛选未处理订单 */
function filterUntreatedOrders() {
  filterRiskStatus.value = '';
  filterWithdrawStatus.value = '1,5,6';
  gridApi.reload();
}

/** 对齐旧站 fnHangUp：筛选挂起订单 */
function filterHangupOrders() {
  filterWithdrawStatus.value = undefined;
  filterRiskStatus.value = 3;
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterPlayerId.value = '';
  filterOrderId.value = '';
  filterAccountNum.value = '';
  filterRealName.value = '';
  filterHandlerName.value = '';
  filterRiskAuditorName.value = '';
  filterShowName.value = '';
  filterChannelIds.value = [];
  filterPackageId.value = '';
  filterWithdrawStatus.value = undefined;
  filterRiskStatus.value = '';
  filterSelectTimeType.value = 1;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

onMounted(() => {
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
          @press-enter="handleSearch"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerId"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入玩家ID"
        >
          <template #addonBefore>玩家ID</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterAccountNum"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入出款账号"
        >
          <template #addonBefore>出款账号</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterRealName"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入真实姓名"
        >
          <template #addonBefore>真实姓名</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterHandlerName"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入操作人员"
        >
          <template #addonBefore>操作人员</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterRiskAuditorName"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入风控人员"
        >
          <template #addonBefore>风控人员</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterShowName"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入出款通道"
        >
          <template #addonBefore>出款通道</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">渠道</span>
          <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
        </Space.Compact>
      </div>

      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">产品</span>
          <Select
            v-model:value="filterPackageId"
            :options="
              packageOptions.map((item) => ({
                label: item.PackageName,
                value: item.PackageId,
              }))
            "
            placeholder="请选择产品"
          />
        </Space.Compact>
      </div>

      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">状态</span>
          <Select
            v-model:value="filterWithdrawStatus"
            allow-clear
            :options="WITHDRAW_STATUS_OPTIONS"
            placeholder="请选择状态"
          />
        </Space.Compact>
      </div>

      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">时间类型</span>
          <Select
            v-model:value="filterSelectTimeType"
            :options="WITHDRAW_TIME_TYPE_OPTIONS"
            placeholder="请选择时间类型"
          />
        </Space.Compact>
      </div>

      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryItems" />

    <div
      v-if="canBatchManual || canBatchReject"
      class="mb-3 flex flex-wrap gap-2"
    >
      <Button
        v-if="canBatchManual"
        :disabled="!hasSelection"
        :loading="batchLoading"
        type="primary"
        @click="handleBatchManual"
      >
        批量人工出款
      </Button>
      <Button
        v-if="canBatchReject"
        danger
        :disabled="!hasSelection"
        :loading="batchLoading"
        @click="handleBatchReject"
      >
        批量拒绝出款
      </Button>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="row.LoginAccount"
          :permission-id="10388"
          :player-id="row.PlayerId"
        />
      </template>
      <template #withdrawStatus="{ row }">
        {{ calcWithdrawStatusText(row.Status, row.Process, row.RefundScore) }}
      </template>
      <template #riskStatus="{ row }">
        <Tag :color="getRiskStatusColor(row.RiskStatus)">
          {{ formatRiskStatus(row.RiskStatus) }}
        </Tag>
      </template>
      <template #receivedStatus="{ row }">
        <Tag :color="getReceivedStatusColor(row.ReceivedStatus)">
          {{ formatReceivedStatus(row.ReceivedStatus) }}
        </Tag>
      </template>
      <template #remark="{ row }">
        <Button
          v-if="canEditRemark"
          size="small"
          type="link"
          @click="openRemark(row)"
        >
          {{ row.Remark || '编辑' }}
        </Button>
        <span v-else>{{ row.Remark || '-' }}</span>
      </template>
      <template #actions="{ row }">
        <Space wrap size="small">
          <Button
            v-if="canManualPay && canShowWithdrawManualPay(row)"
            :disabled="
              isSameAcctActionRestricted(
                WITHDRAW_RISK_SECURITY_PAGE_ID,
                row.RiskAuditorId,
              )
            "
            size="small"
            type="primary"
            @click="openWithdrawAction(row, 'manual')"
          >
            人工出款
          </Button>
          <Button
            v-if="canAutoPay && canShowWithdrawAutoPay(row)"
            :disabled="
              isSameAcctActionRestricted(
                WITHDRAW_RISK_SECURITY_PAGE_ID,
                row.RiskAuditorId,
              )
            "
            size="small"
            @click="openWithdrawAction(row, 'agree')"
          >
            同意出款
          </Button>
          <Button
            v-if="canRiskApprove && canShowWithdrawRiskApprove(row)"
            size="small"
            type="primary"
            @click="handleRiskApprove(row)"
          >
            审核通过
          </Button>
          <Button
            v-if="canRejectPay && canShowWithdrawReject(row)"
            danger
            size="small"
            @click="openWithdrawAction(row, 'reject')"
          >
            拒绝出款
          </Button>
          <Button
            v-if="canWithdrawNotice && canShowWithdrawNotice(row)"
            size="small"
            @click="handleWithdrawNotice(row)"
          >
            提现通知
          </Button>
          <Button
            v-if="canCheckThirdParty && canShowWithdrawCheckThirdParty(row)"
            size="small"
            @click="handleCheckThirdParty(row)"
          >
            查询三方
          </Button>
          <Button
            v-if="canTransitionPending && canShowWithdrawTransitionPending(row)"
            size="small"
            @click="handleTransitionPending(row)"
          >
            转待处理
          </Button>
          <Button
            v-if="canShowWithdrawReceivedFix(row)"
            size="small"
            @click="handleReceivedStatusFix(row)"
          >
            处理异常
          </Button>
        </Space>
      </template>
    </Grid>

    <WithdrawActionModal
      v-model:open="actionOpen"
      :mode="actionMode"
      :row="actionRow"
      @success="gridApi.reload()"
    />

    <Modal
      v-model:open="remarkOpen"
      :confirm-loading="remarkSaving"
      title="编辑备注"
      @ok="saveRemark"
    >
      <Input.TextArea
        v-model:value="remarkText"
        :maxlength="400"
        :rows="4"
        allow-clear
        placeholder="请输入备注（1–400 字）"
        show-count
      />
    </Modal>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10352 才能查看兑换列表"
    title="无权限"
  />
</template>

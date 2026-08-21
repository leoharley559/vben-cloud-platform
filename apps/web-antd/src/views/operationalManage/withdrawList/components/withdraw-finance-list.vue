<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WithdrawListItem } from '#/types/operation-manage';
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
  addWithdrawRemarkApi,
  batchDenyWithdrawApi,
  batchManualWithdrawApi,
  checkThirdPartyWithdrawApi,
  transitionPendingWithdrawApi,
  updateWithdrawReceivedStatusApi,
} from '#/api/operationManage/withdraw';
import { fetchWithdrawFinanceListApi } from '#/api/operationManage/withdraw-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  canShowWithdrawAutoPay,
  canShowWithdrawManualPay,
  canShowWithdrawReceivedFix,
  canShowWithdrawReject,
  isWithdrawRiskBlockingPay,
} from '#/utils/withdraw-actions';
import { calcWithdrawStatusText } from '#/utils/withdraw-status';

import WithdrawActionModal from './withdraw-action-modal.vue';
import WithdrawBatchApproveModal from './withdraw-batch-approve-modal.vue';

defineOptions({ name: 'WithdrawFinanceList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

// 对齐旧站 withdrawListSon：页签 10350，表格权限 10382
const canViewTable = computed(() => checkPermission(10_382));
const canManualPay = computed(() => checkPermission(10_383));
const canAutoPay = computed(() => checkPermission(10_384));
const canRejectPay = computed(() => checkPermission(10_385));
const canEditRemark = computed(() => checkPermission(10_365));
const canBatchApprove = computed(() => checkPermission(12_032));
const canBatchManual = computed(() => checkPermission(12_258));
const canBatchReject = computed(() => checkPermission(12_259));
const canCheckThirdParty = computed(() => checkPermission(12_153));
const canTransitionPending = computed(() => checkPermission(12_154));

const defaultRange = getYesterdayRangeSeconds();
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterOrderId = ref('');
const filterHandlerName = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const selectedRows = ref<WithdrawFinanceItem[]>([]);
const batchLoading = ref(false);
const actionOpen = ref(false);
const batchApproveOpen = ref(false);
const actionMode = ref<'agree' | 'manual' | 'reject'>('manual');
const actionRow = ref<null | WithdrawListItem>(null);
const remarkOpen = ref(false);
const remarkSaving = ref(false);
const remarkRow = ref<null | WithdrawFinanceItem>(null);
const remarkText = ref('');

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
    HandlerName: filterHandlerName.value,
    // 对齐旧站 withdrawListSon：订单编号走 OrderIds（非 Keyword）
    OrderIds: filterOrderId.value,
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value,
  };
}

function asWithdrawRow(row: WithdrawFinanceItem): WithdrawListItem {
  return row as unknown as WithdrawListItem;
}

function canSelectRow(row: WithdrawFinanceItem) {
  return Number(row.Status) === 1;
}

function canShowCheckThirdParty(row: WithdrawFinanceItem) {
  return (
    Number(row.AgentWithdrawId) !== 0 &&
    Number(row.Status) === 5 &&
    (Number(row.Process) === 4 || Number(row.Process) === 9)
  );
}

function canShowTransitionPending(row: WithdrawFinanceItem) {
  return Number(row.Status) === 5 && Number(row.Process) === 9;
}

function openAction(
  row: WithdrawFinanceItem,
  mode: 'agree' | 'manual' | 'reject',
) {
  const withdrawRow = asWithdrawRow(row);
  if (
    (mode === 'agree' || mode === 'manual') &&
    isWithdrawRiskBlockingPay(withdrawRow)
  ) {
    message.warning('风控状态未审核，无法出款');
    return;
  }
  actionRow.value = withdrawRow;
  actionMode.value = mode;
  actionOpen.value = true;
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

function handleBatchApprove() {
  if (!hasSelection.value) {
    message.warning('请先选择记录');
    return;
  }
  batchApproveOpen.value = true;
}

function handleCheckThirdParty(row: WithdrawFinanceItem) {
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

function handleTransitionPending(row: WithdrawFinanceItem) {
  if (!row.Id) {
    return;
  }
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

function handleReceivedStatusFix(row: WithdrawFinanceItem) {
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

function openRemark(row: WithdrawFinanceItem) {
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

const gridOptions: VxeTableGridOptions<WithdrawFinanceItem> = {
  checkboxConfig: {
    checkMethod: ({ row }) => canSelectRow(row as WithdrawFinanceItem),
  },
  columns: [
    { type: 'checkbox', width: 50 },
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
      field: 'Remark',
      minWidth: 140,
      slots: { default: 'remark' },
      title: '备注',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 300,
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
        const result = await fetchWithdrawFinanceListApi({
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

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: WithdrawFinanceItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: WithdrawFinanceItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);
const hasSelection = computed(() => selectedRows.value.length > 0);

function handleBatchApproveSuccess() {
  selectedRows.value = [];
  gridApi.reload();
}

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
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterHandlerName"
            allow-clear
            placeholder="请输入处理人"
          >
            <template #addonBefore>处理人</template>
          </Input>
        </div>
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

    <div
      v-if="canBatchApprove || canBatchManual || canBatchReject"
      class="mb-2 flex flex-wrap items-center justify-end gap-2"
    >
      <Button
        v-if="canBatchApprove"
        :disabled="!hasSelection"
        :loading="batchLoading"
        type="primary"
        @click="handleBatchApprove"
      >
        批量同意出款
      </Button>
      <Button
        v-if="canBatchManual"
        :disabled="!hasSelection"
        :loading="batchLoading"
        @click="handleBatchManual"
      >
        批量人工出款
      </Button>
      <Button
        v-if="canBatchReject"
        :disabled="!hasSelection"
        danger
        :loading="batchLoading"
        @click="handleBatchReject"
      >
        批量拒绝出款
      </Button>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag>{{ calcWithdrawStatusText(row.Status) }}</Tag>
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
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
        <Space :size="0" wrap>
          <Button
            v-if="canManualPay && canShowWithdrawManualPay(asWithdrawRow(row))"
            size="small"
            type="link"
            @click="openAction(row, 'manual')"
          >
            人工出款
          </Button>
          <Button
            v-if="canAutoPay && canShowWithdrawAutoPay(asWithdrawRow(row))"
            size="small"
            type="link"
            @click="openAction(row, 'agree')"
          >
            同意出款
          </Button>
          <Button
            v-if="canRejectPay && canShowWithdrawReject(asWithdrawRow(row))"
            danger
            size="small"
            type="link"
            @click="openAction(row, 'reject')"
          >
            拒绝出款
          </Button>
          <Button
            v-if="canCheckThirdParty && canShowCheckThirdParty(row)"
            size="small"
            type="link"
            @click="handleCheckThirdParty(row)"
          >
            查询三方
          </Button>
          <Button
            v-if="canTransitionPending && canShowTransitionPending(row)"
            size="small"
            type="link"
            @click="handleTransitionPending(row)"
          >
            转待处理
          </Button>
          <Button
            v-if="canShowWithdrawReceivedFix(asWithdrawRow(row))"
            size="small"
            type="link"
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

    <WithdrawBatchApproveModal
      v-model:open="batchApproveOpen"
      :rows="selectedRows"
      @success="handleBatchApproveSuccess"
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
    sub-title="需要权限 10350 才能查看出款列表"
    title="无权限"
  />
</template>

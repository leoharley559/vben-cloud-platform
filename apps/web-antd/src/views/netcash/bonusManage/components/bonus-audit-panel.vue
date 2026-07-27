<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { BonusManageItem } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Result,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  adjustBonusApi,
  approveBonusApi,
  fetchBonusApproveListApi,
} from '#/api/netcash/bonus-manage';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

import {
  bonusOptions,
  statusColor,
  statusText,
  todayRange,
  validAmount,
  validRemark,
  walletOptions,
} from '../shared';

defineOptions({ name: 'BonusAuditPanel' });

type AuditAction =
  | 'adjust'
  | 'batchApprove'
  | 'batchReject'
  | 'singleApprove'
  | 'singleReject';

const { checkPermission } = useCloudPermission();
const cloudStore = useCloudPlatformStore();

const canAuditList = computed(() => checkPermission(11_360));
const canSingleApprove = computed(() => checkPermission(11_361));
const canBatchApprove = computed(() => checkPermission(11_362));
const canSingleReject = computed(() => checkPermission(11_363));
const canBatchReject = computed(() => checkPermission(11_364));
const canAdjust = computed(() => checkPermission(11_365));

const auditFilters = reactive({
  ApplyDesc: '',
  ApplyName: '',
  BonusType: '' as number | string,
  Username: '',
  WalletType: '' as number | string,
});
const auditRange = ref<[Dayjs, Dayjs]>(todayRange());
const auditRows = ref<BonusManageItem[]>([]);
const auditLoading = ref(false);
const auditPage = ref(1);
const auditPageSize = ref(20);
const auditTotal = ref(0);
const auditTotalAmount = ref(0);
const selectedAuditRows = ref<BonusManageItem[]>([]);

const auditSummaryItems = computed(() => [
  {
    label: '申请金额汇总',
    value: formatAmountFromCent(auditTotalAmount.value),
    valueClass: 'text-red-500',
  },
]);

function auditQuery() {
  const [begin, end] = auditRange.value || todayRange();
  return {
    ...auditFilters,
    BeginTime: begin.startOf('day').unix(),
    EndTime: end.endOf('day').unix(),
    IsExp: false,
    Page: auditPage.value,
    PageSize: auditPageSize.value,
  };
}

async function loadAudit() {
  if (!canAuditList.value) return;
  auditLoading.value = true;
  try {
    const result = await fetchBonusApproveListApi(auditQuery());
    auditRows.value = result.Items || [];
    auditTotal.value = Number(result.Pagination?.MaxCount || 0);
    auditTotalAmount.value = Number(result.Total?.Total || 0);
    selectedAuditRows.value = [];
  } catch {
    auditRows.value = [];
    auditTotal.value = 0;
    auditTotalAmount.value = 0;
    selectedAuditRows.value = [];
  } finally {
    auditLoading.value = false;
  }
}

function searchAudit() {
  auditPage.value = 1;
  void loadAudit();
}

function resetAudit() {
  Object.assign(auditFilters, {
    ApplyDesc: '',
    ApplyName: '',
    BonusType: '',
    Username: '',
    WalletType: '',
  });
  auditRange.value = todayRange();
  searchAudit();
}

function canOperateAuditRow(row: BonusManageItem) {
  return (
    Number(row.Approve) === 1 &&
    !isSameAcctActionRestricted(47, row.CreateAdminId)
  );
}

const auditRowSelection = computed(() => ({
  getCheckboxProps: (row: BonusManageItem) => ({
    disabled: !canOperateAuditRow(row),
  }),
  onChange: (_keys: Array<number | string>, rows: BonusManageItem[]) => {
    selectedAuditRows.value = rows;
  },
  selectedRowKeys: selectedAuditRows.value
    .map((row) => row.Id)
    .filter((id): id is number | string => id !== undefined),
}));

const auditColumns = [
  { dataIndex: 'Approve', key: 'Approve', title: '状态', width: 100 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单编号', width: 160 },
  { dataIndex: 'Username', key: 'Username', title: '代理账号', width: 130 },
  { dataIndex: 'WalletType', key: 'WalletType', title: '钱包类型', width: 110 },
  { dataIndex: 'BonusType', key: 'BonusType', title: '红利类型', width: 110 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '申请时间', width: 170 },
  { dataIndex: 'ApplyName', key: 'ApplyName', title: '申请账号', width: 120 },
  { dataIndex: 'Amount', key: 'Amount', title: '申请金额', width: 120 },
  { dataIndex: 'ApplyDesc', key: 'ApplyDesc', title: '申请备注', width: 180 },
  { dataIndex: 'ChangeDesc', key: 'ChangeDesc', title: '变更备注', width: 160 },
  { fixed: 'right', key: 'actions', title: '操作', width: 190 },
];

const auditModalOpen = ref(false);
const auditAction = ref<AuditAction>('singleApprove');
const auditCurrentRow = ref<BonusManageItem | null>(null);
const auditForm = reactive({
  Amount: undefined as number | undefined,
  HandleDesc: '',
});
const auditSubmitting = ref(false);

const auditModalTitle = computed(
  () =>
    ({
      adjust: '调整红利申请',
      batchApprove: '批量通过',
      batchReject: '批量拒绝',
      singleApprove: '通过红利申请',
      singleReject: '拒绝红利申请',
    })[auditAction.value],
);
const isSingleAudit = computed(() =>
  ['adjust', 'singleApprove', 'singleReject'].includes(auditAction.value),
);
const needAuditAmount = computed(() =>
  ['adjust', 'singleApprove'].includes(auditAction.value),
);

function openAuditAction(action: AuditAction, row?: BonusManageItem) {
  if (action.startsWith('batch') && selectedAuditRows.value.length === 0) {
    message.warning('请先勾选待审核记录');
    return;
  }
  auditAction.value = action;
  auditCurrentRow.value = row || null;
  auditForm.Amount =
    action === 'singleApprove' && row
      ? Number(row.Amount || 0) / 100
      : undefined;
  auditForm.HandleDesc = '';
  auditModalOpen.value = true;
}

async function submitAuditAction() {
  if (!validRemark(auditForm.HandleDesc.trim(), true)) {
    message.warning('请输入 1-400 个字符的审核备注');
    return;
  }
  if (needAuditAmount.value && !validAmount(auditForm.Amount, false)) {
    message.warning('金额须为非零且最多两位小数');
    return;
  }
  const ids = auditAction.value.startsWith('batch')
    ? selectedAuditRows.value.map((row) => row.Id).filter(Boolean).join(',')
    : String(auditCurrentRow.value?.Id || '');
  if (!ids) return;

  auditSubmitting.value = true;
  try {
    if (auditAction.value === 'adjust') {
      await adjustBonusApi({
        Amount: Math.round(Number(auditForm.Amount) * 100),
        HandleDesc: auditForm.HandleDesc.trim(),
        Id: ids,
      });
    } else {
      await approveBonusApi({
        Amount:
          auditAction.value === 'singleApprove'
            ? Math.round(Number(auditForm.Amount) * 100)
            : '',
        Approve: auditAction.value.includes('Approve') ? 2 : 3,
        HandleDesc: auditForm.HandleDesc.trim(),
        Ids: ids,
      });
    }
    message.success('操作成功');
    auditModalOpen.value = false;
    await loadAudit();
  } catch {
    // requestClient 已提示业务错误
  } finally {
    auditSubmitting.value = false;
  }
}

onMounted(() => {
  void loadAudit();
});
</script>

<template>
  <Result
    v-if="!canAuditList"
    status="403"
    sub-title="无审核列表查看权限(11360)"
    title="403"
  />
  <template v-else>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <Input
        v-model:value="auditFilters.Username"
        allow-clear
        placeholder="代理账号"
        style="width: 220px"
      >
        <template #addonBefore>代理账号</template>
      </Input>
      <Select
        v-model:value="auditFilters.WalletType"
        class="w-36"
        :options="walletOptions"
      />
      <Select
        v-model:value="auditFilters.BonusType"
        class="w-36"
        :options="bonusOptions"
      />
      <Input
        v-model:value="auditFilters.ApplyName"
        allow-clear
        placeholder="申请账号"
        style="width: 220px"
      >
        <template #addonBefore>申请账号</template>
      </Input>
      <Input
        v-model:value="auditFilters.ApplyDesc"
        allow-clear
        placeholder="申请备注"
        style="width: 220px"
      >
        <template #addonBefore>申请备注</template>
      </Input>
      <DatePicker.RangePicker v-model:value="auditRange" />
      <Button type="primary" @click="searchAudit">查询</Button>
      <Button @click="resetAudit">重置</Button>
    </div>
    <div class="mb-3 flex items-center justify-between">
      <SummaryCards :items="auditSummaryItems" />
      <Space>
        <Button
          v-if="canBatchApprove"
          type="primary"
          :disabled="selectedAuditRows.length === 0"
          @click="openAuditAction('batchApprove')"
        >
          批量通过
        </Button>
        <Button
          v-if="canBatchReject"
          danger
          :disabled="selectedAuditRows.length === 0"
          @click="openAuditAction('batchReject')"
        >
          批量拒绝
        </Button>
      </Space>
    </div>
    <Table
      :columns="auditColumns"
      :data-source="auditRows"
      :loading="auditLoading"
      :pagination="false"
      :row-key="(row: BonusManageItem) => String(row.Id)"
      :row-selection="auditRowSelection"
      :scroll="{ x: 1550 }"
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
        <template v-else-if="column.key === 'CreateTime'">
          {{ formatNetcashDateTime(record.CreateTime) }}
        </template>
        <template v-else-if="column.key === 'Amount'">
          {{ formatAmountFromCent(Number(record.Amount || 0)) }}
        </template>
        <Space v-else-if="column.key === 'actions'" :size="0">
          <Button
            v-if="canSingleApprove"
            type="link"
            size="small"
            :disabled="!canOperateAuditRow(record)"
            @click="openAuditAction('singleApprove', record)"
          >
            通过
          </Button>
          <Button
            v-if="canAdjust"
            type="link"
            size="small"
            :disabled="!canOperateAuditRow(record)"
            @click="openAuditAction('adjust', record)"
          >
            调整
          </Button>
          <Button
            v-if="canSingleReject"
            danger
            type="link"
            size="small"
            :disabled="!canOperateAuditRow(record)"
            @click="openAuditAction('singleReject', record)"
          >
            拒绝
          </Button>
        </Space>
      </template>
    </Table>
    <div class="mt-4 flex justify-end">
      <Pagination
        v-model:current="auditPage"
        v-model:page-size="auditPageSize"
        :total="auditTotal"
        show-size-changer
        show-quick-jumper
        @change="loadAudit"
      />
    </div>

    <Modal
      v-model:open="auditModalOpen"
      :confirm-loading="auditSubmitting"
      :title="auditModalTitle"
      @ok="submitAuditAction"
    >
      <Form layout="vertical">
        <template v-if="isSingleAudit && auditCurrentRow">
          <Form.Item label="代理账号">
            <Input :value="auditCurrentRow.Username" disabled />
          </Form.Item>
          <Form.Item label="申请金额">
            <Input
              :value="formatAmountFromCent(Number(auditCurrentRow.Amount || 0))"
              disabled
            />
          </Form.Item>
        </template>
        <div v-else class="mb-4 text-center">
          确认处理已勾选的 {{ selectedAuditRows.length }} 条红利申请？
        </div>
        <Form.Item
          v-if="needAuditAmount"
          :label="auditAction === 'adjust' ? '调整金额（元）' : '支付金额（元）'"
          required
        >
          <InputNumber
            v-model:value="auditForm.Amount"
            class="!w-full"
            :precision="2"
          />
        </Form.Item>
        <Form.Item v-if="auditAction !== 'adjust'" label="审核账号">
          <Input
            :value="String(cloudStore.adminInfo?.Admin?.Username || '')"
            disabled
          />
        </Form.Item>
        <Form.Item
          :label="auditAction === 'adjust' ? '变更备注' : '审核备注'"
          required
        >
          <Input.TextArea
            v-model:value="auditForm.HandleDesc"
            :maxlength="400"
            :rows="4"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>
  </template>
</template>

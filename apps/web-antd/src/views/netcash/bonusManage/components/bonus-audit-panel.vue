<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BonusManageItem } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  adjustBonusApi,
  approveBonusApi,
  fetchBonusApproveListApi,
} from '#/api/netcash/bonus-manage';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
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
  last3DaysRange,
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
const auditRange = ref(last3DaysRange());
const auditTotalAmount = ref(0);
const selectedAuditRows = ref<BonusManageItem[]>([]);

const auditSummaryItems = computed(() => [
  {
    label: '申请金额汇总',
    value: formatAmountFromCent(auditTotalAmount.value),
  },
]);

function auditQuery(page?: { currentPage: number; pageSize: number }) {
  const [begin, end] = auditRange.value || [];
  return {
    ...auditFilters,
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    IsExp: false,
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
  };
}

function canOperateAuditRow(row: BonusManageItem) {
  return (
    Number(row.Approve) === 1 &&
    !isSameAcctActionRestricted(47, row.CreateAdminId)
  );
}

const gridOptions: VxeTableGridOptions<BonusManageItem> = {
  checkboxConfig: {
    checkMethod: ({ row }) => canOperateAuditRow(row as BonusManageItem),
  },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'Approve',
      minWidth: 100,
      slots: { default: 'approve' },
      title: '状态',
    },
    {
      field: 'OrderId',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'Username',
      minWidth: 130,
      slots: { default: 'username' },
      title: '代理账号',
    },
    {
      field: 'WalletType',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 1 ? '佣金钱包' : '-',
      minWidth: 110,
      title: '钱包类型',
    },
    {
      field: 'BonusType',
      formatter: ({ cellValue }) =>
        Number(cellValue) === 1 ? '代理红利' : '-',
      minWidth: 110,
      title: '红利类型',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    { field: 'ApplyName', minWidth: 120, title: '申请账号' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '申请金额',
    },
    {
      field: 'ApplyDesc',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '申请备注',
    },
    {
      field: 'ChangeDesc',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '变更备注',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 180,
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
        const result = await fetchBonusApproveListApi(auditQuery(page));
        auditTotalAmount.value = Number(result?.Total?.Total || 0);
        selectedAuditRows.value = [];
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
  showFooter: true,
  footerMethod: () => [
    [
      '',
      '合计',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      formatAmountFromCent(auditTotalAmount.value),
      '-',
      '-',
      '',
    ],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: BonusManageItem[] }) => {
      selectedAuditRows.value = records;
    },
    checkboxChange: ({ records }: { records: BonusManageItem[] }) => {
      selectedAuditRows.value = records;
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);

function resetAudit() {
  Object.assign(auditFilters, {
    ApplyDesc: '',
    ApplyName: '',
    BonusType: '',
    Username: '',
    WalletType: '',
  });
  auditRange.value = last3DaysRange();
  gridApi.reload();
}

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
    ? selectedAuditRows.value
        .map((row) => row.Id)
        .filter(Boolean)
        .join(',')
    : String(auditCurrentRow.value?.Id || '');
  if (!ids) return;

  auditSubmitting.value = true;
  try {
    await (auditAction.value === 'adjust' ? adjustBonusApi({
        Amount: Math.round(Number(auditForm.Amount) * 100),
        HandleDesc: auditForm.HandleDesc.trim(),
        Id: ids,
      }) : approveBonusApi({
        Amount:
          auditAction.value === 'singleApprove'
            ? Math.round(Number(auditForm.Amount) * 100)
            : '',
        Approve: auditAction.value.includes('Approve') ? 2 : 3,
        HandleDesc: auditForm.HandleDesc.trim(),
        Ids: ids,
      }));
    message.success('操作成功');
    auditModalOpen.value = false;
    selectedAuditRows.value = [];
    gridApi.reload();
  } catch {
    // requestClient 已提示业务错误
  } finally {
    auditSubmitting.value = false;
  }
}

onMounted(() => {
  if (canAuditList.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canAuditList">
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="auditFilters.Username"
            allow-clear
            placeholder="请输入代理账号"
          >
            <template #addonBefore>代理账号</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">钱包类型</span>
          <Select
            v-model:value="auditFilters.WalletType"
            :options="walletOptions"
            placeholder="请选择钱包类型"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">红利类型</span>
          <Select
            v-model:value="auditFilters.BonusType"
            :options="bonusOptions"
            placeholder="请选择红利类型"
          />
        </Space.Compact>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="auditFilters.ApplyName"
            allow-clear
            placeholder="请输入申请账号"
          >
            <template #addonBefore>申请账号</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="auditFilters.ApplyDesc"
            allow-clear
            placeholder="请输入申请备注"
          >
            <template #addonBefore>申请备注</template>
          </Input>
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="auditRange" label="申请时间" />
        </div>
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
            查询
          </Button>
          <Button @click="resetAudit">重置</Button>
        </div>
      </div>
    </div>

    <div
      v-if="canBatchApprove || canBatchReject"
      class="mb-2 flex flex-wrap items-center justify-end gap-2"
    >
      <Button
        v-if="canBatchApprove"
        type="primary"
        @click="openAuditAction('batchApprove')"
      >
        批量通过
      </Button>
      <Button
        v-if="canBatchReject"
        danger
        @click="openAuditAction('batchReject')"
      >
        批量拒绝
      </Button>
    </div>

    <SummaryCards :items="auditSummaryItems" />

    <Grid>
      <template #approve="{ row }">
        <Tag :color="statusColor(row.Approve)">
          {{ statusText(row.Approve) }}
        </Tag>
      </template>
      <template #username="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :username="row.Username"
        />
      </template>
      <template #actions="{ row }">
        <Space :size="0">
          <Button
            v-if="canSingleApprove && canOperateAuditRow(row)"
            size="small"
            type="link"
            @click="openAuditAction('singleApprove', row)"
          >
            通过
          </Button>
          <Button
            v-if="canAdjust && canOperateAuditRow(row)"
            size="small"
            type="link"
            @click="openAuditAction('adjust', row)"
          >
            调整
          </Button>
          <Button
            v-if="canSingleReject && canOperateAuditRow(row)"
            danger
            size="small"
            type="link"
            @click="openAuditAction('singleReject', row)"
          >
            拒绝
          </Button>
        </Space>
      </template>
    </Grid>

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
          :label="
            auditAction === 'adjust' ? '调整金额（元）' : '支付金额（元）'
          "
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
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 11360 才能查看审核列表"
    title="无权限"
  />
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
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
  approveGiftApi,
  fetchGiftAuditListApi,
  fetchGiftPlayerInfoApi,
  recordGiftApi,
  remarkGiftApi,
} from '#/api/operationManage/gift-manage';
import { queryPlayerByAccountApi } from '#/api/operationManage/player';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';
import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { PLAYER_STATUS_OPTIONS } from '#/utils/player-status';
import { GIFT_AUDIT_STATUS_MAP } from '#/utils/operation-status';

import {
  formatAmountFromCent,
  formatGiftAuditStatus,
  formatGiftDateTime,
  formatVipLevel,
  giftListTotal,
  giftNameText,
  parseGiftNames,
} from './gift-shared';

defineOptions({ name: 'GiftAuditLevelPanel' });

interface GiftRow {
  Address?: string;
  ApproveName?: string;
  ApproveTime?: number | string;
  Bet?: number;
  Contact?: string;
  CreateTime?: number | string;
  ErrMsg?: string;
  GiftName?: string | string[];
  GiftVipLevel?: number | string;
  Id: number | string;
  LoginAccount?: string;
  Mobile?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  PlayerStatus?: number;
  Recharge?: number;
  Remark?: string;
  Status?: number;
  VipLevel?: number | string;
}

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10172));
const canExport = computed(() => checkPermission(10173));
const canRecord = computed(() => checkPermission(10183));
const canRemark = computed(() => checkPermission(10184));
const canApprove = computed(() => checkPermission(10185));
const canReject = computed(() => checkPermission(10186));
const canBatchApprove = computed(() => checkPermission(10181));
const canBatchReject = computed(() => checkPermission(10182));

const filterLoginAccount = ref('');
const filterPackageName = ref('');
const filterOrderId = ref('');
const filterGiftName = ref('');
const filterContact = ref('');
const filterMobile = ref('');
const filterStatus = ref<number | string>('');
const filterVipLevel = ref(-1);
const filterPlayerStatus = ref(-1);
const filterApplyDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const filterApproveDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

const selectedRows = ref<GiftRow[]>([]);
const exportLoading = ref(false);
const submitting = ref(false);
const queryingPlayer = ref(false);

const auditOpen = ref(false);
const remarkOpen = ref(false);
const recordOpen = ref(false);

const auditForm = reactive({
  Approve: 1 as 1 | 2,
  Ids: '' as number | string,
  Remark: '',
  title: '',
});

const remarkForm = reactive({
  Id: '' as number | string,
  Remark: '',
});

const recordQuery = reactive({
  LoginAccount: '',
  PackageName: '',
});

const recordForm = reactive({
  Address: '',
  Contact: '',
  GiftName: '',
  Mobile: '',
  PlayerId: '' as number | string,
  PlayerName: '',
  Remark: '',
  VipLevel: '' as number | string,
});

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审核', value: -1 },
  { label: '通过', value: 1 },
  { label: '拒绝', value: 2 },
];

const playerStatusOptions = [
  { label: '全部', value: -1 },
  ...PLAYER_STATUS_OPTIONS,
];

const packageNameOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '')
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageName,
    })),
);

function isPending(row: GiftRow) {
  return Number(row.Status) === -1 || row.Status === undefined;
}

function statusColor(status?: number) {
  if (Number(status) === 1) {
    return 'success';
  }
  if (Number(status) === 2) {
    return 'error';
  }
  return 'processing';
}

function getQueryParams(page?: { currentPage: number; pageSize: number }) {
  const [applyBegin, applyEnd] = filterApplyDateRange.value || [];
  const [approveBegin, approveEnd] = filterApproveDateRange.value || [];
  return {
    ApplyBeginTime: applyBegin ? applyBegin.unix() : '',
    ApplyEndTime: applyEnd ? applyEnd.unix() : '',
    ApplyType: '4',
    ApproveBeginTime: approveBegin ? approveBegin.unix() : '',
    ApproveEndTime: approveEnd ? approveEnd.unix() : '',
    Contact: filterContact.value.trim(),
    GiftName: filterGiftName.value.trim(),
    IsExp: false,
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    Mobile: filterMobile.value.trim(),
    OrderId: filterOrderId.value.trim(),
    PackageName: filterPackageName.value.trim(),
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
    PlayerStatus: filterPlayerStatus.value,
    Sort: '',
    Status: filterStatus.value ?? '',
    VipLevel: filterVipLevel.value,
  };
}

function normalizeRows(items: Record<string, unknown>[]) {
  return items.map((item) => ({
    ...item,
    GiftName: parseGiftNames(item.GiftName),
  })) as GiftRow[];
}

const gridOptions: VxeTableGridOptions<GiftRow> = {
  checkboxConfig: {
    checkMethod: ({ row }) => isPending(row as GiftRow),
  },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 100, title: '产品名称' },
    {
      field: 'OrderId',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '订单号',
    },
    {
      field: 'GiftVipLevel',
      formatter: ({ cellValue }) => formatVipLevel(cellValue),
      minWidth: 90,
      title: '礼品等级',
    },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) => formatVipLevel(cellValue),
      minWidth: 90,
      title: 'VIP等级',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatGiftDateTime(cellValue),
      minWidth: 160,
      title: '申请时间',
    },
    {
      field: 'GiftName',
      formatter: ({ cellValue }) => giftNameText(cellValue),
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '奖品名称',
    },
    {
      field: 'Bet',
      formatter: ({ row }) =>
        `${formatAmountFromCent(row.Bet)} / ${formatAmountFromCent(row.Recharge)}`,
      minWidth: 140,
      title: '投注/存款',
    },
    { field: 'Contact', minWidth: 90, title: '收货人' },
    { field: 'Mobile', minWidth: 120, title: '收货电话' },
    {
      field: 'Address',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '收货地址',
    },
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '审核状态',
    },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatGiftDateTime(cellValue),
      minWidth: 160,
      title: '审核时间',
    },
    { field: 'ApproveName', minWidth: 100, title: '操作人' },
    { field: 'Remark', minWidth: 120, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'ErrMsg',
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '异常信息',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 220,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchGiftAuditListApi(getQueryParams(page));
        const items = normalizeRows(result.Items || []);
        return {
          items,
          total: giftListTotal(result.Pagination, items.length),
        };
      },
    },
  },
  rowConfig: { keyField: 'Id' },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: GiftRow[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: GiftRow[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

function openAudit(approve: 1 | 2, ids: number | string, title: string) {
  auditForm.Approve = approve;
  auditForm.Ids = ids;
  auditForm.Remark = '';
  auditForm.title = title;
  auditOpen.value = true;
}

function handleBatch(approve: 1 | 2) {
  if (!selectedRows.value.length) {
    message.warning('请先勾选待审核记录');
    return;
  }
  openAudit(
    approve,
    selectedRows.value.map((row) => row.Id).join(','),
    approve === 1 ? '批量通过' : '批量拒绝',
  );
}

async function submitAudit() {
  submitting.value = true;
  try {
    await approveGiftApi({
      Approve: auditForm.Approve,
      Ids: auditForm.Ids,
      Remark: auditForm.Remark,
    });
    message.success(auditForm.Approve === 1 ? '审核通过' : '已拒绝');
    auditOpen.value = false;
    selectedRows.value = [];
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openRemark(row: GiftRow) {
  remarkForm.Id = row.Id;
  remarkForm.Remark = String(row.Remark || '');
  remarkOpen.value = true;
}

async function submitRemark() {
  submitting.value = true;
  try {
    await remarkGiftApi({ ...remarkForm });
    message.success('备注已更新');
    remarkOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openRecord() {
  recordQuery.LoginAccount = '';
  recordQuery.PackageName = packageNameOptions.value[0]?.value || '';
  recordForm.PlayerId = '';
  recordForm.PlayerName = '';
  recordForm.GiftName = '';
  recordForm.Contact = '';
  recordForm.Mobile = '';
  recordForm.Address = '';
  recordForm.Remark = '';
  recordForm.VipLevel = '';
  recordOpen.value = true;
}

async function queryRecordPlayer() {
  if (!recordQuery.LoginAccount.trim() || !recordQuery.PackageName) {
    message.warning('请填写游戏账号与产品包');
    return;
  }
  queryingPlayer.value = true;
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: recordQuery.LoginAccount.trim(),
      PackageName: recordQuery.PackageName,
    });
    const item = result.Items?.[0] as Record<string, unknown> | undefined;
    const playerId = item?.PlayerId;
    if (!playerId || Number(playerId) === 0) {
      message.error('未匹配到有效玩家');
      recordForm.PlayerId = '';
      return;
    }
    recordForm.PlayerId = playerId as number | string;
    try {
      const info = await fetchGiftPlayerInfoApi({
        PlayerId: recordForm.PlayerId,
      });
      recordForm.PlayerName = String(
        info?.PlayerName || item?.LoginAccount || '',
      );
      recordForm.VipLevel = (info?.VipLevel as number | string) ?? '';
    } catch {
      recordForm.PlayerName = String(item?.LoginAccount || '');
    }
  } finally {
    queryingPlayer.value = false;
  }
}

async function submitRecord() {
  if (!recordForm.PlayerId) {
    message.warning('请先查询玩家');
    return;
  }
  if (!recordForm.GiftName.trim()) {
    message.warning('请填写礼品名称');
    return;
  }
  submitting.value = true;
  try {
    await recordGiftApi({
      Address: recordForm.Address,
      ApplyType: 4,
      Contact: recordForm.Contact,
      GiftName: recordForm.GiftName,
      Mobile: recordForm.Mobile,
      PlayerId: recordForm.PlayerId,
      PlayerName: recordForm.PlayerName,
      Remark: recordForm.Remark,
      VipLevel: recordForm.VipLevel,
    });
    message.success('录单成功');
    recordOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function resetFilters() {
  filterLoginAccount.value = '';
  filterPackageName.value = '';
  filterOrderId.value = '';
  filterGiftName.value = '';
  filterContact.value = '';
  filterMobile.value = '';
  filterStatus.value = '';
  filterVipLevel.value = -1;
  filterPlayerStatus.value = -1;
  filterApplyDateRange.value = undefined;
  filterApproveDateRange.value = undefined;
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchGiftAuditListApi({
      ...getQueryParams(),
      IsExp: true,
      Page: 1,
      PageSize: 10000,
    });
    const rows = normalizeRows(result.Items || []);
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: '产品名称', value: (row) => row.PackageName || '-' },
        { header: '订单号', value: (row) => row.OrderId || '-' },
        {
          header: '礼品等级',
          value: (row) => formatVipLevel(row.GiftVipLevel),
        },
        { header: 'VIP等级', value: (row) => formatVipLevel(row.VipLevel) },
        {
          header: '申请时间',
          value: (row) => formatGiftDateTime(row.CreateTime),
        },
        { header: '奖品名称', value: (row) => giftNameText(row.GiftName) },
        {
          header: '投注金额',
          value: (row) => formatAmountFromCent(row.Bet),
        },
        {
          header: '存款金额',
          value: (row) => formatAmountFromCent(row.Recharge),
        },
        { header: '收货人', value: (row) => row.Contact || '-' },
        { header: '收货电话', value: (row) => row.Mobile || '-' },
        { header: '收货地址', value: (row) => row.Address || '-' },
        {
          header: '审核状态',
          value: (row) => formatGiftAuditStatus(row.Status),
        },
        {
          header: '审核时间',
          value: (row) => formatGiftDateTime(row.ApproveTime),
        },
        { header: '操作人', value: (row) => row.ApproveName || '-' },
        { header: '备注', value: (row) => row.Remark || '-' },
        { header: '异常信息', value: (row) => row.ErrMsg || '-' },
      ],
      `晋级豪礼审核_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          style="width: 240px"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPackageName"
          allow-clear
          style="width: 240px"
          placeholder="请输入产品名称"
        >
          <template #addonBefore>产品名称</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          style="width: 250px"
          placeholder="请输入订单号"
        >
          <template #addonBefore>订单号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterGiftName"
          allow-clear
          style="width: 220px"
          placeholder="请输入奖品名称"
        >
          <template #addonBefore>奖品名称</template>
        </Input>
      </div>
      <Select
        v-model:value="filterVipLevel"
        :options="VIP_LEVEL_OPTIONS"
        style="width: 110px"
      />
      <Select
        v-model:value="filterPlayerStatus"
        :options="playerStatusOptions"
        style="width: 110px"
      />
      <Space.Compact>
        <span class="query-field-addon">审核状态</span>
        <Select
          v-model:value="filterStatus"
          :options="statusOptions"
          allow-clear
          style="width: 110px"
          placeholder="请选择审核状态"
        />
      </Space.Compact>
      <QueryDatetimeRangePicker v-model="filterApplyDateRange" label="申请时间" />
      <QueryDatetimeRangePicker v-model="filterApproveDateRange" label="审核时间" />
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterContact"
          allow-clear
          style="width: 200px"
          placeholder="请输入收货人"
        >
          <template #addonBefore>收货人</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterMobile"
          allow-clear
          style="width: 210px"
          placeholder="请输入收货电话"
        >
          <template #addonBefore>收货电话</template>
        </Input>
      </div>
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button v-if="canRecord" @click="openRecord">人工录单</Button>
      <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
        导出
      </Button>
      <Space v-if="canBatchApprove || canBatchReject">
        <Button v-if="canBatchApprove" type="primary" @click="handleBatch(1)">
          批量通过
        </Button>
        <Button v-if="canBatchReject" danger @click="handleBatch(2)">
          批量拒绝
        </Button>
      </Space>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <div>
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
          <div class="mt-1">
            <PlayerStatusTag :status="row.PlayerStatus" hide-normal />
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <Tag :color="statusColor(row.Status)">
          {{ GIFT_AUDIT_STATUS_MAP[Number(row.Status)] || '待审核' }}
        </Tag>
      </template>
      <template #action="{ row }">
        <div class="flex flex-wrap gap-1">
          <Button v-if="canRemark" size="small" @click="openRemark(row)">
            改备注
          </Button>
          <Button
            v-if="canApprove"
            size="small"
            type="primary"
            :disabled="Number(row.Status) === 1"
            @click="openAudit(1, row.Id, '通过审核')"
          >
            通过
          </Button>
          <Button
            v-if="canReject"
            danger
            size="small"
            :disabled="Number(row.Status) === 1 || Number(row.Status) === 2"
            @click="openAudit(2, row.Id, '拒绝审核')"
          >
            拒绝
          </Button>
        </div>
      </template>
    </Grid>

    <Modal
      v-model:open="auditOpen"
      :confirm-loading="submitting"
      destroy-on-close
      :title="auditForm.title"
      @ok="submitAudit"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="审核备注">
          <Input.TextArea v-model:value="auditForm.Remark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="remarkOpen"
      :confirm-loading="submitting"
      destroy-on-close
      title="修改备注"
      @ok="submitRemark"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="备注">
          <Input.TextArea v-model:value="remarkForm.Remark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="recordOpen"
      :confirm-loading="submitting"
      destroy-on-close
      title="人工录单"
      width="640px"
      @ok="submitRecord"
    >
      <Form layout="vertical" class="pt-2">
        <div class="mb-3 flex flex-wrap gap-2">
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="recordQuery.LoginAccount"
              allow-clear
              style="width: 180px"
              placeholder="请输入游戏账号"
            >
              <template #addonBefore>游戏账号</template>
            </Input>
          </div>
          <Select
            v-model:value="recordQuery.PackageName"
            allow-clear
            class="w-40"
            :options="packageNameOptions"
            show-search
            placeholder="请选择产品包"
          />
          <Button :loading="queryingPlayer" @click="queryRecordPlayer">
            查询玩家
          </Button>
        </div>
        <Form.Item label="玩家ID">
          <Input :value="String(recordForm.PlayerId || '')" disabled />
        </Form.Item>
        <Form.Item label="玩家昵称">
          <Input v-model:value="recordForm.PlayerName" disabled />
        </Form.Item>
        <Form.Item label="礼品名称" required>
          <Input v-model:value="recordForm.GiftName" placeholder="请输入" />
        </Form.Item>
        <Form.Item label="收货人" required>
          <Input v-model:value="recordForm.Contact" />
        </Form.Item>
        <Form.Item label="收货电话" required>
          <Input v-model:value="recordForm.Mobile" />
        </Form.Item>
        <Form.Item label="收货地址" required>
          <Input v-model:value="recordForm.Address" />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="recordForm.Remark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
  <Result
    v-else
    status="403"
    sub-title="无审核列表查看权限(10172)"
    title="无权限"
  />
</template>

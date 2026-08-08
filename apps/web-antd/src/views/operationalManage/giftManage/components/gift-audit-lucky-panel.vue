<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
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
  remarkGiftApi,
} from '#/api/operationManage/gift-manage';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { exportRowsToCsv } from '#/utils/export-csv';
import { PLAYER_STATUS_OPTIONS } from '#/utils/player-status';
import { GIFT_AUDIT_STATUS_MAP } from '#/utils/operation-status';

import {
  ACTIVITY_TYPE_LUCKY_DRAW,
  GIFT_IS_MANUAL_OPTIONS,
  GIFT_LUCKY_ACTIVITY_TYPE_OPTIONS,
  GIFT_LUCKY_AUDIT_STATUS_OPTIONS,
  GIFT_RISK_OPTIONS,
  GIFT_TYPE_FILTER_OPTIONS,
  LUCKY_DRAW_BONUS_CATEGORY_OPTIONS,
  formatActivityType,
  formatGiftAuditStatus,
  formatGiftDateTime,
  formatGiftType,
  formatIsManual,
  formatLuckyBonusCategory,
  formatPlayerMetric,
  formatVipLevel,
  giftListTotal,
  giftNameText,
  parseGiftNames,
} from './gift-shared';

defineOptions({ name: 'GiftAuditLuckyPanel' });

interface LuckyAuditRow {
  ActivityType?: number | string;
  Address?: string;
  ApplyRemark?: string;
  ApplyTime?: number | string;
  ApproveName?: string;
  ApproveRemark?: string;
  ApproveTime?: number | string;
  BonusCategory?: number | string;
  BonusId?: number | string;
  BonusTitle?: string;
  ChannelId?: number | string;
  CreateTime?: number | string;
  Contact?: string;
  ErrMsg?: string;
  GiftAttribute?: string;
  GiftName?: string | string[];
  GiftType?: number | string;
  HandlerName?: string;
  Id: number | string;
  IsManual?: number | string;
  LoginAccount?: string;
  Mobile?: string;
  OrderId?: string;
  PackageName?: string;
  PageTitle?: string;
  PlayerId?: number | string;
  PlayerStatus?: number;
  Point?: number | string;
  Remark?: string;
  Status?: number;
  VipLevel?: number | string;
}

const { checkPermission } = useCloudPermission();

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
const filterBonusTitle = ref('');
const filterPageTitle = ref('');
const filterOrderId = ref('');
const filterGiftName = ref('');
const filterContact = ref('');
const filterMobile = ref('');
const filterActivityType = ref(-1);
const filterBonusCategory = ref(0);
const filterGiftType = ref('');
const filterAuditStatus = ref('-1');
const filterPlayerStatus = ref(-1);
const filterRiskMessage = ref('');
const filterIsManual = ref('-1');
const filterVipLevel = ref(-1);
const filterApplyDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const filterApproveDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

const selectedRows = ref<LuckyAuditRow[]>([]);
const exportLoading = ref(false);
const submitting = ref(false);

const auditOpen = ref(false);
const remarkOpen = ref(false);

const auditForm = reactive({
  Approve: 1 as 1 | 2,
  ApproveRemark: '',
  Ids: '' as number | string,
  title: '',
});

const remarkForm = reactive({
  Id: '' as number | string,
  Remark: '',
});

const activityTypeOptions = GIFT_LUCKY_ACTIVITY_TYPE_OPTIONS;
const playerStatusOptions = [
  { label: '全部', value: -1 },
  ...PLAYER_STATUS_OPTIONS,
];

function isPending(row: LuckyAuditRow) {
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
    ActivityType: filterActivityType.value,
    ApplyBeginTime: applyBegin ? applyBegin.startOf('day').unix() : '',
    ApplyEndTime: applyEnd ? applyEnd.endOf('day').unix() : '',
    ApplyType: '5,6,7,8',
    ApproveBeginTime: approveBegin ? approveBegin.startOf('day').unix() : '',
    ApproveEndTime: approveEnd ? approveEnd.endOf('day').unix() : '',
    AuditDeliverStatus: filterAuditStatus.value,
    BonusCategory:
      filterActivityType.value === ACTIVITY_TYPE_LUCKY_DRAW
        ? filterBonusCategory.value
        : 0,
    BonusTitle: filterBonusTitle.value.trim(),
    Contact: filterContact.value.trim(),
    GiftName: filterGiftName.value.trim(),
    GiftType: filterGiftType.value,
    IsExp: false,
    IsManual: filterIsManual.value,
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    Mobile: filterMobile.value.trim(),
    OrderId: filterOrderId.value.trim(),
    PackageName: filterPackageName.value.trim(),
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
    PageTitle: filterPageTitle.value.trim(),
    PlayerStatus: filterPlayerStatus.value,
    RiskMessage: filterRiskMessage.value,
    Sort: '',
    VipLevel: filterVipLevel.value,
  };
}

function normalizeRows(items: Record<string, unknown>[]) {
  return items.map((item) => ({
    ...item,
    GiftName: parseGiftNames(item.GiftName),
  })) as LuckyAuditRow[];
}

const gridOptions: VxeTableGridOptions<LuckyAuditRow> = {
  checkboxConfig: {
    checkMethod: ({ row }) => isPending(row as LuckyAuditRow),
  },
  columns: [
    { type: 'checkbox', width: 50 },
    { field: 'OrderId', fixed: 'left', minWidth: 160, title: '订单号' },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) => formatVipLevel(cellValue),
      minWidth: 90,
      title: 'VIP等级',
    },
    { field: 'PackageName', minWidth: 100, title: '产品名称' },
    { field: 'ChannelId', minWidth: 90, title: '渠道号' },
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '审核状态',
    },
    {
      field: 'ActivityType',
      formatter: ({ cellValue }) => formatActivityType(cellValue),
      minWidth: 100,
      title: '活动类型',
    },
    {
      field: 'BonusTitle',
      formatter: ({ row }) =>
        row.BonusTitle
          ? `${row.BonusTitle}${row.BonusId ? `(${row.BonusId})` : ''}`
          : '-',
      minWidth: 150,
      showOverflow: 'tooltip',
      title: '活动标题/ID',
    },
    {
      field: 'BonusCategory',
      formatter: ({ row }) =>
        formatLuckyBonusCategory(row.ActivityType, row.BonusCategory),
      minWidth: 120,
      title: '活动分类',
    },
    {
      field: 'PageTitle',
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '活动分页',
    },
    {
      field: 'Bet',
      formatter: ({ row }) =>
        formatPlayerMetric(row as unknown as Record<string, unknown>),
      minWidth: 130,
      title: '首存/有效投注',
    },
    {
      field: 'GiftType',
      formatter: ({ cellValue }) => formatGiftType(cellValue),
      minWidth: 90,
      title: '奖品类型',
    },
    {
      field: 'GiftName',
      formatter: ({ cellValue }) => giftNameText(cellValue),
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '奖品名称',
    },
    { field: 'Contact', minWidth: 90, title: '收货人' },
    { field: 'Mobile', minWidth: 120, title: '收货电话' },
    {
      field: 'IsManual',
      formatter: ({ cellValue }) => formatIsManual(cellValue),
      minWidth: 90,
      title: '人工录单',
    },
    {
      field: 'ErrMsg',
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '风控信息',
    },
    {
      field: 'ApplyTime',
      formatter: ({ cellValue, row }) =>
        formatGiftDateTime(cellValue || row.CreateTime),
      minWidth: 160,
      title: '申请时间',
    },
    { field: 'HandlerName', minWidth: 100, title: '申请人' },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatGiftDateTime(cellValue),
      minWidth: 160,
      title: '审核时间',
    },
    { field: 'ApproveName', minWidth: 100, title: '审核人' },
    { field: 'Remark', minWidth: 120, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 180,
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
    checkboxAll: ({ records }: { records: LuckyAuditRow[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: LuckyAuditRow[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

function openAudit(approve: 1 | 2, ids: number | string, title: string) {
  auditForm.Approve = approve;
  auditForm.Ids = ids;
  auditForm.ApproveRemark = '';
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
      ApproveRemark: auditForm.ApproveRemark,
      Ids: auditForm.Ids,
      Remark: auditForm.ApproveRemark,
    });
    message.success(auditForm.Approve === 1 ? '审核通过' : '已拒绝');
    auditOpen.value = false;
    selectedRows.value = [];
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openRemark(row: LuckyAuditRow) {
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

function resetFilters() {
  filterLoginAccount.value = '';
  filterPackageName.value = '';
  filterBonusTitle.value = '';
  filterPageTitle.value = '';
  filterOrderId.value = '';
  filterGiftName.value = '';
  filterContact.value = '';
  filterMobile.value = '';
  filterActivityType.value = -1;
  filterBonusCategory.value = 0;
  filterGiftType.value = '';
  filterAuditStatus.value = '-1';
  filterPlayerStatus.value = -1;
  filterRiskMessage.value = '';
  filterIsManual.value = '-1';
  filterVipLevel.value = -1;
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
        { header: '订单号', value: (row) => row.OrderId || '-' },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: 'VIP等级', value: (row) => formatVipLevel(row.VipLevel) },
        { header: '产品名称', value: (row) => row.PackageName || '-' },
        {
          header: '审核状态',
          value: (row) => formatGiftAuditStatus(row.Status),
        },
        {
          header: '活动类型',
          value: (row) => formatActivityType(row.ActivityType),
        },
        { header: '活动标题', value: (row) => row.BonusTitle || '-' },
        { header: '活动分页', value: (row) => row.PageTitle || '-' },
        { header: '奖品类型', value: (row) => formatGiftType(row.GiftType) },
        { header: '奖品名称', value: (row) => giftNameText(row.GiftName) },
        { header: '收货人', value: (row) => row.Contact || '-' },
        { header: '收货电话', value: (row) => row.Mobile || '-' },
        {
          header: '申请时间',
          value: (row) => formatGiftDateTime(row.ApplyTime || row.CreateTime),
        },
        {
          header: '审核时间',
          value: (row) => formatGiftDateTime(row.ApproveTime),
        },
        { header: '审核人', value: (row) => row.ApproveName || '-' },
        { header: '备注', value: (row) => row.Remark || '-' },
      ],
      `主题抽奖审核_${dayjs().format('YYYYMMDDHHmmss')}`,
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
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 240px"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
      <Input
        v-model:value="filterPackageName"
        allow-clear
        placeholder="产品名称"
        style="width: 240px"
      >
        <template #addonBefore>产品名称</template>
      </Input>
      <Select
        v-model:value="filterActivityType"
        :options="activityTypeOptions"
        style="width: 120px"
      />
      <Select
        v-if="filterActivityType === ACTIVITY_TYPE_LUCKY_DRAW"
        v-model:value="filterBonusCategory"
        :options="LUCKY_DRAW_BONUS_CATEGORY_OPTIONS"
        style="width: 130px"
      />
      <Input
        v-model:value="filterBonusTitle"
        allow-clear
        placeholder="活动标题"
        style="width: 220px"
      >
        <template #addonBefore>活动标题</template>
      </Input>
      <Input
        v-model:value="filterPageTitle"
        allow-clear
        placeholder="活动分页"
        style="width: 220px"
      >
        <template #addonBefore>活动分页</template>
      </Input>
      <Input
        v-model:value="filterGiftName"
        allow-clear
        placeholder="奖品名称"
        style="width: 210px"
      >
        <template #addonBefore>奖品名称</template>
      </Input>
      <Select
        v-model:value="filterGiftType"
        :options="GIFT_TYPE_FILTER_OPTIONS"
        style="width: 110px"
      />
      <Select
        v-model:value="filterAuditStatus"
        :options="GIFT_LUCKY_AUDIT_STATUS_OPTIONS"
        style="width: 110px"
      />
      <Select
        v-model:value="filterPlayerStatus"
        :options="playerStatusOptions"
        style="width: 110px"
      />
      <Select
        v-model:value="filterRiskMessage"
        :options="GIFT_RISK_OPTIONS"
        style="width: 110px"
      />
      <Select
        v-model:value="filterIsManual"
        :options="GIFT_IS_MANUAL_OPTIONS"
        style="width: 110px"
      />
      <Select
        v-model:value="filterVipLevel"
        :options="VIP_LEVEL_OPTIONS"
        style="width: 100px"
      />
      <DatePicker.RangePicker
        v-model:value="filterApplyDateRange"
        :placeholder="['申请开始', '申请结束']"
      />
      <DatePicker.RangePicker
        v-model:value="filterApproveDateRange"
        :placeholder="['审核开始', '审核结束']"
      />
      <Input
        v-model:value="filterContact"
        allow-clear
        placeholder="收货人"
        style="width: 200px"
      >
        <template #addonBefore>收货人</template>
      </Input>
      <Input
        v-model:value="filterMobile"
        allow-clear
        placeholder="收货电话"
        style="width: 200px"
      >
        <template #addonBefore>收货电话</template>
      </Input>
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单号"
        style="width: 230px"
      >
        <template #addonBefore>订单号</template>
      </Input>
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button
        v-if="canRecord"
        disabled
        title="主题抽奖人工录单较复杂，暂未迁移"
      >
        人工录单
      </Button>
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
          <Button
            v-if="canRemark && Number(row.Status) !== 1"
            size="small"
            @click="openRemark(row)"
          >
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
          <Input.TextArea v-model:value="auditForm.ApproveRemark" :rows="3" />
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
  </div>
  <Result
    v-else
    status="403"
    sub-title="无审核列表查看权限(10172)"
    title="无权限"
  />
</template>

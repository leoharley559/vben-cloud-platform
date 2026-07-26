<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Radio,
  Result,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  batchDeliverGiftApi,
  batchRejectGiftDeliverApi,
  deliverGiftApi,
  fetchGiftDeliverListApi,
  queryPlayerGiftDeliverInfoApi,
  refuseGiftDeliverApi,
  remarkGiftApi,
} from '#/api/operationManage/gift-manage';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { exportRowsToCsv } from '#/utils/export-csv';
import { PLAYER_STATUS_OPTIONS } from '#/utils/player-status';
import { GIFT_DELIVER_STATUS_MAP } from '#/utils/operation-status';

import {
  ACTIVITY_TYPE_LUCKY_DRAW,
  GIFT_IS_MANUAL_OPTIONS,
  GIFT_LUCKY_ACTIVITY_TYPE_OPTIONS,
  GIFT_LUCKY_DELIVER_STATUS_OPTIONS,
  GIFT_RISK_OPTIONS,
  GIFT_TYPE_FILTER_OPTIONS,
  LUCKY_DRAW_BONUS_CATEGORY_OPTIONS,
  formatActivityType,
  formatGiftDateTime,
  formatGiftDeliverStatus,
  formatGiftType,
  formatLuckyBonusCategory,
  formatPlayerStatus,
  giftListTotal,
  giftNameText,
  parseGiftNames,
} from './gift-shared';

defineOptions({ name: 'GiftDeliverLuckyPanel' });

interface LuckyDeliverRow {
  ActivityType?: number | string;
  Address?: string;
  ApproveTime?: number | string;
  BonusCategory?: number | string;
  BonusTitle?: string;
  Contact?: string;
  CreateTime?: number | string;
  DeliverTime?: number | string;
  ErrMsg?: string;
  Express?: string;
  ExpressOrderId?: string;
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
  Remark?: string;
  Status?: number;
  VipLevel?: number | string;
}

interface UploadPreviewRow {
  Express?: string;
  ExpressOrderId?: string;
  OrderId?: string;
  UploadStatus?: number | string;
  VirtualGiftRemark?: string;
}

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(10188));
const canExport = computed(() => checkPermission(10189));
const canBatchDeliver = computed(() => checkPermission(10190));
const canBatchReject = computed(() => checkPermission(10182));
const canRemark = computed(() => checkPermission(10192));
const canDeliver = computed(() => checkPermission(10195));
const canRefuse = computed(() => checkPermission(10196));

const filterLoginAccount = ref('');
const filterPackageName = ref('');
const filterBonusTitle = ref('');
const filterPageTitle = ref('');
const filterOrderId = ref('');
const filterGiftName = ref('');
const filterContact = ref('');
const filterMobile = ref('');
const filterExpressOrderId = ref('');
const filterActivityType = ref(-1);
const filterBonusCategory = ref(0);
const filterGiftType = ref('');
const filterAuditStatus = ref('1');
const filterPlayerStatus = ref(-1);
const filterRiskMessage = ref('');
const filterIsManual = ref('-1');
const filterVipLevel = ref(-1);
const filterApplyDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const filterApproveDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const filterDeliverDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

const selectedRows = ref<LuckyDeliverRow[]>([]);
const exportLoading = ref(false);
const submitting = ref(false);
const previewLoading = ref(false);

const shipOpen = ref(false);
const batchOpen = ref(false);
const refuseOpen = ref(false);
const remarkOpen = ref(false);
const batchRejectOpen = ref(false);

const shipForm = reactive({
  DeliverRemark: '',
  Express: '',
  ExpressOrderId: '',
  GiftType: '' as number | string,
  Ids: '' as number | string,
  OrderId: '',
  VirtualGiftRemark: '',
});

const batchForm = reactive({
  DeliverRemark: '',
  GiftType: '1',
  OrderIdsText: '',
});

const batchRejectForm = reactive({
  DeliverRemark: '',
});

const refuseForm = reactive({
  Id: '' as number | string,
  Remark: '',
});

const remarkForm = reactive({
  Id: '' as number | string,
  Remark: '',
});

const uploadPreview = ref<UploadPreviewRow[]>([]);
const uploadSummary = reactive({
  Edit: 0,
  NoEdit: 0,
  OrderIdNoMatch: 0,
  total: 0,
});

const activityTypeOptions = GIFT_LUCKY_ACTIVITY_TYPE_OPTIONS;
const playerStatusOptions = [
  { label: '全部', value: -1 },
  ...PLAYER_STATUS_OPTIONS,
];

function statusColor(status?: number) {
  if (Number(status) === 3 || Number(status) === 4) {
    return 'success';
  }
  if (Number(status) === 5) {
    return 'error';
  }
  return 'processing';
}

function getQueryParams(page?: { currentPage: number; pageSize: number }) {
  const [applyBegin, applyEnd] = filterApplyDateRange.value || [];
  const [approveBegin, approveEnd] = filterApproveDateRange.value || [];
  const [deliverBegin, deliverEnd] = filterDeliverDateRange.value || [];
  return {
    ActivityType: filterActivityType.value,
    ApplyBeginTime: applyBegin ? applyBegin.unix() : '',
    ApplyEndTime: applyEnd ? applyEnd.endOf('day').unix() : '',
    ApplyType: '5,6,7',
    ApproveBeginTime: approveBegin ? approveBegin.unix() : '',
    ApproveEndTime: approveEnd ? approveEnd.endOf('day').unix() : '',
    AuditDeliverStatus: filterAuditStatus.value,
    BonusCategory:
      filterActivityType.value === ACTIVITY_TYPE_LUCKY_DRAW
        ? filterBonusCategory.value
        : 0,
    BonusTitle: filterBonusTitle.value.trim(),
    Contact: filterContact.value.trim(),
    DeliverBeginTime: deliverBegin ? deliverBegin.unix() : '',
    DeliverEndTime: deliverEnd ? deliverEnd.endOf('day').unix() : '',
    ExpressOrderId: filterExpressOrderId.value.trim(),
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
  })) as LuckyDeliverRow[];
}

const gridOptions: VxeTableGridOptions<LuckyDeliverRow> = {
  checkboxConfig: {
    checkMethod: ({ row }) => Number((row as LuckyDeliverRow).Status) === 1,
  },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '发货状态',
    },
    {
      field: 'OrderId',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '订单号',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 100, title: '产品名称' },
    {
      field: 'ActivityType',
      formatter: ({ cellValue }) => formatActivityType(cellValue),
      minWidth: 100,
      title: '活动类型',
    },
    {
      field: 'BonusTitle',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '活动标题',
    },
    {
      field: 'BonusCategory',
      formatter: ({ row }) =>
        formatLuckyBonusCategory(row.ActivityType, row.BonusCategory),
      minWidth: 110,
      title: '活动分类',
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
    { field: 'ExpressOrderId', minWidth: 130, title: '快递单号' },
    { field: 'Express', minWidth: 100, title: '快递公司' },
    {
      field: 'DeliverTime',
      formatter: ({ cellValue }) => formatGiftDateTime(cellValue),
      minWidth: 160,
      title: '发货时间',
    },
    { field: 'Remark', minWidth: 120, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'ErrMsg',
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '风控信息',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 260,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchGiftDeliverListApi(getQueryParams(page));
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
    checkboxAll: ({ records }: { records: LuckyDeliverRow[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: LuckyDeliverRow[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

function openShip(row: LuckyDeliverRow) {
  shipForm.Ids = row.Id;
  shipForm.OrderId = String(row.OrderId || '');
  shipForm.GiftType = row.GiftType ?? '';
  shipForm.Express = '';
  shipForm.ExpressOrderId = '';
  shipForm.VirtualGiftRemark = '';
  shipForm.DeliverRemark = '';
  shipOpen.value = true;
}

async function submitShip() {
  submitting.value = true;
  try {
    await deliverGiftApi({
      DeliverRemark: shipForm.DeliverRemark,
      Express: shipForm.Express,
      ExpressOrderId: shipForm.ExpressOrderId,
      GiftType: shipForm.GiftType,
      Ids: shipForm.Ids,
      OrderId: shipForm.OrderId,
      VirtualGiftRemark: shipForm.VirtualGiftRemark,
    });
    message.success('发货成功');
    shipOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openBatchDeliver() {
  batchForm.GiftType = '1';
  batchForm.OrderIdsText = '';
  batchForm.DeliverRemark = '';
  uploadPreview.value = [];
  batchOpen.value = true;
}

function parseBatchLines(text: string) {
  return text
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function previewBatchUpload() {
  const orderIds = parseBatchLines(batchForm.OrderIdsText);
  if (!orderIds.length) {
    message.warning('请输入订单号，每行一个或用逗号分隔');
    return;
  }
  previewLoading.value = true;
  try {
    const result = (await queryPlayerGiftDeliverInfoApi({
      GiftType: batchForm.GiftType,
      OrderIds: orderIds.join(','),
    })) as Record<string, unknown>;
    uploadPreview.value = ((result.Items || []) as UploadPreviewRow[]) ?? [];
    uploadSummary.total = uploadPreview.value.length;
    uploadSummary.Edit = Number(result.Edit || 0);
    uploadSummary.NoEdit = Number(result.NoEdit || 0);
    uploadSummary.OrderIdNoMatch = Number(result.OrderIdNoMatch || 0);
    if (!uploadPreview.value.length) {
      message.warning('未匹配到可发货订单');
    }
  } finally {
    previewLoading.value = false;
  }
}

async function submitBatchDeliver() {
  const orderIds = uploadPreview.value
    .map((row) => row.OrderId)
    .filter(Boolean)
    .join(',');
  if (!orderIds) {
    message.warning('请先校验订单信息');
    return;
  }
  submitting.value = true;
  try {
    const expressOrderIds = uploadPreview.value
      .map((row) => row.ExpressOrderId || '')
      .join(',');
    const expressList = uploadPreview.value
      .map((row) => row.Express || '')
      .join(',');
    const virtualRemarks = uploadPreview.value
      .map((row) => row.VirtualGiftRemark || '')
      .join(',');
    await batchDeliverGiftApi({
      DeliverRemark: batchForm.DeliverRemark,
      Express: expressList,
      ExpressOrderId: expressOrderIds,
      GiftType: batchForm.GiftType,
      OrderIds: orderIds,
      UploadStatus: uploadPreview.value
        .map((row) => row.UploadStatus ?? 1)
        .join(','),
      VirtualGiftRemark: virtualRemarks,
    });
    message.success('批量发货提交成功');
    batchOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openBatchReject() {
  if (!selectedRows.value.length) {
    message.warning('请先勾选待发货记录');
    return;
  }
  batchRejectForm.DeliverRemark = '';
  batchRejectOpen.value = true;
}

async function submitBatchReject() {
  submitting.value = true;
  try {
    await batchRejectGiftDeliverApi({
      Approve: 2,
      DeliverRemark: batchRejectForm.DeliverRemark,
      Ids: selectedRows.value.map((row) => row.Id).join(','),
    });
    message.success('批量拒绝发货成功');
    batchRejectOpen.value = false;
    selectedRows.value = [];
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openRefuse(row: LuckyDeliverRow) {
  refuseForm.Id = row.Id;
  refuseForm.Remark = '';
  refuseOpen.value = true;
}

async function submitRefuse() {
  submitting.value = true;
  try {
    await refuseGiftDeliverApi({
      DeliverRemark: refuseForm.Remark,
      Id: refuseForm.Id,
      Remark: refuseForm.Remark,
    });
    message.success('已拒绝发货');
    refuseOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openRemark(row: LuckyDeliverRow) {
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
  filterExpressOrderId.value = '';
  filterActivityType.value = -1;
  filterBonusCategory.value = 0;
  filterGiftType.value = '';
  filterAuditStatus.value = '1';
  filterPlayerStatus.value = -1;
  filterRiskMessage.value = '';
  filterIsManual.value = '-1';
  filterVipLevel.value = -1;
  filterApplyDateRange.value = undefined;
  filterApproveDateRange.value = undefined;
  filterDeliverDateRange.value = undefined;
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchGiftDeliverListApi({
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
        {
          header: '发货状态',
          value: (row) => formatGiftDeliverStatus(row.Status),
        },
        { header: '订单号', value: (row) => row.OrderId || '-' },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: '产品名称', value: (row) => row.PackageName || '-' },
        {
          header: '活动类型',
          value: (row) => formatActivityType(row.ActivityType),
        },
        { header: '活动标题', value: (row) => row.BonusTitle || '-' },
        { header: '奖品类型', value: (row) => formatGiftType(row.GiftType) },
        { header: '奖品名称', value: (row) => giftNameText(row.GiftName) },
        { header: '快递单号', value: (row) => row.ExpressOrderId || '-' },
        { header: '快递公司', value: (row) => row.Express || '-' },
        {
          header: '发货时间',
          value: (row) => formatGiftDateTime(row.DeliverTime),
        },
        { header: '备注', value: (row) => row.Remark || '-' },
      ],
      `主题抽奖发货_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

const previewColumns = [
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单号' },
  { dataIndex: 'ExpressOrderId', key: 'ExpressOrderId', title: '快递单号' },
  { dataIndex: 'Express', key: 'Express', title: '快递公司' },
  {
    dataIndex: 'VirtualGiftRemark',
    key: 'VirtualGiftRemark',
    title: '虚拟备注',
  },
];

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
        :options="GIFT_LUCKY_DELIVER_STATUS_OPTIONS"
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
        show-time
      />
      <DatePicker.RangePicker
        v-model:value="filterApproveDateRange"
        :placeholder="['审核开始', '审核结束']"
        show-time
      />
      <DatePicker.RangePicker
        v-model:value="filterDeliverDateRange"
        :placeholder="['发货开始', '发货结束']"
        show-time
      />
      <Input
        v-model:value="filterExpressOrderId"
        allow-clear
        placeholder="快递单号"
        style="width: 220px"
      >
        <template #addonBefore>快递单号</template>
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
      <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
        导出
      </Button>
      <Button v-if="canBatchDeliver" type="primary" @click="openBatchDeliver">
        批量发货
      </Button>
      <Button v-if="canBatchReject" danger @click="openBatchReject">
        批量拒绝
      </Button>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <div>
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId"
          />
          <div class="text-xs text-gray-500">
            ({{ formatPlayerStatus(row.PlayerStatus) }})
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <Tag :color="statusColor(row.Status)">
          {{
            GIFT_DELIVER_STATUS_MAP[Number(row.Status)] ||
            String(row.Status ?? '-')
          }}
        </Tag>
      </template>
      <template #action="{ row }">
        <div class="flex flex-wrap gap-1">
          <Button v-if="canRemark" size="small" @click="openRemark(row)">
            改备注
          </Button>
          <Button
            v-if="canDeliver"
            size="small"
            type="primary"
            :disabled="Number(row.Status) === 3 || Number(row.Status) === 4"
            @click="openShip(row)"
          >
            发货
          </Button>
          <Button
            v-if="canRefuse"
            danger
            size="small"
            :disabled="
              Number(row.Status) === 3 ||
              Number(row.Status) === 4 ||
              Number(row.Status) === 5
            "
            @click="openRefuse(row)"
          >
            拒绝
          </Button>
        </div>
      </template>
    </Grid>

    <Modal
      v-model:open="shipOpen"
      :confirm-loading="submitting"
      destroy-on-close
      :title="Number(shipForm.GiftType) === 2 ? '虚拟奖品发货' : '实物奖品发货'"
      @ok="submitShip"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="订单号">
          <Input v-model:value="shipForm.OrderId" disabled />
        </Form.Item>
        <Form.Item v-if="Number(shipForm.GiftType) === 2" label="虚拟奖品备注">
          <Input.TextArea
            v-model:value="shipForm.VirtualGiftRemark"
            :rows="3"
          />
        </Form.Item>
        <template v-else>
          <Form.Item label="快递公司">
            <Input v-model:value="shipForm.Express" />
          </Form.Item>
          <Form.Item label="快递单号">
            <Input v-model:value="shipForm.ExpressOrderId" />
          </Form.Item>
        </template>
        <Form.Item label="发货备注">
          <Input.TextArea v-model:value="shipForm.DeliverRemark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="batchOpen"
      :confirm-loading="submitting"
      destroy-on-close
      title="主题抽奖批量发货"
      width="760px"
      @ok="submitBatchDeliver"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="奖品类型">
          <Radio.Group v-model:value="batchForm.GiftType">
            <Radio value="1">实物奖品</Radio>
            <Radio value="2">虚拟奖品</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="订单号（每行一个或逗号分隔）">
          <Input.TextArea
            v-model:value="batchForm.OrderIdsText"
            :rows="4"
            placeholder="输入订单号后点击校验"
          />
        </Form.Item>
        <Space class="mb-3">
          <Button :loading="previewLoading" @click="previewBatchUpload">
            校验订单
          </Button>
        </Space>
        <div v-if="uploadPreview.length" class="mb-3 text-sm text-gray-600">
          共 {{ uploadSummary.total }} 条，可修改 {{ uploadSummary.Edit }} 条，
          未变动 {{ uploadSummary.NoEdit }} 条，未识别
          {{ uploadSummary.OrderIdNoMatch }} 条
        </div>
        <Table
          v-if="uploadPreview.length"
          :columns="previewColumns"
          :data-source="uploadPreview"
          :pagination="false"
          row-key="OrderId"
          size="small"
        />
        <Form.Item label="发货备注">
          <Input.TextArea v-model:value="batchForm.DeliverRemark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="batchRejectOpen"
      :confirm-loading="submitting"
      destroy-on-close
      title="批量拒绝发货"
      @ok="submitBatchReject"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="已选订单">
          <Input :value="`${selectedRows.length} 条`" disabled />
        </Form.Item>
        <Form.Item label="拒绝备注">
          <Input.TextArea
            v-model:value="batchRejectForm.DeliverRemark"
            :rows="3"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="refuseOpen"
      :confirm-loading="submitting"
      destroy-on-close
      title="拒绝发货"
      @ok="submitRefuse"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="拒绝备注">
          <Input.TextArea v-model:value="refuseForm.Remark" :rows="3" />
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
    sub-title="无发货列表查看权限(10188)"
    title="无权限"
  />
</template>

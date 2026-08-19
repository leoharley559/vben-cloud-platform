<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deliverGiftApi,
  fetchGiftDeliverListApi,
  receiveGiftApi,
  refuseGiftDeliverApi,
  remarkGiftApi,
} from '#/api/operationManage/gift-manage';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';
import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { PLAYER_STATUS_OPTIONS } from '#/utils/player-status';
import { GIFT_DELIVER_STATUS_MAP } from '#/utils/operation-status';

import {
  formatGiftDateTime,
  formatGiftDeliverStatus,
  formatVipLevel,
  giftListTotal,
  giftNameText,
  parseGiftNames,
} from './gift-shared';

defineOptions({ name: 'GiftDeliverLevelPanel' });

interface DeliverRow {
  Address?: string;
  ApproveTime?: number | string;
  Contact?: string;
  CreateTime?: number | string;
  DeliverTime?: number | string;
  ErrMsg?: string;
  Express?: string;
  ExpressOrderId?: string;
  GiftName?: string | string[];
  HandlerName?: string;
  Id: number | string;
  LoginAccount?: string;
  Mobile?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  PlayerStatus?: number;
  Remark?: string;
  Status?: number;
  VipLevel?: number | string;
}

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(10188));
const canExport = computed(() => checkPermission(10189));
const canBatchDeliver = computed(() => checkPermission(10190));
const canRemark = computed(() => checkPermission(10192));
const canReceive = computed(() => checkPermission(10194));
const canDeliver = computed(() => checkPermission(10195));
const canRefuse = computed(() => checkPermission(10196));

const filterLoginAccount = ref('');
const filterPackageName = ref('');
const filterOrderId = ref('');
const filterGiftName = ref('');
const filterContact = ref('');
const filterMobile = ref('');
const filterExpressOrderId = ref('');
const filterStatus = ref<number | string>('');
const filterVipLevel = ref(-1);
const filterPlayerStatus = ref(-1);
const filterApplyDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const filterApproveDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const filterDeliverDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

const selectedRows = ref<DeliverRow[]>([]);
const exportLoading = ref(false);
const submitting = ref(false);

const shipOpen = ref(false);
const batchOpen = ref(false);
const refuseOpen = ref(false);
const remarkOpen = ref(false);

const shipForm = reactive({
  Express: '',
  ExpressOrderId: '',
  Ids: '' as number | string,
  OrderId: '',
  Remark: '',
});

const batchForm = reactive({
  Remark: '',
});

const refuseForm = reactive({
  Id: '' as number | string,
  Remark: '',
});

const remarkForm = reactive({
  Id: '' as number | string,
  Remark: '',
});

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待发货', value: 1 },
  { label: '已发货', value: 3 },
  { label: '已收货', value: 4 },
  { label: '拒绝发货', value: 5 },
];

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
    ApplyBeginTime: applyBegin ? applyBegin.unix() : '',
    ApplyEndTime: applyEnd ? applyEnd.unix() : '',
    ApplyType: '4',
    ApproveBeginTime: approveBegin ? approveBegin.unix() : '',
    ApproveEndTime: approveEnd ? approveEnd.unix() : '',
    Contact: filterContact.value.trim(),
    DeliverBeginTime: deliverBegin ? deliverBegin.unix() : '',
    DeliverEndTime: deliverEnd ? deliverEnd.unix() : '',
    ExpressOrderId: filterExpressOrderId.value.trim(),
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
  })) as DeliverRow[];
}

const gridOptions: VxeTableGridOptions<DeliverRow> = {
  checkboxConfig: {
    checkMethod: ({ row }) => Number((row as DeliverRow).Status) === 1,
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
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatGiftDateTime(cellValue),
      minWidth: 160,
      title: '审核时间',
    },
    {
      field: 'GiftName',
      formatter: ({ cellValue }) => giftNameText(cellValue),
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '奖品名称',
    },
    { field: 'Contact', minWidth: 90, title: '收货人' },
    { field: 'Mobile', minWidth: 120, title: '收货电话' },
    {
      field: 'Address',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '收货地址',
    },
    { field: 'ExpressOrderId', minWidth: 130, title: '快递单号' },
    { field: 'Express', minWidth: 100, title: '快递公司' },
    { field: 'Remark', minWidth: 120, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'DeliverTime',
      formatter: ({ cellValue }) => formatGiftDateTime(cellValue),
      minWidth: 160,
      title: '发货时间',
    },
    { field: 'HandlerName', minWidth: 100, title: '操作人' },
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
    checkboxAll: ({ records }: { records: DeliverRow[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: DeliverRow[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

function openShip(row: DeliverRow) {
  shipForm.Ids = row.Id;
  shipForm.OrderId = String(row.OrderId || '');
  shipForm.Express = '';
  shipForm.ExpressOrderId = '';
  shipForm.Remark = '';
  shipOpen.value = true;
}

async function submitShip() {
  submitting.value = true;
  try {
    await deliverGiftApi({ ...shipForm });
    message.success('发货成功');
    shipOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openBatchDeliver() {
  if (!selectedRows.value.length) {
    message.warning('请先勾选待发货记录');
    return;
  }
  batchForm.Remark = '';
  batchOpen.value = true;
}

async function submitBatchDeliver() {
  submitting.value = true;
  try {
    await deliverGiftApi({
      Ids: selectedRows.value.map((row) => row.Id).join(','),
      Remark: batchForm.Remark,
    });
    message.success('批量发货成功');
    batchOpen.value = false;
    selectedRows.value = [];
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function handleReceive(row: DeliverRow) {
  Modal.confirm({
    content: `确认订单 ${row.OrderId || row.Id} 已收货？`,
    onOk: async () => {
      await receiveGiftApi({ Id: row.Id, Remark: '' });
      message.success('已确认收货');
      await gridApi.reload();
    },
    title: '确认收货',
  });
}

function openRefuse(row: DeliverRow) {
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

function openRemark(row: DeliverRow) {
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
  filterOrderId.value = '';
  filterGiftName.value = '';
  filterContact.value = '';
  filterMobile.value = '';
  filterExpressOrderId.value = '';
  filterStatus.value = '';
  filterVipLevel.value = -1;
  filterPlayerStatus.value = -1;
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
        { header: 'VIP等级', value: (row) => formatVipLevel(row.VipLevel) },
        {
          header: '申请时间',
          value: (row) => formatGiftDateTime(row.CreateTime),
        },
        {
          header: '审核时间',
          value: (row) => formatGiftDateTime(row.ApproveTime),
        },
        { header: '奖品名称', value: (row) => giftNameText(row.GiftName) },
        { header: '收货人', value: (row) => row.Contact || '-' },
        { header: '收货电话', value: (row) => row.Mobile || '-' },
        { header: '收货地址', value: (row) => row.Address || '-' },
        { header: '快递单号', value: (row) => row.ExpressOrderId || '-' },
        { header: '快递公司', value: (row) => row.Express || '-' },
        { header: '备注', value: (row) => row.Remark || '-' },
        {
          header: '发货时间',
          value: (row) => formatGiftDateTime(row.DeliverTime),
        },
        { header: '操作人', value: (row) => row.HandlerName || '-' },
        { header: '异常信息', value: (row) => row.ErrMsg || '-' },
      ],
      `晋级豪礼发货_${dayjs().format('YYYYMMDDHHmmss')}`,
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
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPackageName"
          allow-clear
          placeholder="请输入产品名称"
        >
          <template #addonBefore>产品名称</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          placeholder="请输入订单号"
        >
          <template #addonBefore>订单号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterGiftName"
          allow-clear
          placeholder="请输入奖品名称"
        >
          <template #addonBefore>奖品名称</template>
        </Input>
      </div>
      <Select
        v-model:value="filterVipLevel"
        :options="VIP_LEVEL_OPTIONS"
      />
      <Select
        v-model:value="filterPlayerStatus"
        :options="playerStatusOptions"
      />
      <Space.Compact>
        <span class="query-field-addon">发货状态</span>
        <Select
          v-model:value="filterStatus"
          :options="statusOptions"
          allow-clear
          placeholder="请选择发货状态"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterApplyDateRange" label="申请时间" />
        </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterApproveDateRange" label="审核时间" />
        </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDeliverDateRange" label="发货时间" />
        </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterContact"
          allow-clear
          placeholder="请输入收货人"
        >
          <template #addonBefore>收货人</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterMobile"
          allow-clear
          placeholder="请输入收货电话"
        >
          <template #addonBefore>收货电话</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterExpressOrderId"
          allow-clear
          placeholder="请输入快递单号"
        >
          <template #addonBefore>快递单号</template>
        </Input>
      </div>
        <div class="query-filter-actions">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
        导出 Excel
      </Button>
      <Button v-if="canBatchDeliver" type="primary" @click="openBatchDeliver">
        批量发货
      </Button>
        </div>
    </div>
  </div>

    <Grid>
      <template #loginAccount="{ row }">
        <div>
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId"
          />
          <div class="mt-1">
            <PlayerStatusTag :status="row.PlayerStatus" hide-normal />
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
            :disabled="Number(row.Status) !== 1"
            @click="openShip(row)"
          >
            发货
          </Button>
          <Button
            v-if="canReceive"
            size="small"
            :disabled="Number(row.Status) === 4 || Number(row.Status) === 5"
            @click="handleReceive(row)"
          >
            收货
          </Button>
          <Button
            v-if="canRefuse"
            danger
            size="small"
            :disabled="Number(row.Status) === 4 || Number(row.Status) === 5"
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
      title="订单发货"
      @ok="submitShip"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="订单号">
          <Input v-model:value="shipForm.OrderId" disabled />
        </Form.Item>
        <Form.Item label="快递公司">
          <Input v-model:value="shipForm.Express" />
        </Form.Item>
        <Form.Item label="快递单号">
          <Input v-model:value="shipForm.ExpressOrderId" />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="shipForm.Remark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="batchOpen"
      :confirm-loading="submitting"
      destroy-on-close
      title="批量发货"
      @ok="submitBatchDeliver"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="已选订单">
          <Input :value="`${selectedRows.length} 条`" disabled />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="batchForm.Remark" :rows="3" />
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

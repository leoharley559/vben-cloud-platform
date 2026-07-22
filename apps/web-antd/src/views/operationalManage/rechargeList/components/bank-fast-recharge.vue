<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerEasyRechargeItem } from '#/types/player-detail';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
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
  fetchEasyRechargeListApi,
  rejectEasyRechargeApi,
} from '#/api/operationManage/easy-recharge';
import EasyRechargeActionModal from '#/components/easy-recharge/easy-recharge-action-modal.vue';
import EasyRechargeVoucherCell from '#/components/easy-recharge/easy-recharge-voucher-cell.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  EASY_RECHARGE_STATUS_OPTIONS,
  formatEasyRechargeStatus,
  getEasyRechargeStatusColor,
} from '#/utils/player-detail-maps';

defineOptions({ name: 'BankFastRechargeList' });

const { checkPermission } = useCloudPermission();
const { memberTypeOptions, packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10269));
const canConfirm = computed(() => checkPermission(10270));
/** 对齐旧站 bankCardRecharge：复议 10271 + Status===3；拒绝 10272 + Status===1 */
const canReview = computed(() => checkPermission(10271));
const canReject = computed(() => checkPermission(10272));
const canExport = computed(() => checkPermission(12159));

const defaultRange = getYesterdayRangeSeconds();
const totalStats = ref({
  failAmount: 0,
  payNum: 0,
  sumAmount: 0,
  sumSendAmount: 0,
});
const exportLoading = ref(false);
const actionOpen = ref(false);
const actionMode = ref<'confirm' | 'review'>('confirm');
const actionRow = ref<PlayerEasyRechargeItem | null>(null);

const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterStatus = ref<number | string>('');
const filterDataSearchType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
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
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    DataSearchType: filterDataSearchType.value,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    GameOrderId: filterOrderId.value,
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value,
    PayType: 10,
    Status: filterStatus.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerEasyRechargeItem> = {
  columns: [
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
      title: '创建时间',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'GameOrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'PackageName',
      minWidth: 120,
      title: '所属产品',
    },
    {
      field: 'RealName',
      minWidth: 100,
      title: '真实姓名',
    },
    {
      field: 'CardNo',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '银行卡号',
    },
    {
      field: 'Name',
      minWidth: 120,
      title: '快捷支付卡名',
    },
    {
      field: 'Bank',
      minWidth: 120,
      title: '开户行',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '银行金额',
    },
    {
      field: 'SendAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '发送金额',
    },
    {
      field: 'ImageUrl',
      minWidth: 130,
      slots: { default: 'voucher' },
      title: '充值凭证',
    },
    {
      field: 'CheckerName',
      minWidth: 120,
      title: '审核人',
    },
    {
      field: 'FinTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
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
      query: async ({ page, sort }) => {
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam =
            sortOrder === 'asc' ? String(sortField) : `-${sortField}`;
        }

        const result = await fetchEasyRechargeListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        totalStats.value = {
          failAmount: Number(result?.Total?.FailAmount || 0),
          payNum: Number(result?.Total?.PayNum || 0),
          sumAmount: Number(result?.Total?.SumAmount || 0),
          sumSendAmount: Number(result?.Total?.SumSendAmount || 0),
        };

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

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterOrderId.value = '';
  filterLoginAccount.value = '';
  filterPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
  filterStatus.value = '';
  filterDataSearchType.value = 0;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

function openAction(row: PlayerEasyRechargeItem, mode: 'confirm' | 'review') {
  actionRow.value = row;
  actionMode.value = mode;
  actionOpen.value = true;
}

function handleReject(row: PlayerEasyRechargeItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '确认拒绝该快捷充值订单？',
    onOk: async () => {
      await rejectEasyRechargeApi(row.Id!);
      message.success('操作成功');
      gridApi.reload();
    },
    title: '拒绝充值',
  });
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchEasyRechargeListApi({
      ...getQueryParams(),
      IsExp: true,
      Page: 1,
      PageSize: 10000,
    });
    const items = result?.Items || [];
    if (!items.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      items,
      [
        {
          header: '状态',
          value: (row) => formatEasyRechargeStatus(row.Status),
        },
        {
          header: '创建时间',
          value: (row) => formatDateTime(row.CreateTime),
        },
        { header: '游戏账号', value: (row) => String(row.LoginAccount || '-') },
        { header: '订单编号', value: (row) => String(row.GameOrderId || '-') },
        { header: '所属产品', value: (row) => String(row.PackageName || '-') },
        {
          header: '银行金额',
          value: (row) => formatAmountFromCent(row.Amount),
        },
        {
          header: '发送金额',
          value: (row) => formatAmountFromCent(row.SendAmount),
        },
      ],
      '快捷充值列表',
    );
  } finally {
    exportLoading.value = false;
  }
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单编号"
        style="width: 220px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>订单编号</template>
      </Input>

      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 200px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>游戏账号</template>
      </Input>

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
        placeholder="产品"
        style="width: 160px"
      />

      <Select
        v-model:value="filterStatus"
        allow-clear
        :options="EASY_RECHARGE_STATUS_OPTIONS"
        placeholder="状态"
        style="width: 140px"
      />

      <Select
        v-model:value="filterDataSearchType"
        :options="memberTypeOptions"
        style="width: 120px"
      />

      <DatePicker.RangePicker v-model:value="filterDateRange" />

      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
          导出
        </Button>
      </Space>
    </div>

    <div class="mb-4 grid gap-3 md:grid-cols-4">
      <div class="rounded border p-3 text-sm">
        <div class="text-gray-500">充值总额</div>
        <div class="font-medium text-green-600">
          {{ formatAmountFromCent(totalStats.sumAmount) }}
        </div>
      </div>
      <div class="rounded border p-3 text-sm">
        <div class="text-gray-500">发送金额</div>
        <div class="font-medium">
          {{ formatAmountFromCent(totalStats.sumSendAmount) }}
        </div>
      </div>
      <div class="rounded border p-3 text-sm">
        <div class="text-gray-500">成功笔数</div>
        <div class="font-medium">{{ totalStats.payNum }}</div>
      </div>
      <div class="rounded border p-3 text-sm">
        <div class="text-gray-500">未成功金额</div>
        <div class="font-medium text-red-500">
          {{ formatAmountFromCent(totalStats.failAmount) }}
        </div>
      </div>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="getEasyRechargeStatusColor(row.Status)">
          {{ formatEasyRechargeStatus(row.Status) }}
        </Tag>
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="row.LoginAccount"
          :permission-id="10273"
          :player-id="row.PlayerId"
        />
      </template>
      <template #voucher="{ row }">
        <EasyRechargeVoucherCell
          :game-order-id="row.GameOrderId"
          :id="row.Id"
          :image-url="row.ImageUrl"
          @success="gridApi.reload()"
        />
      </template>
      <template #actions="{ row }">
        <Space :size="4">
          <Button
            v-if="canConfirm && Number(row.Status) === 1"
            size="small"
            type="link"
            @click="openAction(row, 'confirm')"
          >
            游戏充值
          </Button>
          <Button
            v-if="canReview && Number(row.Status) === 3"
            size="small"
            type="link"
            @click="openAction(row, 'review')"
          >
            复议充值
          </Button>
          <Button
            v-if="canReject && Number(row.Status) === 1"
            danger
            size="small"
            type="link"
            @click="handleReject(row)"
          >
            拒绝
          </Button>
        </Space>
      </template>
    </Grid>

    <EasyRechargeActionModal
      v-model:open="actionOpen"
      :mode="actionMode"
      :row="actionRow"
      @success="gridApi.reload()"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10269 才能查看快捷充值"
    title="无权限"
  />
</template>

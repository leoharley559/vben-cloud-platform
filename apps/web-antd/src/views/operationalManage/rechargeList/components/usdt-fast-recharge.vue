<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerEasyRechargeItem } from '#/types/player-detail';

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
  fetchUsdtRechargeListApi,
  rejectUsdtRechargeApi,
} from '#/api/operationManage/easy-recharge';
import EasyRechargeVoucherCell from '#/components/easy-recharge/easy-recharge-voucher-cell.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  EASY_RECHARGE_STATUS_OPTIONS,
  formatEasyRechargeStatus,
  getEasyRechargeStatusColor,
} from '#/utils/player-detail-maps';

import UsdtRechargeActionModal from './usdt-recharge-action-modal.vue';

defineOptions({ name: 'UsdtFastRechargeList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(12337));
const canConfirm = computed(() => checkPermission(12381));
const canReject = computed(() => checkPermission(12382));
const canReview = computed(() => checkPermission(12380));

const defaultRange = getYesterdayRangeSeconds();
const actionOpen = ref(false);
const actionMode = ref<'confirm' | 'review'>('confirm');
const actionRow = ref<PlayerEasyRechargeItem | null>(null);

const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterStatus = ref<number | string>('');
const filterRequestAddress = ref('');
const filterChannelAddress = ref('');
const filterCheckerName = ref('');
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
    BeginTime: begin ? begin.unix() : '',
    ChannelAddress: filterChannelAddress.value,
    CheckerName: filterCheckerName.value,
    EndTime: end ? end.unix() : '',
    GameOrderId: filterOrderId.value,
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value,
    RequestAddress: filterRequestAddress.value,
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
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '充值金额',
    },
    {
      field: 'RequestAddress',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '申请地址',
    },
    {
      field: 'ChannelAddress',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '收款地址',
    },
    {
      field: 'ImageUrl',
      minWidth: 130,
      slots: { default: 'voucher' },
      title: '充值凭证',
    },
    { field: 'CheckerName', minWidth: 120, title: '审核人' },
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
      query: async ({ page }) => {
        const result = await fetchUsdtRechargeListApi({
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
    content: '确认拒绝该 USDT 快捷充值订单？',
    onOk: async () => {
      await rejectUsdtRechargeApi(row.Id!);
      message.success('操作成功');
      gridApi.reload();
    },
    title: '拒绝充值',
  });
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
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          style="width: 200px"
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          style="width: 200px"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">产品</span>
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
          style="width: 160px"
          placeholder="请选择产品"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
          :options="EASY_RECHARGE_STATUS_OPTIONS"
          style="width: 140px"
          placeholder="请选择状态"
        />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterRequestAddress"
          allow-clear
          style="width: 260px"
          placeholder="请输入申请地址"
        >
          <template #addonBefore>申请地址</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterChannelAddress"
          allow-clear
          style="width: 260px"
          placeholder="请输入收款地址"
        >
          <template #addonBefore>收款地址</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterCheckerName"
          allow-clear
          style="width: 240px"
          placeholder="请输入审核人员"
        >
          <template #addonBefore>审核人员</template>
        </Input>
      </div>
      <QueryDatetimeRangePicker v-model="filterDateRange" />
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
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
        <Space :size="0" wrap>
          <Button
            v-if="canConfirm && Number(row.Status) === 1"
            size="small"
            type="link"
            @click="openAction(row, 'confirm')"
          >
            审核
          </Button>
          <Button
            v-if="canReview && Number(row.Status) === 3"
            size="small"
            type="link"
            @click="openAction(row, 'review')"
          >
            复议
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

    <UsdtRechargeActionModal
      v-model:open="actionOpen"
      :mode="actionMode"
      :row="actionRow"
      @success="gridApi.reload()"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12337 才能查看 USDT 快捷充值"
    title="无权限"
  />
</template>

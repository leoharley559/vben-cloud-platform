<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RechargeListItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  confirmRechargeEmptyOrderApi,
  deleteRechargeBlankOrderApi,
  fetchRechargeListApi,
} from '#/api/operationManage/recharge';
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
  canShowRechargeConfirmEmptyOrder,
  canShowRechargeDeleteEmptyOrder,
  canShowRechargeManualReview,
  canShowRechargeReplaceOrder,
  canShowRechargeSecondReview,
  RECHARGE_SECOND_REVIEW_SECURITY_PAGE_ID,
} from '#/utils/recharge-actions';
import {
  formatRechargeHandleType,
  formatRechargeStatus,
  getRechargeStatusColor,
  RECHARGE_STATUS_OPTIONS,
} from '#/utils/recharge-status';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

import RechargeBlankOrderModal from './recharge-blank-order-modal.vue';
import RechargeReplaceOrderModal from './recharge-replace-order-modal.vue';
import RechargeReviewModal from './recharge-review-modal.vue';

defineOptions({ name: 'AisleRechargeList' });

const { adminInfo, checkPermission } = useCloudPermission();
const { memberTypeOptions, packageOptions } = useOperationOptions();

const operatorName = computed(() =>
  String(adminInfo.value?.Account || adminInfo.value?.AdminName || ''),
);
const serviceAccount = computed(() => {
  const admin = adminInfo.value?.Admin as Record<string, unknown> | undefined;
  return String(admin?.Username || operatorName.value || '');
});

const canManualReview = computed(() => checkPermission(11643));
const canSecondReview = computed(() => checkPermission(11644));
const canConfirmEmpty = computed(() => checkPermission(10276));
const canDeleteEmpty = computed(() => checkPermission(10277));
const canReplaceOrder = computed(() => checkPermission(10275));
const canBlankOrder = computed(() => checkPermission(10278));

const reviewOpen = ref(false);
const reviewMode = ref<'manual' | 'second'>('manual');
const reviewRow = ref<RechargeListItem | null>(null);
const replaceOpen = ref(false);
const replaceRow = ref<RechargeListItem | null>(null);
const blankOpen = ref(false);

/** 列表上方统计，对齐旧站 aisleRecharge Total */
const totalData = ref({
  AdminAmount: 0,
  Amount: 0,
  FailAmount: 0,
  PayNum: 0,
  PlatformAmount: 0,
  SumAmount: 0,
});

const summaryItems = computed(() => [
  {
    label: '总充值金额',
    value: formatAmountFromCent(totalData.value.SumAmount),
  },
  {
    label: '实际到账金额',
    value: formatAmountFromCent(totalData.value.Amount),
  },
  {
    label: '第三方充值金额',
    value: formatAmountFromCent(totalData.value.PlatformAmount),
  },
  {
    label: '币商充值金额',
    value: formatAmountFromCent(totalData.value.AdminAmount),
  },
  {
    label: '成功充值人数',
    value: totalData.value.PayNum,
  },
  {
    label: '未成功充值金额',
    value: formatAmountFromCent(totalData.value.FailAmount),
  },
]);

const defaultRange = getLast3CalendarDaysRangeSeconds();
const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterNickName = ref('');
const filterStatus = ref<number | string>();
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
    AmountType: 1,
    BeginTime: begin ? begin.unix() : '',
    ChannelIds: filterChannelIds.value,
    DataSearchType: filterDataSearchType.value,
    EndTime: end ? end.unix() : '',
    LoginAccount: filterLoginAccount.value,
    NickName: filterNickName.value,
    OrderId: filterOrderId.value,
    PackageId: filterPackageId.value,
    PlayerId: filterPlayerId.value,
    Status: filterStatus.value ?? '',
    TimeType: 1,
  };
}

const gridOptions: VxeTableGridOptions<RechargeListItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 110,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      sortable: true,
      title: '创建时间',
    },
    {
      field: 'HandleType',
      formatter: ({ cellValue }) => formatRechargeHandleType(cellValue),
      minWidth: 100,
      title: '操作类型',
    },
    {
      field: 'FinishTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '支付时间',
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
    {
      field: 'PlayerId',
      minWidth: 100,
      title: '玩家ID',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '申请金额',
    },
    {
      field: 'NickName',
      minWidth: 140,
      title: '通道名称',
    },
    {
      field: 'ChannelName',
      minWidth: 120,
      title: '渠道名称',
    },
    {
      field: 'PackageName',
      minWidth: 120,
      title: '产品',
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
          // 对齐旧站 aisleRecharge：升序 field，降序 -field（`field desc` 会导致 Items=null）
          sortParam =
            sortOrder === 'asc' ? String(sortField) : `-${sortField}`;
        }

        const result = await fetchRechargeListApi({
          ...query,
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        const total = (result?.Total || {}) as Record<string, unknown>;
        totalData.value = {
          AdminAmount: Number(total.AdminAmount || 0),
          Amount: Number(total.Amount || 0),
          FailAmount: Number(total.FailAmount || 0),
          PayNum: Number(total.PayNum || 0),
          PlatformAmount: Number(total.PlatformAmount || 0),
          SumAmount: Number(total.SumAmount || 0),
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

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function openReview(row: RechargeListItem, mode: 'manual' | 'second') {
  reviewRow.value = row;
  reviewMode.value = mode;
  reviewOpen.value = true;
}

function handleConfirmEmptyOrder(row: RechargeListItem) {
  Modal.confirm({
    title: '确认空单',
    content: '确定要确认该空单吗？',
    onOk: async () => {
      await confirmRechargeEmptyOrderApi({ OrderId: row.OrderId });
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

function handleDeleteEmptyOrder(id?: number | string) {
  if (!id) {
    return;
  }
  Modal.confirm({
    title: '删除空单',
    content: '确定要删除该空单吗？',
    onOk: async () => {
      await deleteRechargeBlankOrderApi(id);
      message.success('删除成功');
      gridApi.reload();
    },
  });
}

function openReplace(row: RechargeListItem) {
  replaceRow.value = row;
  replaceOpen.value = true;
}

function handleReset() {
  filterOrderId.value = '';
  filterLoginAccount.value = '';
  filterPlayerId.value = '';
  filterPackageId.value = '';
  filterChannelIds.value = [];
  filterNickName.value = '';
  filterStatus.value = undefined;
  filterDataSearchType.value = 0;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

onMounted(() => {
  gridApi.reload();
});

defineExpose({
  reload: () => gridApi.reload(),
});
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
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
          <span class="query-field-addon">渠道</span>
          <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
        </Space.Compact>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterNickName"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入通道名称"
        >
          <template #addonBefore>通道名称</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">状态</span>
          <Select
            v-model:value="filterStatus"
            allow-clear
            :options="RECHARGE_STATUS_OPTIONS"
            placeholder="请选择状态"
          />
        </Space.Compact>
      </div>

      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">数据类型</span>
          <Select
            v-model:value="filterDataSearchType"
            :options="memberTypeOptions"
            placeholder="请选择数据类型"
          />
        </Space.Compact>
      </div>

      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" label="创建时间" />
        </div>
        <div class="query-filter-actions">
          <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button v-if="canBlankOrder" @click="blankOpen = true">补空单</Button>
      </Space>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="row.LoginAccount"
          :permission-id="10282"
          :player-id="row.PlayerId"
        />
      </template>
      <template #status="{ row }">
        <Tag :color="getRechargeStatusColor(row.Status)">
          {{ formatRechargeStatus(row.Status) }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <Space wrap size="small">
          <Button
            v-if="canManualReview && canShowRechargeManualReview(row)"
            size="small"
            type="primary"
            @click="openReview(row, 'manual')"
          >
            人工审核
          </Button>
          <Button
            v-if="
              canSecondReview &&
              canShowRechargeSecondReview(row) &&
              !isSameAcctActionRestricted(
                RECHARGE_SECOND_REVIEW_SECURITY_PAGE_ID,
                row.FirstTrialName,
                'Username',
              )
            "
            size="small"
            type="primary"
            @click="openReview(row, 'second')"
          >
            二审
          </Button>
          <Button
            v-if="canReplaceOrder && canShowRechargeReplaceOrder(row)"
            size="small"
            @click="openReplace(row)"
          >
            游戏补单
          </Button>
          <Button
            v-if="canConfirmEmpty && canShowRechargeConfirmEmptyOrder(row)"
            :disabled="row.CreateAdminName === serviceAccount"
            size="small"
            @click="handleConfirmEmptyOrder(row)"
          >
            确认空单
          </Button>
          <Button
            v-if="canDeleteEmpty && canShowRechargeDeleteEmptyOrder(row)"
            :disabled="row.CreateAdminName === serviceAccount"
            danger
            size="small"
            @click="handleDeleteEmptyOrder(row.Id)"
          >
            删除空单
          </Button>
        </Space>
      </template>
    </Grid>

    <RechargeReviewModal
      v-model:open="reviewOpen"
      :mode="reviewMode"
      :operator-name="operatorName"
      :row="reviewRow"
      @success="gridApi.reload()"
    />
    <RechargeReplaceOrderModal
      v-model:open="replaceOpen"
      :row="replaceRow"
      @success="gridApi.reload()"
    />
    <RechargeBlankOrderModal
      v-model:open="blankOpen"
      @success="gridApi.reload()"
    />
  </div>
</template>

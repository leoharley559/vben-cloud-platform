<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloseOrderItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Result,
  Select,
  Space,
  Statistic,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchCloseOrderListApi,
  startCloseOrderApi,
} from '#/api/promotion/close-order';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  CLOSE_ORDER_STATUS_COLOR,
  CLOSE_ORDER_STATUS_MAP,
  formatDateTime,
  formatTeamQueryMoney,
} from '#/utils/promotion';

import FinishOrderModal from './components/finish-order-modal.vue';

defineOptions({ name: 'CloseOrder' });

const { adminInfo, checkPermission } = useCloudPermission();

const canViewPage = computed(() => checkPermission(10863));
const canStart = computed(() => checkPermission(10865));
const canFinish = computed(() => checkPermission(10866));

const defaultBegin = dayjs().subtract(31, 'day').startOf('day');
const defaultEnd = dayjs().endOf('day');

const filterAdminUserName = ref('');
const filterOrderId = ref('');
const filterStatus = ref<number | string>();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const showTakeApplyTime = ref(false);
const showTakeApplyAccount = ref(false);
const showFinishTime = ref(false);
const headerData = ref({
  applyMoney: 0,
  goingMoney: 0,
  rejectMoney: 0,
  remitMoney: 0,
  remitRateMoney: 0,
});
const finishOpen = ref(false);
const currentRow = ref<CloseOrderItem>();

const currentAdminId = computed(() => {
  const admin = adminInfo.value?.Admin as { Id?: number | string } | undefined;
  return admin?.Id;
});

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminUserName: filterAdminUserName.value,
    BeginTime: begin ? begin.startOf('day').unix() : defaultBegin.unix(),
    EndTime: end ? end.endOf('day').unix() : defaultEnd.unix(),
    OrderId: filterOrderId.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    Status: filterStatus.value || '',
  };
}

function buildColumns() {
  const columns: VxeTableGridOptions<CloseOrderItem>['columns'] = [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 160,
      title: '申请时间',
    },
  ];
  if (showTakeApplyTime.value) {
    columns.push({
      field: 'UpdateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 160,
      title: '接收申请时间',
    });
  }
  columns.push(
    { field: 'AdminUserName', minWidth: 120, title: '推广账号' },
    { field: 'AdminName', minWidth: 120, title: '推广名称' },
    { field: 'Money', minWidth: 100, title: '申请金额' },
    {
      field: 'remitMoney',
      formatter: ({ row }) =>
        String(Number(row.Money || 0) - Number(row.ServiceCharge || 0)),
      minWidth: 100,
      title: '打款金额',
    },
    { field: 'BankAccount', minWidth: 140, title: '打款账号' },
  );
  if (showTakeApplyAccount.value) {
    columns.push({
      field: 'UpdateAdminName',
      minWidth: 120,
      title: '接收申请账号',
    });
  }
  if (showFinishTime.value) {
    columns.push({
      field: 'UpdateFinishTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 160,
      title: '完成时间',
    });
  }
  columns.push(
    { field: 'OrderId', minWidth: 160, title: '订单编号' },
    { field: 'Desc', minWidth: 160, title: '打款备注' },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'action' },
      title: '操作',
    },
  );
  return columns;
}

const gridOptions: VxeTableGridOptions<CloseOrderItem> = {
  columns: buildColumns(),
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchCloseOrderListApi(getQueryParams(page));
        const moreItems = result.MoreItems || [];
        const getSum = (status: number, rate = false) => {
          const item = moreItems.find((entry) => entry.Status === status);
          if (!item) {
            return 0;
          }
          return rate ? Number(item.SumNumRate || 0) : Number(item.SumNum || 0);
        };
        headerData.value = {
          applyMoney: getSum(1),
          goingMoney: getSum(2),
          rejectMoney: getSum(4),
          remitMoney: getSum(3),
          remitRateMoney: getSum(3, true),
        };
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function reloadGrid() {
  gridOptions.columns = buildColumns();
  gridApi.reload();
}

function handleStart(row: CloseOrderItem) {
  Modal.confirm({
    content: '确认开始处理该订单？',
    onOk: async () => {
      await startCloseOrderApi({ Id: row.Id });
      message.success('已开始处理');
      if (canFinish.value) {
        currentRow.value = row;
        finishOpen.value = true;
      } else {
        reloadGrid();
      }
    },
    title: '开始处理',
  });
}

function handleFinish(row: CloseOrderItem) {
  if (
    row.UpdateAdminId &&
    String(row.UpdateAdminId) !== String(currentAdminId.value)
  ) {
    Modal.confirm({
      content: `当前处理人为 ${row.UpdateAdminName || '-'}，确认继续处理？`,
      onOk: () => {
        currentRow.value = row;
        finishOpen.value = true;
      },
      title: '处理确认',
    });
    return;
  }
  currentRow.value = row;
  finishOpen.value = true;
}

onMounted(() => {
  if (canViewPage.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 分销结算报表"
    title="分销结算报表"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterAdminUserName"
          allow-clear
          placeholder="推广账号"
          style="width: 220px"
        />
        <Input
          v-model:value="filterOrderId"
          allow-clear
          placeholder="订单编号"
          style="width: 220px"
        />
        <Select
          v-model:value="filterStatus"
          allow-clear
          class="w-32"
          :options="[
            { label: '申请中', value: 1 },
            { label: '处理中', value: 2 },
            { label: '已完成', value: 3 },
            { label: '已拒绝', value: 4 },
          ]"
          placeholder="状态"
        />
        <DatePicker.RangePicker v-model:value="filterDateRange" />
        <Select
          allow-clear
          class="w-52"
          mode="multiple"
          placeholder="显示更多列"
          @change="
            (values) => {
              showTakeApplyTime = (values as number[]).includes(0);
              showTakeApplyAccount = (values as number[]).includes(1);
              showFinishTime = (values as number[]).includes(2);
              reloadGrid();
            }
          "
          :options="[
            { label: '接收申请时间', value: 0 },
            { label: '接收申请账号', value: 1 },
            { label: '完成时间', value: 2 },
          ]"
        />
        <Button type="primary" @click="reloadGrid">查询</Button>
      </div>

      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Statistic
          title="申请金额总计"
          :value="
            headerData.applyMoney +
            headerData.goingMoney +
            headerData.remitMoney +
            headerData.rejectMoney
          "
        />
        <Statistic
          title="已打款金额总计"
          :value="formatTeamQueryMoney(headerData.remitRateMoney)"
        />
        <Statistic
          title="拒绝金额总计"
          :value="formatTeamQueryMoney(headerData.rejectMoney)"
        />
      </div>

      <Grid>
        <template #status="{ row }">
          <Tag
            :color="CLOSE_ORDER_STATUS_COLOR[Number(row.Status)] || 'default'"
          >
            {{ CLOSE_ORDER_STATUS_MAP[Number(row.Status)] || row.Status }}
          </Tag>
        </template>
        <template #action="{ row }">
          <Space>
            <Button
              v-if="row.Status === 1 && canStart"
              size="small"
              type="link"
              @click="handleStart(row)"
            >
              开始处理
            </Button>
            <Button
              v-if="row.Status === 2 && canFinish"
              size="small"
              type="link"
              @click="handleFinish(row)"
            >
              结束订单
            </Button>
          </Space>
        </template>
      </Grid>
    </Card>

    <FinishOrderModal
      v-model:open="finishOpen"
      :current-admin-id="currentAdminId"
      :row="currentRow"
      @success="reloadGrid"
    />
  </Page>
  <Result v-else status="403" sub-title="无分销结算报表查看权限" title="403" />
</template>

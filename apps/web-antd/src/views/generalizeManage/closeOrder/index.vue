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
  message,
  Modal,
  Result,
  Select,
  Space,
  Statistic,
  Tag,
} from 'ant-design-vue';
import BigNumber from 'bignumber.js';
import dayjs, { type Dayjs } from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchCloseOrderListApi,
  startCloseOrderApi,
} from '#/api/promotion/close-order';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  CLOSE_ORDER_STATUS_COLOR,
  CLOSE_ORDER_STATUS_MAP,
} from '#/utils/promotion';

import FinishOrderModal from './components/finish-order-modal.vue';

defineOptions({ name: 'CloseOrder' });

const { adminInfo, checkPermission } = useCloudPermission();

const canViewPage = computed(() => checkPermission(10_863));
const canStart = computed(() => checkPermission(10_865));
const canFinish = computed(() => checkPermission(10_866));

const filterAdminUserName = ref('');
const filterOrderId = ref('');
const filterStatus = ref<number[]>([]);
const filterDateRange = ref<[Dayjs, Dayjs]>();

function loadMoreColumns() {
  try {
    const stored = JSON.parse(localStorage.getItem('teamCloseOrder') || '[]');
    if (Array.isArray(stored)) {
      if (stored.every((value) => typeof value === 'boolean')) {
        return stored
          .map((visible, index) => (visible ? index : -1))
          .filter((index) => index >= 0);
      }
      return stored.map(Number).filter((value) => [0, 1, 2].includes(value));
    }
    if (typeof stored === 'string') {
      return stored
        .split(',')
        .map((visible, index) => (visible === 'true' ? index : -1))
        .filter((index) => index >= 0);
    }
  } catch {
    // Ignore invalid legacy preferences.
  }
  return [];
}

const moreColumns = ref<number[]>(loadMoreColumns());
const showTakeApplyTime = computed(() => moreColumns.value.includes(0));
const showTakeApplyAccount = computed(() => moreColumns.value.includes(1));
const showFinishTime = computed(() => moreColumns.value.includes(2));
const headerData = ref({
  applyMoney: 0,
  goingMoney: 0,
  rejectMoney: 0,
  remitMoney: 0,
  remitRateMoney: 0,
});
const finishOpen = ref(false);
const currentRow = ref<CloseOrderItem>();
const startingOrderId = ref('');

const currentAdminId = computed(() => {
  const admin = adminInfo.value?.Admin as undefined | { Id?: number | string };
  return admin?.Id;
});

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminUserName: filterAdminUserName.value,
    BeginTime: begin?.unix() || '',
    EndTime: end?.unix() || '',
    OrderId: filterOrderId.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    Sort: '',
    Status: filterStatus.value.join(','),
  };
}

function formatCloseOrderDate(value?: number | string) {
  if (value === undefined || value === null || value === '') return '';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return dayjs(String(value).length > 10 ? numeric : numeric * 1000).format(
    'YYYY-MM-DD HH:mm:ss',
  );
}

function netMoney(row: CloseOrderItem) {
  const value = new BigNumber(row.Money || 0).minus(row.ServiceCharge || 0);
  return value.isNaN() ? '-' : value.toFixed(0);
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
      formatter: ({ cellValue }) => formatCloseOrderDate(cellValue),
      minWidth: 160,
      title: '申请时间',
    },
  ];
  if (showTakeApplyTime.value) {
    columns.push({
      field: 'UpdateTime',
      formatter: ({ cellValue }) => formatCloseOrderDate(cellValue),
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
      formatter: ({ row }) => netMoney(row),
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
      formatter: ({ cellValue }) => formatCloseOrderDate(cellValue),
      minWidth: 160,
      title: '完成时间',
    });
  }
  columns.push(
    { field: 'OrderId', minWidth: 160, title: '订单编号' },
    { field: 'Desc', minWidth: 160, title: '打款备注' },
  );
  if (canStart.value || canFinish.value) {
    columns.push({
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'action' },
      title: '操作',
    });
  }
  return columns;
}

let latestListRequestId = 0;
let latestGridResult: { items: CloseOrderItem[]; total: number } = {
  items: [],
  total: 0,
};

const gridOptions: VxeTableGridOptions<CloseOrderItem> = {
  columns: buildColumns(),
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const requestId = ++latestListRequestId;
        try {
          const result = await fetchCloseOrderListApi(getQueryParams(page));
          if (requestId !== latestListRequestId) return latestGridResult;
          const moreItems = result.MoreItems;
          const getSum = (status: number, rate = false) => {
            const item = moreItems.find(
              (entry) => Number(entry.Status) === status,
            );
            if (!item) return 0;
            return rate
              ? Number(item.SumNumRate || 0)
              : Number(item.SumNum || 0);
          };
          headerData.value = {
            applyMoney: getSum(1),
            goingMoney: getSum(2),
            rejectMoney: getSum(4),
            remitMoney: getSum(3),
            remitRateMoney: getSum(3, true),
          };
          latestGridResult = {
            items: result.Items,
            total: Number(
              result.Pagination?.MaxCount || result.Items.length,
            ),
          };
          return latestGridResult;
        } catch (error) {
          if (requestId === latestListRequestId) {
            latestGridResult = { items: [], total: 0 };
            headerData.value = {
              applyMoney: 0,
              goingMoney: 0,
              rejectMoney: 0,
              remitMoney: 0,
              remitRateMoney: 0,
            };
          }
          throw error;
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function reloadGrid() {
  gridApi.setGridOptions({ columns: buildColumns() });
  gridApi.reload();
}

function handleStart(row: CloseOrderItem) {
  if (
    !canStart.value ||
    Number(row.Status) !== 1 ||
    !row.Id ||
    startingOrderId.value
  ) {
    return;
  }
  Modal.confirm({
    content: '确认开始处理该订单？',
    onOk: async () => {
      startingOrderId.value = String(row.Id || '');
      try {
        await startCloseOrderApi({ Id: row.Id });
        message.success('已开始处理');
        if (canFinish.value) {
          const latest = await fetchCloseOrderListApi({
            AdminUserName: '',
            BeginTime: '',
            EndTime: '',
            OrderId: row.OrderId || '',
            Page: 1,
            PageSize: 20,
            Sort: '',
            Status: 2,
          });
          const updatedRow = latest.Items.find(
            (item) => String(item.Id) === String(row.Id),
          );
          if (updatedRow) {
            currentRow.value = updatedRow;
            finishOpen.value = true;
          } else {
            message.warning('订单状态已更新，请在处理中列表继续操作');
            reloadGrid();
          }
        } else {
          reloadGrid();
        }
      } finally {
        startingOrderId.value = '';
      }
    },
    title: '开始处理',
  });
}

function handleFinish(row: CloseOrderItem) {
  if (!canFinish.value || Number(row.Status) !== 2) return;
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

function handleMoreColumnsChange(values: unknown) {
  const selected = Array.isArray(values)
    ? values.map(Number).filter((value) => [0, 1, 2].includes(value))
    : [];
  moreColumns.value = selected;
  const legacyValue = [0, 1, 2]
    .map((index) => selected.includes(index))
    .toString();
  localStorage.setItem('teamCloseOrder', JSON.stringify(legacyValue));
  gridApi.setGridOptions({ columns: buildColumns() });
}

function handleReset() {
  filterAdminUserName.value = '';
  filterOrderId.value = '';
  filterStatus.value = [];
  filterDateRange.value = undefined;
  gridApi.reload();
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
    <Card class="close-order-card" :bordered="false">
      <div class="query-panel">
        <Input
          v-model:value="filterAdminUserName"
          allow-clear
          placeholder="请输入推广账号"
          style="width: 250px"
          @keydown.space.prevent
          @press-enter="reloadGrid"
        >
          <template #addonBefore>推广账号</template>
        </Input>
        <Input
          v-model:value="filterOrderId"
          allow-clear
          placeholder="请输入订单编号"
          style="width: 250px"
          @keydown.space.prevent
          @press-enter="reloadGrid"
        >
          <template #addonBefore>订单编号</template>
        </Input>
        <Select
          v-model:value="filterStatus"
          allow-clear
          class="w-48"
          mode="multiple"
          :options="[
            { label: '申请中', value: 1 },
            { label: '处理中', value: 2 },
            { label: '已完成', value: 3 },
            { label: '已拒绝', value: 4 },
          ]"
          placeholder="状态"
        />
        <DatePicker.RangePicker
          v-model:value="filterDateRange"
          format="YYYY-MM-DD HH:mm:ss"
          show-time
        />
        <Select
          v-model:value="moreColumns"
          class="w-52"
          mode="multiple"
          placeholder="显示更多列"
          @change="handleMoreColumnsChange"
          :options="[
            { label: '接收申请时间', value: 0 },
            { label: '接收申请账号', value: 1 },
            { label: '完成时间', value: 2 },
          ]"
        />
        <Button type="primary" @click="reloadGrid">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>

      <div class="summary-grid">
        <div class="summary-item">
          <Statistic
            title="申请金额总计"
            :value="
              headerData.applyMoney +
              headerData.goingMoney +
              headerData.remitMoney +
              headerData.rejectMoney
            "
          />
        </div>
        <div class="summary-item">
          <Statistic
            title="已打款金额总计"
            :precision="2"
            :value="headerData.remitRateMoney"
          />
        </div>
        <div class="summary-item">
          <Statistic title="拒绝金额总计" :value="headerData.rejectMoney" />
        </div>
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
              v-if="Number(row.Status) === 1 && canStart"
              :loading="startingOrderId === String(row.Id || '')"
              :disabled="Boolean(startingOrderId)"
              size="small"
              type="link"
              @click="handleStart(row)"
            >
              开始处理
            </Button>
            <Button
              v-if="Number(row.Status) === 2 && canFinish"
              size="small"
              type="link"
              @click="handleFinish(row)"
            >
              结束订单
            </Button>
            <span
              v-if="Number(row.Status) === 3 || Number(row.Status) === 4"
            >
              {{ row.UpdateFinishAdminName || '-' }}
            </span>
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

<style scoped>
.close-order-card {
  min-height: calc(100vh - 180px);
  border-radius: 12px;
  box-shadow: 0 6px 24px rgb(0 0 0 / 5%);
}

.query-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 14px;
  margin-bottom: 16px;
  background: hsl(var(--muted) / 35%);
  border-radius: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  padding: 14px;
  background: hsl(var(--muted) / 25%);
  border-radius: 8px;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>

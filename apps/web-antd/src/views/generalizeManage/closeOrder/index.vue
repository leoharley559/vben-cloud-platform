<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloseOrderItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import BigNumber from 'bignumber.js';
import dayjs, { type Dayjs } from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchCloseOrderListApi,
  startCloseOrderApi,
} from '#/api/promotion/close-order';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
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
    AdminUserName: filterAdminUserName.value || '',
    BeginTime: begin?.startOf('day').unix() || '',
    EndTime: end?.endOf('day').unix() || '',
    OrderId: filterOrderId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    Sort: '',
    // allow-clear 后可能为 undefined，需兜底避免 join 崩溃
    Status: (filterStatus.value || []).join(','),
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
  return value.isNaN() ? '-' : value.toFixed(2);
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
          const items = Array.isArray(result.Items) ? result.Items : [];
          const moreItems = Array.isArray(result.MoreItems)
            ? result.MoreItems
            : [];
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
            items,
            total: Number(result.Pagination?.MaxCount ?? items.length),
          };
          return latestGridResult;
        } catch {
          // 与 teamQuery 一致：失败清空列表，不重抛避免表格二次报错
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
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const summaryItems = computed(() => [
  {
    label: '申请金额总计',
    value:
      headerData.value.applyMoney +
      headerData.value.goingMoney +
      headerData.value.remitMoney +
      headerData.value.rejectMoney,
  },
  {
    label: '已打款金额总计',
    value: Number(headerData.value.remitRateMoney).toFixed(2),
  },
  { label: '拒绝金额总计', value: headerData.value.rejectMoney },
]);

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
          // 开始处理后刷新该单，避免沿用旧 Status/UpdateAdminId 导致 IsYourSure 误判
          try {
            const latest = await fetchCloseOrderListApi({
              AdminUserName: '',
              BeginTime: '',
              EndTime: '',
              OrderId: row.OrderId || '',
              Page: 1,
              PageSize: 20,
              Sort: '',
              Status: '2',
            });
            const updatedRow = (latest.Items || []).find(
              (item) => String(item.Id) === String(row.Id),
            );
            if (updatedRow) {
              currentRow.value = updatedRow;
              finishOpen.value = true;
              return;
            }
          } catch {
            // 刷新失败则回列表
          }
          message.warning('订单状态已更新，请在处理中列表继续操作');
        }
        reloadGrid();
      } catch {
        // requestClient 已提示业务错误（如 10402）
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
  // 对齐旧站 storage：boolean[]，loadMoreColumns 已兼容该格式
  const legacyValue = [0, 1, 2].map((index) => selected.includes(index));
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
    <Card size="small">
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <Space.Compact>
            <span class="query-field-addon">推广账号</span>
            <Input
              v-model:value="filterAdminUserName"
              allow-clear
              placeholder="请输入推广账号"
              @keydown.space.prevent
              @press-enter="reloadGrid"
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">订单编号</span>
            <Input
              v-model:value="filterOrderId"
              allow-clear
              placeholder="请输入订单编号"
              @keydown.space.prevent
              @press-enter="reloadGrid"
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">状态</span>
            <Select
              v-model:value="filterStatus"
              allow-clear
              mode="multiple"
              :options="[
                { label: '申请中', value: 1 },
                { label: '处理中', value: 2 },
                { label: '已完成', value: 3 },
                { label: '已拒绝', value: 4 },
              ]"
              placeholder="请选择状态"
            />
          </Space.Compact>
          <div class="query-filter-wide">
            <QueryDatetimeRangePicker v-model="filterDateRange" />
          </div>
          <div class="query-filter-wide">
            <Space.Compact>
              <span class="query-field-addon">显示更多列</span>
              <Select
                v-model:value="moreColumns"
                mode="multiple"
                :options="[
                  { label: '接收申请时间', value: 0 },
                  { label: '接收申请账号', value: 1 },
                  { label: '完成时间', value: 2 },
                ]"
                placeholder="请选择显示更多列"
                @change="handleMoreColumnsChange"
              />
            </Space.Compact>
          </div>
          <div class="query-filter-actions query-filter-actions-single">
            <Button type="primary" @click="reloadGrid">查询</Button>
            <Button @click="handleReset">重置</Button>
          </div>
        </div>
      </div>

      <SummaryCards :items="summaryItems" />

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


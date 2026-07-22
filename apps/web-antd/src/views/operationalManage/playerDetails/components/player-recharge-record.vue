<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RechargeListItem } from '#/types/operation-manage';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, DatePicker, Input, Select, Space, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchRechargeListApi } from '#/api/operationManage/recharge';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLast7CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  formatRechargeHandleType,
  formatRechargeStatus,
  getRechargeStatusColor,
  RECHARGE_STATUS_OPTIONS,
} from '#/utils/recharge-status';

defineOptions({ name: 'PlayerRechargeRecord' });

const props = defineProps<{
  playerId: number | string;
}>();

const defaultRange = getLast7CalendarDaysRangeSeconds();
const totalAmount = ref(0);

const filterOrderId = ref('');
const filterStatus = ref<number | string>('');
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

function formatChannelName(row: RechargeListItem) {
  if (Number(row.PayType) === -1) {
    return String(row.CreateAdminName || '-');
  }
  const nick = row.NickName || '';
  const show = row.ShowName ? `(${row.ShowName})` : '';
  return nick ? `${nick}${show}` : '-';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    OrderId: filterOrderId.value,
    PlayerId: String(props.playerId),
    Status: filterStatus.value,
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
      field: 'PackageName',
      minWidth: 120,
      title: '所属产品',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'NickName',
      formatter: ({ row }) => formatChannelName(row),
      minWidth: 160,
      title: '通道名称',
    },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP ${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    {
      field: 'RealAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '充值金额',
    },
    {
      field: 'Remark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '备注',
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
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam = `${sortField} ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        }

        const result = await fetchRechargeListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        totalAmount.value = Number(result?.Total?.Amount || 0);

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

function handleReset() {
  filterOrderId.value = '';
  filterStatus.value = '';
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

watch(
  () => props.playerId,
  () => {
    if (props.playerId) {
      gridApi.reload();
    }
  },
);

onMounted(() => {
  if (props.playerId) {
    gridApi.reload();
  }
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单编号"
        style="width: 200px"
        @press-enter="handleSearch"
      >
        <template #addonBefore>订单编号</template>
      </Input>

      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
          :options="RECHARGE_STATUS_OPTIONS"
          placeholder="全部"
          style="width: 140px"
        />
      </div>

      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">日期</span>
        <DatePicker.RangePicker v-model:value="filterDateRange" />
      </div>

      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </div>

    <div class="mb-3 text-sm">
      充值总额：
      <span class="font-medium text-green-600">
        {{ formatAmountFromCent(totalAmount) }}
      </span>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="getRechargeStatusColor(row.Status)">
          {{ formatRechargeStatus(row.Status) }}
        </Tag>
      </template>
    </Grid>
  </div>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WithdrawListItem } from '#/types/operation-manage';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Input, Select, Space, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchWithdrawListApi } from '#/api/operationManage/withdraw';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  calcWithdrawStatusText,
  formatRiskStatus,
  getRiskStatusColor,
  WITHDRAW_STATUS_OPTIONS,
} from '#/utils/withdraw-status';

defineOptions({ name: 'PlayerWithdrawRecord' });

const props = defineProps<{
  playerId: number | string;
}>();

const defaultRange = getCurrentMonthRangeSeconds();
const totalAmount = ref(0);

const filterOrderId = ref('');
const filterWithdrawStatus = ref<number | string>();
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
    EndTime: end ? end.unix() : '',
    OrderId: filterOrderId.value,
    PlayerId: String(props.playerId),
    SelectTimeType: 1,
    WithdrawStatus: filterWithdrawStatus.value ?? '',
  };
}

const gridOptions: VxeTableGridOptions<WithdrawListItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 120,
      slots: { default: 'withdrawStatus' },
      title: '兑换状态',
    },
    {
      field: 'RiskStatus',
      minWidth: 110,
      slots: { default: 'riskStatus' },
      title: '风控状态',
    },
    {
      field: 'RiskAuditorName',
      minWidth: 110,
      title: '风控人员',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
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
      field: 'FinishTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '结束时间',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '申请金额',
    },
    {
      field: 'RealAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '实际金额',
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

        const result = await fetchWithdrawListApi({
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
  filterWithdrawStatus.value = undefined;
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
          <Space.Compact>
            <span class="query-field-addon">状态</span>
            <Select
              v-model:value="filterWithdrawStatus"
              allow-clear
              :options="WITHDRAW_STATUS_OPTIONS"
              placeholder="请选择状态"
            />
          </Space.Compact>
        </div>

        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Space>
            <Button :loading="loading" type="primary" @click="handleSearch">
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </div>
      </div>
    </div>

    <div class="mb-3 text-sm">
      兑换总额：
      <span class="font-medium text-red-500">
        {{ formatAmountFromCent(totalAmount) }}
      </span>
    </div>

    <Grid>
      <template #withdrawStatus="{ row }">
        {{ calcWithdrawStatusText(row.Status, row.Process, row.RefundScore) }}
      </template>
      <template #riskStatus="{ row }">
        <Tag :color="getRiskStatusColor(row.RiskStatus)">
          {{ formatRiskStatus(row.RiskStatus) }}
        </Tag>
      </template>
    </Grid>
  </div>
</template>

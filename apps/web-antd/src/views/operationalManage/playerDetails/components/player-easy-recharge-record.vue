<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerEasyRechargeItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Input, Select, Space, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchEasyRechargeListApi } from '#/api/operationManage/easy-recharge';
import EasyRechargeVoucherCell from '#/components/easy-recharge/easy-recharge-voucher-cell.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { getLast7CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  EASY_RECHARGE_STATUS_OPTIONS,
  formatEasyRechargeStatus,
  getEasyRechargeStatusColor,
} from '#/utils/player-detail-maps';

defineOptions({ name: 'PlayerEasyRechargeRecord' });

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

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    DataSearchType: 2,
    EndTime: end ? end.unix() : '',
    GameOrderId: filterOrderId.value,
    PlayerId: String(props.playerId),
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
      sortable: true,
      title: '创建时间',
    },
    {
      field: 'GameOrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'PlayerName',
      minWidth: 120,
      title: '充值名称',
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
          sortParam = `${sortField} ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        }

        const result = await fetchEasyRechargeListApi({
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
    defaultSort: { field: 'CreateTime', order: 'desc' },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

const summaryItems = computed(() => [
  {
    label: '充值总额',
    value: formatAmountFromCent(totalAmount.value),
  },
]);

watch(
  () => props.playerId,
  () => props.playerId && gridApi.reload(),
);
onMounted(() => props.playerId && gridApi.reload());
</script>

<template>
  <div>
    <div class="ops-query-scope mb-4">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          @press-enter="gridApi.reload()"
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
          :options="EASY_RECHARGE_STATUS_OPTIONS"
          placeholder="请选择状态"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions">
          <Space>
        <Button :loading="loading" type="primary" @click="gridApi.reload()">
          查询
        </Button>
        <Button
          @click="
            filterOrderId = '';
            filterStatus = '';
            filterDateRange = [
              dayjs.unix(defaultRange.BeginTime),
              dayjs.unix(defaultRange.EndTime),
            ];
            gridApi.reload();
          "
        >
          重置
        </Button>
      </Space>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #status="{ row }">
        <Tag :color="getEasyRechargeStatusColor(row.Status)">
          {{ formatEasyRechargeStatus(row.Status) }}
        </Tag>
      </template>
      <template #voucher="{ row }">
        <EasyRechargeVoucherCell
          :game-order-id="row.GameOrderId"
          :id="row.Id"
          :image-url="row.ImageUrl"
          @success="gridApi.reload()"
        />
      </template>
    </Grid>
  </div>
</template>

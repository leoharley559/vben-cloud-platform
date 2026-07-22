<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerCreditRecordItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Select,
  Space,
  Statistic,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerCreditRecordListApi } from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLast7CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  CREDIT_WALLET_TYPE_OPTIONS,
  formatCreditStatus,
  formatCreditWalletType,
  getCreditStatusColor,
} from '#/utils/player-detail-maps';

defineOptions({ name: 'PlayerCreditRecord' });

const props = defineProps<{
  playerId: number | string;
}>();

const defaultRange = getLast7CalendarDaysRangeSeconds();
const totalAmount = ref(0);

const filterOrderId = ref('');
const filterWalletType = ref(0);
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
    DataSearchType: 2,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    IsBO: 1,
    OrderId: filterOrderId.value,
    PlayerAccountId: String(props.playerId),
    WalletType: filterWalletType.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerCreditRecordItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '操作时间',
    },
    {
      field: 'WalletType',
      formatter: ({ cellValue }) => formatCreditWalletType(cellValue),
      minWidth: 110,
      title: '操作类型',
    },
    {
      field: 'PackageName',
      minWidth: 120,
      title: '所属产品',
    },
    {
      field: 'ReferenceId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '操作金额',
    },
    {
      field: 'WithdrawWaterMultiply',
      minWidth: 100,
      title: '提款流水',
    },
    {
      field: 'Remarks',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '备注',
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

        const result = await fetchPlayerCreditRecordListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        totalAmount.value = Number(result?.Total?.TotalAmount || 0) * -1;

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

watch(
  () => props.playerId,
  () => props.playerId && gridApi.reload(),
);
onMounted(() => props.playerId && gridApi.reload());
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单编号"
        style="width: 220px"
        @press-enter="gridApi.reload()"
      >
        <template #addonBefore>订单编号</template>
      </Input>
      <Select
        v-model:value="filterWalletType"
        :options="CREDIT_WALLET_TYPE_OPTIONS"
        style="width: 140px"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Space>
        <Button :loading="loading" type="primary" @click="gridApi.reload()">
          查询
        </Button>
        <Button
          @click="
            filterOrderId = '';
            filterWalletType = 0;
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

    <Statistic
      class="mb-4"
      title="代存总额"
      :value="formatAmountFromCent(totalAmount)"
    />

    <Grid>
      <template #status="{ row }">
        <Tag :color="getCreditStatusColor(row.Status)">
          {{ formatCreditStatus(row.Status) }}
        </Tag>
      </template>
    </Grid>
  </div>
</template>

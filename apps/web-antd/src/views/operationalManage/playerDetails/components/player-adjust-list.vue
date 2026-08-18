<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerAdjustListItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  Input,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { fetchPlayerAdjustListApi } from '#/api/operationManage/account-adjust';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  ADJUST_HANDLE_TYPE_OPTIONS,
  ADJUST_REASON_OPTIONS,
  formatAdjustApprove,
  formatAdjustDone,
  formatAdjustReason,
  formatAdjustWater,
  formatAdjustWaterType,
  getAdjustApproveColor,
  getAdjustDoneColor,
} from '#/utils/account-adjust';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'PlayerAdjustListPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(12098));
const canExport = computed(() => checkPermission(12099));

const defaultRange = getTodayRangeSeconds();
const totalAmount = ref(0);

const filterReason = ref<number>(-1);
const filterHandleType = ref<number>(-1);
const filterOrderId = ref('');
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
    Approve: -1,
    ApproveBeginTime: '',
    ApproveEndTime: '',
    BeginTime: begin ? begin.unix() : '',
    DataSearchType: 2,
    EndTime: end ? end.unix() : '',
    HandleType: filterHandleType.value,
    IsApprove: 1,
    IsExp: false,
    OrderId: filterOrderId.value,
    PlayerId: String(props.playerId),
    Reason: filterReason.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerAdjustListItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'Done',
      minWidth: 100,
      slots: { default: 'done' },
      title: '游戏状态',
    },
    {
      field: 'Reason',
      formatter: ({ cellValue }) => formatAdjustReason(cellValue),
      minWidth: 110,
      title: '类型',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '调整金额',
    },
    {
      field: 'HandleDesc',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '申请备注',
    },
    {
      field: 'WaterType',
      formatter: ({ row }) =>
        formatAdjustWaterType(row.HandleType, row.WaterType),
      minWidth: 120,
      title: '流水要求类型',
    },
    {
      field: 'Water',
      formatter: ({ row }) => formatAdjustWater(row),
      minWidth: 100,
      title: '调整流水',
    },
    {
      field: 'HandlerName',
      minWidth: 110,
      title: '申请账号',
    },
    {
      field: 'Approve',
      minWidth: 100,
      slots: { default: 'approve' },
      title: '审核状态',
    },
    {
      field: 'ApproveName',
      minWidth: 110,
      title: '审核账号',
    },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
    {
      field: 'ApproveRemark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '审核备注',
    },
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerAdjustListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });

        totalAmount.value = Number(result?.Total?.Total || 0);

        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
  showFooter: true,
  footerMethod: () => [
    [
      '合计',
      '-',
      '-',
      '-',
      formatAmountFromCent(totalAmount.value),
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
    ],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterReason.value = -1;
  filterHandleType.value = -1;
  filterOrderId.value = '';
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

function handleExport() {
  // 导出能力待接入 Export2Excel
}

watch(
  () => props.playerId,
  () => {
    if (props.playerId && canViewTable.value) {
      gridApi.reload();
    }
  },
);

onMounted(() => {
  if (props.playerId && canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">调整类型</span>
          <Select
            v-model:value="filterReason"
            :options="ADJUST_REASON_OPTIONS"
            placeholder="请选择调整类型"
          />
        </Space.Compact>
      </div>

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
          <span class="query-field-addon">调整方式</span>
          <Select
            v-model:value="filterHandleType"
            :options="ADJUST_HANDLE_TYPE_OPTIONS"
            placeholder="请选择调整方式"
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
        <Button v-if="canExport" disabled @click="handleExport">
          导出 Excel
        </Button>
      </Space>
        </div>
    </div>
  </div>

    <Grid>
      <template #done="{ row }">
        <Tag :color="getAdjustDoneColor(row.Done)">
          {{ formatAdjustDone(row.Done) }}
        </Tag>
      </template>
      <template #approve="{ row }">
        <Tag :color="getAdjustApproveColor(row.Approve)">
          {{ formatAdjustApprove(row.Approve) }}
        </Tag>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12098 才能查看调整记录"
    title="无权限"
  />
</template>

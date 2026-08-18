<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerBonusRewardItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Result, Select, Space, Tag } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { fetchPlayerBonusRewardListApi } from '#/api/operationManage/bonus-reward';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  BONUS_ORDER_STATUS_OPTIONS,
  BONUS_TYPE_OPTIONS,
  formatBaseTurnover,
  formatBonusAccount,
  formatBonusSendType,
  formatBonusStatus,
  formatBonusType,
  formatBonusWaterType,
} from '#/utils/bonus-reward';
import { getLast7CalendarDaysRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'PlayerBonusRewardPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(10423));

const defaultRange = getLast7CalendarDaysRangeSeconds();
const totalReward = ref(0);

const filterBonusTypes = ref<number[]>([]);
const filterOrderStatus = ref(0);
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
    BonusType: filterBonusTypes.value,
    DataSearchType: 2,
    EndTime: end ? end.unix() : '',
    OrderStatus: filterOrderStatus.value,
    PlayerId: String(props.playerId),
  };
}

const gridOptions: VxeTableGridOptions<PlayerBonusRewardItem> = {
  columns: [
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'BonusTitle',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '红利标题',
    },
    {
      field: 'BonusType',
      formatter: ({ cellValue }) => formatBonusType(cellValue),
      minWidth: 110,
      title: '红利类型',
    },
    {
      field: 'SendType',
      formatter: ({ cellValue }) => formatBonusSendType(cellValue),
      minWidth: 100,
      title: '发放方式',
    },
    {
      field: 'IsWater',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '是' : '否'),
      minWidth: 110,
      title: '是否需要流水',
    },
    {
      field: 'WaterType',
      formatter: ({ cellValue }) => formatBonusWaterType(cellValue),
      minWidth: 110,
      title: '流水要求类型',
    },
    {
      field: 'WaterReward',
      minWidth: 100,
      title: '彩金流水',
    },
    {
      field: 'Draw',
      formatter: ({ row }) => String(formatBaseTurnover(row)),
      minWidth: 100,
      title: '本金流水',
    },
    {
      field: 'Bonus',
      minWidth: 110,
      slots: { default: 'bonus' },
      title: '红利金额',
    },
    {
      field: 'ApplyTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '申请时间',
    },
    {
      field: 'FinishTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
    {
      field: 'FailTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '失效时间',
    },
    {
      field: 'ApplyAccount',
      formatter: ({ cellValue }) => formatBonusAccount(String(cellValue || '')),
      minWidth: 110,
      title: '申请账号',
    },
    {
      field: 'Operator',
      formatter: ({ cellValue }) => formatBonusAccount(String(cellValue || '')),
      minWidth: 110,
      title: '审核账号',
    },
    {
      field: 'ApplyNote',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '申请备注',
    },
    {
      field: 'ReviewNote',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '审核备注',
    },
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '状态',
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

        const result = await fetchPlayerBonusRewardListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        totalReward.value = Number(result?.BannerItems?.SumReward || 0);

        const items = [...(result?.Items || [])].sort(
          (a, b) => Number(b.ApplyTime || 0) - Number(a.ApplyTime || 0),
        );

        return {
          items,
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
      '-',
      '-',
      '-',
      '-',
      formatAmountFromCent(totalReward.value),
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
  filterBonusTypes.value = [];
  filterOrderStatus.value = 0;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">红利类型</span>
          <Select
            v-model:value="filterBonusTypes"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            :options="BONUS_TYPE_OPTIONS"
            placeholder="请选择红利类型"
            style="width: 220px"
          />
        </Space.Compact>
      </div>

      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">订单状态</span>
          <Select
            v-model:value="filterOrderStatus"
            :options="BONUS_ORDER_STATUS_OPTIONS"
            style="width: 140px"
            placeholder="请选择订单状态"
          />
        </Space.Compact>
      </div>

      <div class="flex flex-col gap-1">
        <QueryDatetimeRangePicker v-model="filterDateRange" label="申请时间" />
      </div>

      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </div>

    <Grid>
      <template #bonus="{ row }">
        <span
          :class="Number(row.Bonus) < 0 ? 'text-red-500' : 'text-green-600'"
        >
          {{ formatAmountFromCent(row.Bonus) }}
        </span>
      </template>
      <template #status="{ row }">
        <Tag
          :color="
            Number(row.Status) === 2
              ? 'success'
              : Number(row.Status) === 4
                ? 'error'
                : 'default'
          "
        >
          {{ formatBonusStatus(row.Status) }}
        </Tag>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10423 才能查看红利信息"
    title="无权限"
  />
</template>

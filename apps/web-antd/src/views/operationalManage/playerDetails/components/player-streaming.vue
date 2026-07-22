<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  PlayerDrawWaterItem,
  PlayerDrawWaterSummary,
} from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Modal,
  Result,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchPlayerDrawWaterListApi,
  resetPlayerRolloverApi,
} from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  STREAMING_BILL_TYPE_OPTIONS,
  formatStreamingBillSubType,
  formatStreamingBillType,
} from '#/utils/player-detail-maps';

import StreamingAddTurnoverModal from './streaming-add-turnover-modal.vue';
import StreamingCurrentTurnoverModal from './streaming-current-turnover-modal.vue';

defineOptions({ name: 'PlayerStreamingPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();
const { ensureGameConfig } = useGameConfig();

const canViewTable = computed(() => checkPermission(12940));
const canExport = computed(() => checkPermission(12939));
const canResetRollover = computed(() => checkPermission(13163));

const defaultRange = getTodayRangeSeconds();
const waterDetail = ref<PlayerDrawWaterSummary>({});
const selectedOrderIds = ref<string[]>([]);
const addModalOpen = ref(false);
const turnoverDetailOpen = ref(false);
const exportLoading = ref(false);
const resetLoading = ref(false);

const filterBillType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function formatDrawWaterDate(row: PlayerDrawWaterItem) {
  if (row.CreateTimeMicroUnix && Number(row.CreateTimeMicroUnix) > 0) {
    return dayjs(Number(row.CreateTimeMicroUnix) / 1000).format(
      'YYYY-MM-DD HH:mm:ss',
    );
  }
  if (!row.CreateTime || Number(row.CreateTime) === 0) {
    return '-';
  }
  const num = Number(row.CreateTime);
  const parsed =
    String(row.CreateTime).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(row.CreateTime);
}

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

function getAmountClass(value?: number | string) {
  const num = Number(value || 0);
  if (num > 0) {
    return 'text-green-600';
  }
  if (num < 0) {
    return 'text-red-500';
  }
  return '';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    BillType: filterBillType.value,
    DataSearchType: 2,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    PlayerId: String(props.playerId),
  };
}

function parseWaterDetail(raw?: string) {
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as PlayerDrawWaterSummary;
  } catch {
    return {};
  }
}

const gridOptions: VxeTableGridOptions<PlayerDrawWaterItem> = {
  checkboxConfig: {
    checkMethod: ({ row }) => Boolean(row.OrderId),
  },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'CreateTime',
      formatter: ({ row }) => formatDrawWaterDate(row),
      minWidth: 170,
      title: '日期',
    },
    {
      field: 'ProcessTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '流水处理',
    },
    {
      field: 'BillType',
      formatter: ({ cellValue }) => formatStreamingBillType(cellValue),
      minWidth: 100,
      title: '帐变项目',
    },
    {
      field: 'BillSubType',
      formatter: ({ row }) =>
        formatStreamingBillSubType(row.BillType, row.BillSubType),
      minWidth: 110,
      title: '帐变类型',
    },
    {
      field: 'OrderId',
      formatter: ({ cellValue }) => (cellValue ? String(cellValue) : '-'),
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'DrawWater',
      minWidth: 110,
      slots: { default: 'drawWater' },
      title: '流水帐变',
    },
    {
      field: 'CurrentDrawWater',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '当前流水',
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

        const result = await fetchPlayerDrawWaterListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        waterDetail.value = parseWaterDetail(result?.WaterDetail);

        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: PlayerDrawWaterItem[] }) => {
      selectedOrderIds.value = records
        .map((row) => String(row.OrderId || ''))
        .filter(Boolean);
    },
    checkboxChange: ({ records }: { records: PlayerDrawWaterItem[] }) => {
      selectedOrderIds.value = records
        .map((row) => String(row.OrderId || ''))
        .filter(Boolean);
    },
  },
  gridOptions,
});

const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterBillType.value = 0;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchPlayerDrawWaterListApi({
      ...getQueryParams(),
      Page: 1,
      PageSize: 10000,
    });
    const items = result?.Items || [];
    if (!items.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      items,
      [
        {
          header: '日期',
          value: (row) => formatDrawWaterDate(row),
        },
        {
          header: '流水处理',
          value: (row) => formatDateTime(row.ProcessTime),
        },
        {
          header: '帐变项目',
          value: (row) => formatStreamingBillType(row.BillType),
        },
        {
          header: '帐变类型',
          value: (row) =>
            formatStreamingBillSubType(row.BillType, row.BillSubType),
        },
        {
          header: '订单编号',
          value: (row) => String(row.OrderId || '-'),
        },
        {
          header: '流水帐变',
          value: (row) => formatAmountFromCent(row.DrawWater),
        },
        {
          header: '当前流水',
          value: (row) => formatAmountFromCent(row.CurrentDrawWater),
        },
      ],
      `玩家流水_${props.playerId}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

function handleResetRollover() {
  if (!selectedOrderIds.value.length) {
    message.warning('请先选择要清空的流水订单');
    return;
  }

  Modal.confirm({
    content: `确认清空已选 ${selectedOrderIds.value.length} 条流水？`,
    onOk: async () => {
      resetLoading.value = true;
      try {
        await resetPlayerRolloverApi({
          OrderIdList: selectedOrderIds.value.join(','),
        });
        message.success('清空流水已提交，列表将稍后刷新');
        selectedOrderIds.value = [];
        setTimeout(() => gridApi.reload(), 3000);
      } finally {
        resetLoading.value = false;
      }
    },
    title: '清空流水',
  });
}

watch(
  () => props.playerId,
  () => {
    if (props.playerId && canViewTable.value) {
      gridApi.reload();
    }
  },
);

onMounted(async () => {
  await ensureGameConfig();
  if (props.playerId && canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">帐变项目</span>
        <Select
          v-model:value="filterBillType"
          :options="STREAMING_BILL_TYPE_OPTIONS"
          style="width: 140px"
        />
      </div>
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
    </div>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Space>
        <Tag color="blue">
          当前流水：{{
            formatAmountFromCent(
              waterDetail.CurrentTotInCompletedDrawWater || 0,
            )
          }}
        </Tag>
        <Button size="small" @click="turnoverDetailOpen = true">
          更多详情
        </Button>
      </Space>
      <Space>
        <Button type="primary" @click="addModalOpen = true">增加流水</Button>
        <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
          导出
        </Button>
        <Button
          v-if="canResetRollover"
          :loading="resetLoading"
          type="primary"
          danger
          @click="handleResetRollover"
        >
          清空流水
        </Button>
      </Space>
    </div>

    <Grid>
      <template #drawWater="{ row }">
        <span :class="getAmountClass(row.DrawWater)">
          {{ formatAmountFromCent(row.DrawWater) }}
        </span>
      </template>
    </Grid>

    <StreamingAddTurnoverModal
      v-model:open="addModalOpen"
      :player-id="playerId"
      @success="gridApi.reload()"
    />
    <StreamingCurrentTurnoverModal
      v-model:open="turnoverDetailOpen"
      :detail="waterDetail"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12940 才能查看流水信息"
    title="无权限"
  />
</template>

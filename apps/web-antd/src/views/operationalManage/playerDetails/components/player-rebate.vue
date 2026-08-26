<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerRebateRecordItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Input, Result, Select, Space, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchPlayerRebateListApi } from '#/api/operationManage/player-detail-extra';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  REBATE_AWARD_STATUS_MAP,
  REBATE_AWARD_STATUS_OPTIONS,
  REBATE_AWARD_TYPE_MAP,
} from '#/utils/player-detail-maps';

defineOptions({ name: 'PlayerRebatePanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(11_610));

const defaultRange = getCurrentMonthRangeSeconds();
const sumBackWater = ref(0);

const filterOrderId = ref('');
const filterAwardStatus = ref(-1);
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

function formatAwardStatus(status?: number) {
  if (status === undefined || status === null) {
    return '-';
  }
  return REBATE_AWARD_STATUS_MAP[status] || String(status);
}

function formatAwardType(type?: number) {
  if (type === undefined || type === null) {
    return '-';
  }
  return REBATE_AWARD_TYPE_MAP[type] || String(type);
}

function getAwardStatusColor(status?: number) {
  if (status === 1) {
    return 'success';
  }
  if (status === 2) {
    return 'error';
  }
  if (status === 0) {
    return 'warning';
  }
  return 'default';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AwardStatus: filterAwardStatus.value,
    AwardTimeBegin: begin ? begin.startOf('day').unix() : '',
    AwardTimeEnd: end ? end.endOf('day').unix() : '',
    AwardType: -1,
    DataSearchType: 2,
    LevelId: -1,
    OrderId: filterOrderId.value,
    PlayerId: String(props.playerId),
    RebateMode: -1,
    VipLevel: -1,
  };
}

const gridOptions: VxeTableGridOptions<PlayerRebateRecordItem> = {
  columns: [
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'BackWater',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '返水金额',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '生成时间',
    },
    {
      field: 'AwardTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '发放时间',
    },
    {
      field: 'AwardType',
      formatter: ({ cellValue }) => formatAwardType(cellValue),
      minWidth: 90,
      title: '发放类型',
    },
    {
      field: 'AwardStatus',
      minWidth: 90,
      slots: { default: 'awardStatus' },
      title: '返水状态',
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

        const result = await fetchPlayerRebateListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        const items = result?.Items || [];
        const rawTotal = result?.Pagination?.MaxCount ?? result?.Total;
        sumBackWater.value = Number(result?.SumBackWater || 0);

        return {
          items,
          total:
            typeof rawTotal === 'number'
              ? rawTotal
              : Number(rawTotal || items.length),
        };
      },
    },
  },
  showFooter: true,
  footerMethod: () => [
    ['合计', formatAmountFromCent(sumBackWater.value), '-', '-', '-', '-'],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterOrderId.value = '';
  filterAwardStatus.value = -1;
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
            <span class="query-field-addon">返水状态</span>
            <Select
              v-model:value="filterAwardStatus"
              :options="REBATE_AWARD_STATUS_OPTIONS"
              placeholder="请选择返水状态"
            />
          </Space.Compact>
        </div>

        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="filterDateRange"
            label="发放时间"
          />
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

    <Grid>
      <template #awardStatus="{ row }">
        <Tag :color="getAwardStatusColor(row.AwardStatus)">
          {{ formatAwardStatus(row.AwardStatus) }}
        </Tag>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 11610 才能查看返水信息"
    title="无权限"
  />
</template>

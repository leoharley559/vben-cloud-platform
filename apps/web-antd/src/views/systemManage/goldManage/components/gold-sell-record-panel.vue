<script lang="ts" setup>
import type { Dayjs } from 'dayjs';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Input } from 'ant-design-vue';

import { fetchGoldSellRecordListApi } from '#/api/systemManage/extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import { toUnixRange } from '#/views/dataClose/shared/report-utils';

defineOptions({ name: 'GoldSellRecordPanel' });

const props = defineProps<{
  /** 父组件传入的初始包网账号（查看记录跳转） */
  agentName?: string;
}>();

interface RecordRow {
  ActType?: number;
  AddScores?: number | string;
  AgentName?: string;
  CreateAdminName?: string;
  CreateTime?: number | string;
  Note?: string;
  OrderId?: string;
  [key: string]: unknown;
}

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(11437));

const filterUsername = ref(props.agentName || '');
const filterOrderId = ref('');
const filterCreateAdminName = ref('');
const dateRange = ref<[Dayjs, Dayjs] | undefined>();
const sumAddScores = ref(0);

const gridOptions: VxeTableGridOptions<RecordRow> = {
  columns: [
    {
      align: 'center',
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as number | string),
      minWidth: 170,
      sortable: true,
      title: '订单日期',
    },
    {
      align: 'center',
      field: 'AgentName',
      minWidth: 140,
      title: '包网账号',
    },
    {
      align: 'center',
      field: 'OrderId',
      minWidth: 220,
      title: '订单编号',
    },
    {
      align: 'center',
      field: 'ActType',
      formatter: ({ cellValue }) => {
        const type = Number(cellValue);
        if (type === 1) return '授信';
        if (type === 2) return '追回';
        return '-';
      },
      minWidth: 100,
      title: '操作类型',
    },
    {
      align: 'center',
      field: 'Note',
      formatter: ({ row }) =>
        Number(row.ActType) === 2 ? String(row.Note || '') : '--',
      minWidth: 160,
      title: '追回理由',
    },
    {
      align: 'center',
      field: 'AddScores',
      minWidth: 120,
      slots: { default: 'addScores' },
      title: '金币',
    },
    {
      align: 'center',
      field: 'CreateAdminName',
      minWidth: 120,
      title: '操作人员',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }) => {
        if (!canViewTable.value) {
          sumAddScores.value = 0;
          return { items: [], total: 0 };
        }
        const { BeginTime, EndTime } = toUnixRange(dateRange.value);
        try {
          const result = await fetchGoldSellRecordListApi({
            BeginTime: BeginTime || '',
            CreateAdminName: filterCreateAdminName.value,
            EndTime: EndTime || '',
            Keyword: '',
            OrderId: filterOrderId.value,
            Page: page.currentPage,
            PageSize: page.pageSize,
            Sort:
              sort?.field && sort?.order
                ? `${sort.order === 'desc' ? '-' : ''}${sort.field}`
                : '',
            Username: filterUsername.value,
          });
          const more = (result.MoreItems || {}) as Record<string, unknown>;
          sumAddScores.value = Number(more.SumAddScores || 0);
          const items = (result.Items || []) as unknown as RecordRow[];
          return {
            items,
            total: Number(result.Pagination?.MaxCount || items.length),
          };
        } catch {
          sumAddScores.value = 0;
          return { items: [], total: 0 };
        }
      },
    },
    autoLoad: false,
  },
  sortConfig: { remote: true },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const summaryItems = computed(() => [
  { label: '授信金币合计', value: sumAddScores.value },
]);

function handleSearch() {
  void gridApi.reload();
}

function handleReset() {
  filterUsername.value = '';
  filterOrderId.value = '';
  filterCreateAdminName.value = '';
  dateRange.value = undefined;
  void gridApi.reload();
}

function formatAddScores(row: RecordRow) {
  const score = Number(row.AddScores || 0);
  const abs = Math.abs(score);
  if (Number(row.ActType) === 1) {
    return `+${abs}`;
  }
  if (Number(row.ActType) === 2) {
    return `-${abs}`;
  }
  return String(row.AddScores ?? '');
}

watch(
  () => props.agentName,
  (name) => {
    if (name === undefined) return;
    filterUsername.value = name;
    void gridApi.reload();
  },
);

onMounted(() => {
  if (props.agentName) {
    filterUsername.value = props.agentName;
  }
  if (canViewTable.value) {
    void gridApi.reload();
  }
});
</script>

<template>
  <div>
    <ReportQueryCard>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterUsername"
          allow-clear
          class="!w-[220px]"
          @press-enter="handleSearch"
          style="width: 220px"
          placeholder="请输入包网账号"
        >
          <template #addonBefore>包网账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          class="!w-[220px]"
          @press-enter="handleSearch"
          style="width: 220px"
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterCreateAdminName"
          allow-clear
          class="!w-[220px]"
          @press-enter="handleSearch"
          style="width: 220px"
          placeholder="请输入操作人员"
        >
          <template #addonBefore>操作人员</template>
        </Input>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" />
        </div>
      <template #actions>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </template>
      <template #extra>
        <SummaryCards :items="summaryItems" />
      </template>
    </ReportQueryCard>

    <Grid v-if="canViewTable">
      <template #addScores="{ row }">
        <span
          :class="
            Number(row.ActType) === 1
              ? 'text-green-600'
              : Number(row.ActType) === 2
                ? 'text-red-500'
                : ''
          "
        >
          {{ formatAddScores(row) }}
        </span>
      </template>
    </Grid>
    <div v-else class="py-8 text-center text-gray-400">
      无授信记录列表查看权限
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchActivityListApi,
  offshelfActivityApi,
} from '#/api/operationManage/activity';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

import {
  ACTIVITY_FILTER_TYPE_OPTIONS,
  type OngoingActivityRow,
  buildUnixRangeQuery,
  computeOngoingDisplayStatus,
  formatActivityTimeCell,
  formatActivityType,
  formatOngoingDisplayStatus,
  formatShowTimeCell,
} from './activity-shared';

defineOptions({ name: 'ActivityOngoingPanel' });

const { checkPermission } = useCloudPermission();
const canViewList = computed(() => checkPermission(10305));
const canOffshelf = computed(() => checkPermission(10307));

const filterId = ref('');
const filterName = ref('');
const filterType = ref<number | string>();
const showTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const activityTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const actionId = ref<number | string>();

const typeOptions = ACTIVITY_FILTER_TYPE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value,
}));

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    Id: filterId.value || '',
    Name: filterName.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    Type: filterType.value ?? '',
    ...buildUnixRangeQuery(showTimeRange.value, 'AdvanceTime', 'ExpireTime'),
    ...buildUnixRangeQuery(activityTimeRange.value, 'OpenTime', 'FinishTime'),
  };
}

const gridOptions: VxeTableGridOptions<OngoingActivityRow> = {
  columns: [
    {
      field: 'displayStatus',
      minWidth: 110,
      slots: { default: 'displayStatus' },
      title: '活动状态',
    },
    {
      field: 'Id',
      formatter: ({ row }) => `${row.Id}(${row.Type ?? '-'})`,
      minWidth: 120,
      title: '活动ID(模板ID)',
    },
    { field: 'RankSort', minWidth: 80, title: '排序' },
    {
      field: 'Type',
      formatter: ({ cellValue }) => formatActivityType(cellValue),
      minWidth: 120,
      title: '活动类型',
    },
    { field: 'Name', minWidth: 160, title: '活动名称' },
    {
      field: 'showTime',
      minWidth: 200,
      slots: { default: 'showTime' },
      title: '展示时间',
    },
    {
      field: 'activityTime',
      minWidth: 200,
      slots: { default: 'activityTime' },
      title: '活动时间',
    },
    {
      field: 'UpdateTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '最后操作时间',
    },
    {
      field: 'operator',
      formatter: ({ row }) =>
        String(row.UpdateAdminName || row.CreateAdminName || '-'),
      minWidth: 100,
      title: '操作人',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 100,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!canViewList.value) {
          return { items: [], total: 0 };
        }
        const result = await fetchActivityListApi(buildQuery(page));
        const items = (result.Items || []) as unknown as OngoingActivityRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function canClose(row: OngoingActivityRow) {
  const status = computeOngoingDisplayStatus(row);
  return status !== 'delisted' && status !== 'closed';
}

function statusColor(row: OngoingActivityRow) {
  const label = formatOngoingDisplayStatus(row);
  if (label === '未开始') return 'default';
  if (label === '预热中') return 'processing';
  if (label === '进行中') return 'success';
  if (label === '下架中') return 'warning';
  return 'default';
}

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterId.value = '';
  filterName.value = '';
  filterType.value = undefined;
  showTimeRange.value = undefined;
  activityTimeRange.value = undefined;
  gridApi.reload();
}

function handleOffshelf(row: OngoingActivityRow) {
  Modal.confirm({
    content: `确认关闭/下架活动「${row.Name || row.Id}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await offshelfActivityApi({ ActivityId: row.Id });
        message.success('操作成功');
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '关闭活动',
  });
}
</script>

<template>
  <div>
    <div class="mb-3 text-xs text-gray-400">
      已支持当前活动下架；创建/编辑向导与多语言配置待后续迭代。
    </div>

    <div v-if="!canViewList" class="py-8 text-center text-gray-400">
      无当前活动列表查看权限 (10305)
    </div>

    <template v-else>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterId"
          allow-clear
          placeholder="活动ID"
          style="width: 210px"
        >
          <template #addonBefore>活动ID</template>
        </Input>
        <Input
          v-model:value="filterName"
          allow-clear
          placeholder="活动名称"
          style="width: 260px"
        >
          <template #addonBefore>活动名称</template>
        </Input>
        <Select
          v-model:value="filterType"
          allow-clear
          class="w-40"
          :options="typeOptions"
          placeholder="活动类型"
        />
        <DatePicker.RangePicker
          v-model:value="showTimeRange"
          show-time
          :placeholder="['预热时间', '下架时间']"
        />
        <DatePicker.RangePicker
          v-model:value="activityTimeRange"
          show-time
          :placeholder="['开始时间', '结束时间']"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>

      <Grid>
        <template #displayStatus="{ row }">
          <Tag :color="statusColor(row)">
            {{ formatOngoingDisplayStatus(row) }}
          </Tag>
        </template>
        <template #showTime="{ row }">
          <div class="whitespace-pre-line text-xs">
            {{ formatShowTimeCell(row) }}
          </div>
        </template>
        <template #activityTime="{ row }">
          <div class="whitespace-pre-line text-xs">
            {{ formatActivityTimeCell(row) }}
          </div>
        </template>
        <template #action="{ row }">
          <Button
            v-if="canOffshelf && canClose(row)"
            danger
            size="small"
            :loading="actionId === row.Id"
            @click="handleOffshelf(row)"
          >
            下架
          </Button>
          <span v-else>-</span>
        </template>
      </Grid>
    </template>
  </div>
</template>

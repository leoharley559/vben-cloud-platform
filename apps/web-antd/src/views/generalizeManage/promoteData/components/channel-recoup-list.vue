<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ChannelRecoupItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Radio,
  Result,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchChannelRecoupListApi } from '#/api/promotion/promote-data';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatDateOnly } from '#/utils/promotion-data';

defineOptions({ name: 'ChannelRecoupList' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(13187));
const canExport = computed(() => checkPermission(10016));

const defaultBegin = dayjs().subtract(7, 'day');
const defaultEnd = dayjs().subtract(1, 'day');

const filterAdminSearch = ref('');
const filterChannelSearch = ref('');
const filterReportType = ref(2);
const filterType = ref(1);
const filterIsTotal = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const exportLoading = ref(false);

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AdminSearch: filterAdminSearch.value,
    AdminSearchType: 1,
    BeginTime: begin ? begin.format('YYYY-MM-DD') : '',
    ChannelSearch: filterChannelSearch.value,
    ChannelSearchType: 1,
    EndTime: end ? end.format('YYYY-MM-DD') : '',
    IsTotal: Boolean(filterIsTotal.value),
    ReportType: filterReportType.value,
    Type: filterType.value,
  };
}

const gridOptions: VxeTableGridOptions<ChannelRecoupItem> = {
  columns: [
    {
      field: 'RegisterPeriod',
      formatter: ({ cellValue }) => formatDateOnly(String(cellValue || '')),
      minWidth: 120,
      title: '日期',
    },
    { field: 'RegNum', minWidth: 100, title: '注册人数' },
    { field: 'FirstPayNum', minWidth: 100, title: '首存人数' },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const result = await fetchChannelRecoupListApi(getQueryParams());
        const items = result.Items || [];
        return { items, total: items.length };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchChannelRecoupListApi(getQueryParams());
    const rows = result.Items || [];
    exportRowsToCsv(
      rows,
      [
        {
          header: '日期',
          value: (row) => formatDateOnly(String(row.RegisterPeriod || '')),
        },
        { header: '注册人数', value: (row) => row.RegNum ?? 0 },
        { header: '首存人数', value: (row) => row.FirstPayNum ?? 0 },
      ],
      `渠道回本数据_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
    message.success('导出成功');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canViewPage.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewPage">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterAdminSearch"
        allow-clear
        placeholder="推广账号"
        style="width: 200px"
      />
      <Input
        v-model:value="filterChannelSearch"
        allow-clear
        placeholder="渠道"
        style="width: 200px"
      />
      <Select
        v-model:value="filterReportType"
        class="w-28"
        :options="[
          { label: '日报', value: 2 },
          { label: '周报', value: 3 },
          { label: '月报', value: 4 },
        ]"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Radio.Group v-model:value="filterType">
        <Radio.Button :value="1">投注人数</Radio.Button>
        <Radio.Button :value="2">公司输赢</Radio.Button>
        <Radio.Button :value="3">充提差</Radio.Button>
        <Radio.Button :value="4">充值</Radio.Button>
        <Radio.Button :value="5">充值人数</Radio.Button>
      </Radio.Group>
      <Select
        v-model:value="filterIsTotal"
        class="w-28"
        :options="[
          { label: '明细', value: 0 },
          { label: '汇总', value: 1 },
        ]"
      />
      <Space>
        <Button type="primary" @click="gridApi.reload()">查询</Button>
        <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
          导出 Excel
        </Button>
      </Space>
    </div>
    <Grid />
  </div>
  <Result v-else status="403" sub-title="无渠道回本数据查看权限" title="403" />
</template>

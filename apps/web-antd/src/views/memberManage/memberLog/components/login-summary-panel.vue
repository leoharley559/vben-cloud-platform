<script lang="ts" setup>
import type { LoginLogSummaryData } from '#/types/member-logs';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchLoginLogSummaryApi } from '#/api/memberManage/member-logs';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getTodayRangeSeconds } from '#/utils/date-range';

defineOptions({ name: 'LoginSummaryPanel' });

const { checkPermission } = useCloudPermission();
const { memberTypeOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const canViewSummary = computed(() => checkPermission(12222));

const defaultRange = getTodayRangeSeconds();
const loading = ref(false);
const filterDataSearchType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const summaryData = ref<LoginLogSummaryData>({});

const platformColumns = [
  { dataIndex: 'TotalPlatform', title: '总登录人次' },
  { dataIndex: 'Ios', title: 'IOS' },
  { dataIndex: 'Android', title: 'Android' },
  { dataIndex: 'AppStore', title: 'App Store' },
  { dataIndex: 'Web', title: 'Web' },
  { dataIndex: 'H5', title: 'H5' },
  { dataIndex: 'Other', title: '其他' },
];

const vipLevelColumns = computed(() => {
  const map = projectConfig.value?.VIPLevelMap as
    | Array<{ VipLevelName?: string }>
    | undefined;
  if (!Array.isArray(map) || !map.length) {
    return [{ dataIndex: 'TotalVip', title: '总登录人次' }];
  }
  return [
    { dataIndex: 'TotalVip', title: '总登录人次' },
    ...map.map((item) => ({
      dataIndex: item.VipLevelName || '',
      title: item.VipLevelName || '-',
    })),
  ];
});

function calcPercentage(value: number, total: number) {
  if (!total) {
    return '0.00%';
  }
  return `${((value / total) * 100).toFixed(2)}%`;
}

const platformRows = computed(() => {
  const data = summaryData.value;
  const total = Number(data.TotalPlatform || 0);
  const countRow: Record<string, string> = {};
  const percentRow: Record<string, string> = {};
  platformColumns.forEach((col) => {
    const value = Number(data[col.dataIndex as keyof LoginLogSummaryData] || 0);
    countRow[col.dataIndex] =
      col.dataIndex === 'TotalPlatform' ? String(total) : String(value);
    percentRow[col.dataIndex] =
      col.dataIndex === 'TotalPlatform' ? '占比' : calcPercentage(value, total);
  });
  return [countRow, percentRow];
});

const vipRows = computed(() => {
  const data = summaryData.value;
  const total = Number(data.TotalVip || 0);
  const vipList = Array.isArray(data.VipList) ? data.VipList : [];
  const map = projectConfig.value?.VIPLevelMap as
    | Array<{ VipLevelName?: string }>
    | undefined;

  const countRow: Record<string, string> = { TotalVip: String(total) };
  const percentRow: Record<string, string> = { TotalVip: '占比' };

  if (Array.isArray(map)) {
    map.forEach((item, index) => {
      const key = item.VipLevelName || `VIP${index}`;
      const value = Number(vipList[index] || 0);
      countRow[key] = String(value);
      percentRow[key] = calcPercentage(value, total);
    });
  }

  return [countRow, percentRow];
});

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : '',
    DataSearchType: filterDataSearchType.value,
    EndTime: end ? end.endOf('day').unix() : '',
  };
}

async function loadSummary() {
  if (!canViewSummary.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchLoginLogSummaryApi(getQueryParams());
    summaryData.value = result.Items || {};
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadSummary();
}

function handleReset() {
  filterDataSearchType.value = 0;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  loadSummary();
}

onMounted(() => {
  loadSummary();
});
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">数据类型</span>
          <Select
            v-model:value="filterDataSearchType"
            style="width: 120px"
            :options="memberTypeOptions"
            placeholder="请选择数据类型"
          />
        </Space.Compact>
      
      </div>
      <div class="flex flex-col gap-1">
        <QueryDatetimeRangePicker v-model="filterDateRange" label="统计时间" precision="date" />
      
      </div>
      <Button :loading="loading" type="primary" @click="handleSearch">
        查询
      </Button>
      <Button @click="handleReset">重置</Button>
    </template>

    <div class="mb-6">
      <div class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
        按端口分布人次
      </div>
      <Table
        bordered
        :columns="platformColumns"
        :data-source="
          platformRows.map((row, index) => ({ ...row, _key: index }))
        "
        :loading="loading"
        :pagination="false"
        row-key="_key"
        size="small"
      />
    </div>

    <div>
      <div class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
        会员等级分布人次
      </div>
      <Table
        bordered
        :columns="vipLevelColumns"
        :data-source="vipRows.map((row, index) => ({ ...row, _key: index }))"
        :loading="loading"
        :pagination="false"
        row-key="_key"
        size="small"
      />
    </div>
  </OpsListPanel>
</template>

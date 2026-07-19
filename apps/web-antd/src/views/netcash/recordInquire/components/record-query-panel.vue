<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  RecordQueryBaseQuery,
  RecordQueryListResult,
} from '#/types/netcash';

import { onMounted, ref } from 'vue';

import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatAmountFromCent } from '#/utils/format-amount';

export interface RecordQueryPanelConfig {
  amountField?: string;
  amountTitle?: string;
  columns: Array<{
    field: string;
    formatter?: (value: unknown) => string;
    minWidth?: number;
    title: string;
  }>;
  fetchApi: (
    query: RecordQueryBaseQuery,
  ) => Promise<RecordQueryListResult<Record<string, unknown>>>;
  summaryField?: string;
  summaryTitle?: string;
}

const props = defineProps<{
  config: RecordQueryPanelConfig;
}>();

const { projectConfig } = useProjectConfig();

const defaultBegin = dayjs().subtract(7, 'day').startOf('day');
const defaultEnd = dayjs().subtract(1, 'day').endOf('day');

const filterAgentAccount = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const summaryValue = ref(0);

const packageOptions = (projectConfig.value?.RealPackageIdNameMap || []).map(
  (item) => ({
    label: item.PackageName,
    value: item.PackageId,
  }),
);

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    AgentAccount: filterAgentAccount.value,
    BeginTime: begin ? begin.startOf('day').unix() : defaultBegin.unix(),
    DataSearchType: 1,
    EndTime: end ? end.endOf('day').unix() : defaultEnd.unix(),
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: props.config.columns.map((column) => ({
    field: column.field,
    formatter: column.formatter
      ? ({ cellValue }) => column.formatter!(cellValue)
      : undefined,
    minWidth: column.minWidth || 120,
    title: column.title,
  })),
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await props.config.fetchApi(getQueryParams(page));
        const items = result.Items || [];
        const summaryField = props.config.summaryField;
        if (summaryField && result.Total?.[summaryField] !== undefined) {
          summaryValue.value = Number(result.Total[summaryField] || 0);
        } else {
          summaryValue.value = 0;
        }
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

onMounted(() => {
  gridApi.reload();
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterAgentAccount"
        allow-clear
        placeholder="代理账号"
        style="width: 180px"
      />
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 180px"
      />
      <Select
        v-model:value="filterPackageId"
        allow-clear
        class="w-40"
        :options="packageOptions"
        placeholder="产品包"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>

    <div v-if="config.summaryTitle" class="mb-3 text-sm text-gray-600">
      {{ config.summaryTitle }}：
      {{
        config.amountField ? formatAmountFromCent(summaryValue) : summaryValue
      }}
    </div>

    <Grid />
  </div>
</template>

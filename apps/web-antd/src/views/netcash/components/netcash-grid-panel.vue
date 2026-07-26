<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NetcashListResult } from '#/types/netcash';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatAmountFromCent } from '#/utils/format-amount';

export interface NetcashGridColumn {
  field: string;
  formatter?: (value: unknown, row?: Record<string, unknown>) => string;
  minWidth?: number;
  title: string;
}

export interface NetcashGridConfig {
  actionWidth?: number;
  amountSummary?: boolean;
  columns: NetcashGridColumn[];
  enableCheckbox?: boolean;
  extraQuery?: Record<string, unknown>;
  fetchApi: (query: Record<string, unknown>) => Promise<NetcashListResult>;
  filters?: Array<
    'agent' | 'date' | 'login' | 'package' | 'status' | 'team' | 'username'
  >;
  showActions?: boolean;
  statusOptions?: Array<{ label: string; value: number | string }>;
  summaryField?: string;
  summaryTitle?: string;
}

const props = defineProps<{
  config: NetcashGridConfig;
}>();

const { projectConfig } = useProjectConfig();

const defaultBegin = dayjs().subtract(7, 'day').startOf('day');
const defaultEnd = dayjs().endOf('day');

const filterAgentAccount = ref('');
const filterLoginAccount = ref('');
const filterUsername = ref('');
const filterTeamName = ref('');
const filterPackageId = ref<number | string>();
const filterStatus = ref<number | string>();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>([
  defaultBegin,
  defaultEnd,
]);
const summaryValue = ref(0);

const enabledFilters = computed(
  () => new Set(props.config.filters || ['agent', 'login', 'package', 'date']),
);

const summaryItems = computed(() => {
  if (!props.config.summaryTitle) return [];
  return [
    {
      label: props.config.summaryTitle,
      value: props.config.amountSummary
        ? formatAmountFromCent(summaryValue.value)
        : summaryValue.value,
    },
  ];
});

const packageOptions = computed(() =>
  (projectConfig.value?.RealPackageIdNameMap || []).map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

const showDateFilter = computed(() => enabledFilters.value.has('date'));

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const query: Record<string, unknown> = {
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...props.config.extraQuery,
  };
  if (enabledFilters.value.has('agent')) {
    query.AgentAccount = filterAgentAccount.value;
  }
  if (enabledFilters.value.has('login')) {
    query.LoginAccount = filterLoginAccount.value;
  }
  if (enabledFilters.value.has('username')) {
    query.Username = filterUsername.value;
  }
  if (enabledFilters.value.has('team')) {
    query.TeamName = filterTeamName.value;
  }
  if (enabledFilters.value.has('package')) {
    query.PackageId = filterPackageId.value || '';
  }
  if (enabledFilters.value.has('status')) {
    query.Status = filterStatus.value || '';
  }
  if (showDateFilter.value && filterDateRange.value) {
    const [begin, end] = filterDateRange.value;
    query.BeginTime = begin.startOf('day').unix();
    query.EndTime = end.endOf('day').unix();
    query.TimeBegin = begin.startOf('day').unix();
    query.TimeEnd = end.endOf('day').unix();
  }
  return query;
}

const checkedRows = ref<Record<string, unknown>[]>([]);

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    ...(props.config.enableCheckbox
      ? [{ type: 'checkbox' as const, width: 50 }]
      : []),
    ...props.config.columns.map((column) => ({
      field: column.field,
      formatter: column.formatter
        ? ({
            cellValue,
            row,
          }: {
            cellValue: unknown;
            row: Record<string, unknown>;
          }) => column.formatter!(cellValue, row)
        : undefined,
      minWidth: column.minWidth || 120,
      title: column.title,
    })),
    ...(props.config.showActions
      ? [
          {
            field: 'actions',
            fixed: 'right' as const,
            minWidth: props.config.actionWidth || 160,
            slots: { default: 'actions' },
            title: '操作',
          },
        ]
      : []),
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await props.config.fetchApi(getQueryParams(page));
        const items = result.Items || [];
        const summaryField = props.config.summaryField;
        summaryValue.value =
          summaryField && result.Total?.[summaryField] !== undefined
            ? Number(result.Total[summaryField] || 0)
            : 0;
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: Record<string, unknown>[] }) => {
      checkedRows.value = records;
    },
    checkboxChange: ({ records }: { records: Record<string, unknown>[] }) => {
      checkedRows.value = records;
    },
  },
  gridOptions,
});

watch(
  () => props.config.extraQuery,
  () => {
    gridApi.reload();
  },
  { deep: true },
);

onMounted(() => {
  gridApi.reload();
});

defineExpose({
  getCheckboxRecords: () => checkedRows.value,
  reload: () => gridApi.reload(),
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-if="enabledFilters.has('username')"
        v-model:value="filterUsername"
        allow-clear
        placeholder="代理账号"
        style="width: 220px"
      >
        <template #addonBefore>代理账号</template>
      </Input>
      <Input
        v-if="enabledFilters.has('agent')"
        v-model:value="filterAgentAccount"
        allow-clear
        placeholder="代理账号"
        style="width: 220px"
      >
        <template #addonBefore>代理账号</template>
      </Input>
      <Input
        v-if="enabledFilters.has('login')"
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 220px"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
      <Input
        v-if="enabledFilters.has('team')"
        v-model:value="filterTeamName"
        allow-clear
        placeholder="团队名称"
        style="width: 220px"
      >
        <template #addonBefore>团队名称</template>
      </Input>
      <Select
        v-if="enabledFilters.has('package')"
        v-model:value="filterPackageId"
        allow-clear
        class="w-40"
        :options="packageOptions"
        placeholder="产品包"
      />
      <Select
        v-if="enabledFilters.has('status') && config.statusOptions?.length"
        v-model:value="filterStatus"
        allow-clear
        class="w-32"
        :options="config.statusOptions"
        placeholder="状态"
      />
      <DatePicker.RangePicker
        v-if="showDateFilter"
        v-model:value="filterDateRange"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template v-if="config.showActions" #actions="{ row }">
        <slot name="actions" :row="row"></slot>
      </template>
    </Grid>
  </div>
</template>

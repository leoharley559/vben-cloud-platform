<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudListResult } from '#/types/operation-manage';

import { computed, onMounted, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatAmountFromCent } from '#/utils/format-amount';

export interface OperationListColumn {
  field: string;
  formatter?: (value: unknown, row?: Record<string, unknown>) => string;
  minWidth?: number;
  /** vxe 列 slot 名，由父组件提供单元格内容 */
  slot?: string;
  title: string;
}

export interface OperationListSummaryItem {
  amount?: boolean;
  field: string;
  title: string;
}

export type OperationDatePreset =
  | 'dayBeforeYesterday'
  | 'last31ToYesterday'
  | 'last7Days'
  | 'today'
  | 'yesterday';

export interface OperationListConfig {
  columns: OperationListColumn[];
  dateFieldKeys?: { begin?: string; end?: string };
  /** range=区间；single=单日（如老板日报 TimeNumber） */
  dateMode?: 'range' | 'single';
  datePreset?: OperationDatePreset;
  dateValueFormat?: 'dateString' | 'unix';
  extraQuery?: Record<string, unknown>;
  fetchApi: (
    query: Record<string, unknown>,
  ) => Promise<CloudListResult<Record<string, unknown>>>;
  filters?: Array<'date' | 'login' | 'package' | 'status' | 'username'>;
  loginField?: string;
  statusOptions?: Array<{ label: string; value: number | string }>;
  summaryApi?: (
    query: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  summaryItems?: OperationListSummaryItem[];
}

const props = defineProps<{
  config: OperationListConfig;
}>();

const { packageOptions } = useOperationOptions();

function resolveDefaultRange(
  preset: OperationDatePreset = 'last7Days',
): [dayjs.Dayjs, dayjs.Dayjs] {
  const today = dayjs().startOf('day');
  const yesterday = today.subtract(1, 'day');
  switch (preset) {
    case 'today': {
      return [today, today.endOf('day')];
    }
    case 'yesterday': {
      return [yesterday, yesterday.endOf('day')];
    }
    case 'dayBeforeYesterday': {
      const day = today.subtract(2, 'day');
      return [day, day.endOf('day')];
    }
    case 'last31ToYesterday': {
      return [yesterday.subtract(30, 'day'), yesterday.endOf('day')];
    }
    default: {
      return [today.subtract(6, 'day'), today.endOf('day')];
    }
  }
}

const initialRange = resolveDefaultRange(props.config.datePreset);
const filterLoginAccount = ref('');
const filterUsername = ref('');
const filterPackageId = ref<number | string>();
const filterStatus = ref<number | string>();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>([
  ...initialRange,
]);
const filterSingleDate = ref<dayjs.Dayjs>(initialRange[0]);
const summaryValues = ref<Record<string, unknown>>({});

const enabledFilters = computed(
  () => new Set(props.config.filters || ['login', 'date']),
);

const isSingleDate = computed(() => props.config.dateMode === 'single');

function buildDateQuery(query: Record<string, unknown>) {
  if (!enabledFilters.value.has('date')) {
    return;
  }
  const beginKey = props.config.dateFieldKeys?.begin || 'BeginTime';
  const endKey = props.config.dateFieldKeys?.end || 'EndTime';
  const useString = props.config.dateValueFormat === 'dateString';

  if (isSingleDate.value && filterSingleDate.value) {
    const day = filterSingleDate.value.startOf('day');
    query[beginKey] = useString ? day.format('YYYY-MM-DD') : day.unix();
    return;
  }

  if (filterDateRange.value) {
    const [begin, end] = filterDateRange.value;
    if (useString) {
      query[beginKey] = begin.format('YYYY-MM-DD');
      query[endKey] = end.format('YYYY-MM-DD');
    } else {
      query[beginKey] = begin.unix();
      query[endKey] = end.unix();
    }
  }
}

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const query: Record<string, unknown> = {
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...(props.config.extraQuery || {}),
  };
  if (enabledFilters.value.has('login')) {
    query[props.config.loginField || 'LoginAccount'] = filterLoginAccount.value;
  }
  if (enabledFilters.value.has('username')) {
    query.Username = filterUsername.value;
  }
  if (enabledFilters.value.has('package')) {
    query.PackageId = filterPackageId.value || '';
  }
  if (enabledFilters.value.has('status')) {
    query.Status = filterStatus.value ?? '';
  }
  buildDateQuery(query);
  return query;
}

async function loadSummary(query: Record<string, unknown>) {
  if (!props.config.summaryApi || !props.config.summaryItems?.length) {
    summaryValues.value = {};
    return;
  }
  try {
    const { Page: _page, PageSize: _size, ...rest } = query;
    summaryValues.value = (await props.config.summaryApi(rest)) || {};
  } catch {
    summaryValues.value = {};
  }
}

function readSummaryValue(field: string) {
  const data = summaryValues.value;
  if (!data) {
    return 0;
  }
  if (data[field] !== undefined) {
    return data[field];
  }
  const banner = data.BannerItems as Record<string, unknown> | undefined;
  if (banner && banner[field] !== undefined) {
    return banner[field];
  }
  const total = data.Total as Record<string, unknown> | undefined;
  if (total && total[field] !== undefined) {
    return total[field];
  }
  return 0;
}

const summaryCards = computed(() =>
  (props.config.summaryItems || []).map((item) => ({
    label: item.title,
    value: item.amount
      ? formatAmountFromCent(Number(readSummaryValue(item.field) || 0))
      : Number(readSummaryValue(item.field) || 0),
  })),
);

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: props.config.columns.map((column) => ({
    field: column.field,
    formatter: column.slot
      ? undefined
      : column.formatter
        ? ({ cellValue, row }) => column.formatter!(cellValue, row)
        : undefined,
    minWidth: column.minWidth || 120,
    slots: column.slot ? { default: column.slot } : undefined,
    title: column.title,
  })),
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const query = getQueryParams(page);
        void loadSummary(query);
        const result = await props.config.fetchApi(query);
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

watch(
  () => props.config.extraQuery,
  () => {
    gridApi.reload();
  },
  { deep: true },
);

watch(
  () => props.config.datePreset,
  (preset) => {
    const range = resolveDefaultRange(preset);
    filterDateRange.value = [...range];
    filterSingleDate.value = range[0];
  },
);

onMounted(() => {
  gridApi.reload();
});

defineExpose({ reload: () => gridApi.reload() });
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div v-if="enabledFilters.has('login')" class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div v-if="enabledFilters.has('username')" class="flex flex-col gap-1">
        <Input
          v-model:value="filterUsername"
          allow-clear
          placeholder="请输入账号"
        >
          <template #addonBefore>账号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">产品包</span>
        <Select
          v-if="enabledFilters.has('package')"
          v-model:value="filterPackageId"
          allow-clear
         
          :options="packageOptions"
          placeholder="请选择产品包"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">状态</span>
        <Select
          v-if="enabledFilters.has('status') && config.statusOptions?.length"
          v-model:value="filterStatus"
          allow-clear
         
          :options="config.statusOptions"
          placeholder="请选择状态"
        />
      </Space.Compact>
      <DatePicker
        v-if="enabledFilters.has('date') && isSingleDate"
        v-model:value="filterSingleDate"
      />
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker
        v-if="enabledFilters.has('date') && !isSingleDate"
        v-model="filterDateRange"
        :precision="config.dateValueFormat === 'dateString' ? 'date' : 'datetime'"
      />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryCards" />

    <Grid>
      <template
        v-for="column in config.columns.filter((item) => item.slot)"
        :key="column.slot"
        #[column.slot!]="{ row }"
      >
        <slot :name="column.slot" :row="row" />
      </template>
    </Grid>
  </div>
</template>

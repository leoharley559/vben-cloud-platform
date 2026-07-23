<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { NetcashListResult } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { formatAmountFromCent } from '#/utils/format-amount';

export interface CreditColumn {
  field: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
  minWidth?: number;
  title: string;
}

export interface CreditFilter {
  defaultValue?: unknown;
  field?: string;
  fields?: [string, string];
  label: string;
  options?: Array<{ label: string; value: number | string }>;
  placeholder?: string;
  type?: 'amountRange' | 'dateRange' | 'input' | 'multiSelect' | 'select';
}

export interface CreditSummary {
  amount?: boolean;
  field: string;
  label: string;
}

export interface CreditPanelConfig {
  actionWidth?: number;
  baseQuery?: Record<string, unknown>;
  checkbox?: boolean;
  columns: CreditColumn[];
  exportFileName?: string;
  fetchApi: (query: Record<string, unknown>) => Promise<NetcashListResult>;
  filters?: CreditFilter[];
  showActions?: boolean;
  summaries?: CreditSummary[];
}

const props = defineProps<{ config: CreditPanelConfig }>();

const filterValues = reactive<Record<string, unknown>>({});
const rangeValues = reactive<Record<string, [number | undefined, number | undefined]>>(
  {},
);
const totalData = ref<Record<string, number>>({});
const selectedRows = ref<Record<string, unknown>[]>([]);
const exporting = ref(false);

function initializeFilters() {
  for (const filter of props.config.filters || []) {
    if (filter.field) {
      filterValues[filter.field] =
        filter.defaultValue ?? (filter.type === 'multiSelect' ? [] : '');
    }
    if (filter.fields) {
      rangeValues[filter.label] = [undefined, undefined];
    }
  }
}

initializeFilters();

function normalizeSelectValue(value: unknown) {
  return Array.isArray(value) ? value.join(',') : value;
}

function isEmptyFilterValue(value: unknown) {
  return (
    value === '' ||
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0)
  );
}

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const baseQuery = props.config.baseQuery || {};
  const query: Record<string, unknown> = {
    Page: page.currentPage,
    PageSize: page.pageSize,
    ...baseQuery,
  };
  for (const filter of props.config.filters || []) {
    if (filter.field && filter.type !== 'dateRange') {
      const value = normalizeSelectValue(filterValues[filter.field]);
      // 空筛选项不覆盖 baseQuery 固定参数（如 Status/WalletType）
      if (isEmptyFilterValue(value) && filter.field in baseQuery) {
        continue;
      }
      query[filter.field] = value;
    }
    if (filter.fields) {
      const range = rangeValues[filter.label];
      if (filter.type === 'dateRange') {
        query[filter.fields[0]] = range?.[0]
          ? dayjs(range[0]).startOf('day').unix()
          : '';
        query[filter.fields[1]] = range?.[1]
          ? dayjs(range[1]).endOf('day').unix()
          : '';
      } else {
        query[filter.fields[0]] =
          range?.[0] === undefined ? '' : Math.round(Number(range[0]) * 100);
        query[filter.fields[1]] =
          range?.[1] === undefined ? '' : Math.round(Number(range[1]) * 100);
      }
    }
  }
  return query;
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    ...(props.config.checkbox
      ? [{ type: 'checkbox' as const, width: 48 }]
      : []),
    { type: 'seq' as const, width: 56, title: '序号' },
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
            minWidth: props.config.actionWidth || 180,
            slots: { default: 'actions' },
            title: '操作',
          },
        ]
      : []),
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = (await props.config.fetchApi(buildQuery(page))) || {};
          const items = Array.isArray(result.Items) ? result.Items : [];
          totalData.value =
            result.Total && typeof result.Total === 'object' ? result.Total : {};
          return {
            items,
            total: Number(result.Pagination?.MaxCount ?? items.length),
          };
        } catch {
          totalData.value = {};
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: Record<string, unknown>[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: Record<string, unknown>[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

const hasSummary = computed(
  () => Array.isArray(props.config.summaries) && props.config.summaries.length > 0,
);

function reset() {
  for (const filter of props.config.filters || []) {
    if (filter.field) {
      filterValues[filter.field] =
        filter.defaultValue ?? (filter.type === 'multiSelect' ? [] : '');
    }
    if (filter.fields) {
      rangeValues[filter.label] = [undefined, undefined];
    }
  }
  gridApi.reload();
}

async function exportExcel() {
  if (!props.config.exportFileName) return;
  exporting.value = true;
  try {
    const currentTotal = Number(
      (gridApi.grid as unknown as { getProxyInfo?: () => { pager?: { total?: number } } })
        ?.getProxyInfo?.()?.pager?.total || 0,
    );
    const result = await props.config.fetchApi({
      ...buildQuery({ currentPage: 1, pageSize: Math.max(currentTotal + 1, 1000) }),
      IsExp: true,
    });
    const rows = Array.isArray(result?.Items) ? result.Items : [];
    if (!rows.length) return;
    const { utils, writeFile } = await import('xlsx');
    const data = rows.map((row) =>
      Object.fromEntries(
        props.config.columns.map((column) => [
          column.title,
          column.formatter
            ? column.formatter(row[column.field], row)
            : (row[column.field] ?? ''),
        ]),
      ),
    );
    const sheet = utils.json_to_sheet(data);
    const book = utils.book_new();
    utils.book_append_sheet(book, sheet, '数据');
    writeFile(book, `${props.config.exportFileName}.xlsx`);
  } finally {
    exporting.value = false;
  }
}

onMounted(() => gridApi.reload());

defineExpose({
  getSelectedRows: () => selectedRows.value,
  reload: () => gridApi.reload(),
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <template v-for="filter in config.filters || []" :key="filter.label">
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">{{ filter.label }}</span>
          <Input
            v-if="(!filter.type || filter.type === 'input') && filter.field"
            v-model:value="filterValues[filter.field]"
            allow-clear
            :placeholder="filter.placeholder || `请输入${filter.label}`"
            style="width: 180px"
            @press-enter="gridApi.reload()"
          />
          <Select
            v-else-if="filter.type === 'select' && filter.field"
            v-model:value="filterValues[filter.field]"
            allow-clear
            :options="filter.options"
            :placeholder="`请选择${filter.label}`"
            style="width: 160px"
          />
          <Select
            v-else-if="filter.type === 'multiSelect' && filter.field"
            v-model:value="filterValues[filter.field]"
            allow-clear
            mode="multiple"
            :options="filter.options"
            :placeholder="`请选择${filter.label}`"
            style="min-width: 200px"
          />
          <DatePicker.RangePicker
            v-else-if="filter.type === 'dateRange' && filter.fields"
            :value="
              rangeValues[filter.label]?.[0]
                ? [
                    dayjs(rangeValues[filter.label][0]),
                    dayjs(rangeValues[filter.label][1]),
                  ]
                : undefined
            "
            @change="
              (value) =>
                (rangeValues[filter.label] = value
                  ? [value[0]?.valueOf(), value[1]?.valueOf()]
                  : [undefined, undefined])
            "
          />
          <Space v-else-if="filter.type === 'amountRange' && filter.fields">
            <InputNumber
              v-model:value="rangeValues[filter.label][0]"
              :min="0"
              placeholder="最小"
              style="width: 110px"
            />
            <span>至</span>
            <InputNumber
              v-model:value="rangeValues[filter.label][1]"
              :min="0"
              placeholder="最大"
              style="width: 110px"
            />
          </Space>
        </div>
      </template>
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="reset">重置</Button>
      <Button
        v-if="config.exportFileName"
        :loading="exporting"
        @click="exportExcel"
      >
        导出
      </Button>
      <slot name="toolbar" :reload="gridApi.reload"></slot>
    </div>

    <div
      v-if="hasSummary"
      class="mb-3 flex flex-wrap gap-x-8 gap-y-2 rounded bg-gray-50 px-4 py-3 text-sm"
    >
      <span v-for="summary in config.summaries" :key="summary.field">
        {{ summary.label }}：
        {{
          summary.amount
            ? formatAmountFromCent(Number(totalData[summary.field] || 0))
            : Number(totalData[summary.field] || 0)
        }}
      </span>
    </div>

    <Grid>
      <template v-if="config.showActions" #actions="{ row }">
        <slot name="actions" :row="row"></slot>
      </template>
    </Grid>
  </div>
</template>

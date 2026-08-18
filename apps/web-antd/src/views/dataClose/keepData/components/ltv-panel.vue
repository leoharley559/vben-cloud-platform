<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  message,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import { fetchKeepDataLtvListApi } from '#/api/dataClose/keep-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToXlsx } from '#/views/dataClose/shared/report-utils';

import {
  calcLtv,
  type KeepDetailsParam,
  type KeepRow,
  loadLtvVisibility,
  moneyText,
  num,
  pivotLtvRows,
  saveLtvVisibility,
} from '../utils';
import DetailsPanel from './details-panel.vue';
import KeepQueryBar from './keep-query-bar.vue';

defineOptions({ name: 'KeepLtvPanel' });

const { checkPermission } = useCloudPermission();
const canExport = computed(() => checkPermission(12_166));

const loading = ref(false);
const showDetails = ref(false);
const detailsParam = ref<KeepDetailsParam | null>(null);
const tableData = ref<KeepRow[]>([]);
const tabTitleBol = ref(loadLtvVisibility());
const moreData = ref<number[]>([]);
const query = reactive<Record<string, unknown>>({});
const queryBarRef = ref<InstanceType<typeof KeepQueryBar>>();

const moreOptions = [
  { label: '30日充值', value: 0 },
  { label: '60日充值', value: 1 },
  { label: 'LTV', value: 2 },
];

const LTV_KEYS = [
  'LTV1',
  'LTV2',
  'LTV3',
  'LTV4',
  'LTV5',
  'LTV7',
  'LTV15',
  'LTV30',
] as const;

const DAY_COLS = [
  { days: 0, field: 'Days1', label: '首日充值' },
  { days: 1, field: 'Days2', label: '2日充值' },
  { days: 2, field: 'Days3', label: '3日充值' },
  { days: 3, field: 'Days4', label: '4日充值' },
  { days: 4, field: 'Days5', label: '5日充值' },
  { days: 6, field: 'Days7', label: '7日充值' },
  { days: 14, field: 'Days15', label: '15日充值' },
] as const;

function syncMoreFromStorage() {
  moreData.value = [];
  tabTitleBol.value.forEach((flag, index) => {
    if (flag) moreData.value.push(index);
  });
}

function onMoreChange(values: number[]) {
  const next = [false, false, false, false, false];
  values.forEach((v) => {
    if (v >= 0 && v < next.length) next[v] = true;
  });
  tabTitleBol.value = next;
  saveLtvVisibility(next);
}

function openDetails(date: unknown, type: string, days?: number) {
  detailsParam.value = {
    page: 'ltv',
    type,
    date: String(date || ''),
    days,
    ...query,
  };
  showDetails.value = true;
}

const columns = computed<TableColumnType<KeepRow>[]>(() => {
  const cols: TableColumnType<KeepRow>[] = [
    {
      align: 'center',
      dataIndex: 'RegisterDate',
      key: 'RegisterDate',
      title: '日期',
    },
    { align: 'center', dataIndex: 'SumReg', key: 'SumReg', title: '新增人数' },
    {
      align: 'center',
      dataIndex: 'SumPayMoney',
      key: 'SumPayMoney',
      title: '总充值',
    },
    ...DAY_COLS.map((item) => ({
      align: 'center' as const,
      dataIndex: item.field,
      key: item.field,
      title: item.label,
    })),
  ];
  if (tabTitleBol.value[0]) {
    cols.push({
      align: 'center',
      dataIndex: 'Days30',
      key: 'Days30',
      title: '30日充值',
      customHeaderCell: () => ({ style: { background: '#13c2c2', color: '#fff' } }),
    });
  }
  if (tabTitleBol.value[1]) {
    cols.push({
      align: 'center',
      dataIndex: 'Days60',
      key: 'Days60',
      title: '60日充值',
      customHeaderCell: () => ({ style: { background: '#1677ff', color: '#fff' } }),
    });
  }
  if (tabTitleBol.value[2]) {
    LTV_KEYS.forEach((key) => {
      cols.push({
        align: 'center',
        dataIndex: key,
        key,
        title: key,
        customHeaderCell: () => ({
          style: { background: '#fa8c16', color: '#fff' },
        }),
      });
    });
  }
  return cols;
});

async function loadList() {
  loading.value = true;
  try {
    const data = await fetchKeepDataLtvListApi(query);
    tableData.value = pivotLtvRows(data.ItemsOld || data.Items || []);
  } catch {
    tableData.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSearch(params: Record<string, unknown>) {
  Object.assign(query, params);
  void loadList();
}

async function handleExport() {
  if (tableData.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  const headers = [
    '日期',
    '新增人数',
    '总充值',
    ...DAY_COLS.map((item) => item.label),
  ];
  if (tabTitleBol.value[0]) headers.push('30日充值');
  if (tabTitleBol.value[1]) headers.push('60日充值');
  if (tabTitleBol.value[2]) headers.push(...LTV_KEYS);

  await exportRowsToXlsx(tableData.value, headers, 'LTV数据', (row) => {
    const values: unknown[] = [
      row.RegisterDate,
      row.SumReg,
      moneyText(row.SumPayMoney),
      ...DAY_COLS.map((item) => moneyText(row[item.field])),
    ];
    if (tabTitleBol.value[0]) values.push(moneyText(row.Days30));
    if (tabTitleBol.value[1]) values.push(moneyText(row.Days60));
    if (tabTitleBol.value[2]) {
      LTV_KEYS.forEach((key) => values.push(moneyText(calcLtv(row, key))));
    }
    return values;
  });
}

onMounted(() => {
  syncMoreFromStorage();
  const built = queryBarRef.value?.buildQuery?.();
  if (built) Object.assign(query, built);
  void loadList();
});
</script>

<template>
  <div>
    <div v-show="!showDetails">
      <KeepQueryBar ref="queryBarRef" @search="handleSearch" />
      <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
              <Space.Compact>
          <span class="query-field-addon">显示更多数据</span>
          <Select
            v-model:value="moreData"
            :options="moreOptions"
            allow-clear
            class="min-w-[220px]"
            mode="multiple"
            @change="onMoreChange"
            placeholder="请选择显示更多数据"
          />
        </Space.Compact>
        <div class="query-filter-actions">
          <Button v-if="canExport" type="primary" @click="handleExport">
          导出Excel
        </Button>
        </div>
    </div>
  </div>
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1800 }"
        bordered
        row-key="RegisterDate"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'SumReg'">
            <a
              v-if="num(record.SumReg) > 0"
              @click="openDetails(record.RegisterDate, 'new')"
            >
              {{ record.SumReg }}
            </a>
            <span v-else>{{ record.SumReg }}</span>
          </template>
          <template v-else-if="column.key === 'SumPayMoney'">
            {{ moneyText(record.SumPayMoney) }}
          </template>
          <template
            v-else-if="DAY_COLS.some((item) => item.field === column.key)"
          >
            <a
              v-if="num(record[column.key as string]) > 0"
              @click="
                openDetails(
                  record.RegisterDate,
                  'topUp',
                  DAY_COLS.find((item) => item.field === column.key)?.days,
                )
              "
            >
              {{ moneyText(record[column.key as string]) }}
            </a>
            <span v-else>{{ moneyText(record[column.key as string]) }}</span>
          </template>
          <template v-else-if="column.key === 'Days30'">
            <a
              v-if="num(record.Days30) > 0"
              @click="openDetails(record.RegisterDate, 'topUp', 29)"
            >
              {{ moneyText(record.Days30) }}
            </a>
            <span v-else>{{ moneyText(record.Days30) }}</span>
          </template>
          <template v-else-if="column.key === 'Days60'">
            <a
              v-if="num(record.Days60) > 0"
              @click="openDetails(record.RegisterDate, 'topUp', 59)"
            >
              {{ moneyText(record.Days60) }}
            </a>
            <span v-else>{{ moneyText(record.Days60) }}</span>
          </template>
          <template v-else-if="LTV_KEYS.includes(column.key as any)">
            {{ moneyText(calcLtv(record, String(column.key))) }}
          </template>
        </template>
      </Table>
    </div>
    <DetailsPanel
      v-if="showDetails && detailsParam"
      :param="detailsParam"
      @back="showDetails = false"
    />
  </div>
</template>

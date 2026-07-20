<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  message,
  RadioButton,
  RadioGroup,
  Table,
} from 'ant-design-vue';

import { fetchKeepDataLoginRetentionListApi } from '#/api/dataClose/keep-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToXlsx } from '#/views/dataClose/shared/report-utils';

import {
  type KeepDetailsParam,
  type KeepRow,
  LOGIN_DAY_COLUMNS,
  num,
  pivotLoginRetention,
  ratioText,
} from '../utils';
import DetailsPanel from './details-panel.vue';
import KeepQueryBar from './keep-query-bar.vue';

defineOptions({ name: 'KeepLoginRetentionPanel' });

const { checkPermission } = useCloudPermission();
const canExport = computed(() => checkPermission(12_164));

const loading = ref(false);
const showDetails = ref(false);
const detailsParam = ref<KeepDetailsParam | null>(null);
const tableData = ref<KeepRow[]>([]);
const showType = ref<1 | 2>(2);
const query = reactive<Record<string, unknown>>({});
const queryBarRef = ref<InstanceType<typeof KeepQueryBar>>();

function openDetails(date: unknown, type: number | string) {
  detailsParam.value = {
    page: 'login',
    type,
    date: String(date || ''),
    ...query,
  };
  showDetails.value = true;
}

function cellValue(row: KeepRow, field: string) {
  const value = num(row[field]);
  if (showType.value === 1) return String(value);
  return ratioText(value, row.SumReg);
}

const columns = computed<TableColumnType<KeepRow>[]>(() => [
  {
    align: 'center',
    dataIndex: 'RegisterDate',
    key: 'RegisterDate',
    title: '日期',
  },
  { align: 'center', dataIndex: 'SumReg', key: 'SumReg', title: '新增人数' },
  ...LOGIN_DAY_COLUMNS.map((item) => ({
    align: 'center' as const,
    dataIndex: item.field,
    key: item.field,
    title: item.label,
  })),
]);

async function loadList() {
  loading.value = true;
  try {
    const data = await fetchKeepDataLoginRetentionListApi(query);
    tableData.value = pivotLoginRetention(data.ItemsOld || data.Items || []);
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
    ...LOGIN_DAY_COLUMNS.map((item) => item.label),
  ];
  await exportRowsToXlsx(tableData.value, headers, '登录留存', (row) => [
    row.RegisterDate,
    row.SumReg,
    ...LOGIN_DAY_COLUMNS.map((item) => cellValue(row, item.field)),
  ]);
}

onMounted(() => {
  const built = queryBarRef.value?.buildQuery?.();
  if (built) Object.assign(query, built);
  void loadList();
});
</script>

<template>
  <div>
    <div v-show="!showDetails">
      <KeepQueryBar ref="queryBarRef" @search="handleSearch" />
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <RadioGroup v-model:value="showType" button-style="solid" size="small">
          <RadioButton :value="1">显示人数</RadioButton>
          <RadioButton :value="2">显示百分比</RadioButton>
        </RadioGroup>
        <Button v-if="canExport" type="primary" @click="handleExport">
          导出Excel
        </Button>
      </div>
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1200 }"
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
          <template
            v-else-if="LOGIN_DAY_COLUMNS.some((item) => item.field === column.key)"
          >
            <a
              v-if="showType === 1"
              @click="
                openDetails(
                  record.RegisterDate,
                  LOGIN_DAY_COLUMNS.find((item) => item.field === column.key)
                    ?.day,
                )
              "
            >
              {{ cellValue(record, String(column.key)) }}
            </a>
            <span v-else>{{ cellValue(record, String(column.key)) }}</span>
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

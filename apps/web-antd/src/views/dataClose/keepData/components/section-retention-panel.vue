<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  message,
  Pagination,
  RadioButton,
  RadioGroup,
  Table,
} from 'ant-design-vue';

import { fetchKeepDataSectionRetentionListApi } from '#/api/dataClose/keep-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToXlsx } from '#/views/dataClose/shared/report-utils';

import {
  type KeepDetailsParam,
  type KeepRow,
  num,
  ratioText,
  SECTION_DAY_COLUMNS,
} from '../utils';
import DetailsPanel from './details-panel.vue';
import KeepQueryBar from './keep-query-bar.vue';

defineOptions({ name: 'KeepSectionRetentionPanel' });

const { checkPermission } = useCloudPermission();
const canExport = computed(() => checkPermission(12_165));

const loading = ref(false);
const showDetails = ref(false);
const detailsParam = ref<KeepDetailsParam | null>(null);
const tableData = ref<KeepRow[]>([]);
const showType = ref<1 | 2>(2);
const total = ref(0);
const page = reactive({ current: 1, pageSize: 20 });
const query = reactive<Record<string, unknown>>({});
const queryBarRef = ref<InstanceType<typeof KeepQueryBar>>();

function openDetails(type: number | string) {
  const begin = String(query.BeginTime || '');
  const end = String(query.EndTime || '');
  detailsParam.value = {
    page: 'qujian',
    type,
    date: `${begin}~${end}`,
    ...query,
  };
  showDetails.value = true;
}

function cellValue(row: KeepRow, field: string) {
  const value = num(row[field]);
  if (showType.value === 1) return String(value);
  return ratioText(value, row.CountLogin1);
}

const columns = computed<TableColumnType<KeepRow>[]>(() => [
  {
    align: 'center',
    dataIndex: 'CountLogin1',
    key: 'CountLogin1',
    title: '新增人数',
  },
  ...SECTION_DAY_COLUMNS.map((item) => ({
    align: 'center' as const,
    dataIndex: item.field,
    key: item.field,
    title: item.label,
  })),
]);

async function loadList() {
  loading.value = true;
  try {
    const data = await fetchKeepDataSectionRetentionListApi({
      ...query,
      Page: page.current,
      PageSize: page.pageSize,
    });
    tableData.value = data.Items || [];
    total.value = data.Pagination?.MaxCount || tableData.value.length;
  } catch {
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch(params: Record<string, unknown>) {
  Object.assign(query, params);
  page.current = 1;
  void loadList();
}

async function handleExport() {
  if (tableData.value.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  const headers = [
    '新增人数',
    ...SECTION_DAY_COLUMNS.map((item) => item.label),
  ];
  await exportRowsToXlsx(tableData.value, headers, '区间留存', (row) => [
    row.CountLogin1,
    ...SECTION_DAY_COLUMNS.map((item) => cellValue(row, item.field)),
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
        <Button v-if="canExport" @click="handleExport">
          导出 Excel
        </Button>
      </div>
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1200 }"
        bordered
        row-key="CountLogin1"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'CountLogin1'">
            <a
              v-if="num(record.CountLogin1) > 0"
              @click="openDetails('new')"
            >
              {{ record.CountLogin1 }}
            </a>
            <span v-else>{{ record.CountLogin1 }}</span>
          </template>
          <template
            v-else-if="
              SECTION_DAY_COLUMNS.some((item) => item.field === column.key)
            "
          >
            <a
              v-if="showType === 1"
              @click="
                openDetails(
                  SECTION_DAY_COLUMNS.find((item) => item.field === column.key)
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
      <div v-if="total > 0" class="mt-3 flex justify-end">
        <Pagination
          v-model:current="page.current"
          v-model:page-size="page.pageSize"
          :total="total"
          show-size-changer
          @change="loadList"
        />
      </div>
    </div>
    <DetailsPanel
      v-if="showDetails && detailsParam"
      :param="detailsParam"
      @back="showDetails = false"
    />
  </div>
</template>

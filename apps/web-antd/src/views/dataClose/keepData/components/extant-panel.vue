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

import { fetchKeepDataExtantListApi } from '#/api/dataClose/keep-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToXlsx } from '#/views/dataClose/shared/report-utils';

import {
  EXTANT_DAY_INDEXES,
  type KeepDetailsParam,
  type KeepRow,
  num,
  ratioText,
} from '../utils';
import DetailsPanel from './details-panel.vue';
import KeepQueryBar from './keep-query-bar.vue';

defineOptions({ name: 'KeepExtantPanel' });

const { checkPermission } = useCloudPermission();
const canList = computed(() => checkPermission(10_531));
const canExport = computed(() => checkPermission(10_532));

const loading = ref(false);
const showDetails = ref(false);
const detailsParam = ref<KeepDetailsParam | null>(null);
const tableData = ref<KeepRow[]>([]);
const showType = ref<1 | 2>(2);
const retentionType = ref<'SumBetNum' | 'SumLoginNum'>('SumBetNum');
const query = reactive<Record<string, unknown>>({});
const queryBarRef = ref<InstanceType<typeof KeepQueryBar>>();

function formatDayLabel(day: number) {
  return `${day}日留存`;
}

function formatCell(row: KeepRow, index: number) {
  const arr = (row[retentionType.value] as number[]) || [];
  const value = num(arr[index]);
  if (showType.value === 1) return String(value);
  return ratioText(value, row.SumFirstPayNum);
}

function openDetails(date: unknown, type: number | string) {
  detailsParam.value = {
    page: 'retention',
    type,
    date: String(date || ''),
    reportType: retentionType.value === 'SumBetNum' ? 1 : 0,
    ...query,
  };
  showDetails.value = true;
}

const columns = computed<TableColumnType<KeepRow>[]>(() => [
  {
    align: 'center',
    dataIndex: 'RegisterDate',
    key: 'RegisterDate',
    title: '日期',
  },
  { align: 'center', dataIndex: 'SumReg', key: 'SumReg', title: '注册人数' },
  {
    align: 'center',
    dataIndex: 'SumFirstPayNum',
    key: 'SumFirstPayNum',
    title: '首存人数',
  },
  ...EXTANT_DAY_INDEXES.map((day, index) => ({
    align: 'center' as const,
    dataIndex: `day-${day}`,
    key: `day-${day}`,
    title: formatDayLabel(day),
    customRender: undefined,
    __day: day,
    __index: index,
  })),
  {
    align: 'center',
    dataIndex: 'ItemsOnceUser',
    key: 'ItemsOnceUser',
    title: '一次性用户',
  },
]);

async function loadList() {
  if (!canList.value) {
    tableData.value = [];
    return;
  }
  loading.value = true;
  try {
    const data = await fetchKeepDataExtantListApi(query);
    tableData.value = data.Items || [];
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
    '注册人数',
    '首存人数',
    ...EXTANT_DAY_INDEXES.map((d) => formatDayLabel(d)),
    '一次性用户',
  ];
  await exportRowsToXlsx(tableData.value, headers, '留存', (row) => [
    row.RegisterDate,
    row.SumReg,
    row.SumFirstPayNum,
    ...EXTANT_DAY_INDEXES.map((_, index) => formatCell(row, index)),
    showType.value === 1
      ? num(row.ItemsOnceUser)
      : ratioText(row.ItemsOnceUser, row.SumFirstPayNum),
  ]);
}

function init() {
  const built = queryBarRef.value?.buildQuery?.();
  if (built) Object.assign(query, built);
  void loadList();
}

onMounted(() => {
  init();
});

defineExpose({ init });
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
        <div class="flex items-center gap-2">
          <RadioGroup
            v-model:value="retentionType"
            button-style="solid"
            size="small"
          >
            <RadioButton value="SumLoginNum">登录留存</RadioButton>
            <RadioButton value="SumBetNum">投注留存</RadioButton>
          </RadioGroup>
          <Button v-if="canExport" @click="handleExport">
            导出 Excel
          </Button>
        </div>
      </div>
      <Table
        v-if="canList"
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1400 }"
        bordered
        row-key="RegisterDate"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'SumReg'">
            <a
              v-if="num(record.SumReg) > 0"
              @click="openDetails(record.RegisterDate, 'reg')"
            >
              {{ record.SumReg }}
            </a>
            <span v-else>{{ record.SumReg }}</span>
          </template>
          <template v-else-if="column.key === 'SumFirstPayNum'">
            <a
              v-if="num(record.SumFirstPayNum) > 0"
              @click="openDetails(record.RegisterDate, 'pay')"
            >
              {{ record.SumFirstPayNum }}
            </a>
            <span v-else>{{ record.SumFirstPayNum }}</span>
          </template>
          <template v-else-if="String(column.key).startsWith('day-')">
            <a
              v-if="showType === 1"
              @click="
                openDetails(
                  record.RegisterDate,
                  Number(String(column.key).replace('day-', '')) === 1
                    ? 2
                    : Number(String(column.key).replace('day-', '')),
                )
              "
            >
              {{
                formatCell(
                  record,
                  EXTANT_DAY_INDEXES.indexOf(
                    Number(String(column.key).replace('day-', '')),
                  ),
                )
              }}
            </a>
            <span v-else>
              {{
                formatCell(
                  record,
                  EXTANT_DAY_INDEXES.indexOf(
                    Number(String(column.key).replace('day-', '')),
                  ),
                )
              }}
            </span>
          </template>
          <template v-else-if="column.key === 'ItemsOnceUser'">
            <a
              v-if="showType === 1"
              @click="openDetails(record.RegisterDate, 'once')"
            >
              {{ num(record.ItemsOnceUser) }}
            </a>
            <span v-else>
              {{ ratioText(record.ItemsOnceUser, record.SumFirstPayNum) }}
            </span>
          </template>
        </template>
      </Table>
      <div v-else class="py-8 text-center text-gray-400">无列表查看权限</div>
    </div>
    <DetailsPanel
      v-if="showDetails && detailsParam"
      :param="detailsParam"
      @back="showDetails = false"
    />
  </div>
</template>

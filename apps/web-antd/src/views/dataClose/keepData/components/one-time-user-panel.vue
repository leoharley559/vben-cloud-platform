<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';

import { onMounted, reactive, ref } from 'vue';

import { Button, message, Table } from 'ant-design-vue';

import { fetchKeepDataOneTimeUserListApi } from '#/api/dataClose/keep-data';
import { exportRowsToXlsx } from '#/views/dataClose/shared/report-utils';

import {
  type KeepDetailsParam,
  type KeepRow,
  num,
  ONE_TIME_FIELDS,
} from '../utils';
import DetailsPanel from './details-panel.vue';
import KeepQueryBar from './keep-query-bar.vue';

defineOptions({ name: 'KeepOneTimeUserPanel' });

const loading = ref(false);
const showDetails = ref(false);
const detailsParam = ref<KeepDetailsParam | null>(null);
const tableData = ref<KeepRow[]>([]);
const query = reactive<Record<string, unknown>>({});
const queryBarRef = ref<InstanceType<typeof KeepQueryBar>>();

function formatLabel(index: number) {
  return index === 7 ? '7次或以上用户' : `${index + 1}次用户`;
}

function openDetails(date: unknown, type: string, days?: number) {
  detailsParam.value = {
    page: 'oneTime',
    type,
    date: String(date || ''),
    days,
    ...query,
  };
  showDetails.value = true;
}

const columns: TableColumnType<KeepRow>[] = [
  {
    align: 'center',
    dataIndex: 'RegisteredDate',
    key: 'RegisteredDate',
    title: '日期',
  },
  {
    align: 'center',
    dataIndex: 'TotalRegisteredPlayers',
    key: 'TotalRegisteredPlayers',
    title: '注册人数',
  },
  ...ONE_TIME_FIELDS.map((field, index) => ({
    align: 'center' as const,
    dataIndex: field,
    key: field,
    title: formatLabel(index),
  })),
];

async function loadList() {
  loading.value = true;
  try {
    const data = await fetchKeepDataOneTimeUserListApi(query);
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
    ...ONE_TIME_FIELDS.map((_, index) => formatLabel(index)),
  ];
  await exportRowsToXlsx(tableData.value, headers, '一次性用户', (row) => [
    row.RegisteredDate,
    row.TotalRegisteredPlayers,
    ...ONE_TIME_FIELDS.map((field) => row[field] ?? 0),
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
      <div class="mb-3 flex justify-end">
        <Button @click="handleExport">导出 Excel</Button>
      </div>
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 1200 }"
        bordered
        row-key="RegisteredDate"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'TotalRegisteredPlayers'">
            <a
              v-if="num(record.TotalRegisteredPlayers) > 0"
              @click="openDetails(record.RegisteredDate, 'reg')"
            >
              {{ record.TotalRegisteredPlayers }}
            </a>
            <span v-else>{{ record.TotalRegisteredPlayers }}</span>
          </template>
          <template
            v-else-if="ONE_TIME_FIELDS.includes(column.key as any)"
          >
            <a
              v-if="num(record[column.key as string]) > 0"
              @click="
                openDetails(
                  record.RegisteredDate,
                  'oneTime',
                  ONE_TIME_FIELDS.indexOf(column.key as any) + 1,
                )
              "
            >
              {{ record[column.key as string] }}
            </a>
            <span v-else>{{ record[column.key as string] ?? 0 }}</span>
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

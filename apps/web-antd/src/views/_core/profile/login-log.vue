<script lang="ts" setup>
import type { AccountLoginLogItem } from '#/api/core/account-login';

import { onMounted, ref } from 'vue';

import { message, Pagination, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchAccountLoginLogListApi } from '#/api/core/account-login';

const loading = ref(false);
const tableData = ref<AccountLoginLogItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const columns = [
  {
    customRender: ({ index }: { index: number }) =>
      (page.value - 1) * pageSize.value + index + 1,
    key: 'index',
    title: '#',
    width: 60,
  },
  {
    dataIndex: 'CreateTime',
    key: 'CreateTime',
    title: '登录时间',
  },
  {
    dataIndex: 'Ip',
    key: 'Ip',
    title: '登录 IP',
  },
  {
    dataIndex: 'Address',
    key: 'Address',
    title: '登录地址',
  },
];

function formatDateTime(value?: number | string) {
  if (value === undefined || value === null || value === '') return '-';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return dayjs(String(value).length > 10 ? numeric : numeric * 1000).format(
    'YYYY-MM-DD HH:mm:ss',
  );
}

async function loadData(nextPage = page.value, nextSize = pageSize.value) {
  loading.value = true;
  try {
    const result = await fetchAccountLoginLogListApi({
      Page: nextPage,
      PageSize: nextSize,
    });
    const items = result?.Item || result?.Items || [];
    tableData.value = items.map((item, index) => ({
      ...item,
      CreateTime: formatDateTime(item.CreateTime),
      _rowKey: `${item.Ip || ''}-${item.CreateTime || ''}-${index}`,
    }));
    total.value = Number(result?.Pagination?.MaxCount || items.length || 0);
    page.value = nextPage;
    pageSize.value = nextSize;
  } catch {
    message.error('加载登录记录失败');
  } finally {
    loading.value = false;
  }
}

function handlePageChange(nextPage: number, nextSize: number) {
  void loadData(nextPage, nextSize);
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div>
    <Table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="_rowKey"
      size="middle"
    />
    <div class="mt-4 flex justify-end">
      <Pagination
        :current="page"
        :page-size="pageSize"
        :total="total"
        show-size-changer
        @change="handlePageChange"
        @show-size-change="handlePageChange"
      />
    </div>
  </div>
</template>

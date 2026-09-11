<script lang="ts" setup>
import type { AccountLoginLogItem } from '#/api/core/account-login';

import { onMounted, ref } from 'vue';

import { message, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchAccountLoginLogListApi } from '#/api/core/account-login';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

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
    width: 180,
  },
  {
    dataIndex: 'Ip',
    key: 'Ip',
    title: '登录 IP',
    width: 160,
  },
  {
    dataIndex: 'Address',
    ellipsis: true,
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

function handleTableChange(
  pagination: { current?: number; pageSize?: number },
) {
  void loadData(pagination.current || 1, pagination.pageSize || pageSize.value);
}

onMounted(() => {
  void loadData();
});
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <Table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        pageSizeOptions: TABLE_ANT_PAGE_SIZE_OPTIONS,
        showQuickJumper: true,
        showSizeChanger: true,
        showTotal: (count: number) => `共 ${count} 条`,
        total,
      }"
      :scroll="{ x: 'max-content', y: 420 }"
      bordered
      row-key="_rowKey"
      size="small"
      @change="handleTableChange"
    />
  </div>
</template>

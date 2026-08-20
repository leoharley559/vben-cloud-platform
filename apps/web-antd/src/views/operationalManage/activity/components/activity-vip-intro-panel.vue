<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { Spin } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchVipActivityListApi } from '#/api/operationManage/exclusive-activity';

defineOptions({ name: 'ActivityVipIntroPanel' });

const loading = ref(false);

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'ThirdId', minWidth: 100, title: '特权ID' },
    {
      // Title 常为空，回退 Name（与旧站列表展示一致）
      field: 'Name',
      formatter: ({ row }) => String(row.Title || row.Name || '-'),
      minWidth: 180,
      title: 'VIP标题',
    },
    { field: 'Desc', minWidth: 240, title: '特权简介' },
    {
      field: 'DescEnabled',
      // 旧站：DescEnabled===2 为展示
      formatter: ({ cellValue }) => (Number(cellValue) === 2 ? '展示' : '隐藏'),
      minWidth: 90,
      title: '描述展示',
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  data: [],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadList() {
  loading.value = true;
  try {
    const result = await fetchVipActivityListApi();
    const items = result.Items || [];
    gridApi.grid?.loadData(items);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <Spin :spinning="loading">
    <div class="mb-3 text-xs text-gray-400">
      VIP 活动介绍接口返回数组；多语言编辑待后续迭代。
    </div>
    <Grid />
  </Spin>
</template>

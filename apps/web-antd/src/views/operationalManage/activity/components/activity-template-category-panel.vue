<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { Spin } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchActivityTypeListApi } from '#/api/operationManage/activity';
import { normalizeCloudList } from '#/utils/activity-manage';

defineOptions({ name: 'ActivityTemplateCategoryPanel' });

const loading = ref(false);

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Id', minWidth: 80, title: '类别ID' },
    { field: 'Type', minWidth: 100, title: '类型编码' },
    { field: 'Name', minWidth: 160, title: '类别名称' },
    { field: 'Title', minWidth: 160, title: '展示标题' },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  data: [],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadList() {
  loading.value = true;
  try {
    const data = await fetchActivityTypeListApi({});
    const items = normalizeCloudList<Record<string, unknown>>(data).Items || [];
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
      活动类别多语言编辑尚未迁移，当前为只读列表。
    </div>
    <Grid />
  </Spin>
</template>

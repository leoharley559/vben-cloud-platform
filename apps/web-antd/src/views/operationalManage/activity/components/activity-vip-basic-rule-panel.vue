<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { Spin } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchVipBasicRuleListApi } from '#/api/operationManage/exclusive-activity';

defineOptions({ name: 'ActivityVipBasicRulePanel' });

const loading = ref(false);

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Id', minWidth: 80, title: 'ID' },
    { field: 'Title', minWidth: 180, title: '活动名称' },
    { field: 'Desc', minWidth: 240, title: '规则说明' },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  data: [],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function loadList() {
  loading.value = true;
  try {
    const result = await fetchVipBasicRuleListApi();
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
      VIP 基础规则只读列表；图片与多语言编辑待后续迭代。
    </div>
    <Grid />
  </Spin>
</template>

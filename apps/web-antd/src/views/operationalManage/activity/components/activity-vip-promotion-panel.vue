<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { Spin } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import VipLevelTag from '#/components/global/vip-level-tag.vue';
import { vipLevelGridColumn } from '#/utils/vip-level';
import { fetchVipGiftListApi } from '#/api/operationManage/exclusive-activity';

defineOptions({ name: 'ActivityVipPromotionPanel' });

const loading = ref(false);

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { ...vipLevelGridColumn },
    { field: 'Title', minWidth: 160, title: '标题' },
    {
      field: 'BackgroundImgPath',
      minWidth: 180,
      title: '背景图',
    },
    {
      field: 'UpgradePrize',
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        try {
          const list =
            typeof cellValue === 'string' ? JSON.parse(cellValue) : cellValue;
          return Array.isArray(list)
            ? list
                .map((item: { Title?: string }) => item.Title || '-')
                .join('、')
            : '-';
        } catch {
          return String(cellValue);
        }
      },
      minWidth: 200,
      title: '奖品名称',
    },
    {
      field: 'UpgradePrizeEnabled',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '开启' : '关闭'),
      minWidth: 90,
      title: '状态',
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
    const result = await fetchVipGiftListApi();
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
      晋级好礼列表来自 listprize；图片/多语言编辑待后续迭代。
    </div>
    <Grid>
      <template #vipLevel="{ row }">
        <VipLevelTag :level="row.VipLevel" />
      </template>
    </Grid>
  </Spin>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DropChangeItem } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Button, message, Result } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchDropChangeListApi } from '#/api/promotion/promote-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { exportRowsToCsv } from '#/utils/export-csv';

import PromoteDataSearch from './promote-data-search.vue';

defineOptions({ name: 'DropChangeList' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_887));

const searchRef = ref<InstanceType<typeof PromoteDataSearch>>();
const exportLoading = ref(false);

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  const base = searchRef.value?.buildPayload() || {
    AdminIds: '',
    BeginTime: '',
    ChannelIds: [],
    EndTime: '',
    TemplateId: '',
  };
  return {
    ...base,
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<DropChangeItem> = {
  columns: [
    { field: 'channel_id', minWidth: 120, title: '渠道号' },
    { field: 'download_count', minWidth: 100, title: '点击' },
    { field: 'page_view', minWidth: 100, title: 'UV' },
    { field: 'unique_page_view', minWidth: 100, title: 'IP' },
    { field: 'app_login_count', minWidth: 100, title: '激活' },
    { field: 'device_count', minWidth: 100, title: '新增设备' },
    { field: 'player_count', minWidth: 100, title: '新增用户' },
    { field: 'pay_count', minWidth: 100, title: '付费用户' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchDropChangeListApi(getQueryParams(page));
        const items = result.Item || [];
        return {
          items,
          total: Number(result.Page?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchDropChangeListApi({
      ...getQueryParams({ currentPage: 1, pageSize: 5000 }),
    });
    const rows = result.Item || [];
    exportRowsToCsv(
      rows,
      [
        { header: '渠道号', value: (row) => row.channel_id ?? '' },
        { header: '点击', value: (row) => row.download_count ?? 0 },
        { header: 'UV', value: (row) => row.page_view ?? 0 },
        { header: 'IP', value: (row) => row.unique_page_view ?? 0 },
        { header: '激活', value: (row) => row.app_login_count ?? 0 },
        { header: '新增设备', value: (row) => row.device_count ?? 0 },
        { header: '新增用户', value: (row) => row.player_count ?? 0 },
        { header: '付费用户', value: (row) => row.pay_count ?? 0 },
      ],
      `落地页转化_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
    message.success('导出成功');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canViewPage.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewPage">
    <PromoteDataSearch ref="searchRef" @search="gridApi.reload()">
      <Button :loading="exportLoading" @click="handleExport">导出 Excel</Button>
    </PromoteDataSearch>
    <Grid />
  </div>
  <Result v-else status="403" sub-title="无落地页转化查看权限" title="403" />
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerLoginStatItem } from '#/types/player-detail';

import { onMounted, watch } from 'vue';

import { Card } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchPlayerLoginInfoListApi } from '#/api/operationManage/player';

defineOptions({ name: 'PlayerLoginStatistics' });

const props = defineProps<{
  playerId: number | string;
}>();

function createGridOptions(
  lType: '1' | '2',
  columns: VxeTableGridOptions<PlayerLoginStatItem>['columns'],
): VxeTableGridOptions<PlayerLoginStatItem> {
  return {
    columns,
    height: 'auto',
    pagerConfig: {
      pageSize: 20,
    },
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page, sort }) => {
          const sortField = sort?.field;
          const sortOrder = sort?.order;
          let sortParam = '';
          if (sortField && sortOrder) {
            sortParam =
              sortOrder === 'asc' ? `-${sortField}` : String(sortField);
          }

          const result = await fetchPlayerLoginInfoListApi({
            DataSearchType: 2,
            LType: lType,
            Page: page.currentPage,
            PageSize: page.pageSize,
            PlayerId: String(props.playerId),
            Sort: sortParam,
          });

          return {
            items: result?.Items || [],
            total: result?.Pagination?.MaxCount || 0,
          };
        },
      },
    },
  };
}

const deviceGridOptions = createGridOptions('2', [
  {
    field: 'DeviceId',
    minWidth: 180,
    showOverflow: 'tooltip',
    title: '设备号',
  },
  {
    field: 'DeviceTotal',
    minWidth: 100,
    sortable: true,
    title: '次数',
  },
]);

const ipGridOptions = createGridOptions('1', [
  {
    field: 'Ip',
    formatter: ({ row }) => {
      const ip = row.Ip || '-';
      const name = row.IpName ? ` ${row.IpName}` : '';
      return `${ip}${name}`;
    },
    minWidth: 180,
    title: '登录 IP',
  },
  {
    field: 'Total',
    minWidth: 100,
    sortable: true,
    title: '次数',
  },
]);

const [DeviceGrid, deviceGridApi] = useVbenVxeGrid({
  gridOptions: deviceGridOptions,
});
const [IpGrid, ipGridApi] = useVbenVxeGrid({ gridOptions: ipGridOptions });

function reloadAll() {
  if (!props.playerId) {
    return;
  }
  deviceGridApi.reload();
  ipGridApi.reload();
}

watch(
  () => props.playerId,
  () => {
    reloadAll();
  },
);

onMounted(() => {
  reloadAll();
});
</script>

<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <Card size="small" title="登录设备">
      <DeviceGrid />
    </Card>
    <Card size="small" title="登录 IP">
      <IpGrid />
    </Card>
  </div>
</template>

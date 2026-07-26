<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, Input, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchPlayerAgentTeamApi } from '#/api/operationManage/activity';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useOperationOptions } from '#/composables/use-operation-options';

defineOptions({ name: 'ActivityPlayerAgentTeamPanel' });

const { packageOptions } = useOperationOptions();

const filterLoginAccount = ref('');
const filterMainCode = ref('');
const filterPackageId = ref<number | string>();

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    LoginAccount: filterLoginAccount.value || '',
    MainCode: filterMainCode.value || '',
    PackageId: filterPackageId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'LoginAccount', minWidth: 120, slots: { default: 'loginAccount' }, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '产品包' },
    { field: 'MainCode', minWidth: 120, title: '代理线编号' },
    { field: 'Code', minWidth: 100, title: '代理编号' },
    { field: 'PlayerLevel', minWidth: 90, title: '代理层级' },
    { field: 'TeamCount', minWidth: 90, title: '团队人数' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerAgentTeamApi(buildQuery(page));
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 160px"
      />
      <Input
        v-model:value="filterMainCode"
        allow-clear
        placeholder="代理线编号"
        style="width: 160px"
      />
      <Select
        v-model:value="filterPackageId"
        allow-clear
        class="w-40"
        :options="packageOptions"
        placeholder="产品包"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>
    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
    </Grid>
  </div>
</template>

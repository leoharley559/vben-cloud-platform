<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Select } from 'ant-design-vue';

import {
  fetchProxyGroupListApi,
  fetchProxyGroupingListApi,
} from '#/api/netcash/proxy-grouping';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatNetcashDateTime } from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'ProxyGrouping' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10139));

interface GroupOption {
  label: string;
  value: number | string;
}

const groupOptions = ref<GroupOption[]>([]);
const selectedGroupId = ref<number | string>(0);
const gridExtraQuery = ref<Record<string, unknown>>({ Group: 0 });

const gridConfig = computed<NetcashGridConfig>(() => ({
  columns: [
    { field: 'grouping', title: '分组名称' },
    { field: 'Username', title: '代理账号' },
    { field: 'Name', title: '代理名称' },
    { field: 'DeveloperName', title: '发展人' },
    {
      field: 'GroupCreateTime',
      formatter: (value) => formatNetcashDateTime(value as string),
      title: '入组时间',
    },
  ],
  extraQuery: gridExtraQuery.value,
  fetchApi: (query) => fetchProxyGroupingListApi(query as never),
  filters: ['username', 'date'],
}));

async function loadGroups() {
  const result = await fetchProxyGroupListApi({ Page: 1, PageSize: 9999 });
  const items = (result.Items || []) as Array<Record<string, unknown>>;
  groupOptions.value = [
    { label: '全部分组', value: 0 },
    ...items.map((item) => ({
      label: String(item.GroupName || item.Name || item.Id || '-'),
      value: (item.Id as number | string) ?? 0,
    })),
  ];
}

watch(selectedGroupId, (groupId) => {
  gridExtraQuery.value = { Group: groupId };
});

onMounted(async () => {
  if (canViewPage.value) {
    await loadGroups();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 代理分组"
    title="代理分组"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <span class="text-sm text-gray-600">选择分组：</span>
        <Select
          v-model:value="selectedGroupId"
          :options="groupOptions"
          style="width: 240px"
        />
        <span class="text-xs text-gray-400">
          树形拖拽、转移成员等待下一迭代迁移
        </span>
      </div>
      <NetcashGridPanel :config="gridConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无代理分组查看权限" title="403" />
</template>

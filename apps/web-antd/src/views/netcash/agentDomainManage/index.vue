<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result } from 'ant-design-vue';

import { fetchAgentDomainListApi } from '#/api/netcash/agent-domain';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'AgentDomainManage' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10550));

const gridConfig: NetcashGridConfig = {
  columns: [
    { field: 'Username', title: '代理账号' },
    { field: 'ChannelId', title: '渠道ID' },
    { field: 'NetCashDomain', title: '专属APP域名' },
    { field: 'NetCashH5Domain', title: '专属H5域名' },
    {
      field: 'Type',
      formatter: (value) =>
        Number(value) === 1
          ? '普通'
          : Number(value) === 2
            ? '正式'
            : String(value ?? '-'),
      title: '代理类型',
    },
  ],
  fetchApi: (query) => fetchAgentDomainListApi(query as never),
  filters: ['username', 'status'],
  statusOptions: [
    { label: '普通', value: 1 },
    { label: '正式', value: 2 },
  ],
};

onMounted(() => {});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 渠道域名管理"
    title="渠道域名管理"
  >
    <Card>
      <NetcashGridPanel :config="gridConfig" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无渠道域名管理查看权限" title="403" />
</template>

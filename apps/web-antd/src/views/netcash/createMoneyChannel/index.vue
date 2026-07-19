<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchCloneChannelPlanListApi,
  fetchMoneyChannelListApi,
} from '#/api/netcash/create-money-channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatNetcashDateTime } from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'CreateMoneyChannel' });

const { checkPermission } = useCloudPermission();

const channelExtraQuery = ref<Record<string, unknown>>({ DataSearchType: 0 });
const testChannelExtraQuery = ref<Record<string, unknown>>({
  DataSearchType: 1,
});

const tabs = computed(() =>
  [
    {
      config: {
        columns: [
          { field: 'ChannelId', title: '渠道号' },
          { field: 'ChannelName', title: '渠道名称' },
          { field: 'AdminId', title: '代理账号' },
          { field: 'AdminName', title: '代理名称' },
          { field: 'InvitationCode', title: '邀请码' },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '创建时间',
          },
        ],
        extraQuery: channelExtraQuery.value,
        fetchApi: (query: Record<string, unknown>) =>
          fetchMoneyChannelListApi(query as never),
        filters: ['username'],
      } satisfies NetcashGridConfig,
      key: 'channel',
      permission: 12330,
      tab: '渠道管理',
    },
    {
      config: {
        columns: [
          { field: 'ChannelId', title: '渠道号' },
          { field: 'ChannelName', title: '渠道名称' },
          { field: 'AdminId', title: '代理账号' },
          { field: 'AdminName', title: '代理名称' },
          { field: 'InvitationCode', title: '邀请码' },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '创建时间',
          },
        ],
        extraQuery: testChannelExtraQuery.value,
        fetchApi: (query: Record<string, unknown>) =>
          fetchMoneyChannelListApi(query as never),
        filters: ['username'],
      } satisfies NetcashGridConfig,
      key: 'testChannel',
      permission: 12491,
      tab: '测试渠道管理',
    },
    {
      config: {
        columns: [
          { field: 'PackageName', title: '产品包' },
          { field: 'SourceChannelId', title: '源渠道号' },
          { field: 'TargetChannelId', title: '目标渠道号' },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '创建时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchCloneChannelPlanListApi(query as never),
        filters: ['package'],
      } satisfies NetcashGridConfig,
      key: 'clone',
      permission: 12912,
      tab: '克隆渠道设置',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('channel');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'channel';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 代理渠道"
    title="代理渠道"
  >
    <Card>
      <div class="mb-4 text-xs text-gray-400">
        渠道创建/编辑等复杂弹窗待下一迭代迁移，当前支持列表查询。
      </div>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <NetcashGridPanel
            v-if="activeTab === item.key"
            :config="item.config"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无代理渠道查看权限" title="403" />
</template>

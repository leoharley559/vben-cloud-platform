<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchExtensionMaterialListApi,
  fetchPromotionConfListApi,
} from '#/api/netcash/extension-material';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatNetcashDateTime } from '#/utils/netcash';

import NetcashGridPanel from '../components/netcash-grid-panel.vue';
import type { NetcashGridConfig } from '../components/netcash-grid-panel.vue';

defineOptions({ name: 'ExtensionMaterial' });

const { checkPermission } = useCloudPermission();

const tabs = computed(() =>
  [
    {
      config: {
        columns: [
          { field: 'PackageName', title: '产品包' },
          { field: 'ThemeName', title: '主题' },
          { field: 'SizeName', title: '尺寸' },
          { field: 'LanguageName', title: '语言' },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '创建时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchExtensionMaterialListApi(query as never),
        filters: ['package'],
      } satisfies NetcashGridConfig,
      key: 'material',
      permission: 10564,
      tab: '素材列表',
    },
    {
      config: {
        columns: [
          { field: 'Value', title: '名称' },
          {
            field: 'Type',
            formatter: (value) =>
              Number(value) === 1
                ? '主题'
                : Number(value) === 2
                  ? '尺寸'
                  : String(value ?? '-'),
            title: '类型',
          },
          {
            field: 'CreateTime',
            formatter: (value) => formatNetcashDateTime(value as string),
            title: '创建时间',
          },
        ],
        fetchApi: (query: Record<string, unknown>) =>
          fetchPromotionConfListApi(query as never),
        filters: [],
      } satisfies NetcashGridConfig,
      key: 'theme',
      permission: 10565,
      tab: '主题和尺寸',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);
const activeTab = ref('material');

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'material';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 推广素材"
    title="推广素材"
  >
    <Card>
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
  <Result v-else status="403" sub-title="无推广素材查看权限" title="403" />
</template>

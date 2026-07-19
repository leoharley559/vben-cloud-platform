<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Empty, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import PhoneBlockPanel from './components/phone-block-panel.vue';

defineOptions({ name: 'SystemSetting' });

const { checkPermission } = useCloudPermission();
const activeTab = ref('block');

const tabs = computed(() =>
  [
    {
      key: 'block',
      permission: 12240,
      tab: '区号屏蔽',
    },
    {
      key: 'other',
      permission: 12241,
      placeholder: true,
      tab: '其它设置',
    },
  ].filter((item) => checkPermission(item.permission)),
);

const canViewPage = computed(() => tabs.value.length > 0);

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'block';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="游戏管理 · 系统设置"
    title="系统设置"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line" size="small">
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <template v-if="item.placeholder">
            <div class="mb-4 text-xs text-gray-400">
              其它系统配置等待下一迭代迁移。
            </div>
            <Empty description="其它设置待迁移" />
          </template>
          <PhoneBlockPanel
            v-else-if="item.key === 'block' && activeTab === 'block'"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无系统设置查看权限" title="403" />
</template>

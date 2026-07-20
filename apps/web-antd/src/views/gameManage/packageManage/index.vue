<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import EnterprisePackagePanel from './components/enterprise-package-panel.vue';
import ShelfPackagePanel from './components/shelf-package-panel.vue';

defineOptions({ name: 'PackageManage' });

const { checkPermission } = useCloudPermission();

const canViewPage = computed(
  () =>
    checkPermission(12_355) ||
    checkPermission(13_189) ||
    checkPermission(13_190),
);
const tabs = computed(() =>
  [
    {
      key: 'enterprise',
      permission: checkPermission(12_355),
      title: '企业包',
    },
    {
      key: 'ios',
      permission: checkPermission(13_189),
      title: 'iOS 上架包',
    },
    {
      key: 'android',
      permission: checkPermission(13_190),
      title: 'Android 上架包',
    },
  ].filter((item) => item.permission),
);
const activeTab = ref('');

watchEffect(() => {
  if (!tabs.value.some((item) => item.key === activeTab.value)) {
    activeTab.value = tabs.value[0]?.key || '';
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="维护企业签名包及 iOS、Android 上架包配置"
    title="包体管理"
  >
    <Card class="package-manage-card" :bordered="false">
      <Tabs v-model:active-key="activeTab" size="large">
        <Tabs.TabPane
          v-for="item in tabs"
          :key="item.key"
          :tab="item.title"
        >
          <EnterprisePackagePanel v-if="item.key === 'enterprise'" />
          <ShelfPackagePanel
            v-else-if="item.key === 'ios'"
            platform="ios"
          />
          <ShelfPackagePanel v-else platform="android" />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无包体管理查看权限" title="403" />
</template>

<style scoped>
.package-manage-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgb(15 23 42 / 6%);
}
</style>

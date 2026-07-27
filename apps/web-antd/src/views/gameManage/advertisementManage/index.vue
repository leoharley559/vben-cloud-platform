<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, Empty, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import AdvertisementProgrammePanel from './components/advertisement-programme-panel.vue';
import OtherAdvertisementPanel from './components/other-advertisement-panel.vue';

defineOptions({ name: 'AdvertisementManage' });

const route = useRoute();
const { checkPermission } = useCloudPermission();
const activeTab = ref('');
const tabs = computed(() =>
  [
    {
      component: AdvertisementProgrammePanel,
      key: 'first',
      label: '首页轮播广告',
      permission: 11_027,
      type: 1,
    },
    {
      component: AdvertisementProgrammePanel,
      key: 'fourth',
      label: '首页弹窗',
      permission: 11_029,
      type: 3,
    },
    {
      component: AdvertisementProgrammePanel,
      key: 'sixth',
      label: '支付广告',
      permission: 12_058,
      type: 6,
    },
    {
      component: OtherAdvertisementPanel,
      key: 'fifth',
      label: '其他广告',
      permission: 11_030,
      type: 4,
    },
  ].filter((item) => checkPermission(item.permission)),
);

watch(
  [() => route.query.type, tabs],
  () => {
    const requested = String(route.query.type || '');
    activeTab.value = tabs.value.some((item) => item.key === requested)
      ? requested
      : tabs.value[0]?.key || '';
  },
  { immediate: true },
);
</script>

<template>
  <Page auto-content-height title="广告管理">
    <Card :bordered="false" class="advertisement-card">
      <Empty
        v-if="tabs.length === 0"
        description="当前账号没有广告管理查看权限"
      />
      <Tabs
        v-else
        v-model:active-key="activeTab"
        destroy-inactive-tab-pane
        type="line"
        size="small"
      >
        <Tabs.TabPane
          v-for="item in tabs"
          :key="item.key"
          :tab="item.label"
        >
          <AdvertisementProgrammePanel
            v-if="item.type !== 4 && activeTab === item.key"
            :ad-type="item.type"
          />
          <OtherAdvertisementPanel
            v-else-if="item.type === 4 && activeTab === item.key"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>

<style scoped>
.advertisement-card {
  min-height: 500px;
  border-radius: 12px;
}

.advertisement-card :deep(.ant-tabs-nav) {
  margin-bottom: 18px;
}
</style>

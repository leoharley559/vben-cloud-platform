<script lang="ts" setup>
import { ref } from 'vue';

import { Alert, Radio } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import ActivityTemplateCategoryPanel from './activity-template-category-panel.vue';
import ActivityTemplateOwnPanel from './activity-template-own-panel.vue';
import ActivityTemplateSystemPanel from './activity-template-system-panel.vue';

defineOptions({ name: 'ActivityTemplatePanel' });

const { checkPermission } = useCloudPermission();
const activeSubTab = ref<'category' | 'own' | 'system'>('system');

if (!checkPermission(10308)) {
  activeSubTab.value = 'system';
}
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="system">系统模板</Radio.Button>
        <Radio.Button value="own">我的模板</Radio.Button>
        <Radio.Button value="category">活动类别</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityTemplateSystemPanel v-if="activeSubTab === 'system'" />
    <ActivityTemplateOwnPanel v-else-if="activeSubTab === 'own'" />
    <ActivityTemplateCategoryPanel v-else />

    <Alert
      class="mt-4"
      show-icon
      type="info"
      message="从模板创建活动的完整向导（activityDialog）尚未迁移，列表仅供查看与后续接入。"
    />
  </div>
</template>

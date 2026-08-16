<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import ActivityInviteConfigPanel from './activity-invite-config-panel.vue';
import ActivityInviteRelationsPanel from './activity-invite-relations-panel.vue';
import ActivityInviteRewardsPanel from './activity-invite-rewards-panel.vue';

defineOptions({ name: 'ActivityInvitePanel' });

const activeSubTab = ref<'config' | 'relations' | 'rewards'>('config');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="config">活动配置</Radio.Button>
        <Radio.Button value="relations">邀请关系</Radio.Button>
        <Radio.Button value="rewards">发放记录</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityInviteConfigPanel v-if="activeSubTab === 'config'" />
    <ActivityInviteRelationsPanel v-else-if="activeSubTab === 'relations'" />
    <ActivityInviteRewardsPanel v-else />
  </div>
</template>

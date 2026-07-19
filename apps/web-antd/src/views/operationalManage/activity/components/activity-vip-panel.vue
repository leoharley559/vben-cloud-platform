<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import ActivityVipBasicRulePanel from './activity-vip-basic-rule-panel.vue';
import ActivityVipIntroPanel from './activity-vip-intro-panel.vue';
import ActivityVipPromotionPanel from './activity-vip-promotion-panel.vue';

defineOptions({ name: 'ActivityVipPanel' });

const activeSubTab = ref<'basic' | 'intro' | 'promotion'>('promotion');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="promotion">晋级好礼</Radio.Button>
        <Radio.Button value="intro">VIP活动介绍</Radio.Button>
        <Radio.Button value="basic">基础规则</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityVipPromotionPanel v-if="activeSubTab === 'promotion'" />
    <ActivityVipIntroPanel v-else-if="activeSubTab === 'intro'" />
    <ActivityVipBasicRulePanel v-else />
  </div>
</template>

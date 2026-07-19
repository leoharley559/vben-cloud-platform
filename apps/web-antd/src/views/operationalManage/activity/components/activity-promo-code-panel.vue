<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import ActivityPromoCodeActivePanel from './activity-promo-code-active-panel.vue';
import ActivityPromoCodeRecordPanel from './activity-promo-code-record-panel.vue';

defineOptions({ name: 'ActivityPromoCodePanel' });

const activeSubTab = ref<'active' | 'redeem'>('active');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="active">优惠码列表</Radio.Button>
        <Radio.Button value="redeem">兑换记录</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityPromoCodeActivePanel v-if="activeSubTab === 'active'" />
    <ActivityPromoCodeRecordPanel v-else />
  </div>
</template>

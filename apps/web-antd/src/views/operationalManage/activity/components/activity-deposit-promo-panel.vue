<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import ActivityDepositPromoClaimPanel from './activity-deposit-promo-claim-panel.vue';
import ActivityDepositPromoRulesPanel from './activity-deposit-promo-rules-panel.vue';

defineOptions({ name: 'ActivityDepositPromoPanel' });

const activeSubTab = ref<'claim' | 'rules'>('rules');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="rules">活动规则</Radio.Button>
        <Radio.Button value="claim">优惠明细</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityDepositPromoRulesPanel v-if="activeSubTab === 'rules'" />
    <ActivityDepositPromoClaimPanel v-else />
  </div>
</template>

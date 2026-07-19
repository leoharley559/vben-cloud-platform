<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import GiftDeliverLevelPanel from './gift-deliver-level-panel.vue';
import GiftDeliverLuckyPanel from './gift-deliver-lucky-panel.vue';

defineOptions({ name: 'GiftDeliverPanel' });

const activeSubTab = ref<'level' | 'lucky'>('level');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="level">晋级豪礼</Radio.Button>
        <Radio.Button value="lucky">主题抽奖</Radio.Button>
      </Radio.Group>
    </div>

    <GiftDeliverLevelPanel v-if="activeSubTab === 'level'" />
    <GiftDeliverLuckyPanel v-if="activeSubTab === 'lucky'" />
  </div>
</template>

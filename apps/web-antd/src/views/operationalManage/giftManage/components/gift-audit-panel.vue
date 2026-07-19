<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import GiftAuditLevelPanel from './gift-audit-level-panel.vue';
import GiftAuditLuckyPanel from './gift-audit-lucky-panel.vue';

defineOptions({ name: 'GiftAuditPanel' });

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

    <GiftAuditLevelPanel v-if="activeSubTab === 'level'" />
    <GiftAuditLuckyPanel v-if="activeSubTab === 'lucky'" />
  </div>
</template>

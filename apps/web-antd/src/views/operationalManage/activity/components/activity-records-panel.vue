<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import ActivityChangeLogPanel from './activity-change-log-panel.vue';
import ActivityHistoryPanel from './activity-history-panel.vue';

defineOptions({ name: 'ActivityRecordsPanel' });

const activeSubTab = ref<'changelog' | 'history'>('history');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="history">历史活动</Radio.Button>
        <Radio.Button value="changelog">编辑记录</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityHistoryPanel v-if="activeSubTab === 'history'" />
    <ActivityChangeLogPanel v-else />
  </div>
</template>

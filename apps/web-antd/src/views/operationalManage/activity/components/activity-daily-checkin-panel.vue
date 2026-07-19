<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import ActivityDailyCheckinListPanel from './activity-daily-checkin-list-panel.vue';
import ActivityDailyCheckinRecordPanel from './activity-daily-checkin-record-panel.vue';

defineOptions({ name: 'ActivityDailyCheckinPanel' });

const activeSubTab = ref<'list' | 'record'>('list');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="list">活动设置</Radio.Button>
        <Radio.Button value="record">签到记录</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityDailyCheckinListPanel v-if="activeSubTab === 'list'" />
    <ActivityDailyCheckinRecordPanel v-else />
  </div>
</template>

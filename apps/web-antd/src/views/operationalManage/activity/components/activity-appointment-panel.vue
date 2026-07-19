<script lang="ts" setup>
import { ref } from 'vue';

import { Radio } from 'ant-design-vue';

import ActivityAppointmentRecordsPanel from './activity-appointment-records-panel.vue';
import ActivityAppointmentRulesPanel from './activity-appointment-rules-panel.vue';

defineOptions({ name: 'ActivityAppointmentPanel' });

const activeSubTab = ref<'records' | 'rules'>('rules');
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
        <Radio.Button value="records">明细记录</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityAppointmentRulesPanel v-if="activeSubTab === 'rules'" />
    <ActivityAppointmentRecordsPanel v-else />
  </div>
</template>

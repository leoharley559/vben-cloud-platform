<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Radio } from 'ant-design-vue';

import LeaderboardActivePanel from './components/leaderboard-active-panel.vue';
import LeaderboardRecordPanel from './components/leaderboard-record-panel.vue';

defineOptions({ name: 'Leaderboard' });

const activeSubTab = ref<'active' | 'past' | 'record'>('active');
const recordActivityId = ref('');

function handleCheckRecord(activityId: number | string) {
  recordActivityId.value = String(activityId);
  activeSubTab.value = 'record';
}
</script>

<template>
  <Page auto-content-height description="运营管理 · 排行榜" title="排行榜">
    <Card>
      <div class="mb-3">
        <Radio.Group v-model:value="activeSubTab" button-style="solid">
          <Radio.Button value="active">当前排行榜</Radio.Button>
          <Radio.Button value="past">历史排行榜</Radio.Button>
          <Radio.Button value="record">排行结算记录</Radio.Button>
        </Radio.Group>
      </div>

      <LeaderboardActivePanel
        v-if="activeSubTab === 'active'"
        :is-history="false"
      />
      <LeaderboardActivePanel
        v-else-if="activeSubTab === 'past'"
        :is-history="true"
        @check-record="handleCheckRecord"
      />
      <LeaderboardRecordPanel v-else :initial-activity-id="recordActivityId" />
    </Card>
  </Page>
</template>

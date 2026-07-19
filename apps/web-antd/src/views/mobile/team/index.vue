<script lang="ts" setup>
import { ref } from 'vue';

import { Card, Tabs } from 'ant-design-vue';

import TeamDaily from './daily/index.vue';
import TeamHistory from './history/index.vue';

defineOptions({ name: 'MobileTeamPanel' });

const activeTab = ref('daily');
</script>

<template>
  <Card>
    <Tabs v-model:active-key="activeTab" type="line" size="small">
      <Tabs.TabPane key="daily" tab="今日团队">
        <TeamDaily v-if="activeTab === 'daily'" />
      </Tabs.TabPane>
      <Tabs.TabPane key="history" tab="历史查询">
        <TeamHistory v-if="activeTab === 'history'" />
      </Tabs.TabPane>
    </Tabs>
  </Card>
</template>

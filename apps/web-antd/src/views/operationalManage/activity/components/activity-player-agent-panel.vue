<script lang="ts" setup>
import { ref } from 'vue';

import { Alert, Radio } from 'ant-design-vue';

import ActivityPlayerAgentCommissionPanel from './activity-player-agent-commission-panel.vue';
import ActivityPlayerAgentRewardPanel from './activity-player-agent-reward-panel.vue';
import ActivityPlayerAgentTeamPanel from './activity-player-agent-team-panel.vue';

defineOptions({ name: 'ActivityPlayerAgentPanel' });

const activeSubTab = ref<'commission' | 'reward' | 'scheme' | 'team'>(
  'commission',
);
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="scheme">代理方案</Radio.Button>
        <Radio.Button value="commission">佣金查询</Radio.Button>
        <Radio.Button value="reward">领奖记录</Radio.Button>
        <Radio.Button value="team">团队管理</Radio.Button>
      </Radio.Group>
    </div>

    <Alert
      v-if="activeSubTab === 'scheme'"
      show-icon
      type="info"
      message="代理方案多语言/规则编辑器尚未迁移（旧站 playerAgentScheme）。"
    />
    <ActivityPlayerAgentCommissionPanel
      v-else-if="activeSubTab === 'commission'"
    />
    <ActivityPlayerAgentRewardPanel v-else-if="activeSubTab === 'reward'" />
    <ActivityPlayerAgentTeamPanel v-else />
  </div>
</template>

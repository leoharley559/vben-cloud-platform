<script lang="ts" setup>
import { ref } from 'vue';

import { Alert, Radio } from 'ant-design-vue';

import ActivityInviteDetailPanel from './activity-invite-detail-panel.vue';

defineOptions({ name: 'ActivityInvitePanel' });

const activeSubTab = ref<'detail' | 'rule' | 'statistics'>('detail');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="detail">活动明细</Radio.Button>
        <Radio.Button value="rule">活动规则</Radio.Button>
        <Radio.Button value="statistics">活动统计</Radio.Button>
      </Radio.Group>
    </div>

    <ActivityInviteDetailPanel v-if="activeSubTab === 'detail'" />
    <Alert
      v-else
      show-icon
      type="info"
      :message="
        activeSubTab === 'rule'
          ? '邀请好友规则配置尚未迁移，请后续接入 playerinvitefunc 配置接口。'
          : '邀请统计/访问明细尚未迁移。'
      "
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { Alert, Radio } from 'ant-design-vue';

import ActivityBeginnerTurntableDetailPanel from './activity-beginner-turntable-detail-panel.vue';

defineOptions({ name: 'ActivityBeginnerTurntablePanel' });

const activeSubTab = ref<'detail' | 'firstDeposit' | 'register'>('detail');
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        v-model:value="activeSubTab"
        button-style="solid"
        size="default"
      >
        <Radio.Button value="register">注册转盘</Radio.Button>
        <Radio.Button value="firstDeposit">首存转盘</Radio.Button>
        <Radio.Button value="detail">活动明细</Radio.Button>
      </Radio.Group>
    </div>

    <Alert
      v-if="activeSubTab !== 'detail'"
      show-icon
      type="info"
      message="注册/首存转盘 scheme 配置编辑器尚未迁移（newplayerdrawconfig/scheme）。"
    />
    <ActivityBeginnerTurntableDetailPanel v-else />
  </div>
</template>

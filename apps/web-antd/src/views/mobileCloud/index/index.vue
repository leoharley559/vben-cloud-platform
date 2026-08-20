<script lang="ts" setup>
import { ref } from 'vue';

import { MOBILE_CLOUD_TABS } from '#/types/mobile';

import MobileShell from '../../mobile/components/mobile-shell.vue';
import MemberPanel from '../member/index.vue';
import UserPanel from '../user/index.vue';
import VerifyCodePanel from '../verifyCode/index.vue';

defineOptions({ name: 'MobileCloudIndex' });

const activeTab = ref('code');
</script>

<template>
  <MobileShell v-model:active-tab="activeTab" :tabs="MOBILE_CLOUD_TABS">
    <VerifyCodePanel v-if="activeTab === 'code'" />
    <MemberPanel v-else-if="activeTab === 'member'" />
    <UserPanel v-else-if="activeTab === 'user'" />
  </MobileShell>
</template>

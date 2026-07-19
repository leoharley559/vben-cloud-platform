<script lang="ts" setup>
import { ref } from 'vue';

import { MOBILE_TABS } from '#/types/mobile';

import MobileShell from '../components/mobile-shell.vue';
import DataPanel from '../data/index.vue';
import EarningPanel from '../earning/index.vue';
import OpenAccountPanel from '../openAccount/index.vue';
import PromotionPanel from '../promotion/index.vue';
import QueryPanel from '../query/index.vue';
import TeamPanel from '../team/index.vue';

defineOptions({ name: 'MobileIndex' });

const activeTab = ref('data');
</script>

<template>
  <MobileShell v-model:active-tab="activeTab" :tabs="MOBILE_TABS">
    <DataPanel v-if="activeTab === 'data'" />
    <OpenAccountPanel v-else-if="activeTab === 'user'" />
    <PromotionPanel v-else-if="activeTab === 'tui'" />
    <TeamPanel v-else-if="activeTab === 'team'" />
    <QueryPanel v-else-if="activeTab === 'query'" />
    <EarningPanel v-else-if="activeTab === 'money'" />
  </MobileShell>
</template>

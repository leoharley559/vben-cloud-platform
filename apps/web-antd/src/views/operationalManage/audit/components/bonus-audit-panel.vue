<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Radio, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import BonusEventAudit from './bonus-event-audit.vue';
import BonusReleaseAudit from './bonus-release-audit.vue';

defineOptions({ name: 'BonusAuditPanel' });

const { checkPermission } = useCloudPermission();

const canBonusRelease = computed(() => checkPermission(10_112));
const canEventBonus = computed(() => checkPermission(11_968));

const canViewAny = computed(() => canBonusRelease.value || canEventBonus.value);

const activeTab = ref<'event' | 'release'>('release');

function resolveDefaultTab() {
  if (canBonusRelease.value) {
    activeTab.value = 'release';
    return;
  }
  if (canEventBonus.value) {
    activeTab.value = 'event';
  }
}

onMounted(() => {
  resolveDefaultTab();
});
</script>

<template>
  <div v-if="canViewAny">
    <div class="mb-3">
      <Radio.Group v-model:value="activeTab" button-style="solid" size="default">
        <Radio.Button v-if="canBonusRelease" value="release">
          红利发放
        </Radio.Button>
        <Radio.Button v-if="canEventBonus" value="event">
          活动红利
        </Radio.Button>
      </Radio.Group>
    </div>

    <BonusReleaseAudit v-if="activeTab === 'release' && canBonusRelease" />
    <BonusEventAudit v-if="activeTab === 'event' && canEventBonus" />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要红利审核相关权限才能访问"
    title="无权限"
  />
</template>

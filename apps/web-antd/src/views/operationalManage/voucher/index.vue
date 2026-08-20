<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Radio, Result } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import VoucherActivePanel from './components/voucher-active-panel.vue';
import VoucherRecordPanel from './components/voucher-record-panel.vue';

defineOptions({ name: 'Voucher' });

const { checkPermission } = useCloudPermission();

const subTabs = computed(() =>
  [
    { key: 'active', label: '票券列表', permission: 13_293 },
    { key: 'history', label: '历史票券', permission: 13_350 },
    { key: 'record', label: '票券记录', permission: null },
  ].filter(
    (item) => item.permission === null || checkPermission(item.permission),
  ),
);

const canViewPage = computed(() => checkPermission(13_292));
const activeSubTab = ref('active');

onMounted(() => {
  activeSubTab.value = subTabs.value[0]?.key || 'active';
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 票券中心"
    title="票券中心"
  >
    <Card>
      <div class="mb-3">
        <Radio.Group v-model:value="activeSubTab" button-style="solid">
          <Radio.Button
            v-for="item in subTabs"
            :key="item.key"
            :value="item.key"
          >
            {{ item.label }}
          </Radio.Button>
        </Radio.Group>
      </div>

      <VoucherActivePanel
        v-if="activeSubTab === 'active'"
        :is-history="false"
      />
      <VoucherActivePanel
        v-else-if="activeSubTab === 'history'"
        :is-history="true"
      />
      <VoucherRecordPanel v-else-if="activeSubTab === 'record'" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无票券中心查看权限" title="403" />
</template>

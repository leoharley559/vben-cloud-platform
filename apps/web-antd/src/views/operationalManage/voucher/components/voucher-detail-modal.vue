<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Modal, Tabs } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import VoucherPayoutPanel from './voucher-payout-panel.vue';
import VoucherRecordPanel from './voucher-record-panel.vue';
import { resolveVoucherName } from './voucher-shared';

defineOptions({ name: 'VoucherDetailModal' });

const props = defineProps<{
  showPayout?: boolean;
  voucher?: {
    Id: number | string;
    LangText?: unknown;
    Type?: number;
  } | null;
}>();

const open = defineModel<boolean>('open', { default: false });

const { checkPermission } = useCloudPermission();

const canPayout = computed(
  () => Boolean(props.showPayout) && checkPermission(13444),
);

const activeTab = ref('record');

const title = computed(() => {
  const name = resolveVoucherName(props.voucher?.LangText);
  return name ? `票券详情 · ${name}` : '票券详情';
});

watch(open, (visible) => {
  if (visible) {
    activeTab.value = 'record';
  }
});
</script>

<template>
  <Modal
    v-model:open="open"
    destroy-on-close
    :footer="null"
    :title="title"
    width="92%"
  >
    <Tabs
      v-if="voucher?.Id"
      v-model:active-key="activeTab"
      type="line"
      size="small"
    >
      <Tabs.TabPane key="record" tab="票券记录">
        <VoucherRecordPanel
          v-if="activeTab === 'record'"
          :voucher-id="voucher.Id"
        />
      </Tabs.TabPane>
      <Tabs.TabPane v-if="canPayout" key="payout" tab="手动发放">
        <VoucherPayoutPanel v-if="activeTab === 'payout'" :voucher="voucher" />
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>

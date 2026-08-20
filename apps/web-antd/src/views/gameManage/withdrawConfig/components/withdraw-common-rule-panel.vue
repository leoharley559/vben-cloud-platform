<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Button, Card, Result, Space } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import WithdrawArrivalTimePanel from './withdraw-arrival-time-panel.vue';
import WithdrawBankBindingRulePanel from './withdraw-bank-binding-rule-panel.vue';
import WithdrawBasicRulePanel from './withdraw-basic-rule-panel.vue';
import WithdrawPackageRulePanel from './withdraw-package-rule-panel.vue';
import WithdrawVirtualRulePanel from './withdraw-virtual-rule-panel.vue';

defineOptions({ name: 'WithdrawCommonRulePanel' });

type TabKey =
  | 'arrival'
  | 'bank'
  | 'forced'
  | 'params'
  | 'prompt'
  | 'virtual'
  | 'wallet';

const { checkPermission } = useCloudPermission();
const tabs = computed(() =>
  [
    {
      key: 'params' as const,
      label: '提现参数配置',
      visible: checkPermission(10_994),
    },
    {
      key: 'prompt' as const,
      label: '提现提示配置',
      visible: checkPermission(10_995),
    },
    {
      key: 'wallet' as const,
      label: '钱包绑定设置',
      visible: checkPermission(12_920),
    },
    {
      key: 'forced' as const,
      label: '强制提现设置',
      visible: checkPermission(12_951),
    },
    {
      key: 'bank' as const,
      label: '银行卡绑定设置',
      visible: checkPermission(10_996),
    },
    {
      key: 'virtual' as const,
      label: '自定义虚拟货币设置',
      visible: checkPermission(11_647),
    },
    {
      key: 'arrival' as const,
      label: '预计到账显示时间',
      visible: checkPermission(12_386) || checkPermission(12_398),
    },
  ].filter((item) => item.visible),
);
const active = ref<TabKey>('params');

watch(
  tabs,
  (items) => {
    if (!items.some((item) => item.key === active.value) && items[0]) {
      active.value = items[0].key;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="tabs.length > 0">
    <Card class="mb-4" size="small">
      <Space wrap>
        <Button
          v-for="tab in tabs"
          :key="tab.key"
          :type="active === tab.key ? 'primary' : 'default'"
          @click="active = tab.key"
        >
          {{ tab.label }}
        </Button>
      </Space>
    </Card>

    <WithdrawBasicRulePanel v-if="active === 'params'" mode="params" />
    <WithdrawBasicRulePanel v-else-if="active === 'prompt'" mode="prompt" />
    <WithdrawPackageRulePanel v-else-if="active === 'wallet'" mode="wallet" />
    <WithdrawPackageRulePanel v-else-if="active === 'forced'" mode="forced" />
    <WithdrawBankBindingRulePanel v-else-if="active === 'bank'" />
    <WithdrawVirtualRulePanel v-else-if="active === 'virtual'" />
    <WithdrawArrivalTimePanel v-else-if="active === 'arrival'" />
  </div>
  <Result
    v-else
    status="403"
    sub-title="当前账号没有提现通用规则配置权限"
    title="403"
  />
</template>

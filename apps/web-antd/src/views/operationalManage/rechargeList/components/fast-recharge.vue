<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Radio } from 'ant-design-vue';

import { useCloudPermission } from '#/composables/use-cloud-permission';

import BankFastRecharge from './bank-fast-recharge.vue';
import UsdtFastRecharge from './usdt-fast-recharge.vue';
import VoucherRechargeList from './voucher-recharge-list.vue';

defineOptions({ name: 'FastRechargeTabs' });

const { checkPermission } = useCloudPermission();

const canBank = computed(() => checkPermission(12_333));
const canUsdt = computed(() => checkPermission(12_337));

const pageType = ref(1);
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group v-model:value="pageType" button-style="solid">
        <Radio.Button v-if="canBank" :value="1">快捷支付</Radio.Button>
        <Radio.Button v-if="canUsdt" :value="2">USDT快捷</Radio.Button>
        <Radio.Button :value="3">兑换码充值</Radio.Button>
      </Radio.Group>
    </div>

    <BankFastRecharge v-if="pageType === 1 && canBank" />
    <UsdtFastRecharge v-else-if="pageType === 2 && canUsdt" />
    <VoucherRechargeList v-else-if="pageType === 3" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import { Card, Tooltip } from 'ant-design-vue';

import { centsToYuan, toNumber } from '#/utils/dashboard';

defineOptions({ name: 'DashboardBannerStats' });

const props = defineProps<{
  today: Record<string, unknown>;
}>();

const items = computed(() => {
  const t = props.today || {};
  return [
    {
      key: 'reg',
      label: '新增（账号/访问）',
      value: `${toNumber(t.SumReg)} / ${toNumber(t.SumDevice)}`,
    },
    {
      key: 'login',
      label: '登录账户',
      value: String(toNumber(t.SumBannerLogin)),
    },
    {
      key: 'payNum',
      label: '充值人数',
      tip: `官方充值人数：${toNumber(t.SumBannerPlatformPayNum)} / 币商充值人数：${toNumber(t.SumBannerAgentPayNum)}`,
      value: String(toNumber(t.SumBannerPayNum)),
    },
    {
      key: 'first',
      label: '首存金额/人数',
      value: `${centsToYuan(t.SumBannerFirstPayMoney)} / ${toNumber(t.SumBannerFirstPayNum)}`,
    },
  ];
});
</script>

<template>
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <Card
      v-for="item in items"
      :key="item.key"
      class="border-0 shadow-sm"
      size="small"
    >
      <div class="text-2xl font-semibold text-gray-900">{{ item.value }}</div>
      <div class="mt-1 flex items-center gap-1 text-sm text-gray-500">
        <span>{{ item.label }}</span>
        <Tooltip v-if="item.tip" :title="item.tip">
          <span class="cursor-help text-blue-500">?</span>
        </Tooltip>
      </div>
    </Card>
  </div>
</template>

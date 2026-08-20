<script lang="ts" setup>
import type { PanelMetricKey } from '#/utils/dashboard';

import { computed } from 'vue';

import { Card, Tooltip } from 'ant-design-vue';

import { centsToYuan, formatComparePercent, toNumber, VISIBLE_PANEL_KEYS } from '#/utils/dashboard';

defineOptions({ name: 'DashboardPanelMetrics' });

const props = defineProps<{
  activeKey: PanelMetricKey;
  hideMoney: boolean;
  today: Record<string, unknown>;
  yesterday: Record<string, unknown>;
}>();

const emit = defineEmits<{
  select: [key: PanelMetricKey];
  'update:hideMoney': [value: boolean];
}>();

interface MetricCard {
  accent: string;
  key: PanelMetricKey;
  label: string;
  primary: string;
  secondary: string;
  secondaryLabel: string;
  secondaryPositive: boolean;
  tip?: string;
}

const cards = computed<MetricCard[]>(() => {
  const today = props.today || {};
  const yesterday = props.yesterday || {};
  const hide = props.hideMoney;

  const bet = toNumber(today.SumTransBetMoney1);
  const win = toNumber(today.SumTransWinMoney1);
  const pay = toNumber(today.SumPayMergerMoney);
  const withdraw = toNumber(today.SumWithdrawMoney);
  const yBet = toNumber(yesterday.SumTransBetMoney1);
  const yWin = toNumber(yesterday.SumTransWinMoney1);
  const yPay = toNumber(yesterday.SumPayMergerMoney);
  const yWithdraw = toNumber(yesterday.SumWithdrawMoney);
  // 对齐日报公司输赢：盈利 = -返奖
  const profit = -win;
  const yProfit = -yWin;

  const map: Record<string, MetricCard> = {
    SumTransBetMoney1: {
      accent: '#f4516c',
      key: 'SumTransBetMoney1',
      label: '投注金额',
      primary: hide ? '***' : String(centsToYuan(bet)),
      secondary: formatComparePercent(bet - yBet, yBet),
      secondaryLabel: '较昨日',
      secondaryPositive: bet - yBet >= 0,
    },
    SumTransWinMoney1: {
      accent: '#34bfa3',
      key: 'SumTransWinMoney1',
      label: '返奖金额',
      primary: hide ? '***' : String(centsToYuan(win)),
      secondary: formatComparePercent(win - yWin, yWin),
      secondaryLabel: '较昨日',
      secondaryPositive: win - yWin >= 0,
    },
    WinSubBet: {
      accent: '#febf5b',
      key: 'WinSubBet',
      label: '盈利',
      primary: hide ? '***' : String(centsToYuan(profit)),
      secondary: formatComparePercent(profit - yProfit, yProfit),
      secondaryLabel: '较昨日',
      secondaryPositive: profit - yProfit >= 0,
    },
    SumTotalPayMoney: {
      accent: '#34bfa3',
      key: 'SumTotalPayMoney',
      label: '充值金额',
      primary: hide ? '***' : String(centsToYuan(pay)),
      secondary: formatComparePercent(pay - yPay, yPay),
      secondaryLabel: '较昨日',
      secondaryPositive: pay - yPay >= 0,
      tip: `官方充值：${centsToYuan(today.SumPayMoney)} / 币商充值：${centsToYuan(today.SumAgentPayMoney)}`,
    },
    SumWithdrawMoney: {
      accent: '#f4516c',
      key: 'SumWithdrawMoney',
      label: '兑换金额',
      primary: hide ? '***' : String(centsToYuan(withdraw)),
      secondary: formatComparePercent(withdraw - yWithdraw, yWithdraw),
      secondaryLabel: '较昨日',
      secondaryPositive: withdraw - yWithdraw >= 0,
    },
    profits: {
      accent: '#febf5b',
      key: 'profits',
      label: '充兑差',
      primary: hide ? '***' : String(centsToYuan(pay - withdraw)),
      secondary: pay ? `${((withdraw / pay) * 100).toFixed(2)}%` : '0%',
      secondaryLabel: '兑充比',
      secondaryPositive: pay ? withdraw / pay < 1 : true,
    },
  };

  return VISIBLE_PANEL_KEYS.map((key) => map[key]!).filter(Boolean);
});
</script>

<template>
  <div>
    <div class="mb-3 flex items-center gap-2">
      <span class="text-base font-medium text-gray-800">今日数据</span>
      <button
        class="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:border-gray-400"
        type="button"
        @click="emit('update:hideMoney', !hideMoney)"
      >
        {{ hideMoney ? '显示金额' : '隐藏金额' }}
      </button>
    </div>
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <Card
        v-for="card in cards"
        :key="card.key"
        class="cursor-pointer transition-shadow hover:shadow-md"
        :class="
          activeKey === card.key
            ? 'border-blue-500 ring-1 ring-blue-200'
            : 'border-transparent'
        "
        size="small"
        @click="emit('select', card.key)"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="mb-1 flex items-center gap-1 text-xs text-gray-500">
              <span>{{ card.label }}</span>
              <Tooltip v-if="card.tip" :title="card.tip">
                <span class="cursor-help text-blue-500">?</span>
              </Tooltip>
            </div>
            <div class="text-xl font-semibold text-gray-900">
              {{ card.primary }}
            </div>
            <div class="mt-1 text-xs text-gray-400">
              <span
                :class="
                  card.secondaryPositive ? 'text-emerald-600' : 'text-red-500'
                "
              >
                {{ card.secondary }}
              </span>
              <span class="ml-1">{{ card.secondaryLabel }}</span>
            </div>
          </div>
          <span
            class="mt-1 inline-block h-2.5 w-2.5 rounded-full"
            :style="{ background: card.accent }"
          ></span>
        </div>
      </Card>
    </div>
  </div>
</template>

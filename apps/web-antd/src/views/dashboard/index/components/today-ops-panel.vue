<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Card, Spin, Table } from 'ant-design-vue';

import { fetchDashboardTodayApi } from '#/api/dashboard';
import { useProjectConfig } from '#/composables/use-project-config';
import {
  formatDeltaPercent,
  formatRatePercent,
  formatSeconds,
  toNumber,
} from '#/utils/dashboard';

defineOptions({ name: 'DashboardTodayOps' });

const { projectConfig } = useProjectConfig();

function payTypeName(payType: unknown): string {
  const key = String(payType ?? '');
  if (!key || key === '0') return '';
  const list =
    (
      projectConfig.value as {
        RechargeTypeList?: Array<{
          I18nKey?: string;
          Key?: number | string;
          Name?: string;
        }>;
      } | null
    )?.RechargeTypeList || [];
  const found = list.find((item) => String(item.Key) === key);
  return found?.Name || '';
}

const loading = ref(false);

const recharged = ref<{
  TodayItems: Array<Record<string, unknown>>;
  TodayTotal: Record<string, number>;
  YestDayTotal: Record<string, number>;
}>({
  TodayItems: [],
  TodayTotal: { SuccessRate: 0 },
  YestDayTotal: { SuccessRate: 0 },
});

const recharged15 = ref<{
  Curr15Items: Array<Record<string, unknown>>;
  Curr15Total: Record<string, number>;
  Last15Total: Record<string, number>;
}>({
  Curr15Items: [],
  Curr15Total: { SuccessRate: 0 },
  Last15Total: { SuccessRate: 0 },
});

const withDraw = ref<Record<string, number>>({});
const onlineUser = ref<{
  OnlineCount: number;
  TodayOnlineUserItems: Array<Record<string, unknown>>;
}>({
  OnlineCount: 0,
  TodayOnlineUserItems: [],
});

function rateOf(success: number, total: number) {
  return total ? success / total : 0;
}

function enrichRechargeRows(
  todayItems: Array<Record<string, unknown>>,
  yesterdayItems: Array<Record<string, unknown>>,
) {
  return (todayItems || []).map((today, index) => {
    const yesterday =
      (yesterdayItems || []).find(
        (item) => String(item.PayType) === String(today.PayType),
      ) || {};
    const children = Array.isArray(today.Children)
      ? (today.Children as Array<Record<string, unknown>>).map(
          (child, cIdx) => {
            const yChild =
              (Array.isArray(yesterday.Children)
                ? (yesterday.Children as Array<Record<string, unknown>>)
                : []
              ).find(
                (item) => String(item.RechargeId) === String(child.RechargeId),
              ) || {};
            return {
              ...child,
              YesterdaySuccessRate: rateOf(
                toNumber(yChild.SuccessCount),
                toNumber(yChild.TotalCount),
              ),
              TodaySuccessRate: rateOf(
                toNumber(child.SuccessCount),
                toNumber(child.TotalCount),
              ),
              children: undefined,
              fakeId: `c-${index}-${cIdx}-${child.RechargeId}`,
              key: `c-${index}-${cIdx}-${child.RechargeId}`,
            };
          },
        )
      : undefined;
    return {
      ...today,
      YesterdaySuccessRate: rateOf(
        toNumber(yesterday.SuccessCount),
        toNumber(yesterday.TotalCount),
      ),
      TodaySuccessRate: rateOf(
        toNumber(today.SuccessCount),
        toNumber(today.TotalCount),
      ),
      children,
      fakeId: `p-${index}-${today.PayType}`,
      key: `p-${index}-${today.PayType}`,
    };
  });
}

function enrich15Rows(items: Array<Record<string, unknown>>) {
  return (items || []).map((row, index) => ({
    ...row,
    CurrSuccessRate: rateOf(
      toNumber(row.SuccessCount),
      toNumber(row.TotalCount),
    ),
    LastSuccessRate: toNumber(row.LastSuccessRate),
    fakeId: `15-${index}-${row.PayType || row.RechargeId}`,
    key: `15-${index}-${row.PayType || row.RechargeId}`,
  }));
}

async function loadData() {
  loading.value = true;
  try {
    const data = (await fetchDashboardTodayApi()) || {};
    const recharge = (data.Recharged || {}) as Record<string, any>;
    const recharge15 = (data.Recharged15 || {}) as Record<string, any>;

    const todayTotal = recharge.TodayTotal || {};
    const yestTotal = recharge.YestDayTotal || {};
    todayTotal.SuccessRate = rateOf(
      toNumber(todayTotal.SumSuccessCount),
      toNumber(todayTotal.SumTotalCount),
    );
    yestTotal.SuccessRate = rateOf(
      toNumber(yestTotal.SumSuccessCount),
      toNumber(yestTotal.SumTotalCount),
    );

    recharged.value = {
      TodayItems: enrichRechargeRows(
        recharge.TodayItems || [],
        recharge.YestDayItems || [],
      ),
      TodayTotal: todayTotal,
      YestDayTotal: yestTotal,
    };

    const curr15Total = recharge15.Curr15Total || {};
    const last15Total = recharge15.Last15Total || {};
    curr15Total.SuccessRate = rateOf(
      toNumber(curr15Total.SumSuccessCount),
      toNumber(curr15Total.SumTotalCount),
    );
    last15Total.SuccessRate = rateOf(
      toNumber(last15Total.SumSuccessCount),
      toNumber(last15Total.SumTotalCount),
    );

    recharged15.value = {
      Curr15Items: enrich15Rows(recharge15.Curr15Items || []),
      Curr15Total: curr15Total,
      Last15Total: last15Total,
    };

    withDraw.value = (data.WithDraw || {}) as Record<string, number>;
    const online = (data.OnlineUser || {}) as Record<string, any>;
    onlineUser.value = {
      OnlineCount: toNumber(online.OnlineCount),
      TodayOnlineUserItems: online.TodayOnlineUserItems || [],
    };
  } finally {
    loading.value = false;
  }
}

function deltaClass(today: number, yesterday: number) {
  return today - yesterday >= 0 ? 'text-emerald-600' : 'text-red-500';
}

const rechargeColumns = [
  {
    dataIndex: 'name',
    key: 'name',
    title: '充值通道',
    customRender: ({ record }: { record: Record<string, unknown> }) => {
      if (Number(record.RechargeId) === 0) {
        return String(record.CreateAdminName || '-');
      }
      if (
        record.children &&
        Array.isArray(record.children) &&
        record.children.length
      ) {
        return (
          payTypeName(record.PayType) ||
          String(record.PayTypeName || record.PayType || '-')
        );
      }
      return String(
        record.ShowName || payTypeName(record.PayType) || record.PayType || '-',
      );
    },
  },
  { dataIndex: 'TotalCount', key: 'TotalCount', title: '今日订单' },
  {
    key: 'rate',
    title: '成功率',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      `${formatRatePercent(toNumber(record.TodaySuccessRate))} (${formatDeltaPercent(toNumber(record.TodaySuccessRate), toNumber(record.YesterdaySuccessRate))})`,
  },
];

const recharge15Columns = [
  {
    key: 'name',
    title: '充值通道',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      String(
        record.ShowName ||
          payTypeName(record.PayType) ||
          record.PayType ||
          record.CreateAdminName ||
          '-',
      ),
  },
  { dataIndex: 'TotalCount', key: 'TotalCount', title: '订单数' },
  {
    key: 'rate',
    title: '成功率',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      `${formatRatePercent(toNumber(record.CurrSuccessRate))} (${formatDeltaPercent(toNumber(record.CurrSuccessRate), toNumber(record.LastSuccessRate))})`,
  },
];

const onlineColumns = [
  { dataIndex: 'RiskAuditorName', key: 'RiskAuditorName', title: '风控员' },
  { dataIndex: 'OrderCount', key: 'OrderCount', title: '订单数' },
  {
    key: 'avg',
    title: '平均耗时',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatSeconds(record.AvgTime),
  },
];

const withdrawCards = computed(() => {
  const w = withDraw.value;
  return [
    {
      key: 'total',
      label: '总出款时间',
      today: toNumber(w.TodayTotalTime),
      yesterday: toNumber(w.YestDayTotalTime),
    },
    {
      key: 'risk',
      label: '风控响应时间',
      today: toNumber(w.TodayRiskAuditorTime),
      yesterday: toNumber(w.YestDayRiskAuditorTime),
    },
    {
      key: 'finance',
      label: '财务响应时间',
      today: toNumber(w.TodayFinanceTime),
      yesterday: toNumber(w.YestDayFinanceTime),
    },
    {
      key: 'finish',
      label: '通道出款时间',
      today: toNumber(w.TodayFinishTime),
      yesterday: toNumber(w.YestDayFinishTime),
    },
  ];
});

onMounted(() => {
  void loadData();
});
</script>

<template>
  <Spin :spinning="loading">
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
      <Card class="shadow-sm" size="small">
        <div class="mb-1">
          <div class="text-2xl font-semibold">
            {{ formatRatePercent(recharged.TodayTotal.SuccessRate) }}
            <span
              class="ml-1 text-sm"
              :class="
                deltaClass(
                  recharged.TodayTotal.SuccessRate,
                  recharged.YestDayTotal.SuccessRate,
                )
              "
            >
              {{
                formatDeltaPercent(
                  recharged.TodayTotal.SuccessRate,
                  recharged.YestDayTotal.SuccessRate,
                )
              }}
            </span>
          </div>
          <div class="text-sm text-gray-500">今日充值成功率</div>
        </div>
        <Table
          :columns="rechargeColumns"
          :data-source="recharged.TodayItems"
          :pagination="false"
          :scroll="{ y: 360 }"
          row-key="fakeId"
          size="small"
        />
      </Card>

      <Card class="shadow-sm" size="small">
        <div class="mb-1">
          <div class="text-2xl font-semibold">
            {{ formatRatePercent(recharged15.Curr15Total.SuccessRate) }}
            <span
              class="ml-1 text-sm"
              :class="
                deltaClass(
                  recharged15.Curr15Total.SuccessRate,
                  recharged15.Last15Total.SuccessRate,
                )
              "
            >
              {{
                formatDeltaPercent(
                  recharged15.Curr15Total.SuccessRate,
                  recharged15.Last15Total.SuccessRate,
                )
              }}
            </span>
          </div>
          <div class="text-sm text-gray-500">15分钟充值成功率</div>
        </div>
        <Table
          :columns="recharge15Columns"
          :data-source="recharged15.Curr15Items"
          :pagination="false"
          :scroll="{ y: 360 }"
          row-key="fakeId"
          size="small"
        />
      </Card>

      <Card class="shadow-sm" size="small">
        <div class="mb-3 text-sm font-medium text-gray-700">提现时间统计</div>
        <div class="grid grid-cols-1 gap-2">
          <div
            v-for="item in withdrawCards"
            :key="item.key"
            class="rounded-lg bg-gray-50 px-3 py-3"
          >
            <div class="text-lg font-semibold">
              {{ formatSeconds(item.today) }}
              <span
                class="ml-1 text-xs"
                :class="deltaClass(item.today, item.yesterday)"
              >
                {{ formatDeltaPercent(item.today, item.yesterday) }}
              </span>
            </div>
            <div class="text-xs text-gray-500">{{ item.label }}</div>
          </div>
        </div>
      </Card>

      <Card class="shadow-sm" size="small">
        <div class="mb-1">
          <div class="text-2xl font-semibold">{{ onlineUser.OnlineCount }}</div>
          <div class="text-sm text-gray-500">当前在线风控</div>
        </div>
        <Table
          :columns="onlineColumns"
          :data-source="onlineUser.TodayOnlineUserItems"
          :pagination="false"
          :scroll="{ y: 360 }"
          :row-key="(row, index) => String(row.RiskAuditorName || index)"
          size="small"
        />
      </Card>
    </div>
  </Spin>
</template>

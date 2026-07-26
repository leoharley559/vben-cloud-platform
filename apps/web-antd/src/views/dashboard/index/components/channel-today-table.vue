<script lang="ts" setup>
import { h, onMounted, ref } from 'vue';

import { Button, Card, Table, message } from 'ant-design-vue';

import { fetchDashboardChannelApi } from '#/api/dashboard';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'DashboardChannelToday' });

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);

function pickChannelRows(
  result: {
    Items?: Array<Record<string, unknown>>;
    RealtimeItems?: Array<Record<string, unknown>>;
  } | null,
) {
  if (!result || typeof result !== 'object') {
    return [];
  }
  const realtime = Array.isArray(result.RealtimeItems)
    ? result.RealtimeItems
    : [];
  if (realtime.length) {
    return realtime;
  }
  // 兼容：RealtimeItems 为空/null 时尝试 Items
  return Array.isArray(result.Items) ? result.Items : [];
}

const columns = [
  {
    key: 'rank',
    title: '排名',
    width: 70,
    customRender: ({ index }: { index: number }) => index + 1,
  },
  {
    key: 'channel',
    title: '渠道名称（渠道号）',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      record.ChannelName ? `${record.ChannelName}(${record.ChannelId})` : '--',
  },
  {
    dataIndex: 'NewCountNum',
    key: 'NewCountNum',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(a.NewCountNum) - Number(b.NewCountNum),
    title: '新增人数',
  },
  {
    dataIndex: 'NewPayCountNum',
    key: 'NewPayCountNum',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(a.NewPayCountNum) - Number(b.NewPayCountNum),
    title: '新增付费人数',
  },
  {
    key: 'NewPaySumNum',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(a.NewPaySumNum) - Number(b.NewPaySumNum),
    title: '新增付费金额',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(Number(record.NewPaySumNum)),
  },
  {
    dataIndex: 'LoginCountNum',
    key: 'LoginCountNum',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(a.LoginCountNum) - Number(b.LoginCountNum),
    title: '登录人数',
  },
  {
    dataIndex: 'PayCountNum',
    key: 'PayCountNum',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(a.PayCountNum) - Number(b.PayCountNum),
    title: '总付费人数',
  },
  {
    key: 'PaySumNum',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(a.PaySumNum) - Number(b.PaySumNum),
    title: '总充值',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(Number(record.PaySumNum)),
  },
  {
    key: 'WithDrawSumNum',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(a.WithDrawSumNum) - Number(b.WithDrawSumNum),
    title: '总兑换',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(Number(record.WithDrawSumNum)),
  },
  {
    key: 'RemainderSumNum',
    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      Number(a.RemainderSumNum) - Number(b.RemainderSumNum),
    title: '充兑差',
    customRender: ({ record }: { record: Record<string, unknown> }) => {
      const amount = formatAmountFromCent(Number(record.RemainderSumNum));
      const positive = Number(record.RemainderSumNum) > 0;
      return h(
        'span',
        { style: { color: positive ? '#059669' : '#ef4444' } },
        amount,
      );
    },
  },
];

async function loadList() {
  loading.value = true;
  try {
    const result = (await fetchDashboardChannelApi({})) || {};
    const items = pickChannelRows(result);
    list.value = [...items].sort(
      (a, b) => Number(b.NewCountNum || 0) - Number(a.NewCountNum || 0),
    );
  } catch {
    list.value = [];
    message.error('渠道今日数据加载失败');
  } finally {
    loading.value = false;
  }
}

function handleExport() {
  if (!list.value.length) {
    message.warning('暂无数据可导出');
    return;
  }
  exportRowsToCsv(
    list.value,
    [
      {
        header: '排名',
        value: (_row, index) => index + 1,
      },
      {
        header: '渠道名称',
        value: (row) => String(row.ChannelName ?? ''),
      },
      {
        header: '渠道号',
        value: (row) => String(row.ChannelId ?? ''),
      },
      {
        header: '新增人数',
        value: (row) => Number(row.NewCountNum || 0),
      },
      {
        header: '新增付费人数',
        value: (row) => Number(row.NewPayCountNum || 0),
      },
      {
        header: '新增付费金额',
        value: (row) => formatAmountFromCent(Number(row.NewPaySumNum)),
      },
      {
        header: '登录人数',
        value: (row) => Number(row.LoginCountNum || 0),
      },
      {
        header: '总付费人数',
        value: (row) => Number(row.PayCountNum || 0),
      },
      {
        header: '总充值',
        value: (row) => formatAmountFromCent(Number(row.PaySumNum)),
      },
      {
        header: '总兑换',
        value: (row) => formatAmountFromCent(Number(row.WithDrawSumNum)),
      },
      {
        header: '充兑差',
        value: (row) => formatAmountFromCent(Number(row.RemainderSumNum)),
      },
    ],
    `渠道今日数据_${Date.now()}.csv`,
  );
  message.success('已导出');
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <Card class="shadow-sm" size="small">
    <template #title>
      <div class="flex items-center justify-between">
        <span>渠道今日数据</span>
        <Button size="small" type="primary" @click="handleExport">
          导出 Excel
        </Button>
      </div>
    </template>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :locale="{ emptyText: '暂无渠道今日数据' }"
      :pagination="false"
      :row-key="(row) => String(row.ChannelId ?? row.ChannelName ?? '')"
      :scroll="{ x: 1100, y: 420 }"
      size="small"
    />
  </Card>
</template>

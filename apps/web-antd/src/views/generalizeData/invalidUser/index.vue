<script lang="ts" setup>
import type { InvalidUserSummary } from '#/types/generalize-data';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, DatePicker, Descriptions, Result } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchInvalidUserSummaryApi } from '#/api/promotion/generalize-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'InvalidUser' });

const { checkPermission } = useCloudPermission();

const loading = ref(false);
const summary = ref<InvalidUserSummary>({});
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(7, 'day'),
  dayjs(),
]);

const canViewPage = computed(() => checkPermission(10888));

function formatPercent(part?: number, total?: number) {
  if (!total) {
    return '0.0%';
  }
  return `${((Number(part || 0) / total) * 100).toFixed(1)}%`;
}

const metrics = computed(() => {
  const data = summary.value;
  const reg = Number(data.CountRegNum || 0);
  return [
    {
      count: data.CountDeviceNum ?? 0,
      key: 'device',
      percent: reg ? '100.0%' : '0.0%',
      title: '新增设备',
    },
    {
      count: data.CountRegNum ?? 0,
      key: 'reg',
      percent: reg ? '100.0%' : '0.0%',
      title: '新增用户',
    },
    {
      count: data.CountNum0 ?? 0,
      key: 'num0',
      percent: formatPercent(data.CountNum0, reg),
      title: '无效类型0',
    },
    {
      count: data.CountNum1 ?? 0,
      key: 'num1',
      percent: formatPercent(data.CountNum1, reg),
      title: '无效类型1',
    },
    {
      count: data.CountNum3 ?? 0,
      key: 'num3',
      percent: formatPercent(data.CountNum3, reg),
      title: '无效类型3',
    },
  ];
});

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.format('YYYY-MM-DD') : '',
    EndTime: end ? end.format('YYYY-MM-DD') : '',
  };
}

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchInvalidUserSummaryApi(getQueryParams());
    summary.value = result.Items || {};
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (canViewPage.value) {
    loadData();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广数据 · 无效用户"
    title="无效用户"
  >
    <Card :loading="loading">
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <DatePicker.RangePicker v-model:value="filterDateRange" />
        <Button type="primary" @click="loadData">查询</Button>
      </div>

      <Descriptions bordered :column="1" size="small" title="数量">
        <Descriptions.Item
          v-for="item in metrics"
          :key="`${item.key}-count`"
          :label="item.title"
        >
          {{ item.count }}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions bordered class="mt-4" :column="1" size="small" title="占比">
        <Descriptions.Item
          v-for="item in metrics"
          :key="`${item.key}-percent`"
          :label="item.title"
        >
          {{ item.percent }}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无无效用户查看权限" title="403" />
</template>

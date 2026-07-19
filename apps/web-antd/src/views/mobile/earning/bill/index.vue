<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Spin, Table } from 'ant-design-vue';

import { fetchCloseManageListApi } from '#/api/promotion/close-manage';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileEarningBill' });

const emit = defineEmits<{ detail: [] }>();

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);

const columns = [
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatOperationDateTime(record.CreateTime as string),
    key: 'time',
    title: '时间',
  },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(Number(record.Money || 0)),
    key: 'money',
    title: '金额',
  },
  { dataIndex: 'StatusName', key: 'status', title: '状态' },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchCloseManageListApi({ Page: 1, PageSize: 30 });
    list.value = (result.Items || []) as Record<string, unknown>[];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Spin :spinning="loading">
    <MobileMvpTip />
    <Card size="small" title="账单列表">
      <Table
        :columns="columns"
        :custom-row="() => ({ onClick: () => emit('detail') })"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        size="small"
      />
    </Card>
  </Spin>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Button, Card, Spin, Table } from 'ant-design-vue';

import { fetchWithdrawAccountListApi } from '#/api/promotion/close-manage';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileEarningWithdrawAccount' });

const emit = defineEmits<{ add: [] }>();

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);

const columns = [
  { dataIndex: 'AccountName', key: 'name', title: '姓名' },
  { dataIndex: 'AccountNumber', key: 'number', title: '账号' },
  { dataIndex: 'BankName', key: 'bank', title: '银行' },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchWithdrawAccountListApi();
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
    <Button block class="mb-3" type="primary" @click="emit('add')">
      新增收款账户
    </Button>
    <Card size="small">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        size="small"
      />
    </Card>
  </Spin>
</template>

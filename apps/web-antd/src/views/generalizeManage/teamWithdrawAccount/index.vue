<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Result, Space, Table } from 'ant-design-vue';

import {
  deleteWithdrawAccountApi,
  fetchWithdrawAccountListApi,
} from '#/api/promotion/close-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import type { WithdrawAccountItem } from '#/types/promotion';

import WithdrawAccountModal from '../closeManage/components/withdraw-account-modal.vue';

defineOptions({ name: 'TeamWithdrawAccount' });

const { checkPermission } = useCloudPermission();

const loading = ref(false);
const accountOpen = ref(false);
const accountList = ref<WithdrawAccountItem[]>([]);

const canViewPage = computed(() => checkPermission(10929));

const columns = [
  {
    customRender: ({ record }: { record: WithdrawAccountItem }) =>
      Number(record.AccountType) === 1 ? '银行卡' : '支付宝',
    key: 'type',
    title: '类型',
    width: 90,
  },
  { dataIndex: 'RealName', key: 'name', title: '姓名' },
  { dataIndex: 'Account', key: 'account', title: '账号' },
  { dataIndex: 'BankName', key: 'bank', title: '开户行' },
  { key: 'action', title: '操作', width: 90 },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchWithdrawAccountListApi();
    accountList.value = result.Items || [];
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id?: number | string) {
  if (!id) return;
  await deleteWithdrawAccountApi(id);
  await loadData();
}

onMounted(loadData);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="推广管理 · 提现账号"
    title="提现账号管理"
  >
    <Card>
      <Space class="mb-3">
        <Button type="primary" @click="accountOpen = true">
          管理提现账号
        </Button>
      </Space>
      <Table
        :columns="columns"
        :data-source="accountList"
        :loading="loading"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button
              danger
              size="small"
              type="link"
              @click="handleDelete(record.Id)"
            >
              删除
            </Button>
          </template>
        </template>
      </Table>
      <WithdrawAccountModal v-model:open="accountOpen" @change="loadData" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无提现账号管理权限" title="403" />
</template>

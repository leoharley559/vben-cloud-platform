<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Button, Card, Spin, Table, Tag } from 'ant-design-vue';

import { fetchPromoterListApi } from '#/api/promotion/manage';
import { formatOperationDateTime } from '#/utils/operation-status';

import MobileMvpTip from '../components/mobile-mvp-tip.vue';
import OpenAccountForm from '../openAccount/account/index.vue';

defineOptions({ name: 'MobileOpenAccountPanel' });

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);
const showForm = ref(false);

const columns = [
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      Number(record.Status) === 1 ? '启用' : '停用',
    key: 'status',
    title: '状态',
    width: 70,
  },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatOperationDateTime(record.CreateTime as string),
    key: 'createTime',
    title: '创建时间',
  },
  { dataIndex: 'Username', key: 'username', title: '账号' },
  { dataIndex: 'Name', key: 'name', title: '昵称' },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      `${Number(record.CommissionRate || 0) / 10}%`,
    key: 'rate',
    title: '分成',
    width: 70,
  },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchPromoterListApi({ Page: 1, PageSize: 50 });
    list.value = (result.Items || []) as Record<string, unknown>[];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Spin :spinning="loading">
    <MobileMvpTip>新增/编辑下级账号表单等待下一迭代迁移。</MobileMvpTip>
    <Button block class="mb-3" type="primary" @click="showForm = true">
      新增账号
    </Button>
    <Card size="small" title="下级列表">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="Number(record.Status) === 1 ? 'success' : 'error'">
              {{ Number(record.Status) === 1 ? '启用' : '停用' }}
            </Tag>
          </template>
        </template>
      </Table>
    </Card>
    <OpenAccountForm v-if="showForm" @close="showForm = false" />
  </Spin>
</template>

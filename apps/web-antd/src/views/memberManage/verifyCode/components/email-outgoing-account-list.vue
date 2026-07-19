<script lang="ts" setup>
import type {
  EmailOutgoingAccountForm,
  EmailOutgoingAccountItem,
} from '#/types/email-verify-code';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  Modal,
  Result,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';

import {
  addEmailOutgoingAccountApi,
  deleteEmailOutgoingAccountApi,
  fetchEmailOutgoingAccountListApi,
  setPrimaryEmailOutgoingAccountApi,
  updateEmailOutgoingAccountApi,
} from '#/api/memberManage/email-verify-code';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'EmailOutgoingAccountList' });

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(13089));

const loading = ref(false);
const saving = ref(false);
const list = ref<EmailOutgoingAccountItem[]>([]);
const modalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const form = ref<EmailOutgoingAccountForm>({
  EmailAccount: '',
  EmailPassword: '',
  EmailSmtp: '',
});

async function loadList() {
  loading.value = true;
  try {
    const result = await fetchEmailOutgoingAccountListApi();
    if (Array.isArray(result)) {
      list.value = result;
    } else if (result && typeof result === 'object') {
      const items = (result as { Items?: EmailOutgoingAccountItem[] }).Items;
      list.value = Array.isArray(items) ? items : [];
    } else {
      list.value = [];
    }
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  modalMode.value = 'create';
  form.value = { EmailAccount: '', EmailPassword: '', EmailSmtp: '' };
  modalOpen.value = true;
}

function openEdit(row: EmailOutgoingAccountItem) {
  modalMode.value = 'edit';
  form.value = {
    EmailAccount: String(row.EmailAccount || ''),
    EmailPassword: String(row.EmailPassword || ''),
    EmailSmtp: String(row.EmailSmtp || ''),
    Id: row.Id,
  };
  modalOpen.value = true;
}

async function handleSubmit() {
  if (
    !form.value.EmailAccount ||
    !form.value.EmailPassword ||
    !form.value.EmailSmtp
  ) {
    message.warning('请填写完整信息');
    return;
  }
  saving.value = true;
  try {
    if (modalMode.value === 'create') {
      await addEmailOutgoingAccountApi(form.value);
      message.success('新增成功');
    } else if (form.value.Id) {
      await updateEmailOutgoingAccountApi(form.value.Id, form.value);
      message.success('编辑成功');
    }
    modalOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: EmailOutgoingAccountItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '确认删除该邮箱通道？',
    onOk: async () => {
      await deleteEmailOutgoingAccountApi(row.Id!);
      message.success('删除成功');
      await loadList();
    },
    title: '提示',
  });
}

async function handleSetPrimary(row: EmailOutgoingAccountItem) {
  if (!row.Id || row.IsPrimary) {
    return;
  }
  saving.value = true;
  try {
    await setPrimaryEmailOutgoingAccountApi(row.Id);
    message.success('设置成功');
    await loadList();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (canView.value) {
    loadList();
  }
});
</script>

<template>
  <OpsListPanel v-if="canView">
    <template #filters>
      <div class="ml-auto">
        <Button type="primary" @click="openCreate">新增账号</Button>
      </div>
    </template>

    <Table
      bordered
      :columns="[
        { dataIndex: 'EmailAccount', key: 'email', title: '邮箱地址' },
        { dataIndex: 'EmailPassword', key: 'password', title: '邮箱密码' },
        { dataIndex: 'EmailSmtp', key: 'smtp', title: 'SMTP 地址' },
        { key: 'actions', title: '操作', width: 260 },
      ]"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'email'">
          <Space>
            <span>{{ record.EmailAccount }}</span>
            <Tag v-if="record.IsPrimary" color="blue">当前使用</Tag>
          </Space>
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space>
            <Button
              :disabled="Boolean(record.IsPrimary)"
              size="small"
              type="primary"
              @click="handleSetPrimary(record)"
            >
              使用
            </Button>
            <Button size="small" @click="openEdit(record)">编辑</Button>
            <Button
              :disabled="Boolean(record.IsPrimary)"
              danger
              size="small"
              @click="handleDelete(record)"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      :confirm-loading="saving"
      :open="modalOpen"
      :title="modalMode === 'create' ? '新增邮箱通道' : '编辑邮箱通道'"
      @cancel="modalOpen = false"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <Form.Item label="邮箱地址" required>
          <Input v-model:value="form.EmailAccount" placeholder="请输入" />
        </Form.Item>
        <Form.Item label="邮箱密码" required>
          <Input.Password
            v-model:value="form.EmailPassword"
            placeholder="请输入"
          />
        </Form.Item>
        <Form.Item label="SMTP 服务器" required>
          <Input v-model:value="form.EmailSmtp" placeholder="请输入" />
        </Form.Item>
      </Form>
    </Modal>
  </OpsListPanel>
  <Result v-else status="403" sub-title="无邮箱通道配置权限" title="403" />
</template>

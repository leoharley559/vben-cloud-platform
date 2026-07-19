<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import {
  createAgentWithdrawAccountApi,
  deleteAgentWithdrawAccountApi,
  fetchAgentWithdrawAccountListApi,
  updateAgentWithdrawAccountApi,
} from '#/api/netcash/agency-account-details';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import type { NetcashListResult } from '#/types/netcash';

defineOptions({ name: 'AgencyFinancePanel' });

const props = defineProps<{
  adminId: number | string;
}>();

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(11_254));
const canAdd = computed(() => checkPermission(11_260));
const canEdit = computed(() => checkPermission(11_261));
const canDelete = computed(() => checkPermission(11_262));

const ALIPAY_TYPE = 2;

const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);

const columns = computed(() => [
  { dataIndex: 'Account', key: 'Account', title: '支付宝账号' },
  { dataIndex: 'RealName', key: 'RealName', title: '真实姓名' },
  ...(canEdit.value || canDelete.value
    ? [{ dataIndex: 'actions', key: 'actions', title: '操作', width: 160 }]
    : []),
]);

async function loadList() {
  if (!props.adminId || !canView.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchAgentWithdrawAccountListApi(props.adminId);
    const items = Array.isArray(result)
      ? result
      : (result as NetcashListResult)?.Items || [];
    rows.value = items.filter((item) => Number(item.Type) === ALIPAY_TYPE);
  } finally {
    loading.value = false;
  }
}

const modalOpen = ref(false);
const submitting = ref(false);
const isCreate = ref(true);
const form = reactive({
  Account: '',
  Id: '' as number | string,
  RealName: '',
  ValidCode: '',
});

function openCreateModal() {
  isCreate.value = true;
  form.Id = '';
  form.Account = '';
  form.RealName = '';
  form.ValidCode = '';
  modalOpen.value = true;
}

function openEditModal(row: Record<string, unknown>) {
  isCreate.value = false;
  form.Id = String(row.Id ?? '');
  form.Account = String(row.Account ?? '');
  form.RealName = String(row.RealName ?? '');
  form.ValidCode = '';
  modalOpen.value = true;
}

async function submitModal() {
  if (!form.Account.trim()) {
    message.warning('请输入支付宝账号');
    return;
  }
  if (!form.RealName.trim()) {
    message.warning('请输入真实姓名');
    return;
  }
  if (!/^\d{6}$/.test(form.ValidCode)) {
    message.warning('请输入 6 位谷歌验证码');
    return;
  }
  submitting.value = true;
  try {
    if (isCreate.value) {
      await createAgentWithdrawAccountApi({
        Account: form.Account.trim(),
        AdminId: props.adminId,
        RealName: form.RealName.trim(),
        Type: ALIPAY_TYPE,
        ValidCode: form.ValidCode,
      });
    } else {
      await updateAgentWithdrawAccountApi({
        Account: form.Account.trim(),
        AdminId: props.adminId,
        Id: form.Id,
        RealName: form.RealName.trim(),
        Type: ALIPAY_TYPE,
        ValidCode: form.ValidCode,
      });
    }
    message.success(isCreate.value ? '添加成功' : '编辑成功');
    modalOpen.value = false;
    await loadList();
  } finally {
    submitting.value = false;
  }
}

const deleteModalOpen = ref(false);
const deleteSubmitting = ref(false);
const deleteId = ref<number | string>('');
const deleteValidCode = ref('');

function openDeleteModal(row: Record<string, unknown>) {
  deleteId.value = String(row.Id ?? '');
  deleteValidCode.value = '';
  deleteModalOpen.value = true;
}

async function submitDelete() {
  if (!/^\d{6}$/.test(deleteValidCode.value)) {
    message.warning('请输入 6 位谷歌验证码');
    return;
  }
  deleteSubmitting.value = true;
  try {
    await deleteAgentWithdrawAccountApi(deleteId.value, {
      ValidCode: deleteValidCode.value,
    });
    message.success('已删除');
    deleteModalOpen.value = false;
    await loadList();
  } finally {
    deleteSubmitting.value = false;
  }
}

watch(
  () => props.adminId,
  () => {
    void loadList();
  },
);

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div v-if="canView">
    <div v-if="canAdd" class="mb-3">
      <Button type="primary" @click="openCreateModal">新增支付宝账户</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'actions'">
          <Space :size="0">
            <Button
              v-if="canEdit"
              size="small"
              type="link"
              @click="openEditModal(record as Record<string, unknown>)"
            >
              编辑
            </Button>
            <Button
              v-if="canDelete"
              danger
              size="small"
              type="link"
              @click="openDeleteModal(record as Record<string, unknown>)"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>
    <p class="mt-2 text-xs text-gray-500">
      MVP 仅支持支付宝账户；银行卡 / USDT / 电子钱包待下一迭代
    </p>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="isCreate ? '新增支付宝账户' : '编辑支付宝账户'"
      @ok="submitModal"
    >
      <Form layout="vertical">
        <Form.Item label="支付宝账号" required>
          <Input v-model:value="form.Account" placeholder="请输入账号" />
        </Form.Item>
        <Form.Item label="真实姓名" required>
          <Input v-model:value="form.RealName" placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item label="谷歌验证码" required>
          <Input
            v-model:value="form.ValidCode"
            :maxlength="6"
            placeholder="6 位数字"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="deleteModalOpen"
      :confirm-loading="deleteSubmitting"
      ok-type="danger"
      title="删除支付宝账户"
      @ok="submitDelete"
    >
      <Form layout="vertical">
        <Form.Item label="谷歌验证码" required>
          <Input
            v-model:value="deleteValidCode"
            :maxlength="6"
            placeholder="6 位数字"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
  <div v-else class="text-sm text-gray-500">无财务账户查看权限</div>
</template>

<script lang="ts" setup>
import type { BankCardListItem } from '#/types/bank-card';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createBankCardApi,
  deleteBankCardApi,
  fetchBankCardListApi,
  updateBankCardApi,
} from '#/api/memberManage/bank-card';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'PlayerAlipayList' });

const props = defineProps<{
  deviceId?: string;
  loginAccount?: string;
  packageName?: string;
  playerId: number | string;
}>();

/** 与银行卡一致，PageId=8 */
const ALIPAY_SECURITY_PAGE_ID = 8;

const { checkPermission } = useCloudPermission();

const canSection = computed(() => checkPermission(11_180));
const canView = computed(() => checkPermission(11_298));
const canCreate = computed(() => checkPermission(11_299));
const canEdit = computed(() => checkPermission(11_405));
const canDelete = computed(() => checkPermission(11_300));

const loading = ref(false);
const saving = ref(false);
const list = ref<BankCardListItem[]>([]);
const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const deleteIsBlack = ref(false);
const pendingDeleteId = ref<number | string>('');
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const passAction = ref<'delete' | 'save'>('save');

const form = reactive({
  AlipayAccount: '',
  AlipayName: '',
  Id: '' as number | string,
});

const columns = [
  { dataIndex: 'AlipayName', key: 'AlipayName', title: '支付宝名', width: 140 },
  {
    dataIndex: 'AlipayAccount',
    key: 'AlipayAccount',
    title: '支付宝账号',
    width: 180,
  },
  {
    dataIndex: 'BankCardTime',
    key: 'BankCardTime',
    title: '绑定时间',
    width: 170,
  },
  { key: 'action', title: '操作', width: 140 },
];

function formatTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

async function loadList() {
  if (!props.playerId || !canSection.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchBankCardListApi({
      Page: 1,
      PageSize: 50,
      PlayerId: props.playerId,
    });
    list.value = (result?.Items || []).filter((item) => !!item.AlipayAccount);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  formMode.value = 'create';
  form.Id = '';
  form.AlipayName = '';
  form.AlipayAccount = '';
  formOpen.value = true;
}

function openEdit(row: BankCardListItem) {
  formMode.value = 'edit';
  form.Id = row.Id ?? '';
  form.AlipayName = String(row.AlipayName || '');
  form.AlipayAccount = String(row.AlipayAccount || '');
  formOpen.value = true;
}

function requestSave() {
  if (!form.AlipayName.trim() || !form.AlipayAccount.trim()) {
    message.warning('请填写支付宝名和账号');
    return;
  }
  passAction.value = 'save';
  passPopupRef.value?.validate(ALIPAY_SECURITY_PAGE_ID);
}

async function doSave(extra: Record<string, unknown> = {}) {
  saving.value = true;
  try {
    const payload = {
      AlipayAccount: form.AlipayAccount.trim(),
      AlipayName: form.AlipayName.trim(),
      DeviceId: props.deviceId || '',
      LoginAccount: props.loginAccount || '',
      PackageName: props.packageName || '',
      PlayerId: props.playerId,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    };
    if (formMode.value === 'create') {
      await createBankCardApi({
        ...payload,
        Hash: createRequestHash(),
        OperationType: 1,
      });
      message.success('支付宝已添加');
    } else {
      await updateBankCardApi({
        ...payload,
        Id: form.Id,
      });
      message.success('支付宝已更新');
    }
    formOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

function requestDelete(row: BankCardListItem) {
  if (row.Id === undefined || row.Id === null || row.Id === '') {
    return;
  }
  pendingDeleteId.value = row.Id;
  deleteIsBlack.value = false;
  passAction.value = 'delete';
  passPopupRef.value?.prompt(ALIPAY_SECURITY_PAGE_ID);
}

async function doDelete(extra: Record<string, unknown> = {}) {
  if (pendingDeleteId.value === '') {
    return;
  }
  loading.value = true;
  try {
    await deleteBankCardApi(pendingDeleteId.value, {
      IsBlack: deleteIsBlack.value,
      OperationType: 2,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    });
    message.success('已删除');
    await loadList();
  } finally {
    loading.value = false;
    pendingDeleteId.value = '';
  }
}

function handlePassConfirm(data: Record<string, unknown>) {
  if (passAction.value === 'delete') {
    void doDelete(data);
    return;
  }
  void doSave(data);
}

watch(
  () => props.playerId,
  () => {
    void loadList();
  },
);

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div v-if="canSection" class="mt-4">
    <div class="mb-2 flex items-center justify-between">
      <div class="text-sm font-medium">支付宝</div>
      <Button v-if="canCreate" size="small" type="primary" @click="openCreate">
        新增支付宝
      </Button>
    </div>

    <Table
      v-if="canView"
      bordered
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :row-key="(record) => String(record.Id ?? record.AlipayAccount)"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'BankCardTime'">
          {{ formatTime(record.BankCardTime) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Space :size="0">
            <Button
              v-if="canEdit"
              size="small"
              type="link"
              @click="openEdit(record)"
            >
              编辑
            </Button>
            <Button
              v-if="canDelete"
              danger
              size="small"
              type="link"
              @click="requestDelete(record)"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="formOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="formMode === 'create' ? '新增支付宝' : '编辑支付宝'"
      @ok="requestSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="支付宝名" required>
          <Input
            v-model:value="form.AlipayName"
            allow-clear
            placeholder="请输入支付宝名"
          />
        </Form.Item>
        <Form.Item label="支付宝账号" required>
          <Input
            v-model:value="form.AlipayAccount"
            allow-clear
            placeholder="请输入支付宝账号"
          />
        </Form.Item>
      </Form>
    </Modal>

    <PassPopup
      ref="passPopupRef"
      :prompt-msg="passAction === 'delete' ? '确认删除该支付宝？' : ''"
      :title="passAction === 'delete' ? '删除支付宝' : '安全验证'"
      @confirm="handlePassConfirm"
    >
      <template v-if="passAction === 'delete'" #extra>
        <Checkbox v-model:checked="deleteIsBlack" class="mt-3">
          删除同时加入黑名单
        </Checkbox>
      </template>
    </PassPopup>
  </div>
</template>

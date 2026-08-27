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

defineOptions({ name: 'PlayerWechatList' });

const props = defineProps<{
  deviceId?: string;
  loginAccount?: string;
  packageName?: string;
  playerId: number | string;
}>();

/** 与银行卡 / 支付宝一致，PageId=8 */
const WECHAT_SECURITY_PAGE_ID = 8;

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
const qrPreviewOpen = ref(false);
const qrPreview = reactive({
  account: '',
  name: '',
  url: '',
});

const form = reactive({
  Id: '' as number | string,
  WechatAccount: '',
  WechatName: '',
});

const columns = [
  { dataIndex: 'WechatName', key: 'WechatName', title: '微信名', width: 140 },
  {
    dataIndex: 'WechatAccount',
    key: 'WechatAccount',
    title: '微信账号',
    width: 180,
  },
  {
    dataIndex: 'BankCardTime',
    key: 'BankCardTime',
    title: '绑定时间',
    width: 170,
  },
  { key: 'qrCode', title: '收款码', width: 90 },
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
    const accounts = result?.WechatAccounts || [];
    list.value =
      accounts.length > 0
        ? accounts.map((item) => ({
            BankCardTime: item.CreateTime,
            Id: item.Id,
            QrCodeUrl: String(item.QrCodeUrl || ''),
            WechatAccount: String(item.Account || ''),
            WechatName: String(item.Name || ''),
          }))
        : (result?.Items || []).filter((item) => !!item.WechatAccount);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  formMode.value = 'create';
  form.Id = '';
  form.WechatName = '';
  form.WechatAccount = '';
  formOpen.value = true;
}

function openEdit(row: BankCardListItem) {
  formMode.value = 'edit';
  form.Id = row.Id ?? '';
  form.WechatName = String(row.WechatName || '');
  form.WechatAccount = String(row.WechatAccount || '');
  formOpen.value = true;
}

function openQrPreview(row: BankCardListItem) {
  qrPreview.name = String(row.WechatName || '');
  qrPreview.account = String(row.WechatAccount || '');
  qrPreview.url = String(row.QrCodeUrl || '').trim();
  qrPreviewOpen.value = true;
}

function requestSave() {
  if (!form.WechatName.trim() || !form.WechatAccount.trim()) {
    message.warning('请填写微信名和账号');
    return;
  }
  passAction.value = 'save';
  passPopupRef.value?.validate(WECHAT_SECURITY_PAGE_ID);
}

async function doSave(extra: Record<string, unknown> = {}) {
  saving.value = true;
  try {
    const payload = {
      DeviceId: props.deviceId || '',
      LoginAccount: props.loginAccount || '',
      PackageName: props.packageName || '',
      PlayerId: props.playerId,
      WechatAccount: form.WechatAccount.trim(),
      WechatName: form.WechatName.trim(),
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    };
    if (formMode.value === 'create') {
      await createBankCardApi({
        ...payload,
        Hash: createRequestHash(),
        OperationType: 1,
      });
      message.success('微信已添加');
    } else {
      await updateBankCardApi({
        ...payload,
        Id: form.Id,
      });
      message.success('微信已更新');
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
  passPopupRef.value?.prompt(WECHAT_SECURITY_PAGE_ID);
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
      <div class="text-sm font-medium">微信</div>
      <Button v-if="canCreate" size="small" type="primary" @click="openCreate">
        新增微信
      </Button>
    </div>

    <Table
      v-if="canView"
      bordered
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :row-key="(record) => String(record.Id ?? record.WechatAccount)"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'BankCardTime'">
          {{ formatTime(record.BankCardTime) }}
        </template>
        <template v-else-if="column.key === 'qrCode'">
          <Button size="small" type="link" @click="openQrPreview(record)">
            查看
          </Button>
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
      v-model:open="qrPreviewOpen"
      :footer="null"
      destroy-on-close
      title="微信收款码"
      width="420px"
    >
      <div class="space-y-3 pt-1">
        <div class="text-sm">
          <div>账号名：{{ qrPreview.name || '-' }}</div>
          <div class="mt-1">账号：{{ qrPreview.account || '-' }}</div>
        </div>
        <div class="flex min-h-[200px] items-center justify-center rounded border border-dashed border-gray-200 bg-gray-50 p-4">
          <img
            v-if="qrPreview.url"
            :alt="`${qrPreview.name || '微信'}收款码`"
            class="max-h-[280px] max-w-full object-contain"
            :src="qrPreview.url"
          />
          <span v-else class="text-sm text-gray-400">玩家暂未上传</span>
        </div>
      </div>
    </Modal>

    <Modal
      v-model:open="formOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="formMode === 'create' ? '新增微信' : '编辑微信'"
      @ok="requestSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="微信名" required>
          <Input
            v-model:value="form.WechatName"
            allow-clear
            placeholder="请输入微信名"
          />
        </Form.Item>
        <Form.Item label="微信账号" required>
          <Input
            v-model:value="form.WechatAccount"
            allow-clear
            placeholder="请输入微信账号"
          />
        </Form.Item>
      </Form>
    </Modal>

    <PassPopup
      ref="passPopupRef"
      :prompt-msg="passAction === 'delete' ? '确认删除该微信？' : ''"
      :title="passAction === 'delete' ? '删除微信' : '安全验证'"
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

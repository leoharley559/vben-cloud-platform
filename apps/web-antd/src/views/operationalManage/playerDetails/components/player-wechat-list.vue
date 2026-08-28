<script lang="ts" setup>
import type { BankCardListItem } from '#/types/bank-card';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Alert,
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
import GoogleCodeField from '#/components/security/google-code-field.vue';
import { checkSecured } from '#/components/security/security-utils';
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
/** 后台暂不代玩家新增，仅保留编辑/删除 */
const canCreate = computed(() => false);
const canEdit = computed(() => checkPermission(11_405));
const canDelete = computed(() => checkPermission(11_300));

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const list = ref<BankCardListItem[]>([]);
const formOpen = ref(false);
const deleteOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const deleteIsBlack = ref(false);
const deleteValidCode = ref('');
const pendingDeleteRow = ref<BankCardListItem | null>(null);
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
  ValidCode: '',
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
  form.ValidCode = '';
  formOpen.value = true;
}

function openEdit(row: BankCardListItem) {
  formMode.value = 'edit';
  form.Id = row.Id ?? '';
  form.WechatName = String(row.WechatName || '');
  form.WechatAccount = String(row.WechatAccount || '');
  form.ValidCode = '';
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
  if (
    checkSecured(WECHAT_SECURITY_PAGE_ID) &&
    !/^\d{6}$/.test(form.ValidCode.trim())
  ) {
    message.warning('请输入6位谷歌验证码');
    return;
  }
  void doSave(
    form.ValidCode.trim()
      ? { ValidCode: form.ValidCode.trim() }
      : {},
  );
}

async function doSave(extra: Record<string, unknown> = {}) {
  saving.value = true;
  try {
    const payload = {
      Account: form.WechatAccount.trim(),
      AccountType: 2,
      DeviceId: props.deviceId || '',
      Name: form.WechatName.trim(),
      PlayerId: props.playerId,
      ResourceType: 'withdrawal_account' as const,
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
  pendingDeleteRow.value = row;
  deleteIsBlack.value = false;
  deleteValidCode.value = '';
  deleteOpen.value = true;
}

function requestDeleteConfirm() {
  if (
    checkSecured(WECHAT_SECURITY_PAGE_ID) &&
    !/^\d{6}$/.test(deleteValidCode.value.trim())
  ) {
    message.warning('请输入6位谷歌验证码');
    return;
  }
  void doDelete(
    deleteValidCode.value.trim()
      ? { ValidCode: deleteValidCode.value.trim() }
      : {},
  );
}

async function doDelete(extra: Record<string, unknown> = {}) {
  const row = pendingDeleteRow.value;
  if (!row?.Id) {
    return;
  }
  deleting.value = true;
  try {
    await deleteBankCardApi({
      AccountType: 2,
      Id: row.Id,
      IsBlack: deleteIsBlack.value,
      ResourceType: 'withdrawal_account',
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    });
    message.success('已删除');
    deleteOpen.value = false;
    await loadList();
  } finally {
    deleting.value = false;
    pendingDeleteRow.value = null;
  }
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
        <GoogleCodeField
          :page-id="WECHAT_SECURITY_PAGE_ID"
          v-model:value="form.ValidCode"
        />
      </Form>
    </Modal>

    <Modal
      v-model:open="deleteOpen"
      :confirm-loading="deleting"
      destroy-on-close
      title="删除微信"
      @ok="requestDeleteConfirm"
    >
      <div class="mb-3">
        <Alert
          message="删除数据则会删除玩家绑定，是否继续？"
          show-icon
          type="warning"
        />
      </div>
      <div v-if="pendingDeleteRow" class="mb-3 space-y-1 text-sm text-gray-700">
        <div>微信名：{{ pendingDeleteRow.WechatName || '-' }}</div>
        <div>微信账号：{{ pendingDeleteRow.WechatAccount || '-' }}</div>
      </div>
      <Form layout="vertical" class="pt-2">
        <GoogleCodeField
          compact
          :page-id="WECHAT_SECURITY_PAGE_ID"
          v-model:value="deleteValidCode"
        />
        <Form.Item class="!mb-0">
          <Checkbox v-model:checked="deleteIsBlack">
            删除同时加入黑名单
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

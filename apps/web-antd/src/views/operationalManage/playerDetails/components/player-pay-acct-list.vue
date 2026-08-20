<script lang="ts" setup>
import type { EWalletListItem } from '#/types/e-wallet';

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
  createEWalletApi,
  deleteEWalletApi,
  fetchPlayerPayAcctListApi,
  updateEWalletApi,
} from '#/api/memberManage/e-wallet';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';

defineOptions({ name: 'PlayerPayAcctList' });

const props = defineProps<{
  playerId: number | string;
}>();
const PAY_ACCT_SECURITY_PAGE_ID = 9;
const MAX_BIND = 10;
const ACCOUNT_REGEX = /^(?=.{11,12}$)(09|639|\*)[0-9*]*$/;

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canSection = computed(() => checkPermission(12_693));
const canView = computed(() => checkPermission(12_694));
const canCreate = computed(() => checkPermission(12_695));
const canEdit = computed(() => checkPermission(12_696));
const canDelete = computed(() => checkPermission(12_697));

const platforms = [
  { id: 201, logId: 16, name: 'GCash' },
  { id: 202, logId: 17, name: 'GrabPay' },
  { id: 203, logId: 18, name: 'PayMaya' },
];

const openPlatformIds = computed(() => {
  const list = projectConfig.value?.WithdrawTypeList as
    | Array<{ IsOpen?: boolean | number; Key?: number | string }>
    | undefined;
  if (!list?.length) {
    return new Set(platforms.map((item) => item.id));
  }
  return new Set(
    list
      .filter((item) => Number(item.IsOpen) === 1 || item.IsOpen === true)
      .map((item) => Number(item.Key))
      .filter((key) => platforms.some((p) => p.id === key)),
  );
});

const visiblePlatforms = computed(() =>
  platforms.filter((item) => openPlatformIds.value.has(item.id)),
);

const loading = ref(false);
const saving = ref(false);
const allList = ref<EWalletListItem[]>([]);
const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const currentPayType = ref(201);
const deleteIsBlack = ref(false);
const pendingDeleteId = ref<number | string>('');
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const passAction = ref<'delete' | 'save'>('save');

const form = reactive({
  Account: '',
  Id: '' as number | string,
  Name: '',
});

const columns = [
  { dataIndex: 'Name', key: 'Name', title: '真实姓名', width: 120 },
  { dataIndex: 'Account', key: 'Account', title: '账号', width: 160 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '创建时间', width: 170 },
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

function listByPayType(payType: number) {
  return allList.value.filter((item) => Number(item.PayType) === payType);
}

function normalizeList(data: unknown): EWalletListItem[] {
  if (Array.isArray(data)) {
    return data as EWalletListItem[];
  }
  if (data && typeof data === 'object') {
    const obj = data as { Items?: EWalletListItem[] };
    if (Array.isArray(obj.Items)) {
      return obj.Items;
    }
  }
  return [];
}

async function loadList() {
  if (!props.playerId || !canSection.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchPlayerPayAcctListApi(props.playerId);
    allList.value = normalizeList(result);
  } finally {
    loading.value = false;
  }
}

function openCreate(payType: number) {
  if (listByPayType(payType).length >= MAX_BIND) {
    message.warning(`最多绑定 ${MAX_BIND} 个账号`);
    return;
  }
  currentPayType.value = payType;
  formMode.value = 'create';
  form.Id = '';
  form.Name = '';
  form.Account = '';
  formOpen.value = true;
}

function openEdit(payType: number, row: EWalletListItem) {
  currentPayType.value = payType;
  formMode.value = 'edit';
  form.Id = row.Id ?? '';
  form.Name = String(row.Name || '').replaceAll('*', '');
  form.Account = String(row.Account || '');
  formOpen.value = true;
}

function requestSave() {
  const name = form.Name.trim().replaceAll('*', '');
  const account = form.Account.trim().replaceAll(/[^\d]/g, '');
  if (!name || !account) {
    message.warning('请填写姓名和账号');
    return;
  }
  if (!ACCOUNT_REGEX.test(account)) {
    message.warning('账号需为菲律宾手机号格式（09/639 开头，11–12 位）');
    return;
  }
  form.Name = name;
  form.Account = account;
  passAction.value = 'save';
  passPopupRef.value?.validate(PAY_ACCT_SECURITY_PAGE_ID);
}

async function doSave(extra: Record<string, unknown> = {}) {
  saving.value = true;
  try {
    const payload = {
      Account: form.Account,
      Name: form.Name,
      PayType: currentPayType.value,
      PlayerId: props.playerId,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    };
    if (formMode.value === 'create') {
      await createEWalletApi(payload);
      message.success('账号已添加');
    } else {
      await updateEWalletApi({ ...payload, Id: form.Id });
      message.success('账号已更新');
    }
    formOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

function requestDelete(row: EWalletListItem) {
  if (row.Id === undefined || row.Id === null || row.Id === '') {
    return;
  }
  pendingDeleteId.value = row.Id;
  deleteIsBlack.value = false;
  passAction.value = 'delete';
  passPopupRef.value?.prompt(PAY_ACCT_SECURITY_PAGE_ID);
}

async function doDelete(extra: Record<string, unknown> = {}) {
  if (pendingDeleteId.value === '') {
    return;
  }
  loading.value = true;
  try {
    await deleteEWalletApi(pendingDeleteId.value, {
      IsBlack: deleteIsBlack.value,
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

const currentPlatformName = computed(
  () =>
    platforms.find((item) => item.id === currentPayType.value)?.name ||
    '电子钱包',
);

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
  <div v-if="canSection && visiblePlatforms.length > 0" class="mt-4 space-y-4">
    <div
      v-for="platform in visiblePlatforms"
      :key="platform.id"
      class="rounded border border-gray-100 p-3"
    >
      <div class="mb-2 flex items-center justify-between">
        <div class="text-sm font-medium">{{ platform.name }}</div>
        <Button
          v-if="canCreate"
          size="small"
          type="primary"
          @click="openCreate(platform.id)"
        >
          新增{{ platform.name }}
        </Button>
      </div>

      <Table
        v-if="canView"
        bordered
        :columns="columns"
        :data-source="listByPayType(platform.id)"
        :loading="loading"
        :pagination="false"
        :row-key="(record) => String(record.Id ?? record.Account)"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'CreateTime'">
            {{ formatTime(record.CreateTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space :size="0">
              <Button
                v-if="canEdit"
                size="small"
                type="link"
                @click="openEdit(platform.id, record)"
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
    </div>

    <Modal
      v-model:open="formOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="
        formMode === 'create'
          ? `新增${currentPlatformName}`
          : `编辑${currentPlatformName}`
      "
      @ok="requestSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="真实姓名" required>
          <Input
            v-model:value="form.Name"
            allow-clear
            placeholder="请输入真实姓名"
          />
        </Form.Item>
        <Form.Item :label="`${currentPlatformName}账号`" required>
          <Input
            v-model:value="form.Account"
            allow-clear
            placeholder="09/639 开头手机号"
          />
        </Form.Item>
      </Form>
    </Modal>

    <PassPopup
      ref="passPopupRef"
      :prompt-msg="passAction === 'delete' ? '确认删除该电子钱包账号？' : ''"
      :title="passAction === 'delete' ? '删除账号' : '安全验证'"
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

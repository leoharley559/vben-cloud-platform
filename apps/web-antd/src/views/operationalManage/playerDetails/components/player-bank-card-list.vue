<script lang="ts" setup>
import type { BankCardListItem } from '#/types/bank-card';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
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
import { useProjectConfig } from '#/composables/use-project-config';
import { formatBankCode } from '#/utils/bank-card';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'PlayerBankCardList' });

/** 银行卡增删改安全校验 PageId（与旧站 GoogleCode page-id=8 一致） */
const BANK_CARD_SECURITY_PAGE_ID = 8;

const props = defineProps<{
  loginAccount?: string;
  packageName?: string;
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canSection = computed(() => checkPermission(11180));
const canView = computed(() => checkPermission(11298));
const canCreate = computed(() => checkPermission(11299));
const canEdit = computed(() => checkPermission(11405));
const canDelete = computed(() => checkPermission(11300));

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
  BankCardNum: '',
  BankCode: '',
  BankRealName: '',
  Id: '' as number | string,
});

const bankOptions = computed(() => {
  const listCfg = projectConfig.value?.BankList as
    | Array<{ BankCode?: string; BankName?: string; IsOpen?: number }>
    | undefined;
  return (listCfg || [])
    .filter((item) => item.BankCode && item.IsOpen !== 0)
    .map((item) => ({
      label: item.BankName || item.BankCode || '',
      value: item.BankCode || '',
    }));
});

const bankListForFormat = computed(
  () =>
    (projectConfig.value?.BankList as Array<{
      BankCode?: string;
      BankName?: string;
    }>) || [],
);

const columns = [
  { dataIndex: 'BankCode', key: 'BankCode', title: '银行', width: 140 },
  { dataIndex: 'RealName', key: 'RealName', title: '开户姓名', width: 120 },
  { dataIndex: 'BankCardNum', key: 'BankCardNum', title: '卡号', width: 180 },
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
    list.value = result?.Items || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  formMode.value = 'create';
  form.Id = '';
  form.BankCode = '';
  form.BankRealName = '';
  form.BankCardNum = '';
  formOpen.value = true;
}

function openEdit(row: BankCardListItem) {
  formMode.value = 'edit';
  form.Id = row.Id ?? '';
  form.BankCode = String(row.BankCode || '');
  form.BankRealName = String(row.RealName || row.BankRealName || '');
  form.BankCardNum = String(row.BankCardNum || '');
  formOpen.value = true;
}

function requestSave() {
  if (!form.BankCode || !form.BankRealName.trim() || !form.BankCardNum.trim()) {
    message.warning('请填写完整银行卡信息');
    return;
  }
  passAction.value = 'save';
  passPopupRef.value?.validate(BANK_CARD_SECURITY_PAGE_ID);
}

async function doSave(extra: Record<string, unknown> = {}) {
  saving.value = true;
  try {
    const payload = {
      BankCardNum: form.BankCardNum.trim(),
      BankCode: form.BankCode,
      BankRealName: form.BankRealName.trim(),
      LoginAccount: props.loginAccount || '',
      PackageName: props.packageName || '',
      PlayerId: props.playerId,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    };
    if (formMode.value === 'create') {
      await createBankCardApi({
        ...payload,
        Hash: createRequestHash(),
      });
      message.success('银行卡已添加');
    } else {
      await updateBankCardApi({
        ...payload,
        Id: form.Id,
      });
      message.success('银行卡已更新');
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
  passPopupRef.value?.prompt(BANK_CARD_SECURITY_PAGE_ID);
}

async function doDelete(extra: Record<string, unknown> = {}) {
  if (pendingDeleteId.value === '') {
    return;
  }
  loading.value = true;
  try {
    await deleteBankCardApi(pendingDeleteId.value, {
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
      <div class="text-sm font-medium">银行卡</div>
      <Button v-if="canCreate" size="small" type="primary" @click="openCreate">
        新增银行卡
      </Button>
    </div>

    <Table
      v-if="canView"
      bordered
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :row-key="(record) => String(record.Id ?? record.BankCardNum)"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'BankCode'">
          {{ formatBankCode(record.BankCode, bankListForFormat) }}
        </template>
        <template v-else-if="column.key === 'RealName'">
          {{ record.RealName || record.BankRealName || '-' }}
        </template>
        <template v-else-if="column.key === 'BankCardTime'">
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
      :title="formMode === 'create' ? '新增银行卡' : '编辑银行卡'"
      @ok="requestSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="银行" required>
          <Select
            v-model:value="form.BankCode"
            :options="bankOptions"
            class="!w-full"
            option-filter-prop="label"
            placeholder="请选择银行"
            show-search
          />
        </Form.Item>
        <Form.Item label="开户姓名" required>
          <Input
            v-model:value="form.BankRealName"
            allow-clear
            placeholder="请输入开户姓名"
          />
        </Form.Item>
        <Form.Item label="银行卡号" required>
          <Input
            v-model:value="form.BankCardNum"
            allow-clear
            :disabled="formMode === 'edit'"
            placeholder="请输入卡号"
          />
        </Form.Item>
      </Form>
    </Modal>

    <PassPopup
      ref="passPopupRef"
      :prompt-msg="passAction === 'delete' ? '确认删除该银行卡？' : ''"
      :title="passAction === 'delete' ? '删除银行卡' : '安全验证'"
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

<script lang="ts" setup>
import type { CryptoAddressListItem } from '#/types/crypto-address';
import {
  CRYPTO_CONFIG_TYPE_OPTIONS,
  formatCryptoConfigType,
} from '#/types/crypto-address';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import {
  createCryptoAddressApi,
  deleteCryptoAddressApi,
  fetchCryptoAddressListApi,
  updateCryptoAddressApi,
} from '#/api/memberManage/crypto-address';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'PlayerVirtualAddressList' });

/** 虚拟币地址安全校验 PageId（SECURITY_PATHS key 18） */
const CRYPTO_SECURITY_PAGE_ID = 18;

const props = defineProps<{
  loginAccount?: string;
  packageName?: string;
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canSection = computed(() => checkPermission(11181));
const canView = computed(() => checkPermission(11301));
const canCreate = computed(() => checkPermission(11299));
const canEdit = computed(() => checkPermission(11302));
const canDelete = computed(() => checkPermission(11303));

const loading = ref(false);
const saving = ref(false);
const list = ref<CryptoAddressListItem[]>([]);
const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const deleteIsBlack = ref(false);
const pendingDeleteId = ref<number | string>('');
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const passAction = ref<'delete' | 'save'>('save');

const form = reactive({
  DigitalAddress: '',
  DigitalAlias: '',
  DigitalConfigType: 1,
  DigitalType: 'USDT',
  Id: '' as number | string,
});

const columns = [
  { dataIndex: 'DigitalType', key: 'DigitalType', title: '币种', width: 90 },
  {
    dataIndex: 'DigitalConfigType',
    key: 'DigitalConfigType',
    title: '协议',
    width: 100,
  },
  {
    dataIndex: 'DigitalAlias',
    key: 'DigitalAlias',
    title: '别名',
    width: 140,
  },
  {
    dataIndex: 'DigitalAddress',
    key: 'DigitalAddress',
    title: '虚拟币地址',
  },
  { key: 'action', title: '操作', width: 140 },
];

function validateAddress(address: string, configType: number) {
  const value = address.replace(/\s/g, '');
  if (configType === 1 && !/^T/.test(value)) {
    return 'TRC20 地址需以 T 开头';
  }
  if (configType === 2 && !/^0x/.test(value)) {
    return 'ERC20 地址需以 0x 开头';
  }
  if (configType === 3 && !/^0x/.test(value)) {
    return '其他协议地址需以 0x 开头';
  }
  return '';
}

async function loadList() {
  if (!props.playerId || !canSection.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchCryptoAddressListApi({
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
  form.DigitalType = 'USDT';
  form.DigitalConfigType = 1;
  form.DigitalAlias = '';
  form.DigitalAddress = '';
  formOpen.value = true;
}

function openEdit(row: CryptoAddressListItem) {
  formMode.value = 'edit';
  form.Id = row.Id ?? '';
  form.DigitalType = String(row.DigitalType || 'USDT');
  form.DigitalConfigType = Number(row.DigitalConfigType || 1);
  form.DigitalAlias = String(row.DigitalAlias || '');
  form.DigitalAddress = String(row.DigitalAddress || '');
  formOpen.value = true;
}

function requestSave() {
  if (!form.DigitalAlias.trim() || !form.DigitalAddress.trim()) {
    message.warning('请填写别名和地址');
    return;
  }
  const addressError = validateAddress(
    form.DigitalAddress,
    form.DigitalConfigType,
  );
  if (addressError) {
    message.warning(addressError);
    return;
  }
  passAction.value = 'save';
  passPopupRef.value?.validate(CRYPTO_SECURITY_PAGE_ID);
}

async function doSave(extra: Record<string, unknown> = {}) {
  saving.value = true;
  try {
    const address = form.DigitalAddress.replace(/\s/g, '');
    const payload = {
      DigitalAddress: address,
      DigitalAlias: form.DigitalAlias.trim(),
      DigitalConfigType: form.DigitalConfigType,
      DigitalDesc: formatCryptoConfigType(form.DigitalConfigType),
      DigitalType: form.DigitalType || 'USDT',
      LoginAccount: props.loginAccount || '',
      PackageName: props.packageName || '',
      PlayerId: props.playerId,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    };
    if (formMode.value === 'create') {
      await createCryptoAddressApi({
        ...payload,
        Hash: createRequestHash(),
      });
      message.success('虚拟币地址已添加');
    } else {
      await updateCryptoAddressApi({
        ...payload,
        Id: form.Id,
      });
      message.success('虚拟币地址已更新');
    }
    formOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

function requestDelete(row: CryptoAddressListItem) {
  if (row.Id === undefined || row.Id === null || row.Id === '') {
    return;
  }
  pendingDeleteId.value = row.Id;
  deleteIsBlack.value = false;
  passAction.value = 'delete';
  passPopupRef.value?.prompt(CRYPTO_SECURITY_PAGE_ID);
}

async function doDelete(extra: Record<string, unknown> = {}) {
  if (pendingDeleteId.value === '') {
    return;
  }
  loading.value = true;
  try {
    await deleteCryptoAddressApi(pendingDeleteId.value, {
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
      <div class="text-sm font-medium">虚拟币地址</div>
      <Button v-if="canCreate" size="small" type="primary" @click="openCreate">
        新增地址
      </Button>
    </div>

    <Table
      v-if="canView"
      bordered
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :row-key="(record) => String(record.Id ?? record.DigitalAddress)"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'DigitalConfigType'">
          {{
            record.DigitalDesc ||
            formatCryptoConfigType(Number(record.DigitalConfigType))
          }}
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
      :title="formMode === 'create' ? '新增虚拟币地址' : '编辑虚拟币地址'"
      @ok="requestSave"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="币种" required>
          <Select
            v-model:value="form.DigitalType"
            :disabled="formMode === 'edit'"
            :options="[{ label: 'USDT', value: 'USDT' }]"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="协议" required>
          <Radio.Group v-model:value="form.DigitalConfigType">
            <Radio
              v-for="item in CRYPTO_CONFIG_TYPE_OPTIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item label="别名" required>
          <Input
            v-model:value="form.DigitalAlias"
            allow-clear
            placeholder="请输入别名"
          />
        </Form.Item>
        <Form.Item label="虚拟币地址" required>
          <Input.TextArea
            v-model:value="form.DigitalAddress"
            :rows="3"
            allow-clear
            placeholder="请输入地址"
          />
        </Form.Item>
      </Form>
    </Modal>

    <PassPopup
      ref="passPopupRef"
      :prompt-msg="passAction === 'delete' ? '确认删除该虚拟币地址？' : ''"
      :title="passAction === 'delete' ? '删除虚拟币地址' : '安全验证'"
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

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  message,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  addWithdrawPackageRuleApi,
  deleteWithdrawPackageRuleApi,
  fetchWithdrawPackageRulesApi,
  switchWithdrawWalletApi,
} from '#/api/gameManage/withdraw-rules';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';

const props = defineProps<{ mode: 'forced' | 'wallet' }>();

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const keyword = computed(() =>
  props.mode === 'wallet' ? 'WalletBind' : 'ForcedWithdrawal',
);
const title = computed(() =>
  props.mode === 'wallet' ? '钱包绑定产品设置' : '强制提现产品设置',
);
const canAdd = computed(
  () => props.mode === 'wallet' || checkPermission(12_953),
);
const canDelete = computed(
  () => props.mode === 'wallet' || checkPermission(12_954),
);
const canSwitchWallet = computed(
  () => props.mode === 'wallet' && checkPermission(13_209),
);

const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const walletSwitch = ref(0);
const query = reactive({ Page: 1, PageSize: 20 });
const modalOpen = ref(false);
const submitting = ref(false);
const form = reactive<{ PackageId?: number | string }>({});
const options = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '' && item.PackageId != null)
    .map((item) => ({
      label: String(item.PackageName || item.PackageId),
      value: item.PackageId as number | string,
    })),
);
const columns = [
  { key: 'index', title: '序号', width: 70 },
  { dataIndex: 'PackageName', key: 'PackageName', title: '所属产品' },
  { dataIndex: 'UpdateTime', key: 'UpdateTime', title: '添加时间' },
  { dataIndex: 'Operator', key: 'Operator', title: '操作人' },
  { key: 'actions', title: '操作', width: 100 },
];

async function load() {
  loading.value = true;
  try {
    const result = await fetchWithdrawPackageRulesApi({
      ...query,
      KeyWord: keyword.value,
    });
    rows.value = result.Items || [];
    total.value = Number(result.Pagination?.MaxCount || rows.value.length);
    walletSwitch.value = Number(result.SwitchWallet ?? walletSwitch.value);
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  form.PackageId = undefined;
  modalOpen.value = true;
}

async function submit() {
  if (form.PackageId === undefined) {
    message.warning('请选择产品');
    return;
  }
  submitting.value = true;
  try {
    await addWithdrawPackageRuleApi({
      KeyWord: keyword.value,
      PackageId: form.PackageId,
    });
    message.success('添加成功');
    modalOpen.value = false;
    await load();
  } finally {
    submitting.value = false;
  }
}

function remove(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认删除产品「${row.PackageName || ''}」？`,
    okType: 'danger',
    title: '删除',
    onOk: async () => {
      await deleteWithdrawPackageRuleApi({
        KeyWord: keyword.value,
        WalletBindingConfigId: row.Id,
      });
      message.success('删除成功');
      await load();
    },
  });
}

async function changeWalletSwitch(checked: boolean) {
  const previous = walletSwitch.value;
  walletSwitch.value = checked ? 1 : 0;
  try {
    await switchWithdrawWalletApi(walletSwitch.value);
    message.success('设置成功');
    await load();
  } catch {
    walletSwitch.value = previous;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Space>
        <strong>{{ title }}</strong>
        <template v-if="mode === 'wallet'">
          <span class="text-gray-500">钱包绑定锁定</span>
          <Switch
            v-if="canSwitchWallet"
            :checked="walletSwitch === 1"
            @change="(checked) => changeWalletSwitch(!!checked)"
          />
          <span v-else>{{ walletSwitch === 1 ? '开启' : '关闭' }}</span>
        </template>
      </Space>
      <Button v-if="canAdd" type="primary" @click="openAdd">新增产品</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, index, record }">
        <template v-if="column.key === 'index'">
          {{ (query.Page - 1) * query.PageSize + index + 1 }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button v-if="canDelete" danger type="link" @click="remove(record)">
            删除
          </Button>
          <span v-else>-</span>
        </template>
      </template>
    </Table>
    <Pagination
      v-if="total > query.PageSize"
      v-model:current="query.Page"
      v-model:page-size="query.PageSize"
      class="mt-3 text-right"
      :total="total"
      @change="load"
    />
    <Modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      title="新增产品"
      @ok="submit"
    >
      <Form layout="vertical">
        <Form.Item label="产品" required>
          <Select
            v-model:value="form.PackageId"
            :options="options"
            allow-clear
            placeholder="请选择产品"
            show-search
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

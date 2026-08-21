<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Result,
  Select,
  Table,
} from 'ant-design-vue';

import {
  createAppStoreWhiteRiskApi,
  deleteAppStoreWhiteRiskApi,
  fetchAppStoreWhiteRiskListApi,
} from '#/api/operationManage/game-risk-control';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'AppStoreWhitelistPanel' });

const APP_STORE_KEY_OPTIONS = [
  { label: 'h4_ios (奇异果)', value: 'h4_ios' },
  { label: 'h6_ios (奇异果体育)', value: 'h6_ios' },
  { label: 'h7_ios (足球竞彩)', value: 'h7_ios' },
  { label: 'h8_ios (精彩足球)', value: 'h8_ios' },
  { label: 'h9_ios (世界杯竞彩)', value: 'h9_ios' },
  { label: 'oh01 (竞猜世界杯)', value: 'oh01' },
  { label: 'ou01 (竞彩足球)', value: 'ou01' },
  { label: 'ou2 (体育竞猜)', value: 'ou2' },
  { label: 'z1_ios (芒果体育)', value: 'z1_ios' },
  { label: 'h10_ios (足球竞猜)', value: 'h10_ios' },
  { label: 'h11_ios (竞猜体育)', value: 'h11_ios' },
  { label: 'h12_ios (黑白体育)', value: 'h12_ios' },
  { label: 'h13_ios (黑白直播)', value: 'h13_ios' },
  { label: 'h14_ios (世界杯竞猜)', value: 'h14_ios' },
  { label: 'h15_ios (世界杯足球)', value: 'h15_ios' },
  { label: 'h16_ios (奇异果体育)', value: 'h16_ios' },
  { label: 'h17_ios (果体育)', value: 'h17_ios' },
  { label: 'h18_ios (疯狂直播)', value: 'h18_ios' },
];

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(11_343));
const canCreate = computed(() => checkPermission(11_344));
const canDelete = computed(() => checkPermission(11_345));

const loading = ref(false);
const saving = ref(false);
const createOpen = ref(false);
const filterKey = ref('h4_ios');
const list = ref<Array<Record<string, unknown>>>([]);

const form = reactive({
  Key: 'h4_ios',
  UUID: '',
});

const columns = [
  { dataIndex: 'created_at', key: 'created_at', title: '创建时间', width: 180 },
  { dataIndex: 'UUID', key: 'UUID', title: '设备 ID' },
  { dataIndex: 'Key', key: 'Key', title: '包体类型', width: 140 },
  { key: 'action', title: '操作', width: 100 },
];

async function loadList() {
  if (!canView.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchAppStoreWhiteRiskListApi({
      Key: filterKey.value,
    });
    const rows =
      (result as { WhitelistList?: Array<Record<string, unknown>> | null })
        ?.WhitelistList ||
      (result as { Items?: Array<Record<string, unknown>> | null })?.Items ||
      [];
    list.value = (rows || []).map((item) => ({
      ...item,
      Key: item.Key || filterKey.value,
      created_at: String(item.created_at || '').split('.')[0],
    }));
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.Key = filterKey.value || 'h4_ios';
  form.UUID = '';
  createOpen.value = true;
}

async function submitCreate() {
  if (!form.Key || !form.UUID.trim()) {
    message.warning('请填写完整信息');
    return;
  }
  saving.value = true;
  try {
    await createAppStoreWhiteRiskApi({
      Key: form.Key,
      UUID: form.UUID.trim(),
    });
    message.success('新增成功');
    createOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

function handleDelete(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认删除设备「${row.UUID}」？`,
    onOk: async () => {
      await deleteAppStoreWhiteRiskApi({
        Key: String(row.Key || filterKey.value),
        UUID: String(row.UUID || ''),
      });
      message.success('已删除');
      await loadList();
    },
    title: '删除白名单',
  });
}

function resetFilters() {
  filterKey.value = 'h4_ios';
  void loadList();
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div v-if="canView">
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <Select v-model:value="filterKey" :options="APP_STORE_KEY_OPTIONS" />
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="loadList">
            查询
          </Button>
          <Button @click="resetFilters">重置</Button>
        </div>
      </div>
    </div>

    <div
      v-if="canCreate"
      class="mb-2 flex flex-wrap items-center justify-end gap-2"
    >
      <Button type="primary" @click="openCreate">新增</Button>
    </div>

    <Table
      bordered
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :row-key="(record) => String(record.UUID ?? '')"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="handleDelete(record)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="新增 App Store 白名单"
      @ok="submitCreate"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="包 Key" required>
          <Select
            v-model:value="form.Key"
            :options="APP_STORE_KEY_OPTIONS"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="设备 ID (UUID)" required>
          <Input
            v-model:value="form.UUID"
            allow-clear
            placeholder="请输入设备 UUID"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
  <Result v-else status="403" sub-title="需要列表权限 11343" title="无权限" />
</template>

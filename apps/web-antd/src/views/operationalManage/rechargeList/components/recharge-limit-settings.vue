<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RechargeLimitConfigItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Form,
  InputNumber,
  Modal,
  Result,
  Space,
  message,
} from 'ant-design-vue';

import {
  createRechargeLimitConfigApi,
  deleteRechargeLimitConfigApi,
  fetchRechargeLimitConfigListApi,
  updateRechargeLimitConfigApi,
} from '#/api/operationManage/recharge-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'RechargeLimitSettings' });

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(10265));
const canCreate = computed(() => checkPermission(10266));
const canEdit = computed(() => checkPermission(10267));
const canDelete = computed(() => checkPermission(10268));

const modalOpen = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const saving = ref(false);
const formState = ref<RechargeLimitConfigItem>({
  Duration: undefined,
  Limit: undefined,
  Vip: undefined,
});

const gridOptions: VxeTableGridOptions<RechargeLimitConfigItem> = {
  columns: [
    { field: 'Vip', minWidth: 100, title: 'VIP等级' },
    { field: 'Duration', minWidth: 120, title: '重置间隔(分钟)' },
    { field: 'Limit', minWidth: 100, title: '充值次数' },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const result = await fetchRechargeLimitConfigListApi({
          Page: 1,
          PageSize: 1000,
        });
        return {
          items: result?.Items || [],
          total: result?.Items?.length || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function openCreate() {
  modalMode.value = 'add';
  formState.value = { Duration: undefined, Limit: undefined, Vip: undefined };
  modalOpen.value = true;
}

function openEdit(row: RechargeLimitConfigItem) {
  modalMode.value = 'edit';
  formState.value = { ...row };
  modalOpen.value = true;
}

async function handleSave() {
  if (
    formState.value.Vip === undefined ||
    formState.value.Duration === undefined ||
    formState.value.Limit === undefined
  ) {
    message.warning('请填写完整信息');
    return;
  }

  saving.value = true;
  try {
    if (modalMode.value === 'add') {
      await createRechargeLimitConfigApi(formState.value);
      message.success('新增成功');
    } else {
      await updateRechargeLimitConfigApi(formState.value);
      message.success('保存成功');
    }
    modalOpen.value = false;
    gridApi.reload();
  } finally {
    saving.value = false;
  }
}

function handleDelete(row: RechargeLimitConfigItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '确认删除该充值次数设置？',
    onOk: async () => {
      await deleteRechargeLimitConfigApi(row.Id!);
      message.success('删除成功');
      gridApi.reload();
    },
    title: '删除确认',
  });
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="mb-4 flex items-center justify-between">
      <span class="font-medium">充值次数限制</span>
      <Button v-if="canCreate" type="primary" @click="openCreate">
        新增设置
      </Button>
    </div>

    <Grid>
      <template #actions="{ row }">
        <Space :size="4">
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="handleDelete(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="saving"
      :title="modalMode === 'add' ? '新增充值次数' : '编辑充值次数'"
      @ok="handleSave"
    >
      <Form layout="vertical">
        <Form.Item v-if="modalMode === 'add'" label="VIP等级" required>
          <InputNumber
            v-model:value="formState.Vip"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="重置间隔(分钟)" required>
          <InputNumber
            v-model:value="formState.Duration"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="充值次数" required>
          <InputNumber
            v-model:value="formState.Limit"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>
      </Form>
      <p class="text-center text-sm text-red-500">
        设置后，玩家在重置间隔内超过充值次数将被限制
      </p>
    </Modal>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10265 才能查看充值次数设置"
    title="无权限"
  />
</template>

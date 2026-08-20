<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createPlayerRemarkApi,
  deletePlayerRemarkApi,
  fetchPlayerRemarkListApi,
  updatePlayerRemarkApi,
} from '#/api/operationManage/player';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'PlayerListRemarkDrawer' });

const props = defineProps<{
  loginAccount?: string;
  open: boolean;
  playerId: null | number | string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const { checkPermission } = useCloudPermission();
const canView = computed(() => checkPermission(10_015));
const canCreate = computed(() => checkPermission(10_062));

const loading = ref(false);
const saving = ref(false);
const list = ref<Array<Record<string, unknown>>>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dialogOpen = ref(false);
const dialogType = ref<'create' | 'update'>('create');
const form = reactive({
  Id: '' as number | string,
  Remark: '',
});

const columns = [
  { dataIndex: 'time', key: 'time', title: '时间', width: 170 },
  { dataIndex: 'Name', key: 'Name', title: '操作人', width: 120 },
  { dataIndex: 'Remark', key: 'Remark', title: '备注内容' },
  { key: 'action', title: '操作', width: 140 },
];

function formatTime(row: Record<string, unknown>) {
  const raw = Number(row.UpdateTime) > 0 ? row.UpdateTime : row.CreateTime;
  if (!raw || Number(raw) === 0) {
    return '-';
  }
  const num = Number(raw);
  const parsed = String(raw).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : String(raw);
}

async function loadList() {
  if (!props.playerId || !canView.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchPlayerRemarkListApi({
      IsSelf: true,
      Page: page.value,
      PageSize: pageSize.value,
      PlayerId: props.playerId,
    });
    list.value = (result?.Items || []) as Array<Record<string, unknown>>;
    total.value = Number(result?.Pagination?.MaxCount || list.value.length);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.playerId],
  ([open]) => {
    if (open && props.playerId) {
      page.value = 1;
      void loadList();
    }
  },
);

function openCreate() {
  dialogType.value = 'create';
  form.Id = '';
  form.Remark = '';
  dialogOpen.value = true;
}

function openEdit(row: Record<string, unknown>) {
  dialogType.value = 'update';
  form.Id = row.Id as number | string;
  form.Remark = String(row.Remark || '');
  dialogOpen.value = true;
}

async function handleSave() {
  if (!props.playerId) {
    return;
  }
  if (!form.Remark.trim()) {
    message.warning('请填写备注');
    return;
  }
  saving.value = true;
  try {
    if (dialogType.value === 'create') {
      await createPlayerRemarkApi({
        Hash: createRequestHash(),
        PlayerId: props.playerId,
        Remark: form.Remark.trim(),
      });
      message.success('备注已新增');
    } else {
      await updatePlayerRemarkApi({
        Id: form.Id,
        PlayerId: props.playerId,
        Remark: form.Remark.trim(),
      });
      message.success('备注已更新');
    }
    dialogOpen.value = false;
    await loadList();
  } finally {
    saving.value = false;
  }
}

function handleDelete(row: Record<string, unknown>) {
  Modal.confirm({
    content: '确认删除该备注？',
    title: '删除备注',
    onOk: async () => {
      await deletePlayerRemarkApi(row.Id as number | string);
      message.success('删除成功');
      await loadList();
    },
  });
}
function handlePageChange(p: number, ps: number) {
  page.value = p;
  pageSize.value = ps;
  void loadList();
}
</script>

<template>
  <Drawer
    :open="open"
    :title="`玩家备注 · ${loginAccount || playerId || ''}`"
    :width="640"
    destroy-on-close
    @close="emit('update:open', false)"
  >
    <div v-if="canView">
      <div class="mb-3 flex justify-end">
        <Button v-if="canCreate" type="primary" @click="openCreate">
          新增备注
        </Button>
      </div>
      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="{
          current: page,
          pageSize,
          total,
          onChange: handlePageChange,
        }"
        :row-key="(row) => String(row.Id)"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'time'">
            {{ formatTime(record) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space :size="0">
              <Button size="small" type="link" @click="openEdit(record)">
                编辑
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="handleDelete(record)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </div>
    <div v-else class="text-gray-500">无备注查看权限</div>

    <Modal
      v-model:open="dialogOpen"
      :confirm-loading="saving"
      :title="dialogType === 'create' ? '新增备注' : '编辑备注'"
      @ok="handleSave"
    >
      <Form layout="vertical">
        <Form.Item label="备注" required>
          <Input.TextArea v-model:value="form.Remark" :rows="4" />
        </Form.Item>
      </Form>
    </Modal>
  </Drawer>
</template>

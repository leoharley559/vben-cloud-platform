<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
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

defineOptions({ name: 'PlayerRemarkList' });

const props = defineProps<{
  playerId: number | string;
}>();

interface RemarkItem {
  CreateTime?: number | string;
  Id?: number | string;
  Name?: string;
  Remark?: string;
  UpdateTime?: number | string;
  [key: string]: unknown;
}

const { checkPermission } = useCloudPermission();
const canSection = computed(() => checkPermission(11_182));
const canView = computed(() => checkPermission(11_304));
const canCreate = computed(() => checkPermission(11_305));
const canEdit = computed(() => checkPermission(11_306));
const canDelete = computed(() => checkPermission(12_397));

const loading = ref(false);
const saving = ref(false);
const list = ref<RemarkItem[]>([]);
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

function formatTime(row: RemarkItem) {
  const raw = Number(row.UpdateTime) > 0 ? row.UpdateTime : row.CreateTime;
  if (!raw || Number(raw) === 0) {
    return '-';
  }
  const num = Number(raw);
  const parsed = String(raw).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : String(raw);
}

async function loadList() {
  if (!props.playerId || !canSection.value) {
    return;
  }
  loading.value = true;
  try {
    const result = await fetchPlayerRemarkListApi({
      IsSelf: false,
      Page: page.value,
      PageSize: pageSize.value,
      PlayerId: props.playerId,
    });
    list.value = (result?.Items || []) as RemarkItem[];
    total.value = Number(result?.Pagination?.MaxCount || 0);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  dialogType.value = 'create';
  form.Id = '';
  form.Remark = '';
  dialogOpen.value = true;
}

function openEdit(row: RemarkItem) {
  dialogType.value = 'update';
  form.Id = row.Id ?? '';
  form.Remark = String(row.Remark || '');
  dialogOpen.value = true;
}

async function submitRemark() {
  if (!form.Remark.trim()) {
    message.warning('请填写备注内容');
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
      message.success('备注已添加');
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

function handleDelete(row: RemarkItem) {
  if (row.Id === undefined || row.Id === null || row.Id === '') {
    return;
  }
  Modal.confirm({
    content: '确认删除该备注？',
    onOk: async () => {
      await deletePlayerRemarkApi(row.Id as number | string);
      message.success('已删除');
      await loadList();
    },
    title: '删除备注',
  });
}

function handleTableChange(pagination: {
  current?: number;
  pageSize?: number;
}) {
  page.value = pagination.current || 1;
  pageSize.value = pagination.pageSize || 10;
  void loadList();
}

watch(
  () => props.playerId,
  () => {
    page.value = 1;
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
      <div class="text-sm font-medium">玩家备注</div>
      <Button v-if="canCreate" size="small" type="primary" @click="openCreate">
        新增备注
      </Button>
    </div>

    <Table
      v-if="canView"
      bordered
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        showSizeChanger: true,
        total,
      }"
      :row-key="(record) => String(record.Id ?? record.CreateTime)"
      size="small"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'time'">
          {{ formatTime(record) }}
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
              @click="handleDelete(record)"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="dialogOpen"
      :confirm-loading="saving"
      destroy-on-close
      :title="dialogType === 'create' ? '新增备注' : '编辑备注'"
      @ok="submitRemark"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="备注内容" required>
          <Input.TextArea
            v-model:value="form.Remark"
            :rows="4"
            allow-clear
            placeholder="请输入备注"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

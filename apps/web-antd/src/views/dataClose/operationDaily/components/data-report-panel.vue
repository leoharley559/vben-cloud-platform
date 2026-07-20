<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  addWhatsAppRecipientApi,
  buyDataReportNumApi,
  createDataReportApi,
  deleteDataReportApi,
  deleteWhatsAppRecipientApi,
  fetchDataReportDetailApi,
  fetchDataReportListApi,
  fetchWhatsAppRecipientListApi,
  regenerateDataReportTokenApi,
  resendDataReportApi,
  toggleDataReportApi,
  updateDataReportApi,
} from '#/api/dataClose/operation-daily';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'DataReportPanel' });

type Row = Record<string, unknown>;

const { checkPermission } = useCloudPermission();

const canList = computed(() => checkPermission(12_362));
const canCreate = computed(() => checkPermission(12_359));
const canEdit = computed(() => checkPermission(12_363));
const canDelete = computed(() => checkPermission(12_361));
const canToggle = computed(() => checkPermission(12_364));
const canResend = computed(() => checkPermission(12_394));
const canBuy = computed(() => checkPermission(12_413));
const canRefreshToken = computed(() => checkPermission(12_445));
const canViewWhatsApp = computed(() => checkPermission(13_166));
const canAddWhatsApp = computed(() => checkPermission(13_167));
const canDeleteWhatsApp = computed(() => checkPermission(13_168));

const loading = ref(false);
const list = ref<Row[]>([]);
const limitCounter = ref(0);
const maxLimit = ref(0);
const modalOpen = ref(false);
const tokenOpen = ref(false);
const tokenText = ref('');
const editingId = ref<null | number | string>(null);
const whatsAppOpen = ref(false);
const whatsAppAddOpen = ref(false);
const whatsAppLoading = ref(false);
const whatsAppList = ref<Row[]>([]);
const currentReportId = ref<number | string>('');
const whatsAppForm = reactive({ User: '', Phone: '' });

const form = reactive({
  Filename: '',
  Type: 1,
  Details: '',
  ReportType: 1,
  Lang: 2,
  DivisorPeople: 10,
  DivisorAmount: 10,
  TelegramChannel: '',
  Status: 1,
});

const typeOptions = [
  { label: '代理账号', value: 1 },
  { label: '产品', value: 2 },
  { label: '渠道', value: 3 },
  { label: '上架包', value: 4 },
];
const timeOptions = [
  { label: '日报', value: 1 },
  { label: '月报', value: 2 },
];
const langOptions = [
  { label: 'en-US', value: 1 },
  { label: 'zh-CN', value: 2 },
];
const divisorOptions = [10, 100, 1000, 10_000].map((value) => ({
  label: String(value),
  value,
}));
const botStatusMap: Record<number, string> = {
  1: '未绑定',
  2: '已绑定',
  3: '可重发',
};

const columns = computed<TableColumnType<Row>[]>(() => [
  { align: 'center', key: 'Status', title: '开关', width: 80 },
  {
    align: 'center',
    dataIndex: 'Filename',
    key: 'Filename',
    title: '文件名',
  },
  { align: 'center', key: 'Type', title: '类型' },
  {
    align: 'center',
    dataIndex: 'Details',
    key: 'Details',
    title: '参数',
  },
  { align: 'center', key: 'ReportType', title: '周期' },
  { align: 'center', key: 'Divisor', title: '显示阈值' },
  { align: 'center', key: 'Lang', title: '语言' },
  {
    align: 'center',
    key: 'Telegram',
    title: 'Telegram',
  },
  { align: 'center', key: 'WhatsApp', title: 'WhatsApp' },
  { align: 'center', key: 'actions', title: '操作', width: 260 },
]);

async function loadWhatsApp() {
  whatsAppLoading.value = true;
  try {
    const data = await fetchWhatsAppRecipientListApi({
      CompanyReportId: currentReportId.value,
    });
    whatsAppList.value = data.Items || [];
  } catch {
    whatsAppList.value = [];
  } finally {
    whatsAppLoading.value = false;
  }
}

function openWhatsApp(row: Row) {
  currentReportId.value = row.Id as string;
  whatsAppOpen.value = true;
  void loadWhatsApp();
}

async function addWhatsApp() {
  await addWhatsAppRecipientApi({
    CompanyReportId: currentReportId.value,
    User: whatsAppForm.User,
    Phone: whatsAppForm.Phone,
  });
  message.success('已添加');
  whatsAppAddOpen.value = false;
  whatsAppForm.User = '';
  whatsAppForm.Phone = '';
  await loadWhatsApp();
}

async function removeWhatsApp(row: Row) {
  await deleteWhatsAppRecipientApi({
    Id: row.Id,
    CompanyReportId: currentReportId.value,
  });
  message.success('已删除');
  await loadWhatsApp();
}

async function loadList() {
  if (!canList.value) return;
  loading.value = true;
  try {
    const data = await fetchDataReportListApi({});
    list.value = data.Items || [];
    limitCounter.value = num(data.ItemsLimit?.CreatedCount);
    maxLimit.value = num(data.ItemsLimit?.CreateMaxLimit);
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

function num(value: unknown) {
  return Number(value || 0);
}

function typeLabel(value: unknown) {
  return typeOptions.find((item) => item.value === Number(value))?.label || '-';
}

function resetForm() {
  editingId.value = null;
  Object.assign(form, {
    Filename: '',
    Type: 1,
    Details: '',
    ReportType: 1,
    Lang: 2,
    DivisorPeople: 10,
    DivisorAmount: 10,
    TelegramChannel: '',
    Status: 1,
  });
}

function handleCreate() {
  resetForm();
  modalOpen.value = true;
}

async function handleEdit(row: Row) {
  editingId.value = row.Id as number | string;
  try {
    const detail = await fetchDataReportDetailApi(row.Id as string);
    Object.assign(form, {
      Filename: detail.Filename || row.Filename,
      Type: detail.Type || row.Type,
      Details: detail.Details || row.Details,
      ReportType: detail.ReportType || row.ReportType,
      Lang: detail.Lang || row.Lang,
      DivisorPeople: detail.DivisorPeople || row.DivisorPeople,
      DivisorAmount: detail.DivisorAmount || row.DivisorAmount,
      TelegramChannel: detail.TelegramChannel || row.TelegramChannel,
      Status: detail.Status ?? row.Status,
    });
    modalOpen.value = true;
  } catch {
    message.error('获取详情失败');
  }
}

async function handleSave() {
  const payload = { ...form };
  try {
    if (editingId.value) {
      await updateDataReportApi({ ...payload, Id: editingId.value });
      message.success('更新成功');
    } else {
      const result = (await createDataReportApi(payload)) as Row;
      message.success('创建成功');
      if (result?.Token) {
        tokenText.value = `/register ${result.Token}`;
        tokenOpen.value = true;
      }
    }
    modalOpen.value = false;
    await loadList();
  } catch {
    /* handled by request */
  }
}

async function handleToggle(row: Row) {
  try {
    await toggleDataReportApi(row.Id as string);
    message.success('状态已更新');
    await loadList();
  } catch {
    await loadList();
  }
}

async function handleDelete(row: Row) {
  Modal.confirm({
    content: `确认删除报表「${row.Filename}」？`,
    title: '删除确认',
    onOk: async () => {
      await deleteDataReportApi(row.Id as string);
      message.success('已删除');
      await loadList();
    },
  });
}

async function handleResend(row: Row) {
  await resendDataReportApi(row.Id as string);
  message.success('已触发重发');
}

async function handleRefreshToken(row: Row) {
  const result = (await regenerateDataReportTokenApi(row.Id as string)) as Row;
  tokenText.value = `/register ${result?.Token || ''}`;
  tokenOpen.value = true;
  await loadList();
}

async function handleBuy() {
  await buyDataReportNumApi();
  message.success('已购买额度');
  await loadList();
}

function copyToken() {
  void navigator.clipboard.writeText(tokenText.value);
  message.success('已复制');
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <Space>
        <span>
          允许报表数量: {{ limitCounter }} / {{ maxLimit }}
        </span>
        <Button v-if="canBuy" type="primary" @click="handleBuy">
          购买额度
        </Button>
      </Space>
      <Button v-if="canCreate" type="primary" @click="handleCreate">
        新增报表
      </Button>
    </div>

    <Table
      v-if="canList"
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'Status'">
          <Switch
            v-if="canToggle"
            :checked="Number(record.Status) === 1"
            @change="handleToggle(record)"
          />
          <span v-else>{{ Number(record.Status) === 1 ? '开' : '关' }}</span>
        </template>
        <template v-else-if="column.key === 'Type'">
          {{ typeLabel(record.Type) }}
        </template>
        <template v-else-if="column.key === 'ReportType'">
          {{ Number(record.ReportType) === 2 ? '月报' : '日报' }}
        </template>
        <template v-else-if="column.key === 'Divisor'">
          人数: {{ record.DivisorPeople }} / 金额: {{ record.DivisorAmount }}
        </template>
        <template v-else-if="column.key === 'Lang'">
          {{ Number(record.Lang) === 1 ? 'en-US' : 'zh-CN' }}
        </template>
        <template v-else-if="column.key === 'Telegram'">
          <div>{{ record.TelegramChannelName || record.TelegramChannel }}</div>
          <a
            v-if="canRefreshToken"
            @click="handleRefreshToken(record)"
          >
            {{ botStatusMap[Number(record.BotStatus)] || 'Token' }}
          </a>
        </template>
        <template v-else-if="column.key === 'WhatsApp'">
          <a v-if="canViewWhatsApp" @click="openWhatsApp(record)">
            绑定状态
          </a>
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space>
            <a v-if="canEdit" @click="handleEdit(record)">编辑</a>
            <a
              v-if="canResend && Number(record.BotStatus) === 3"
              @click="handleResend(record)"
            >
              重发
            </a>
            <a v-if="canDelete" class="text-red-500" @click="handleDelete(record)">
              删除
            </a>
          </Space>
        </template>
      </template>
    </Table>
    <div v-else class="py-8 text-center text-gray-400">无列表查看权限</div>

    <Modal
      v-model:open="modalOpen"
      :title="editingId ? '编辑报表' : '新增报表'"
      @ok="handleSave"
    >
      <Form layout="vertical">
        <Form.Item label="文件名" required>
          <Input v-model:value="form.Filename" />
        </Form.Item>
        <Form.Item label="类型">
          <Select v-model:value="form.Type" :options="typeOptions" />
        </Form.Item>
        <Form.Item label="参数">
          <Input v-model:value="form.Details" />
        </Form.Item>
        <Form.Item label="周期">
          <Select v-model:value="form.ReportType" :options="timeOptions" />
        </Form.Item>
        <Form.Item label="语言">
          <Select v-model:value="form.Lang" :options="langOptions" />
        </Form.Item>
        <Form.Item label="人数阈值">
          <Select
            v-model:value="form.DivisorPeople"
            :options="divisorOptions"
          />
        </Form.Item>
        <Form.Item label="金额阈值">
          <Select
            v-model:value="form.DivisorAmount"
            :options="divisorOptions"
          />
        </Form.Item>
        <Form.Item label="Telegram Channel">
          <Input v-model:value="form.TelegramChannel" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="tokenOpen"
      title="Telegram Token"
      ok-text="复制"
      @ok="copyToken"
    >
      <Input.TextArea :value="tokenText" :rows="3" readonly />
    </Modal>

    <Modal
      v-model:open="whatsAppOpen"
      :footer="null"
      title="WhatsApp 接收人"
      width="640px"
    >
      <div class="mb-3 flex justify-end">
        <Button
          v-if="canAddWhatsApp"
          type="primary"
          @click="whatsAppAddOpen = true"
        >
          新增账号
        </Button>
      </div>
      <Table
        :columns="[
          { align: 'center', dataIndex: 'User', key: 'User', title: '用户' },
          { align: 'center', dataIndex: 'Phone', key: 'Phone', title: '账号' },
          { align: 'center', key: 'waActions', title: '操作' },
        ]"
        :data-source="whatsAppList"
        :loading="whatsAppLoading"
        :pagination="false"
        bordered
        row-key="Id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'waActions'">
            <a
              v-if="canDeleteWhatsApp"
              class="text-red-500"
              @click="removeWhatsApp(record)"
            >
              删除
            </a>
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      v-model:open="whatsAppAddOpen"
      title="新增 WhatsApp 账号"
      @ok="addWhatsApp"
    >
      <Form layout="vertical">
        <Form.Item label="用户">
          <Input v-model:value="whatsAppForm.User" />
        </Form.Item>
        <Form.Item label="账号">
          <Input v-model:value="whatsAppForm.Phone" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

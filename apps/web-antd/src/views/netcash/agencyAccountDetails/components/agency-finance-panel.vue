<script lang="ts" setup>
import type { AgentWithdrawAccountPayload } from '#/api/netcash/agency-account-details';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import {
  createAgentWithdrawAccountApi,
  deleteAgentWithdrawAccountApi,
  fetchAgentRemarkListApi,
  fetchAgentWithdrawAccountListApi,
  fetchAgentWithdrawAccountLogsApi,
  updateAgentWithdrawAccountApi,
} from '#/api/netcash/agency-account-details';
import { fetchDrawingsChannelSettingListApi } from '#/api/netcash/drawmoney-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { AGENCY_REMARK_TYPE_MAP, formatNetcashDateTime } from '#/utils/netcash';

defineOptions({ name: 'AgencyFinancePanel' });
const props = defineProps<{ adminId: number | string }>();
const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
type DataRow = Record<string, unknown>;

const canView = computed(() => checkPermission(11_254));
const canAdd = computed(() => checkPermission(11_260));
const canEdit = computed(() => checkPermission(11_261));
const canDelete = computed(() => checkPermission(11_262));
const canRemark = computed(() => checkPermission(12_023));
const loading = ref(false);
const rows = ref<DataRow[]>([]);
const remarks = ref<DataRow[]>([]);
const channelTypes = ref<DataRow[]>([]);

const accountTypes = [
  { label: '支付宝', value: 2 },
  { label: 'USDT', value: 3 },
  { label: 'GCash', value: 201 },
  { label: 'GrabPay', value: 202 },
  { label: 'PayMaya', value: 203 },
  { label: '银行卡', value: 204 },
  { label: '银行卡（206）', value: 206 },
  { label: '银行卡（209）', value: 209 },
];
const bankTypes = new Set([204, 206, 209]);
const bankOptions = computed(() => {
  const list = (projectConfig.value?.BankList || []) as DataRow[];
  return list
    .filter((item) => Number(item.IsOpen ?? 1) === 1)
    .map((item) => ({
      bankName: String(item.BankName || item.Name || ''),
      label: String(item.BankName || item.Name || item.BankCode || ''),
      value: String(item.BankCode || item.Key || ''),
    }));
});
const visibleTypes = computed(() => {
  const configured =
    channelTypes.value.length > 0
      ? channelTypes.value
      : ((projectConfig.value?.WithdrawTypeList || []) as DataRow[]);
  const enabled = new Set(
    configured
      .filter((item) => Number(item.IsOpen ?? 1) === 1)
      .map((item) => Number(item.Key ?? item.WithdrawType)),
  );
  const used = new Set(rows.value.map((item) => Number(item.Type)));
  if (enabled.size === 0) return accountTypes;
  return accountTypes.filter(
    (item) => enabled.has(item.value) || used.has(item.value),
  );
});

function typeName(type: number) {
  return (
    accountTypes.find((item) => item.value === type)?.label || String(type)
  );
}
function listByType(type: number) {
  return rows.value.filter((item) => Number(item.Type) === type);
}
function columns(type: number) {
  const base = bankTypes.has(type)
    ? [
        { dataIndex: 'RealName', key: 'RealName', title: '持卡人' },
        { dataIndex: 'Account', key: 'Account', title: '银行卡号' },
        { dataIndex: 'Name', key: 'Name', title: '银行名称' },
      ]
    : (type === 3
      ? [
          { dataIndex: 'DigitalType', key: 'DigitalType', title: '链类型' },
          { dataIndex: 'Account', key: 'Account', title: 'USDT 地址' },
        ]
      : [
          { dataIndex: 'Account', key: 'Account', title: '账号' },
          { dataIndex: 'RealName', key: 'RealName', title: '真实姓名' },
        ]);
  return [
    ...base,
    ...(canEdit.value || canDelete.value
      ? [{ dataIndex: 'actions', key: 'actions', title: '操作', width: 150 }]
      : []),
  ];
}

async function loadList() {
  if (!props.adminId || !canView.value) return;
  loading.value = true;
  try {
    const [accounts, remarkResult] = await Promise.all([
      fetchAgentWithdrawAccountListApi(props.adminId),
      canRemark.value
        ? fetchAgentRemarkListApi(props.adminId)
        : Promise.resolve({ Items: [] }),
    ]);
    rows.value = accounts.Items || [];
    remarks.value = remarkResult.Items || [];
  } finally {
    loading.value = false;
  }
}

async function loadChannelTypes() {
  try {
    channelTypes.value = await fetchDrawingsChannelSettingListApi({
      Keyword: '',
      Page: 1,
      PageSize: 999,
      Sort: '',
    });
  } catch {
    channelTypes.value = [];
  }
}

const modalOpen = ref(false);
const submitting = ref(false);
const isCreate = ref(true);
const form = reactive({
  Account: '',
  BankCode: '',
  DigitalType: 'TRC20',
  Id: '' as number | string,
  Name: '',
  RealName: '',
  Type: 204,
  ValidCode: '',
});

function resetForm(type = 204) {
  Object.assign(form, {
    Account: '',
    BankCode: '',
    DigitalType: 'TRC20',
    Id: '',
    Name: '',
    RealName: '',
    Type: type,
    ValidCode: '',
  });
}
function openCreateModal() {
  isCreate.value = true;
  resetForm(visibleTypes.value[0]?.value || 204);
  modalOpen.value = true;
}
function openEditModal(row: DataRow) {
  isCreate.value = false;
  Object.assign(form, {
    Account: String(row.Account || ''),
    BankCode: String(row.BankCode || ''),
    DigitalType: String(row.DigitalType || 'TRC20'),
    Id: String(row.Id || ''),
    Name: String(row.Name || ''),
    RealName: String(row.RealName || ''),
    Type: Number(row.Type || 204),
    ValidCode: '',
  });
  modalOpen.value = true;
}
function bankChanged(value: unknown) {
  const bankCode = String(value || '');
  form.Name =
    bankOptions.value.find((item) => item.value === bankCode)?.bankName || '';
}

function normalizeAccountInput(value: string) {
  form.Account =
    form.Type === 2 || form.Type === 3
      ? value.replaceAll('*', '')
      : value.replaceAll(/[^\d*]/g, '');
}

function validate() {
  if (!form.Account.trim() || !/^\d{6}$/.test(form.ValidCode)) {
    message.warning('请填写账号和 6 位谷歌验证码');
    return false;
  }
  if (bankTypes.has(form.Type)) {
    if (!form.RealName.trim() || !form.BankCode) {
      message.warning('请填写持卡人并选择银行');
      return false;
    }
    if (!/^.{10,16}$/.test(form.Account.trim())) {
      message.warning('银行卡号长度须为 10–16 位');
      return false;
    }
  } else if (form.Type === 3) {
    const account = form.Account.trim();
    if (
      (form.DigitalType === 'TRC20' && !account.startsWith('T')) ||
      (form.DigitalType === 'ERC20' && !account.startsWith('0x'))
    ) {
      message.warning(`${form.DigitalType} 地址格式不正确`);
      return false;
    }
  } else if (
    [201, 202, 203].includes(form.Type) &&
    !/^(?=.{11,12}$)(09|639|\*)[0-9*]*$/.test(form.Account.trim())
  ) {
    message.warning('电子钱包账号须为 11–12 位，并以 09 或 639 开头');
    return false;
  } else if (!form.RealName.trim()) {
    message.warning('请输入真实姓名');
    return false;
  }
  return true;
}

async function submitModal() {
  if (!validate()) return;
  submitting.value = true;
  try {
    const payload: AgentWithdrawAccountPayload = {
      Account: form.Account.trim().replaceAll('*', ''),
      AdminId: props.adminId,
      Type: form.Type,
      ValidCode: form.ValidCode,
    };
    if (bankTypes.has(form.Type)) {
      Object.assign(payload, {
        BankCode: form.BankCode,
        Name: form.Name,
        RealName: form.RealName.trim(),
      });
    } else if (form.Type === 3) {
      payload.DigitalType = form.DigitalType;
    } else {
      payload.RealName = form.RealName.trim().replaceAll('*', '');
    }
    await (isCreate.value
      ? createAgentWithdrawAccountApi(payload)
      : updateAgentWithdrawAccountApi({ ...payload, Id: form.Id }));
    message.success(isCreate.value ? '添加成功' : '编辑成功');
    modalOpen.value = false;
    await loadList();
  } finally {
    submitting.value = false;
  }
}

const deleteOpen = ref(false);
const deleteId = ref<number | string>('');
const deleteCode = ref('');
function openDelete(row: DataRow) {
  deleteId.value = String(row.Id || '');
  deleteCode.value = '';
  deleteOpen.value = true;
}
async function submitDelete() {
  if (!/^\d{6}$/.test(deleteCode.value)) {
    message.warning('请输入 6 位谷歌验证码');
    return;
  }
  await deleteAgentWithdrawAccountApi(deleteId.value, {
    ValidCode: deleteCode.value,
  });
  message.success('删除成功');
  deleteOpen.value = false;
  await loadList();
}

const logsOpen = ref(false);
const logsLoading = ref(false);
const logs = ref<DataRow[]>([]);
async function openLogs(type: number) {
  logsOpen.value = true;
  logsLoading.value = true;
  try {
    const types = bankTypes.has(type) ? '204,206,209' : type;
    const result = await fetchAgentWithdrawAccountLogsApi(props.adminId, types);
    logs.value = result.Items || [];
  } finally {
    logsLoading.value = false;
  }
}

watch(() => props.adminId, loadList);
onMounted(() => {
  void loadChannelTypes();
  void loadList();
});
</script>

<template>
  <div v-if="canView" class="space-y-4">
    <div v-if="canAdd">
      <Button type="primary" @click="openCreateModal">新增提款账户</Button>
    </div>
    <Row :gutter="[12, 12]">
      <Col v-for="item in visibleTypes" :key="item.value" :lg="12" :xs="24">
        <Card size="small">
          <template #title>
            <Space>
              <span>{{ item.label }}</span>
              <Button size="small" type="link" @click="openLogs(item.value)">
                操作日志
              </Button>
            </Space>
          </template>
          <Table
            bordered
            :columns="columns(item.value)"
            :data-source="listByType(item.value)"
            :loading="loading"
            :pagination="false"
            :row-key="(row) => String(row.Id ?? '')"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'actions'">
                <Space :size="0">
                  <Button
                    v-if="canEdit"
                    size="small"
                    type="link"
                    @click="openEditModal(record)"
                  >
                    编辑
                  </Button>
                  <Button
                    v-if="canDelete"
                    danger
                    size="small"
                    type="link"
                    @click="openDelete(record)"
                  >
                    删除
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>

    <Card v-if="canRemark" size="small" title="备注">
      <Table
        bordered
        :columns="[
          { dataIndex: 'CreateTime', key: 'CreateTime', title: '日期' },
          { dataIndex: 'Remark', key: 'Remark', title: '备注内容' },
          { dataIndex: 'Type', key: 'Type', title: '操作类型' },
          {
            dataIndex: 'CreateAdminAccount',
            key: 'CreateAdminAccount',
            title: '操作人',
          },
        ]"
        :data-source="remarks"
        :loading="loading"
        :pagination="false"
        :row-key="(row) => String(row.Id ?? '')"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'CreateTime'">
            {{ formatNetcashDateTime(record.CreateTime) }}
          </template>
          <template v-else-if="column.key === 'Type'">
            {{
              AGENCY_REMARK_TYPE_MAP[Number(record.Type)] || record.Type || '-'
            }}
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="modalOpen"
      :confirm-loading="submitting"
      :title="`${isCreate ? '新增' : '编辑'}${typeName(form.Type)}账户`"
      @ok="submitModal"
    >
      <Form layout="vertical">
        <Form.Item v-if="isCreate" label="账户类型" required>
          <Select
            v-model:value="form.Type"
            :options="visibleTypes"
            @change="(value) => resetForm(Number(value))"
          />
        </Form.Item>
        <Form.Item v-if="bankTypes.has(form.Type)" label="开户银行" required>
          <Select
            v-model:value="form.BankCode"
            show-search
            :options="bankOptions"
            @change="bankChanged"
          />
        </Form.Item>
        <Form.Item v-if="form.Type === 3" label="数字货币类型" required>
          <Radio.Group v-model:value="form.DigitalType">
            <Radio value="TRC20">TRC20</Radio>
            <Radio value="ERC20">ERC20</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item v-else label="真实姓名" required>
          <Input v-model:value="form.RealName" />
        </Form.Item>
        <Form.Item :label="form.Type === 3 ? 'USDT 地址' : '账号'" required>
          <Input :value="form.Account" @update:value="normalizeAccountInput" />
        </Form.Item>
        <Form.Item label="谷歌验证码" required>
          <Input v-model:value="form.ValidCode" :maxlength="6" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="deleteOpen"
      ok-type="danger"
      title="删除提款账户"
      @ok="submitDelete"
    >
      <Form layout="vertical">
        <Form.Item label="谷歌验证码" required>
          <Input v-model:value="deleteCode" :maxlength="6" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="logsOpen"
      :footer="null"
      title="提款账户操作日志"
      width="720px"
    >
      <Table
        bordered
        :columns="[
          { dataIndex: 'CreateTime', key: 'CreateTime', title: '操作时间' },
          { dataIndex: 'Remark', key: 'Remark', title: '操作内容' },
          { dataIndex: 'HandlerName', key: 'HandlerName', title: '操作人' },
        ]"
        :data-source="logs"
        :loading="logsLoading"
        :pagination="false"
        :row-key="(row) => String(row.Id ?? '')"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'CreateTime'">
            {{ formatNetcashDateTime(record.CreateTime) }}
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

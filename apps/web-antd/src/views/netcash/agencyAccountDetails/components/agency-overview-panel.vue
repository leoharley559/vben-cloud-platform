<script lang="ts" setup>
import {
  computed,
  onBeforeUnmount,
  onDeactivated,
  reactive,
  ref,
  watch,
} from 'vue';

import {
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
} from 'ant-design-vue';

import {
  editAgentCommissionMoneyApi,
  editAgentMobileApi,
  fetchAgentMoneyModifyRecordApi,
  fetchAgentNetcashDetailApi,
  fetchAgentRemarkListApi,
} from '#/api/netcash/agency-account-details';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  AGENCY_ACCOUNT_TYPE_MAP,
  AGENCY_REMARK_TYPE_MAP,
  AGENCY_STATUS_MAP,
  AGENCY_TYPE_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

defineOptions({ name: 'AgencyOverviewPanel' });

const props = defineProps<{
  adminId: string;
}>();

const emit = defineEmits<{
  'update:summary': [payload: { name?: string; username?: string }];
}>();

const { checkPermission } = useCloudPermission();
const canBasics = computed(() => checkPermission(11_253));
const canEditMobile = computed(() => checkPermission(11_258));
const canEditMoney = computed(() => checkPermission(11_501));
const canRemark = computed(() => checkPermission(12_023));

const loading = ref(false);
const detail = ref<Record<string, unknown>>({});
const moneyRecords = ref<Record<string, unknown>[]>([]);
const remarks = ref<Record<string, unknown>[]>([]);

const displayMobile = computed(() =>
  String(detail.value.Mobile || detail.value.MobileNumber || ''),
);

const commissionDisplay = computed(() => {
  const level = Number(detail.value.AccountLevel);
  const accountType = Number(detail.value.AccountType);
  if (level === 1) {
    if (accountType === 1) {
      return (
        detail.value.CommissionTemplateName ||
        detail.value.CommissionTemplateId ||
        '-'
      );
    }
    if (accountType === 2) {
      return `${Number(detail.value.CommissionRate || 0) / 100}%`;
    }
    if (accountType === 3) {
      return (
        detail.value.CommissionMultiTemplateName ||
        detail.value.CommissionMultiTemplateId ||
        '-'
      );
    }
  }
  return accountType === 3
    ? '多场馆费率'
    : `${Number(detail.value.CommissionRate || 0) / 100}%`;
});

const canShowMoneyEdit = computed(
  () => canEditMoney.value && Number(detail.value.Type) !== 3,
);

let loadSeq = 0;

function emitSummary() {
  emit('update:summary', {
    name: String(detail.value.Name || ''),
    username: String(detail.value.Username || ''),
  });
}

async function loadDetail() {
  if (!props.adminId) return;
  const seq = ++loadSeq;
  loading.value = true;
  try {
    const nextDetail = await fetchAgentNetcashDetailApi(props.adminId);
    if (seq !== loadSeq) return;
    detail.value = nextDetail;
    emitSummary();
    if (canBasics.value) {
      const records = await fetchAgentMoneyModifyRecordApi(props.adminId);
      if (seq !== loadSeq) return;
      moneyRecords.value = records.Items || [];
    }
    if (canRemark.value) {
      const remarkResult = await fetchAgentRemarkListApi(props.adminId);
      if (seq !== loadSeq) return;
      remarks.value = remarkResult.Items || [];
    }
  } catch {
    if (seq !== loadSeq) return;
    detail.value = {};
    moneyRecords.value = [];
    remarks.value = [];
    emitSummary();
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
}

const phoneModalOpen = ref(false);
const phoneSubmitting = ref(false);
const phoneForm = reactive({
  BindPhone: '',
  PhoneCode: '86',
});

const phoneCodeOptions = [
  { label: '+86', value: '86' },
  { label: '+1', value: '1' },
  { label: '+60', value: '60' },
  { label: '+62', value: '62' },
  { label: '+63', value: '63' },
  { label: '+65', value: '65' },
  { label: '+66', value: '66' },
  { label: '+81', value: '81' },
  { label: '+82', value: '82' },
  { label: '+84', value: '84' },
  { label: '+853', value: '853' },
  { label: '+855', value: '855' },
  { label: '+886', value: '886' },
  { label: '+852', value: '852' },
];

function openPhoneModal() {
  const raw = displayMobile.value;
  if (raw.includes('_')) {
    const [code, phone] = raw.split('_');
    phoneForm.PhoneCode = code || '86';
    phoneForm.BindPhone = phone || '';
  } else {
    phoneForm.PhoneCode = '86';
    phoneForm.BindPhone = raw;
  }
  phoneModalOpen.value = true;
}

async function submitPhoneModal() {
  if (!phoneForm.BindPhone.trim()) {
    message.warning('请输入手机号');
    return;
  }
  phoneSubmitting.value = true;
  try {
    await editAgentMobileApi({
      Id: props.adminId,
      Mobile: `${phoneForm.PhoneCode}_${phoneForm.BindPhone.trim()}`,
    });
    message.success('手机号已更新');
    phoneModalOpen.value = false;
    await loadDetail();
  } catch {
    /* requestClient 已提示 */
  } finally {
    phoneSubmitting.value = false;
  }
}

const moneyModalOpen = ref(false);
const moneySubmitting = ref(false);
const moneyValue = ref<number | undefined>();
const moneyHistoryOpen = ref(false);
const rateOpen = ref(false);
const rateRows = computed(() => {
  const raw = detail.value.CommissionRate;
  if (
    Number(detail.value.AccountLevel) === 1 ||
    Number(detail.value.AccountType) !== 3
  ) {
    return [];
  }
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'string') return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
});

function openMoneyModal() {
  moneyValue.value = Number(detail.value.Money || 0) / 100;
  moneyModalOpen.value = true;
}

async function submitMoneyModal() {
  if (moneyValue.value === undefined || moneyValue.value < 0) {
    message.warning('请输入有效佣金余额');
    return;
  }
  if (!Number.isInteger(moneyValue.value)) {
    message.warning('请输入整数金额（元）');
    return;
  }
  moneySubmitting.value = true;
  try {
    await editAgentCommissionMoneyApi({
      AdminId: props.adminId,
      Money: Math.round(moneyValue.value * 100),
    });
    message.success('佣金余额已更新');
    moneyModalOpen.value = false;
    await loadDetail();
  } catch {
    /* requestClient 已提示 */
  } finally {
    moneySubmitting.value = false;
  }
}

function invalidatePendingLoads() {
  loadSeq += 1;
  phoneModalOpen.value = false;
  moneyModalOpen.value = false;
  moneyHistoryOpen.value = false;
  rateOpen.value = false;
}

watch(
  () => props.adminId,
  () => {
    invalidatePendingLoads();
    detail.value = {};
    moneyRecords.value = [];
    remarks.value = [];
    void loadDetail();
  },
  { immediate: true },
);

onDeactivated(() => {
  invalidatePendingLoads();
});
onBeforeUnmount(() => {
  invalidatePendingLoads();
});
</script>

<template>
  <div>
    <Spin :spinning="loading">
      <Descriptions v-if="canBasics" bordered :column="2" size="small">
        <Descriptions.Item label="代理账号">
          {{ detail.Username || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="姓名">
          {{ detail.Name || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {{ AGENCY_STATUS_MAP[Number(detail.Status)] || detail.Status }}
        </Descriptions.Item>
        <Descriptions.Item label="代理类型">
          {{ AGENCY_TYPE_MAP[Number(detail.Type)] || detail.Type }}
        </Descriptions.Item>
        <Descriptions.Item label="代理模式">
          {{
            AGENCY_ACCOUNT_TYPE_MAP[Number(detail.AccountType)] ||
            detail.AccountType
          }}
        </Descriptions.Item>
        <Descriptions.Item label="代理层级">
          {{ detail.AccountLevel || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="上级代理">
          {{ detail.AgentName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="手机号">
          <Space>
            <span>{{ displayMobile || '-' }}</span>
            <Button
              v-if="canEditMobile"
              size="small"
              type="link"
              @click="openPhoneModal"
            >
              {{ displayMobile ? '编辑' : '绑定' }}
            </Button>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="佣金余额">
          <Space>
            <span>{{ formatAmountFromCent(Number(detail.Money || 0)) }}</span>
            <Button
              v-if="canShowMoneyEdit"
              size="small"
              type="link"
              @click="openMoneyModal"
            >
              调整
            </Button>
            <Button
              v-if="canBasics"
              size="small"
              type="link"
              @click="moneyHistoryOpen = true"
            >
              调整记录
            </Button>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="注册时间">
          {{
            formatNetcashDateTime(
              (detail.RegisterCreateTime || detail.CreateTime) as string,
            )
          }}
        </Descriptions.Item>
        <Descriptions.Item label="团队">
          {{ detail.TeamName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="注册 IP / 地区">
          {{ detail.RegisterIp || '-' }}
          {{ detail.RegisterAddress || '' }}
        </Descriptions.Item>
        <Descriptions.Item label="注册设备编号">
          {{ detail.RegisterDeviceId || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="注册设备类型">
          {{ detail.RegisterLoginPlatform || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="最后登录设备编号">
          {{ detail.LastDeviceId || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="最后登录设备类型">
          {{ detail.LastLoginPlatform || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="所属分组">
          {{ detail.GroupName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="佣金算法">
          {{
            detail.AlgorithmTemplateName || detail.AlgorithmTemplateId || '-'
          }}
        </Descriptions.Item>
        <Descriptions.Item label="佣金模板 / 比例">
          <Space>
            <span>{{ commissionDisplay }}</span>
            <Button
              v-if="rateRows.length > 0"
              size="small"
              type="link"
              @click="rateOpen = true"
            >
              查看场馆比例
            </Button>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="佣金发放方式">
          {{
            Number(detail.SendCommissionType) === 1
              ? '系统发放一级代理'
              : Number(detail.SendCommissionType) === 2
                ? '系统发放全部代理'
                : '-'
          }}
        </Descriptions.Item>
        <Descriptions.Item label="佣金结算周期">
          {{
            ({ 1: '日结', 2: '周结', 3: '月结' } as Record<number, string>)[
              Number(detail.SettlementType)
            ] || '-'
          }}
        </Descriptions.Item>
      </Descriptions>
      <Space v-else>
        <span>
          状态：{{
            AGENCY_STATUS_MAP[Number(detail.Status)] || detail.Status || '-'
          }}
        </span>
        <span class="text-sm text-gray-500">无基础资料查看权限</span>
      </Space>
      <div v-if="canRemark" class="remark-block">
        <div class="remark-title">备注</div>
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
          :pagination="false"
          :row-key="(row) => String(row.Id ?? '')"
          size="small"
          :scroll="{ y: 220 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'CreateTime'">
              {{ formatNetcashDateTime(record.CreateTime) }}
            </template>
            <template v-else-if="column.key === 'Type'">
              {{
                AGENCY_REMARK_TYPE_MAP[Number(record.Type)] ||
                record.Type ||
                '-'
              }}
            </template>
          </template>
        </Table>
      </div>
    </Spin>

    <Modal
      v-model:open="phoneModalOpen"
      :confirm-loading="phoneSubmitting"
      destroy-on-close
      title="编辑手机号"
      @ok="submitPhoneModal"
    >
      <Form layout="vertical">
        <Form.Item label="区号">
          <Select
            v-model:value="phoneForm.PhoneCode"
            :options="phoneCodeOptions"
            style="width: 120px"
          />
        </Form.Item>
        <Form.Item label="手机号" required>
          <Input
            v-model:value="phoneForm.BindPhone"
            placeholder="请输入手机号"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="moneyModalOpen"
      :confirm-loading="moneySubmitting"
      destroy-on-close
      title="调整佣金余额"
      @ok="submitMoneyModal"
    >
      <Form layout="vertical">
        <Form.Item label="佣金余额（元，整数）" required>
          <InputNumber
            v-model:value="moneyValue"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="moneyHistoryOpen"
      destroy-on-close
      :footer="null"
      title="佣金余额调整记录"
      width="760px"
    >
      <Table
        bordered
        :columns="[
          { dataIndex: 'CreateTime', key: 'CreateTime', title: '日期' },
          { dataIndex: 'MoneyBefore', key: 'MoneyBefore', title: '调整前余额' },
          { dataIndex: 'MoneyAfter', key: 'MoneyAfter', title: '调整后余额' },
          { dataIndex: 'Handler', key: 'Handler', title: '操作人' },
        ]"
        :data-source="moneyRecords"
        :pagination="false"
        :row-key="(row) => String(row.Id ?? '')"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'CreateTime'">
            {{ formatNetcashDateTime(record.CreateTime) }}
          </template>
          <template
            v-else-if="
              ['MoneyBefore', 'MoneyAfter'].includes(String(column.key))
            "
          >
            {{
              formatAmountFromCent(Number(record[String(column.key)] || 0))
            }}
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      v-model:open="rateOpen"
      destroy-on-close
      :footer="null"
      title="场馆佣金比例"
      width="640px"
    >
      <Table
        bordered
        :columns="[
          { dataIndex: 'Name', key: 'Name', title: '场馆类型' },
          { dataIndex: 'WinLoseRate', key: 'WinLoseRate', title: '输赢占成' },
          { dataIndex: 'WaterRate', key: 'WaterRate', title: '返水占成' },
        ]"
        :data-source="rateRows"
        :pagination="false"
        :row-key="(row) => String(row.Id ?? row.Name ?? '')"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template
            v-if="['WinLoseRate', 'WaterRate'].includes(String(column.key))"
          >
            {{ Number(record[String(column.key)] || 0) / 100 }}%
          </template>
        </template>
      </Table>
    </Modal>
  </div>
</template>

<style scoped>
.remark-block {
  margin-top: 16px;
}

.remark-title {
  margin-bottom: 8px;
  font-weight: 600;
}
</style>

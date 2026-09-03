<script lang="ts" setup>
import type { AgencyListItem, AgentFanDianConfig } from '#/types/netcash';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
} from 'ant-design-vue';

import {
  createAgencyApi,
  fetchDeveloperNamesListApi,
  updateAgencyApi,
} from '#/api/netcash/agency';
import { fetchAgentNetcashDetailApi } from '#/api/netcash/agency-account-details';
import {
  fetchCommTempListApi,
  fetchMultCommTempListApi,
  fetchVenueTemplateListApi,
} from '#/api/netcash/commission-manage';
import { fetchCloneChannelPlanListApi } from '#/api/netcash/create-money-channel';
import { fetchJuniorAlgorithmOptionsApi } from '#/api/netcash/junior-member';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import {
  AGENCY_PHONE_AREA_CODE_OPTIONS,
  AGENCY_TYPE_FORM_OPTIONS,
  AGENCY_TYPE_FORM_OPTIONS_WITH_TEST,
  getAgentFanDianProjectConfig,
  getOrCreateAgencyDeviceId,
  initAgentFanDianFormFromAgent,
  initAgentFanDianFormFromProject,
  serializeAgentFanDianConfigForSubmit,
  validAgencyRemark,
} from '#/utils/netcash';

import AgencyFanDianFormPanel from './agency-fandian-form-panel.vue';

defineOptions({ name: 'AgencyFormModal' });

const props = defineProps<{
  mode: 'create' | 'edit';
  open: boolean;
  row?: AgencyListItem | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

/** 对齐旧站 showAgentFinanceFieldsInForm: false */
const SHOW_AGENT_FINANCE_FIELDS = false;
const DEFAULT_PHONE_AREA_CODE = '86_';

const cloudStore = useCloudPlatformStore();
const { packageOptions } = useOperationOptions();

const submitting = ref(false);
const formLoading = ref(false);
const validationMessage = ref('');
const optionsLoading = ref(false);
const clonePlanLoading = ref(false);
const developerOptions = ref<
  Array<{ developerName: string; label: string; value: number | string }>
>([]);
const commissionOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);
const multCommissionOptions = ref<
  Array<{ label: string; value: number | string }>
>([]);
const venueOptions = ref<Array<{ label: string; value: number | string }>>([]);
const algorithmOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);
const clonePlanOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);

const agentFanDianForm = ref<AgentFanDianConfig | null>(null);
const packageIds = ref<Array<number | string>>([]);
const suppressTypeWatch = ref(false);
const accountLevel = ref(1);
const editStatus = ref<number | undefined>();
const preservedLanguages = ref<unknown>(undefined);

const mobile = reactive({
  AreaCode: '',
  Phone: '',
});

const form = reactive({
  AccountType: 1 as number,
  AlgorithmTemplateId: undefined as number | string | undefined,
  ApiFeeTemplateId: undefined as number | string | undefined,
  CloneChannelPlanId: undefined as number | string | undefined,
  CommissionMultiTemplateId: undefined as number | string | undefined,
  CommissionRate: undefined as number | string | undefined,
  CommissionRateDiff: undefined as number | string | undefined,
  CommissionTemplateId: undefined as number | undefined,
  ConfirmPassword: '',
  DeveloperName: '',
  DeveloperId: undefined as number | string | undefined,
  MaintainerName: '',
  Name: '',
  Password: '',
  Remark: '',
  SendCommissionType: 1 as number | string,
  SettlementType: 3,
  Type: 2,
  Username: '',
});

const title = computed(() =>
  props.mode === 'create' ? '新增代理' : '编辑代理',
);

const isEditMode = computed(() => props.mode === 'edit');
const isTestAgent = computed(() => form.Type === 3);
const isFinanceLocked = computed(
  () => isEditMode.value && (accountLevel.value !== 1 || form.Type === 3),
);
const isAccountTypeLocked = computed(
  () => isEditMode.value || isTestAgent.value,
);
const isTypeLocked = computed(
  () => isEditMode.value && (accountLevel.value !== 1 || form.Type === 3),
);
const isSettlementTypeLocked = computed(
  () =>
    isTestAgent.value ||
    form.AccountType === 1 ||
    (isEditMode.value && accountLevel.value !== 1),
);
const isSendCommissionTypeLocked = computed(
  () => isTestAgent.value || (isEditMode.value && accountLevel.value !== 1),
);
const isCommissionRateDiffLocked = computed(
  () =>
    isTestAgent.value ||
    form.AccountType === 1 ||
    (isEditMode.value && accountLevel.value !== 1),
);
const hasAgentFanDianConfig = computed(
  () => !!getAgentFanDianProjectConfig(cloudStore.projectConfig),
);

const sendCommissionOptions = computed(() => {
  const options = [{ label: '系统发放一级代理', value: 1 }];
  if (form.AccountType !== 1) {
    options.push({ label: '系统发放全部代理', value: 2 });
  }
  return options;
});

const agencyTypeOptions = computed(() =>
  form.Type === 3 && isEditMode.value
    ? [...AGENCY_TYPE_FORM_OPTIONS_WITH_TEST]
    : [...AGENCY_TYPE_FORM_OPTIONS],
);

const realPackageList = computed(() =>
  packageOptions.value.filter(
    (item) => item.PackageId !== '' && item.PackageId != null,
  ),
);

function normalizeUsernameInput(value: string) {
  return value.replaceAll(' ', '').toLowerCase();
}

function handleUsernameInput(event: Event) {
  const target = event.target as HTMLInputElement;
  form.Username = normalizeUsernameInput(target.value);
}

function parseMobileFromRow(mobileValue?: string) {
  if (!mobileValue) {
    mobile.AreaCode = DEFAULT_PHONE_AREA_CODE;
    mobile.Phone = '';
    return;
  }
  const parts = String(mobileValue).split('_');
  mobile.AreaCode = parts[0] ? `${parts[0]}_` : DEFAULT_PHONE_AREA_CODE;
  mobile.Phone = parts[1] || '';
}

function failValidate(msg: string) {
  validationMessage.value = msg;
  message.error(msg);
  return false;
}

async function resolveEditRow(row: AgencyListItem) {
  const adminId = row.AdminId ?? row.Id;
  if (!adminId) {
    return row;
  }
  try {
    const detail = await fetchAgentNetcashDetailApi(adminId);
    if (detail && typeof detail === 'object' && Object.keys(detail).length > 0) {
      return { ...row, ...detail } as AgencyListItem;
    }
  } catch {
    // 详情接口失败时回退列表行数据
  }
  return row;
}

function syncDeveloperFromRow(row: AgencyListItem) {
  const rawId = row.DeveloperId;
  if (rawId !== undefined && rawId !== null && rawId !== '' && rawId !== 0) {
    const hit = developerOptions.value.find(
      (item) => String(item.value) === String(rawId),
    );
    if (hit) {
      form.DeveloperId = hit.value;
      form.DeveloperName = hit.developerName;
      return;
    }
  }

  const name = String(row.DeveloperName || '').trim();
  if (!name) {
    form.DeveloperId = undefined;
    form.DeveloperName = '';
    return;
  }

  const byName = developerOptions.value.find(
    (item) => item.developerName === name,
  );
  if (byName) {
    form.DeveloperId = byName.value;
    form.DeveloperName = byName.developerName;
    return;
  }

  form.DeveloperName = name;
  form.DeveloperId = undefined;
}

function syncCloneChannelPlanFromRow(row: AgencyListItem) {
  const rawId = row.CloneChannelPlanId;
  if (
    rawId === undefined ||
    rawId === null ||
    rawId === '' ||
    rawId === 0 ||
    rawId === '0'
  ) {
    form.CloneChannelPlanId = undefined;
    return;
  }
  const hit = clonePlanOptions.value.find(
    (item) => String(item.value) === String(rawId),
  );
  form.CloneChannelPlanId = hit ? hit.value : (rawId as number | string);
}

function fillCommissionRate(row: AgencyListItem) {
  const rate = row.CommissionRate;
  if (rate === undefined || rate === null || rate === '') {
    form.CommissionRate = undefined;
    return;
  }
  const level = Number(row.AccountLevel) || 1;
  const accountType = Number(row.AccountType) || 1;
  if (level !== 1 && accountType === 3) {
    if (typeof rate === 'string') {
      try {
        form.CommissionRate = JSON.parse(rate);
        return;
      } catch {
        form.CommissionRate = rate;
        return;
      }
    }
    form.CommissionRate = rate as number | string;
    return;
  }
  form.CommissionRate = Number((Number(rate) / 100).toFixed(2));
}

function resetForm() {
  form.Username = '';
  form.Password = '';
  form.ConfirmPassword = '';
  form.Name = '';
  form.DeveloperName = '';
  form.DeveloperId = undefined;
  form.MaintainerName = '';
  form.AccountType = 1;
  form.CommissionTemplateId = undefined;
  form.CommissionMultiTemplateId = undefined;
  form.CommissionRate = undefined;
  form.CommissionRateDiff = undefined;
  form.ApiFeeTemplateId = undefined;
  form.AlgorithmTemplateId = undefined;
  form.CloneChannelPlanId = undefined;
  form.Type = 2;
  form.SettlementType = 3;
  form.SendCommissionType = 1;
  form.Remark = '';
  mobile.AreaCode = DEFAULT_PHONE_AREA_CODE;
  mobile.Phone = '';
  accountLevel.value = 1;
  editStatus.value = undefined;
  preservedLanguages.value = undefined;
  packageIds.value = [];
  agentFanDianForm.value = null;
  clonePlanOptions.value = [];
}

async function fillFromRow(row: AgencyListItem) {
  suppressTypeWatch.value = true;
  resetForm();
  validationMessage.value = '';
  const detail = await resolveEditRow(row);
  accountLevel.value = Number(detail.AccountLevel) || 1;
  editStatus.value =
    detail.Status === undefined ? undefined : Number(detail.Status);
  preservedLanguages.value = detail.Languages;

  form.Username = String(detail.Username || '');
  form.Name = String(detail.Name || '');
  form.MaintainerName = String(detail.MaintainerName || '');
  parseMobileFromRow(String(detail.Mobile || detail.MobileNumber || ''));
  form.AccountType = Number(detail.AccountType) || 1;
  form.CommissionTemplateId = detail.CommissionTemplateId as number | undefined;
  form.CommissionMultiTemplateId = detail.CommissionMultiTemplateId as
    | number
    | string
    | undefined;
  fillCommissionRate(detail);
  form.CommissionRateDiff =
    detail.CommissionRateDiff === undefined ||
    detail.CommissionRateDiff === null
      ? undefined
      : Number((Number(detail.CommissionRateDiff) / 100).toFixed(2));
  const apiFeeId = detail.ApiFeeTemplateId;
  form.ApiFeeTemplateId =
    apiFeeId === 0 || apiFeeId === '0' ? undefined : apiFeeId;
  form.AlgorithmTemplateId = detail.AlgorithmTemplateId as
    | number
    | string
    | undefined;
  form.CloneChannelPlanId = undefined;
  form.Remark = String(detail.RemarkOnDeactivation || detail.Remark || '');
  form.Type = Number(detail.Type) || 2;
  form.SettlementType = Number(detail.SettlementType) || 3;
  form.SendCommissionType = Number(detail.SendCommissionType) || 1;

  packageIds.value =
    detail.PackageId &&
    String(detail.PackageId) !== '' &&
    String(detail.PackageId) !== '-1'
      ? String(detail.PackageId)
          .split(',')
          .map((item) => Number(item.trim()))
          .filter((item) => !Number.isNaN(item))
      : realPackageList.value.map((item) => item.PackageId);

  if (form.Type !== 3) {
    await loadClonePlanList(packageIds.value);
  }
  syncDeveloperFromRow(detail);
  syncCloneChannelPlanFromRow(detail);
  agentFanDianForm.value = initAgentFanDianFormFromAgent(
    cloudStore.projectConfig,
    detail.AgentFanDianConfig,
  );
  suppressTypeWatch.value = false;
}

async function loadClonePlanList(packageId?: Array<number | string> | string) {
  clonePlanLoading.value = true;
  try {
    let packageParam = '';
    if (Array.isArray(packageId)) {
      packageParam =
        packageId.length === realPackageList.value.length
          ? ''
          : packageId.join(',');
    } else {
      packageParam = packageId === '-1' ? '' : String(packageId || '');
    }
    const result = await fetchCloneChannelPlanListApi({
      ChannelId: '',
      PackageId: packageParam,
    });
    clonePlanOptions.value = (result?.Items || []).map((item) => ({
      label: String(item.Name || item.Id || ''),
      value: item.Id as number | string,
    }));
  } catch {
    clonePlanOptions.value = [];
  } finally {
    clonePlanLoading.value = false;
  }
}

async function loadOptions() {
  optionsLoading.value = true;
  try {
    const [developers, commissions, multCommissions, venues, algorithms] =
      await Promise.all([
        fetchDeveloperNamesListApi({ Page: 1, PageSize: 9999 }),
        fetchCommTempListApi({ Page: 1, PageSize: 9999 }),
        fetchMultCommTempListApi({ Page: 1, PageSize: 9999 }),
        fetchVenueTemplateListApi({ Page: 1, PageSize: 9999 }),
        fetchJuniorAlgorithmOptionsApi(),
      ]);
    developerOptions.value = (developers?.Items || []).map((item) => ({
      developerName: String(item.DeveloperName || ''),
      label: `${item.DeveloperName || '-'}${item.Remark ? `（${item.Remark}）` : ''}`,
      value: item.Id as number | string,
    }));
    commissionOptions.value = (commissions?.Items || []).map((item) => ({
      label: String(item.Name || item.TemplateName || item.Id || ''),
      value: item.Id as number | string,
    }));
    multCommissionOptions.value = (multCommissions?.Items || []).map(
      (item) => ({
        label: String(item.TemplateName || item.Name || item.Id || ''),
        value: item.Id as number | string,
      }),
    );
    venueOptions.value = (venues?.Items || []).map((item) => ({
      label: String(item.TemplateName || item.Name || item.Id || ''),
      value: item.Id as number | string,
    }));
    algorithmOptions.value = (algorithms || []).map((item) => ({
      label: String(item.TemplateName || item.Name || item.Id || ''),
      value: item.Id as number | string,
    }));
  } finally {
    optionsLoading.value = false;
  }
}

function applyDefaultAgentFinanceWhenFormHidden() {
  if (SHOW_AGENT_FINANCE_FIELDS) {
    return;
  }
  if (form.Type === 3) {
    handleTypeSelectCall(3);
    return;
  }
  if (!form.CommissionTemplateId && commissionOptions.value.length > 0) {
    form.CommissionTemplateId = Number(commissionOptions.value[0]?.value);
  }
  if (!form.ApiFeeTemplateId && venueOptions.value.length > 0) {
    form.ApiFeeTemplateId = venueOptions.value[0]?.value;
  }
  if (!form.AlgorithmTemplateId && algorithmOptions.value.length > 0) {
    form.AlgorithmTemplateId = algorithmOptions.value[0]?.value;
  }
  if (!form.CommissionMultiTemplateId && multCommissionOptions.value.length > 0) {
    form.CommissionMultiTemplateId = multCommissionOptions.value[0]?.value;
  }
  if (form.SendCommissionType === '' || form.SendCommissionType == null) {
    form.SendCommissionType = 1;
  }
}

function handleTypeSelectCall(type: number) {
  if (type === 3) {
    form.AccountType = 1;
    form.CommissionTemplateId = commissionOptions.value[0]
      ? Number(commissionOptions.value[0].value)
      : undefined;
    form.ApiFeeTemplateId = venueOptions.value[0]?.value;
    form.AlgorithmTemplateId = algorithmOptions.value[0]?.value;
    form.SettlementType = 3;
    form.SendCommissionType = 1;
    return;
  }
  if (!SHOW_AGENT_FINANCE_FIELDS) {
    applyDefaultAgentFinanceWhenFormHidden();
  }
  if (type !== 3) {
    loadClonePlanList(packageIds.value);
  }
}

function accountTypeChange() {
  form.SendCommissionType = '';
  form.CommissionRateDiff = undefined;
  form.SettlementType = 3;
  if (form.AccountType === 1) {
    form.SendCommissionType = 1;
  }
}

async function openCreateForm() {
  suppressTypeWatch.value = true;
  resetForm();
  packageIds.value = realPackageList.value.map((item) => item.PackageId);
  await loadClonePlanList('');
  applyDefaultAgentFinanceWhenFormHidden();
  agentFanDianForm.value = initAgentFanDianFormFromProject(
    cloudStore.projectConfig,
  );
  suppressTypeWatch.value = false;
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      validationMessage.value = '';
      return;
    }
    formLoading.value = true;
    try {
      await loadOptions();
      if (props.mode === 'edit' && props.row) {
        await fillFromRow(props.row);
        return;
      }
      await openCreateForm();
    } finally {
      formLoading.value = false;
    }
  },
);

watch(
  () => form.Type,
  (type) => {
    if (!props.open || suppressTypeWatch.value) {
      return;
    }
    handleTypeSelectCall(Number(type));
  },
);

function closeModal() {
  emit('update:open', false);
}

function validPercent(value: number | string | undefined, allowZero: boolean) {
  if (value === undefined || value === null || value === '') {
    return false;
  }
  const regexp = allowZero
    ? /^([0-9]\d?(\.\d{1,2})?|0\.\d{1,2}|100)$/
    : /^([1-9]\d?(\.\d{1,2})?|0\.\d{1,2}|100)$/;
  return regexp.test(String(value));
}

function validate() {
  validationMessage.value = '';
  const username = form.Username.trim();
  if (!username) {
    return failValidate('请输入代理账号');
  }
  if (
    props.mode === 'create' &&
    !/^[a-zA-Z][a-zA-Z0-9_]{7,11}$/.test(username)
  ) {
    return failValidate('代理账号须以字母开头，8-12位字母数字下划线');
  }
  if (props.mode === 'create') {
    if (!form.Password || form.Password.length < 6) {
      return failValidate('密码至少 6 位');
    }
    if (form.Password !== form.ConfirmPassword) {
      return failValidate('两次输入的密码不一致');
    }
  } else if (form.Password || form.ConfirmPassword) {
    if (!form.Password || form.Password.length < 6) {
      return failValidate('修改密码时至少 6 位');
    }
    if (form.Password !== form.ConfirmPassword) {
      return failValidate('修改密码时请填写并确认一致');
    }
  }
  if (!form.Name.trim()) {
    return failValidate('请输入姓名');
  }
  if (
    form.DeveloperId === undefined ||
    form.DeveloperId === null ||
    form.DeveloperId === ''
  ) {
    return failValidate('请选择发展人');
  }
  if (!form.MaintainerName.trim()) {
    return failValidate('请输入维护人');
  }
  if (!validAgencyRemark(form.Remark.trim())) {
    return failValidate('请输入备注（1-400 字符）');
  }
  if (form.Type !== 3 && !form.CloneChannelPlanId) {
    return failValidate('请选择克隆渠道方案');
  }
  if (SHOW_AGENT_FINANCE_FIELDS) {
    if (form.AccountType === 1 && !form.CommissionTemplateId) {
      return failValidate('请选择单层佣金模板');
    }
    if (form.AccountType === 2 && !validPercent(form.CommissionRate, true)) {
      return failValidate('佣金比例须为 0-100，最多两位小数');
    }
    if (form.AccountType === 3 && !form.CommissionMultiTemplateId) {
      return failValidate('请选择多层多费率佣金模板');
    }
    if (
      form.AccountType !== 1 &&
      !validPercent(form.CommissionRateDiff, false)
    ) {
      return failValidate('佣金级距须大于 0 且不超过 100，最多两位小数');
    }
    if (!form.ApiFeeTemplateId || !form.AlgorithmTemplateId) {
      return failValidate('请选择场馆费率与佣金算法');
    }
  }
  return true;
}

function selectDeveloper(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    form.DeveloperId = undefined;
    form.DeveloperName = '';
    return;
  }
  form.DeveloperName =
    developerOptions.value.find((item) => String(item.value) === String(value))
      ?.developerName || '';
}

function resolvePackageIdPayload() {
  if (packageIds.value.length === 0) {
    return '-1';
  }
  if (packageIds.value.length === realPackageList.value.length) {
    return '-1';
  }
  return [...packageIds.value]
    .map(Number)
    .toSorted((a, b) => a - b)
    .join(',');
}

function toPayloadValue(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }
  return value;
}

function formatLanguagesPayload(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map(String).join(',');
  }
  return String(value);
}

function buildCommissionRatePayload() {
  if (accountLevel.value !== 1 && form.AccountType === 3) {
    if (form.CommissionRate === undefined || form.CommissionRate === '') {
      return '';
    }
    return typeof form.CommissionRate === 'object'
      ? JSON.stringify(form.CommissionRate)
      : form.CommissionRate;
  }
  return String((Number(form.CommissionRate || 0) * 100).toFixed(0));
}

function buildCommissionRateDiffPayload() {
  return String((Number(form.CommissionRateDiff || 0) * 100).toFixed(0));
}

function buildMobilePayload() {
  if (!mobile.Phone.trim()) {
    return '';
  }
  return `${mobile.AreaCode}${mobile.Phone.trim()}`;
}

function buildAgentFanDianPayload() {
  if (!hasAgentFanDianConfig.value || !agentFanDianForm.value) {
    return undefined;
  }
  return JSON.stringify(
    serializeAgentFanDianConfigForSubmit(agentFanDianForm.value),
  );
}

function buildPayload() {
  applyDefaultAgentFinanceWhenFormHidden();

  // 对齐旧站 compileAccount：完整 parameter 对象，空值用 '' 而非 undefined
  const payload: Record<string, unknown> = {
    AccountLevel: accountLevel.value,
    AccountType: form.AccountType,
    AlgorithmTemplateId: toPayloadValue(form.AlgorithmTemplateId),
    ApiFeeTemplateId: toPayloadValue(form.ApiFeeTemplateId),
    CloneChannelPlanId:
      form.Type === 3 ? '' : toPayloadValue(form.CloneChannelPlanId),
    CommissionMultiTemplateId: toPayloadValue(form.CommissionMultiTemplateId),
    CommissionRate: buildCommissionRatePayload(),
    CommissionRateDiff: buildCommissionRateDiffPayload(),
    CommissionTemplateId: toPayloadValue(form.CommissionTemplateId),
    DeveloperId: toPayloadValue(form.DeveloperId),
    DeveloperName: toPayloadValue(form.DeveloperName),
    DevicePlatform: 'web',
    MaintainerName: form.MaintainerName,
    Mobile: buildMobilePayload(),
    Name: form.Name,
    PackageId: resolvePackageIdPayload(),
    QingLiu: false,
    Remark: form.Remark,
    SendCommissionType: toPayloadValue(form.SendCommissionType) || 1,
    SettlementType: form.SettlementType,
    TeamIds: [],
    Type: form.Type,
    Username: form.Username,
  };

  const fanDian = buildAgentFanDianPayload();
  if (fanDian) {
    payload.AgentFanDianConfig = fanDian;
  }

  if (props.mode === 'edit') {
    payload.AdminId = toPayloadValue(props.row?.AdminId ?? props.row?.Id);
    payload.Id = toPayloadValue(props.row?.Id ?? props.row?.AdminId);
    payload.ConfirmPassword = form.Password ? form.ConfirmPassword : '';
    payload.Languages = formatLanguagesPayload(preservedLanguages.value);
    payload.Password = form.Password || '';
    payload.Status = toPayloadValue(editStatus.value);
  } else {
    payload.ConfirmPassword = form.ConfirmPassword;
    payload.Password = form.Password;
  }

  return payload;
}

async function handleSubmit() {
  if (!validate()) {
    return;
  }
  submitting.value = true;
  validationMessage.value = '';
  try {
    if (props.mode === 'create') {
      await createAgencyApi({
        ...buildPayload(),
        DeviceId: getOrCreateAgencyDeviceId(),
      });
      message.success('新增成功');
    } else {
      await updateAgencyApi(buildPayload());
      message.success('编辑成功');
    }
    closeModal();
    emit('success');
  } catch (error) {
    const msg =
      error instanceof Error && error.message
        ? error.message
        : '保存失败，请稍后重试';
    validationMessage.value = msg;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    destroy-on-close
    :open="open"
    :title="title"
    width="800px"
    @cancel="closeModal"
  >
    <div
      v-if="validationMessage"
      class="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
    >
      {{ validationMessage }}
    </div>
    <div v-if="formLoading" class="py-10 text-center text-muted-foreground">
      加载中...
    </div>
    <Form v-else layout="vertical">
      <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <Form.Item label="代理账号" required>
          <Input
            v-model:value="form.Username"
            :disabled="mode === 'edit'"
            placeholder="请输入代理账号"
            @input="handleUsernameInput"
          />
        </Form.Item>

        <Form.Item label="代理类型" required>
          <Select
            v-model:value="form.Type"
            :disabled="isTypeLocked"
            :options="agencyTypeOptions"
          />
        </Form.Item>

        <template v-if="mode === 'create'">
          <Form.Item label="密码" required>
            <Input.Password
              v-model:value="form.Password"
              placeholder="请输入密码（至少6位）"
            />
          </Form.Item>
          <Form.Item label="确认密码" required>
            <Input.Password
              v-model:value="form.ConfirmPassword"
              placeholder="请再次输入密码"
            />
          </Form.Item>
        </template>
        <template v-else>
          <Form.Item label="密码">
            <Input.Password
              v-model:value="form.Password"
              placeholder="不修改请留空"
            />
          </Form.Item>
          <Form.Item label="确认密码">
            <Input.Password
              v-model:value="form.ConfirmPassword"
              placeholder="不修改请留空"
            />
          </Form.Item>
        </template>

        <Form.Item label="姓名" required>
          <Input v-model:value="form.Name" placeholder="请输入姓名" />
        </Form.Item>

        <Form.Item label="手机号">
          <div class="flex gap-2">
            <Select
              v-model:value="mobile.AreaCode"
              :options="[...AGENCY_PHONE_AREA_CODE_OPTIONS]"
              placeholder="区号"
              style="width: 32%"
            />
            <Input
              v-model:value="mobile.Phone"
              placeholder="请输入手机号"
              style="width: 68%"
              @input="
                (event) => {
                  const target = event.target as HTMLInputElement;
                  mobile.Phone = target.value.replace(/[^\d]/g, '');
                }
              "
            />
          </div>
        </Form.Item>

        <Form.Item label="发展人" required>
          <Select
            v-model:value="form.DeveloperId"
            :loading="optionsLoading"
            :options="developerOptions"
            placeholder="请选择发展人"
            show-search
            @change="(value) => selectDeveloper(value as string | number | undefined)"
          />
        </Form.Item>

        <Form.Item label="维护人" required>
          <Input
            v-model:value="form.MaintainerName"
            placeholder="请输入维护人"
          />
        </Form.Item>

        <Form.Item label="佣金周期" required>
          <Select
            v-model:value="form.SettlementType"
            :disabled="isSettlementTypeLocked"
            :options="[
              { label: '日结', value: 1 },
              { label: '周结', value: 2 },
              { label: '月结', value: 3 },
            ]"
          />
        </Form.Item>

        <Form.Item label="发佣方式" required>
          <Select
            v-model:value="form.SendCommissionType"
            :disabled="isSendCommissionTypeLocked"
            :options="sendCommissionOptions"
          />
        </Form.Item>
      </div>

      <template v-if="SHOW_AGENT_FINANCE_FIELDS">
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item label="代理模式" required>
            <Select
              v-model:value="form.AccountType"
              :disabled="isAccountTypeLocked"
              :options="[
                { label: '单层', value: 1 },
                { label: '多层（单费率）', value: 2 },
                { label: '多层（多费率）', value: 3 },
              ]"
              @change="accountTypeChange"
            />
          </Form.Item>

          <Form.Item label="场馆费率" required>
            <Select
              v-model:value="form.ApiFeeTemplateId"
              :disabled="isFinanceLocked || isTestAgent"
              :loading="optionsLoading"
              :options="venueOptions"
              placeholder="请选择场馆费率模板"
              show-search
            />
          </Form.Item>

          <Form.Item v-if="form.AccountType === 1" label="佣金方案" required>
            <Select
              v-model:value="form.CommissionTemplateId"
              :disabled="isFinanceLocked || isTestAgent"
              :loading="optionsLoading"
              :options="commissionOptions"
              placeholder="请选择佣金方案"
              show-search
            />
          </Form.Item>

          <Form.Item v-if="form.AccountType === 2" label="佣金比例" required>
            <InputNumber
              v-model:value="form.CommissionRate"
              :disabled="isFinanceLocked || isTestAgent"
              :max="100"
              :min="0"
              :precision="2"
              addon-after="%"
              style="width: 100%"
            />
          </Form.Item>

          <Form.Item
            v-if="form.AccountType === 3"
            label="多层多费率佣金模板"
            required
          >
            <Select
              v-model:value="form.CommissionMultiTemplateId"
              :disabled="isFinanceLocked || isTestAgent"
              :loading="optionsLoading"
              :options="multCommissionOptions"
              placeholder="请选择多层多费率佣金模板"
              show-search
            />
          </Form.Item>

          <Form.Item
            v-if="form.AccountType !== 1"
            label="佣金级距"
            required
          >
            <InputNumber
              v-model:value="form.CommissionRateDiff"
              :disabled="isCommissionRateDiffLocked"
              :max="100"
              :min="0.01"
              :precision="2"
              addon-after="%"
              style="width: 100%"
            />
          </Form.Item>

          <Form.Item label="佣金算法" required>
            <Select
              v-model:value="form.AlgorithmTemplateId"
              :disabled="isFinanceLocked || isTestAgent"
              :loading="optionsLoading"
              :options="algorithmOptions"
              placeholder="请选择佣金算法"
              show-search
            />
          </Form.Item>
        </div>
      </template>

      <Form.Item
        v-if="hasAgentFanDianConfig && agentFanDianForm"
        label="游戏返水配置"
      >
        <AgencyFanDianFormPanel v-model="agentFanDianForm" />
      </Form.Item>

      <Form.Item
        v-if="form.Type !== 3"
        label="克隆渠道方案"
        required
      >
        <Select
          v-model:value="form.CloneChannelPlanId"
          :loading="clonePlanLoading"
          :options="clonePlanOptions"
          placeholder="请选择克隆渠道方案"
          show-search
        />
      </Form.Item>

      <Form.Item label="备注" required>
        <Input.TextArea
          v-model:value="form.Remark"
          :maxlength="400"
          placeholder="请输入备注"
          :rows="3"
        />
      </Form.Item>
    </Form>
    <template #footer>
      <Button @click="closeModal">取消</Button>
      <Button
        :disabled="formLoading"
        :loading="submitting"
        type="primary"
        @click="handleSubmit"
      >
        确定
      </Button>
    </template>
  </Modal>
</template>

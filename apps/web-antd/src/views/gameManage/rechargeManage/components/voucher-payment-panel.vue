<script lang="ts" setup>
import type { FormInstance, FormProps, TableColumnsType } from 'ant-design-vue';

import type {
  PrivateCardItem,
  PrivateCardPayload,
  RechargeChannelId,
  RechargeConditions,
  RechargePlayerLevel,
  RechargeQuickTemplate,
} from '#/types/recharge-channel';

import { computed, nextTick, onMounted, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';
import md5 from 'crypto-js/md5';

import {
  createPrivateCardApi,
  createRechargeQuickTemplateApi,
  deletePrivateCardApi,
  deleteRechargeQuickTemplateApi,
  fetchPrivateCardDetailApi,
  fetchPrivateCardListApi,
  fetchRechargePlayerLevelsApi,
  fetchRechargeQuickTemplatesApi,
  sortPrivateCardsApi,
  switchPrivateCardApi,
  updatePrivateCardApi,
} from '#/api/gameManage/recharge-channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';

defineOptions({ name: 'VoucherPaymentPanel' });

const emit = defineEmits<{ changed: [] }>();

const PAY_TYPE = 212;
const ALL_VIP = 9999;
const DEVICE_OPTIONS = [
  { label: 'Android', value: 1 },
  { label: 'iOS', value: 2 },
  { label: 'H5', value: 3 },
  { label: 'PC', value: 4 },
];

type EditableModel = {
  AllowInput: number;
  InputMax: number | undefined;
  InputMin: number | undefined;
  LevelIds: RechargeChannelId[];
  NickName: string;
  PlatformType: number[];
  Priority: number | undefined;
  TestChannel: RechargeChannelId[];
  timeCheck: boolean;
  timeMax: number | undefined;
  timeMin: number | undefined;
  vipCheck: boolean;
  VipV2: number[];
};

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const canManage = computed(() => checkPermission(10_821));

const rows = ref<PrivateCardItem[]>([]);
const loading = ref(false);
const listError = ref('');
const actionId = ref<RechargeChannelId>();
const sorting = ref(false);

const formRef = ref<FormInstance>();
const dialogOpen = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const detailLoading = ref(false);
const detailError = ref('');
const saving = ref(false);
const preservedDetail = ref<PrivateCardItem>();
const initialSnapshot = ref('');

const levels = ref<RechargePlayerLevel[]>([]);
const dependencyLoading = ref(false);
const dependencyError = ref('');
const templates = ref<RechargeQuickTemplate[]>([]);
const templateOpen = ref(false);
const templateName = ref('');
const templateSaving = ref(false);

const model = reactive<EditableModel>(emptyModel());

const columns: TableColumnsType<PrivateCardItem> = [
  { key: 'sort', title: '排序', width: 108 },
  { key: 'open', title: '状态', width: 90 },
  { dataIndex: 'NickName', key: 'NickName', title: '通道名称', width: 160 },
  { key: 'amount', title: '充值金额', width: 150 },
  { key: 'levels', title: '会员层级', width: 160 },
  { key: 'audience', title: '开放人群', width: 210 },
  { key: 'devices', title: '设备显示', width: 150 },
  { key: 'channels', title: '指定渠道', width: 180 },
  { key: 'action', fixed: 'right', title: '操作', width: 130 },
];

const vipOptions = computed(() => {
  const values = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId: number;
    VipLevelName?: string;
  }>;
  return values.map((item) => ({
    label: item.VipLevelName || `VIP${item.VipLevelId}`,
    value: Number(item.VipLevelId),
  }));
});

const levelOptions = computed(() =>
  levels.value.map((item) => ({
    label: item.LevelName || String(item.Id),
    value: item.Id,
  })),
);

const channelOptions = computed(() => {
  const list = (projectConfig.value?.ChildChannelInfo || []) as Array<{
    ChannelId: RechargeChannelId;
    ChannelName?: string;
    IsHidden?: number;
  }>;
  return list
    .filter((item) => Number(item.IsHidden) !== 2)
    .map((item) => ({
      label: `${item.ChannelName || '渠道'} (${item.ChannelId})`,
      value: item.ChannelId,
    }));
});

const channelNameMap = computed(() => {
  return new Map(
    channelOptions.value.map((item) => [String(item.value), item.label]),
  );
});

const dirty = computed(
  () =>
    dialogOpen.value &&
    !detailLoading.value &&
    snapshot() !== initialSnapshot.value,
);

const rules = computed<NonNullable<FormProps['rules']>>(() => ({
  InputMax: [
    {
      validator: async () => {
        if (model.AllowInput !== 1) return;
        validateAmountRange();
      },
    },
  ],
  InputMin: [
    {
      validator: async () => {
        if (model.AllowInput !== 1) return;
        validateAmountRange();
      },
    },
  ],
  NickName: [
    { required: true, message: '请输入通道名称', trigger: ['blur', 'change'] },
    { max: 100, message: '通道名称最多 100 个字符' },
  ],
  PlatformType: [{ required: true, message: '请至少选择一个设备' }],
  Priority: [
    { required: true, message: '请输入分配权重' },
    {
      validator: async (_rule: unknown, value: unknown) => {
        const priority = Number(value);
        if (!Number.isInteger(priority) || priority < 1 || priority > 100) {
          throw new Error('分配权重必须是 1-100 的整数');
        }
      },
    },
  ],
}));

function emptyModel(): EditableModel {
  return {
    AllowInput: 2,
    InputMax: undefined,
    InputMin: undefined,
    LevelIds: [],
    NickName: '',
    PlatformType: DEVICE_OPTIONS.map((item) => item.value),
    Priority: 100,
    TestChannel: [],
    timeCheck: false,
    timeMax: 0,
    timeMin: 0,
    vipCheck: false,
    VipV2: [],
  };
}

function parseCsv(value: unknown): RechargeChannelId[] {
  if (Array.isArray(value))
    return value.filter((item) => item !== '' && item != null);
  if (typeof value !== 'string' && typeof value !== 'number') return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumbers(value: unknown, fallback: number[] = []): number[] {
  const result = parseCsv(value)
    .map(Number)
    .filter((item) => Number.isFinite(item));
  return result.length > 0 ? result : [...fallback];
}

function parseConditions(value: unknown): RechargeConditions {
  let source: Record<string, unknown> = {};
  try {
    if (typeof value === 'string' && value.trim()) {
      source = JSON.parse(value) as Record<string, unknown>;
    } else if (value && typeof value === 'object') {
      source = value as Record<string, unknown>;
    }
  } catch {
    source = {};
  }
  const regTime = Array.isArray(source.RegTime)
    ? source.RegTime.map(Number)
        .filter((item) => Number.isFinite(item))
        .slice(0, 2)
    : [];
  const vip = Array.isArray(source.VipV2)
    ? source.VipV2.map(Number).filter((item) => Number.isFinite(item))
    : [];
  return {
    ...source,
    RegTime: regTime.length === 2 ? regTime : [0, 0],
    VipV2: vip.length > 0 ? vip : [ALL_VIP],
  } as RechargeConditions;
}

function conditionsFor(row: PrivateCardItem) {
  return parseConditions(row.Conditions);
}

function serializeConditions(): string {
  const original = parseConditions(preservedDetail.value?.Conditions);
  return JSON.stringify({
    ...original,
    RegTime: model.timeCheck
      ? [Number(model.timeMin), Number(model.timeMax)]
      : [0, 0],
    VipV2: model.vipCheck ? [...model.VipV2] : [ALL_VIP],
  });
}

function snapshot() {
  return JSON.stringify({
    ...model,
    LevelIds: model.LevelIds.map(String).toSorted(),
    PlatformType: [...model.PlatformType].toSorted(),
    TestChannel: model.TestChannel.map(String).toSorted(),
    VipV2: [...model.VipV2].toSorted(),
  });
}

function assignModel(detail?: PrivateCardItem) {
  const conditions = parseConditions(detail?.Conditions);
  const regTime = conditions.RegTime;
  const unrestrictedVip = conditions.VipV2.includes(ALL_VIP);
  Object.assign(model, emptyModel(), {
    AllowInput: Number(detail?.AllowInput || 2),
    InputMax:
      detail?.InputMax === '' || detail?.InputMax == null
        ? undefined
        : Number(detail.InputMax),
    InputMin:
      detail?.InputMin === '' || detail?.InputMin == null
        ? undefined
        : Number(detail.InputMin),
    LevelIds: parseCsv(detail?.LevelIds),
    NickName: String(detail?.NickName || ''),
    PlatformType: parseNumbers(
      detail?.PlatformType,
      DEVICE_OPTIONS.map((item) => item.value),
    ),
    Priority: Number(detail?.Priority || 100),
    TestChannel: parseCsv(detail?.TestChannel),
    timeCheck: Number(regTime[0]) !== 0 || Number(regTime[1]) !== 0,
    timeMax: Number(regTime[1] || 0),
    timeMin: Number(regTime[0] || 0),
    vipCheck: !unrestrictedVip,
    VipV2: unrestrictedVip ? [] : [...conditions.VipV2],
  });
}

function validateAmountRange() {
  const min = Number(model.InputMin);
  const max = Number(model.InputMax);
  if (!Number.isInteger(min) || min <= 0 || min > 100_000) {
    throw new Error('最小金额必须是 1-100000 的整数');
  }
  if (!Number.isInteger(max) || max <= 0 || max > 100_000) {
    throw new Error('最大金额必须是 1-100000 的整数');
  }
  if (max < min) throw new Error('最大金额不能小于最小金额');
}

function validateAudience() {
  if (model.timeCheck) {
    const min = Number(model.timeMin);
    const max = Number(model.timeMax);
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max > 99_999_999 ||
      max <= min
    ) {
      message.error('注册时间须为 0-99999999 的整数，且结束值大于开始值');
      return false;
    }
  }
  if (model.vipCheck && model.VipV2.length === 0) {
    message.error('请至少选择一个 VIP 等级');
    return false;
  }
  return true;
}

function buildPayload(): PrivateCardPayload {
  return {
    ...preservedDetail.value,
    AllowInput: model.AllowInput,
    Conditions: serializeConditions(),
    InputMax: model.AllowInput === 1 ? model.InputMax : '',
    InputMin: model.AllowInput === 1 ? model.InputMin : '',
    LevelIds: model.LevelIds.join(','),
    NickName: model.NickName.trim(),
    PayType: PAY_TYPE,
    PlatformType: model.PlatformType.join(','),
    Priority: model.Priority,
    TestChannel: model.TestChannel.join(','),
    ...(dialogMode.value === 'create'
      ? { Hash: md5(`${Date.now()}-${Math.random()}`).toString() }
      : {}),
  };
}

async function loadList() {
  if (!canManage.value) return;
  loading.value = true;
  listError.value = '';
  try {
    const result = await fetchPrivateCardListApi({
      Page: 1,
      PageSize: 1000,
      PayType: PAY_TYPE,
    });
    rows.value = [...result.Items]
      .filter((item) => Number(item.PayType ?? PAY_TYPE) === PAY_TYPE)
      .toSorted((a, b) => Number(b.Index || 0) - Number(a.Index || 0));
  } catch (error) {
    listError.value = error instanceof Error ? error.message : '通道加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadDependencies() {
  dependencyLoading.value = true;
  dependencyError.value = '';
  try {
    const [levelResult, templateResult] = await Promise.all([
      fetchRechargePlayerLevelsApi({ Page: 1, PageSize: 1000 }),
      fetchRechargeQuickTemplatesApi(),
    ]);
    levels.value = levelResult.Items;
    templates.value = templateResult.Items;
  } catch (error) {
    dependencyError.value =
      error instanceof Error ? error.message : '会员层级或快捷模板加载失败';
  } finally {
    dependencyLoading.value = false;
  }
}

async function openCreate() {
  dialogMode.value = 'create';
  preservedDetail.value = undefined;
  detailError.value = '';
  assignModel();
  dialogOpen.value = true;
  await nextTick();
  formRef.value?.clearValidate();
  initialSnapshot.value = snapshot();
}

async function openEdit(row: PrivateCardItem) {
  dialogMode.value = 'edit';
  preservedDetail.value = row;
  detailError.value = '';
  assignModel(row);
  dialogOpen.value = true;
  await nextTick();
  initialSnapshot.value = snapshot();
  await loadDetail(row.Id);
}

async function loadDetail(id: RechargeChannelId) {
  detailLoading.value = true;
  detailError.value = '';
  try {
    const detail = await fetchPrivateCardDetailApi(id);
    preservedDetail.value = detail;
    assignModel(detail);
    await nextTick();
    formRef.value?.clearValidate();
    initialSnapshot.value = snapshot();
  } catch (error) {
    detailError.value = error instanceof Error ? error.message : '详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

async function submit() {
  if (detailLoading.value || detailError.value) return;
  try {
    await formRef.value?.validate();
    if (!validateAudience()) return;
  } catch {
    return;
  }
  saving.value = true;
  try {
    const payload = buildPayload();
    await (dialogMode.value === 'create'
      ? createPrivateCardApi(payload)
      : updatePrivateCardApi(payload));
    message.success(dialogMode.value === 'create' ? '新增成功' : '保存成功');
    initialSnapshot.value = snapshot();
    dialogOpen.value = false;
    await loadList();
    emit('changed');
  } finally {
    saving.value = false;
  }
}

function requestClose() {
  if (!dirty.value) {
    dialogOpen.value = false;
    return;
  }
  Modal.confirm({
    content: '表单有未保存的修改，确认放弃吗？',
    okText: '放弃修改',
    okType: 'danger',
    title: '确认关闭',
    onOk: () => {
      dialogOpen.value = false;
    },
  });
}

function switchChannel(row: PrivateCardItem, checked: boolean) {
  const next = checked ? 1 : 2;
  Modal.confirm({
    content: `确认${checked ? '开启' : '关闭'}通道「${row.NickName || row.Id}」？开放人群：${audienceText(row)}`,
    title: '切换通道状态',
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await switchPrivateCardApi({ Id: row.Id, Open: next });
        message.success('状态更新成功');
        await loadList();
        emit('changed');
      } finally {
        actionId.value = undefined;
      }
    },
  });
}

function removeChannel(row: PrivateCardItem) {
  Modal.confirm({
    content: `确认删除通道「${row.NickName || row.Id}」？`,
    okType: 'danger',
    title: '删除通道',
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await deletePrivateCardApi(row.Id);
        message.success('删除成功');
        await loadList();
        emit('changed');
      } finally {
        actionId.value = undefined;
      }
    },
  });
}

async function moveRow(index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= rows.value.length || sorting.value) return;
  const next = [...rows.value];
  [next[index], next[target]] = [next[target]!, next[index]!];
  rows.value = next;
  sorting.value = true;
  try {
    await sortPrivateCardsApi({
      Ids: [...next]
        .toReversed()
        .map((item) => item.Id)
        .join(','),
    });
    message.success('排序已更新');
    await loadList();
    emit('changed');
  } catch {
    await loadList();
  } finally {
    sorting.value = false;
  }
}

function openTemplateCreate() {
  if (model.TestChannel.length === 0) {
    message.warning('请先选择指定渠道');
    return;
  }
  templateName.value = '';
  templateOpen.value = true;
}

async function saveTemplate() {
  const name = templateName.value.trim();
  if (!name) {
    message.error('请输入模板名称');
    return;
  }
  templateSaving.value = true;
  try {
    await createRechargeQuickTemplateApi({
      ModelName: name,
      TestChannel: model.TestChannel.join(','),
    });
    message.success('模板已保存');
    templateOpen.value = false;
    await loadDependencies();
  } finally {
    templateSaving.value = false;
  }
}

function removeTemplate(template: RechargeQuickTemplate) {
  Modal.confirm({
    content: `确认删除快捷模板「${template.ModelName || template.Id}」？`,
    okType: 'danger',
    title: '删除模板',
    onOk: async () => {
      await deleteRechargeQuickTemplateApi(template.Id);
      message.success('模板已删除');
      await loadDependencies();
    },
  });
}

function applyTemplate(template: RechargeQuickTemplate) {
  model.TestChannel = parseCsv(template.TestChannel);
}

function asPrivateCard(record: Record<string, unknown>): PrivateCardItem {
  return record as PrivateCardItem;
}

function audienceText(row: PrivateCardItem) {
  const conditions = conditionsFor(row);
  const result: string[] = [];
  if (conditions.RegTime.some((item) => Number(item) !== 0)) {
    result.push(`注册 ${conditions.RegTime[0]}-${conditions.RegTime[1]} 小时`);
  }
  if (!conditions.VipV2.includes(ALL_VIP)) {
    result.push(
      conditions.VipV2.map((item) => `VIP${item}`).join('、') || '未选择 VIP',
    );
  }
  return result.join('；') || '全部';
}

function deviceText(row: PrivateCardItem) {
  const ids = parseNumbers(
    row.PlatformType,
    DEVICE_OPTIONS.map((item) => item.value),
  );
  if (ids.length === DEVICE_OPTIONS.length) return '全部设备';
  return DEVICE_OPTIONS.filter((item) => ids.includes(item.value))
    .map((item) => item.label)
    .join('、');
}

function levelText(row: PrivateCardItem) {
  const ids = parseCsv(row.LevelIds);
  if (ids.length === 0) return '全部层级';
  return ids
    .map(
      (id) =>
        levels.value.find((item) => String(item.Id) === String(id))
          ?.LevelName || String(id),
    )
    .join('、');
}

function channelText(row: PrivateCardItem) {
  const ids = parseCsv(row.TestChannel);
  if (ids.length === 0) return '全部渠道';
  return ids
    .map((id) => channelNameMap.value.get(String(id)) || String(id))
    .join('、');
}

onMounted(() => {
  if (!canManage.value) return;
  void Promise.all([loadList(), loadDependencies()]);
});
</script>

<template>
  <Result
    v-if="!canManage"
    status="403"
    sub-title="无兑换码支付通道管理权限"
    title="403"
  />
  <div v-else class="space-y-3">
    <Alert v-if="listError" :message="listError" show-icon type="error">
      <template #action>
        <Button size="small" @click="loadList">重试</Button>
      </template>
    </Alert>

    <div class="flex justify-end">
      <Button type="primary" @click="openCreate">新增通道</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      :row-key="(row) => String(row.Id)"
      :scroll="{ x: 1340 }"
      size="small"
    >
      <template #bodyCell="{ column, index, record: row }">
        <template v-if="column.key === 'sort'">
          <Space>
            <Button
              :disabled="index === 0 || sorting"
              size="small"
              @click="moveRow(index, -1)"
            >
              上移
            </Button>
            <Button
              :disabled="index === rows.length - 1 || sorting"
              size="small"
              @click="moveRow(index, 1)"
            >
              下移
            </Button>
          </Space>
        </template>
        <template v-else-if="column.key === 'open'">
          <Switch
            :checked="Number(row.Open) === 1"
            :loading="String(actionId) === String(row.Id)"
            checked-children="开"
            un-checked-children="关"
            @change="(checked) => switchChannel(asPrivateCard(row), !!checked)"
          />
        </template>
        <template v-else-if="column.key === 'amount'">
          <span v-if="Number(row.AllowInput) === 1">
            {{ row.InputMin }} - {{ row.InputMax }}
          </span>
          <span v-else class="text-gray-400">不允许玩家输入</span>
        </template>
        <template v-else-if="column.key === 'levels'">
          {{ levelText(asPrivateCard(row)) }}
        </template>
        <template v-else-if="column.key === 'audience'">
          {{ audienceText(asPrivateCard(row)) }}
        </template>
        <template v-else-if="column.key === 'devices'">
          {{ deviceText(asPrivateCard(row)) }}
        </template>
        <template v-else-if="column.key === 'channels'">
          {{ channelText(asPrivateCard(row)) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button size="small" @click="openEdit(asPrivateCard(row))">
              编辑
            </Button>
            <Button
              danger
              :loading="String(actionId) === String(row.Id)"
              size="small"
              @click="removeChannel(asPrivateCard(row))"
            >
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      :confirm-loading="saving"
      :mask-closable="false"
      :ok-button-props="{ disabled: detailLoading || !!detailError }"
      :open="dialogOpen"
      :title="
        dialogMode === 'create' ? '新增兑换码支付通道' : '编辑兑换码支付通道'
      "
      width="min(760px, calc(100vw - 24px))"
      destroy-on-close
      @cancel="requestClose"
      @ok="submit"
    >
      <Spin :spinning="detailLoading || dependencyLoading">
        <Alert
          v-if="detailError"
          class="mb-3"
          :message="detailError"
          show-icon
          type="error"
        >
          <template #action>
            <Button
              v-if="preservedDetail?.Id != null"
              size="small"
              @click="loadDetail(preservedDetail.Id)"
            >
              重试
            </Button>
          </template>
        </Alert>
        <Alert
          v-if="dependencyError"
          class="mb-3"
          :message="dependencyError"
          show-icon
          type="warning"
        >
          <template #action>
            <Button size="small" @click="loadDependencies">重试</Button>
          </template>
        </Alert>

        <Form
          ref="formRef"
          :model="model"
          :rules="rules"
          class="pt-1"
          layout="vertical"
        >
          <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item label="通道名称" name="NickName">
              <Input
                v-model:value="model.NickName"
                :maxlength="100"
                placeholder="请输入通道/服务商名称"
                show-count
              />
            </Form.Item>
            <Form.Item label="分配权重" name="Priority">
              <InputNumber
                v-model:value="model.Priority"
                :max="100"
                :min="1"
                class="w-full"
                placeholder="1-100"
              />
            </Form.Item>
          </div>

          <Form.Item label="设备显示" name="PlatformType">
            <Checkbox.Group
              v-model:value="model.PlatformType"
              :options="DEVICE_OPTIONS"
            />
          </Form.Item>

          <Form.Item label="允许玩家输入金额" name="AllowInput">
            <Switch
              :checked="model.AllowInput === 1"
              checked-children="允许"
              un-checked-children="不允许"
              @change="model.AllowInput = $event ? 1 : 2"
            />
          </Form.Item>

          <div
            v-if="model.AllowInput === 1"
            class="grid grid-cols-1 gap-x-4 md:grid-cols-2"
          >
            <Form.Item label="最小金额" name="InputMin">
              <InputNumber
                v-model:value="model.InputMin"
                :max="100000"
                :min="1"
                :precision="0"
                class="w-full"
              />
            </Form.Item>
            <Form.Item label="最大金额" name="InputMax">
              <InputNumber
                v-model:value="model.InputMax"
                :max="100000"
                :min="1"
                :precision="0"
                class="w-full"
              />
            </Form.Item>
          </div>

          <Form.Item label="指定渠道">
            <Select
              v-model:value="model.TestChannel"
              allow-clear
              class="w-full"
              mode="multiple"
              :options="channelOptions"
              placeholder="留空表示全部渠道"
              show-search
            />
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <Tag
                v-for="template in templates"
                :key="String(template.Id)"
                closable
                color="blue"
                class="cursor-pointer"
                @click="applyTemplate(template)"
                @close.prevent="removeTemplate(template)"
              >
                {{ template.ModelName || template.Id }}
              </Tag>
              <Button size="small" @click="openTemplateCreate"
                >收藏当前选择</Button
              >
            </div>
          </Form.Item>

          <Form.Item label="会员层级">
            <Select
              v-model:value="model.LevelIds"
              allow-clear
              class="w-full"
              mode="multiple"
              :options="levelOptions"
              placeholder="留空表示全部会员层级"
              show-search
            />
          </Form.Item>

          <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item label="限制注册时长">
              <Switch
                v-model:checked="model.timeCheck"
                checked-children="限制"
                un-checked-children="不限"
              />
              <div v-if="model.timeCheck" class="mt-2 flex items-center gap-2">
                <InputNumber
                  v-model:value="model.timeMin"
                  :max="99999999"
                  :min="0"
                  :precision="0"
                  class="min-w-0 flex-1"
                />
                <span>至</span>
                <InputNumber
                  v-model:value="model.timeMax"
                  :max="99999999"
                  :min="0"
                  :precision="0"
                  class="min-w-0 flex-1"
                />
                <span>小时</span>
              </div>
            </Form.Item>

            <Form.Item label="限制 VIP 等级">
              <Switch
                v-model:checked="model.vipCheck"
                checked-children="限制"
                un-checked-children="不限"
              />
              <Select
                v-if="model.vipCheck"
                v-model:value="model.VipV2"
                class="mt-2 w-full"
                mode="multiple"
                :options="vipOptions"
                placeholder="请选择 VIP 等级"
              />
            </Form.Item>
          </div>
        </Form>
      </Spin>
    </Modal>

    <Modal
      v-model:open="templateOpen"
      :confirm-loading="templateSaving"
      title="收藏快捷渠道模板"
      @ok="saveTemplate"
    >
      <Form layout="vertical">
        <Form.Item label="模板名称" required>
          <Input
            v-model:value="templateName"
            :maxlength="50"
            placeholder="请输入模板名称"
            @press-enter="saveTemplate"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

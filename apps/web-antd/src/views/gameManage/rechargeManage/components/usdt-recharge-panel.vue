<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  RechargeChannelId,
  RechargeConditions,
  RechargeQuickTemplate,
  RechargeSpecializedTotal,
  UsdtRechargeItem,
  UsdtRechargePayload,
} from '#/types/recharge-channel';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
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
  createRechargeQuickTemplateApi,
  createUsdtRechargeApi,
  deleteRechargeQuickTemplateApi,
  deleteUsdtRechargeApi,
  fetchRechargePlayerLevelsApi,
  fetchRechargeQuickTemplatesApi,
  fetchUsdtRechargeDetailApi,
  fetchUsdtRechargeListApi,
  fetchUsdtRechargeTotalApi,
  sortUsdtRechargeApi,
  switchUsdtRechargeApi,
  updateUsdtRechargeApi,
} from '#/api/gameManage/recharge-channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';

defineOptions({ name: 'UsdtRechargePanel' });

const emit = defineEmits<{ changed: [] }>();

type FormMode = 'create' | 'edit';

interface UsdtFormModel {
  Agreement: 'TRC20';
  AllowInput: number;
  ChannelAddress: string;
  DailyLimit: number | undefined;
  Gears: Array<number | string>;
  InputMax: number | undefined;
  InputMin: number | undefined;
  LevelIds: RechargeChannelId[];
  NickName: string;
  PlatformType: number[];
  Priority: number | undefined;
  RegTime: [number, number];
  TestChannel: RechargeChannelId[];
  VipV2: number[];
  timeCheck: boolean;
  vipCheck: boolean;
}

const PAY_TYPE = 26;
const ALL_VIP = 9999;
const listQuery = {
  Keyword: '',
  OnShelf: 1,
  Page: 1,
  PageSize: 999,
  PayType: PAY_TYPE,
  Sort: '',
};
const platformOptions = [
  { label: '安卓', value: 1 },
  { label: 'iOS', value: 2 },
  { label: 'H5', value: 3 },
  { label: 'PC', value: 4 },
];

const { adminInfo, checkPermission, projectConfig } = useCloudPermission();
const canManage = computed(() => checkPermission(10_821));
const rows = ref<UsdtRechargeItem[]>([]);
const listLoading = ref(false);
const listError = ref('');
const total = ref<RechargeSpecializedTotal>({});
const playerLevels = ref<Array<{ Id: RechargeChannelId; LevelName?: string }>>(
  [],
);
const templates = ref<RechargeQuickTemplate[]>([]);
const dependenciesLoading = ref(false);
const actionId = ref<RechargeChannelId>();
const ordering = ref(false);

const modalOpen = ref(false);
const mode = ref<FormMode>('create');
const detailLoading = ref(false);
const detailError = ref('');
const saving = ref(false);
const sourceDetail = ref<Record<string, unknown>>({});
const sourceConditions = ref<Record<string, unknown>>({});
const baseline = ref('');
const templateName = ref('');

const form = reactive<UsdtFormModel>(makeDefaultForm());

const vipOptions = computed(() => {
  const values = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId: number;
    VipLevelName?: string;
  }>;
  return values.map((item) => ({
    label: item.VipLevelName || `VIP${item.VipLevelId}`,
    value: item.VipLevelId,
  }));
});
const vipIds = computed(() => vipOptions.value.map((item) => item.value));

const channelOptions = computed(() => {
  const values = (projectConfig.value?.ChildChannelInfo || []) as Array<{
    ChannelId: RechargeChannelId;
    ChannelName?: string;
    IsHidden?: number;
  }>;
  return values
    .filter((item) => Number(item.IsHidden) !== 2)
    .map((item) => ({
      label: `${item.ChannelName || '-'} (${item.ChannelId})`,
      value: item.ChannelId,
    }));
});

const levelOptions = computed(() =>
  playerLevels.value.map((item) => ({
    label: item.LevelName || String(item.Id),
    value: item.Id,
  })),
);
const levelNameMap = computed(
  () =>
    new Map(
      playerLevels.value.map((item) => [
        String(item.Id),
        item.LevelName || String(item.Id),
      ]),
    ),
);
const channelNameMap = computed(
  () =>
    new Map(
      channelOptions.value.map((item) => [String(item.value), item.label]),
    ),
);
const isDirty = computed(
  () =>
    modalOpen.value &&
    !detailLoading.value &&
    baseline.value !== snapshotForm(),
);

const columns: TableColumnsType<UsdtRechargeItem> = [
  { key: 'order', title: '排序', width: 105 },
  { key: 'Open', title: '状态', width: 80 },
  { dataIndex: 'NickName', key: 'NickName', title: '通道名称', width: 140 },
  { dataIndex: 'Agreement', key: 'Agreement', title: '协议', width: 90 },
  {
    dataIndex: 'ChannelAddress',
    key: 'ChannelAddress',
    title: '通道地址',
    width: 190,
  },
  {
    dataIndex: 'DailyLimit',
    key: 'DailyLimit',
    title: '每日限额',
    width: 110,
  },
  { key: 'amount', title: '充值金额', width: 170 },
  { key: 'levels', title: '会员层级', width: 150 },
  { key: 'audience', title: '开放人群', width: 200 },
  { key: 'platform', title: '设备显示', width: 145 },
  { key: 'channels', title: '指定渠道', width: 180 },
  { dataIndex: 'Priority', key: 'Priority', title: '优先级', width: 90 },
  { fixed: 'right', key: 'action', title: '操作', width: 135 },
];

function makeDefaultForm(): UsdtFormModel {
  return {
    Agreement: 'TRC20',
    AllowInput: 2,
    ChannelAddress: '',
    DailyLimit: undefined,
    Gears: [],
    InputMax: undefined,
    InputMin: undefined,
    LevelIds: [],
    NickName: '',
    PlatformType: [1, 2, 3, 4],
    Priority: 0,
    RegTime: [0, 0],
    TestChannel: [],
    VipV2: [],
    timeCheck: false,
    vipCheck: false,
  };
}

function splitWire(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseConditions(value: unknown): RechargeConditions {
  let parsed: Record<string, unknown> = {};
  if (typeof value === 'string' && value) {
    try {
      parsed = JSON.parse(value) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  } else if (value && typeof value === 'object') {
    parsed = value as Record<string, unknown>;
  }
  const reg = Array.isArray(parsed.RegTime)
    ? parsed.RegTime.map(Number)
    : [0, 0];
  const vip = Array.isArray(parsed.VipV2)
    ? parsed.VipV2.map(Number)
    : [ALL_VIP];
  return {
    ...parsed,
    RegTime: [reg[0] || 0, reg[1] || 0],
    VipV2: vip.length > 0 ? vip : [ALL_VIP],
  };
}

function currentAgentId(): RechargeChannelId | undefined {
  const info = adminInfo.value as null | Record<string, unknown>;
  const admin = info?.Admin as Record<string, unknown> | undefined;
  const account = info?.Account as Record<string, unknown> | undefined;
  return (admin?.AgentId ??
    account?.AgentId ??
    projectConfig.value?.AccountTeamInfo?.AgentId) as
    | RechargeChannelId
    | undefined;
}

function normalizedGears() {
  return [
    ...new Set(
      form.Gears.map(Number).filter((value) => Number.isFinite(value)),
    ),
  ].toSorted((left, right) => left - right);
}

function snapshotForm() {
  return JSON.stringify({
    ...form,
    Gears: normalizedGears(),
    LevelIds: form.LevelIds.map(String).toSorted(),
    PlatformType: form.PlatformType.toSorted(),
    TestChannel: form.TestChannel.map(String).toSorted(),
    VipV2: form.VipV2.toSorted((a, b) => a - b),
  });
}

function hydrateForm(detail: UsdtRechargeItem) {
  const conditions = parseConditions(detail.Conditions);
  const vip = conditions.VipV2 || [ALL_VIP];
  const next: UsdtFormModel = {
    Agreement: 'TRC20',
    AllowInput: Number(detail.AllowInput) === 1 ? 1 : 2,
    ChannelAddress: String(detail.ChannelAddress || ''),
    DailyLimit:
      detail.DailyLimit === '' || detail.DailyLimit == null
        ? undefined
        : Number(detail.DailyLimit),
    Gears: splitWire(detail.Gears).map(Number),
    InputMax:
      detail.InputMax === '' || detail.InputMax == null
        ? undefined
        : Number(detail.InputMax),
    InputMin:
      detail.InputMin === '' || detail.InputMin == null
        ? undefined
        : Number(detail.InputMin),
    LevelIds: splitWire(detail.LevelIds),
    NickName: String(detail.NickName || ''),
    PlatformType:
      splitWire(detail.PlatformType).length > 0
        ? splitWire(detail.PlatformType).map(Number)
        : [1, 2, 3, 4],
    Priority:
      detail.Priority === '' || detail.Priority == null
        ? 0
        : Number(detail.Priority),
    RegTime: [
      Number(conditions.RegTime?.[0] || 0),
      Number(conditions.RegTime?.[1] || 0),
    ],
    TestChannel: splitWire(detail.TestChannel),
    VipV2: vip.includes(ALL_VIP) ? [...vipIds.value] : [...vip],
    timeCheck: Boolean(conditions.RegTime?.[0] || conditions.RegTime?.[1]),
    vipCheck: !vip.includes(ALL_VIP),
  };
  Object.assign(form, next);
  sourceDetail.value = { ...detail };
  sourceConditions.value = { ...conditions };
  baseline.value = snapshotForm();
}

async function loadList() {
  listLoading.value = true;
  listError.value = '';
  try {
    const [result, totalResult] = await Promise.all([
      fetchUsdtRechargeListApi({ ...listQuery }),
      fetchUsdtRechargeTotalApi({ PayType: PAY_TYPE }),
    ]);
    rows.value = result.Items.toSorted(
      (left, right) => Number(right.Index || 0) - Number(left.Index || 0),
    );
    total.value = totalResult.Items || {};
  } catch (error) {
    listError.value =
      error instanceof Error ? error.message : 'USDT 通道加载失败';
  } finally {
    listLoading.value = false;
  }
}

async function loadDependencies() {
  dependenciesLoading.value = true;
  try {
    const [levelResult, templateResult] = await Promise.all([
      // 勿传 BeginTime/EndTime=1：本环境会 Items=null；对齐兑换码面板拉全量层级
      fetchRechargePlayerLevelsApi({
        LevelName: '',
        Page: 1,
        PageSize: 999,
      }),
      fetchRechargeQuickTemplatesApi(),
    ]);
    playerLevels.value = levelResult.Items;
    templates.value = templateResult.Items;
  } catch {
    message.warning('层级或渠道模板加载失败，可点击重试');
  } finally {
    dependenciesLoading.value = false;
  }
}

function openCreate() {
  mode.value = 'create';
  sourceDetail.value = {};
  sourceConditions.value = {};
  Object.assign(form, makeDefaultForm());
  form.VipV2 = [...vipIds.value];
  templateName.value = '';
  detailError.value = '';
  detailLoading.value = false;
  modalOpen.value = true;
  baseline.value = snapshotForm();
}

async function openEdit(row: UsdtRechargeItem) {
  mode.value = 'edit';
  sourceDetail.value = { ...row };
  detailError.value = '';
  detailLoading.value = true;
  modalOpen.value = true;
  try {
    const detail = await fetchUsdtRechargeDetailApi(row.Id);
    hydrateForm(detail);
  } catch (error) {
    detailError.value =
      error instanceof Error ? error.message : '通道详情加载失败';
  } finally {
    detailLoading.value = false;
  }
}

async function retryDetail() {
  const id = sourceDetail.value.Id as RechargeChannelId | undefined;
  if (id == null) return;
  await openEdit({ Id: id });
}

function validateForm(): string | undefined {
  if (!form.NickName.trim()) return '请输入通道名称';
  if (
    !form.ChannelAddress.trim() ||
    !/^[A-Za-z0-9-]+$/.test(form.ChannelAddress.trim())
  ) {
    return '通道地址必填，且只能包含字母、数字和连字符';
  }
  if (
    form.DailyLimit == null ||
    !Number.isInteger(Number(form.DailyLimit)) ||
    Number(form.DailyLimit) < 0
  ) {
    return '每日充值限额必须是非负整数';
  }
  if (form.PlatformType.length === 0) return '请至少选择一个设备';
  const gears = normalizedGears();
  if (gears.length === 0) return '请至少添加一个快捷金额';
  if (gears.some((value) => !Number.isInteger(value))) {
    return '快捷金额必须是整数';
  }
  if (form.AllowInput === 1) {
    const min = Number(form.InputMin);
    const max = Number(form.InputMax);
    if (!Number.isInteger(min) || min <= 0 || min > 100_000) {
      return '最小金额必须是 1 至 100000 的整数';
    }
    if (!Number.isInteger(max) || max < min || max > 100_000) {
      return '最大金额必须是不小于最小金额且不超过 100000 的整数';
    }
    if (min > Math.min(...gears)) return '最小金额不能大于最小快捷金额';
    if (max < Math.max(...gears)) return '最大金额不能小于最大快捷金额';
  }
  if (form.timeCheck) {
    const [min, max] = form.RegTime.map(Number);
    if (
      min === undefined ||
      max === undefined ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max <= min ||
      max > 99_999_999
    ) {
      return '注册时长须为非负整数，且结束值大于开始值（最大 99999999）';
    }
  }
  if (form.vipCheck && form.VipV2.length === 0) {
    return '请至少选择一个 VIP';
  }
  return undefined;
}

function buildPayload(): UsdtRechargePayload {
  const gears = normalizedGears();
  const conditions = {
    ...sourceConditions.value,
    RegTime: form.timeCheck ? form.RegTime.map(Number) : [0, 0],
    VipV2: form.vipCheck ? form.VipV2.toSorted((a, b) => a - b) : [ALL_VIP],
  };
  const common = {
    ...sourceDetail.value,
    AgentId: currentAgentId(),
    Agreement: 'TRC20',
    AllowInput: form.AllowInput,
    ChannelAddress: form.ChannelAddress.trim(),
    Conditions: JSON.stringify(conditions),
    DailyLimit: Number(form.DailyLimit),
    Gears: gears.join(','),
    InputMax: form.AllowInput === 1 ? Number(form.InputMax) : '',
    InputMin: form.AllowInput === 1 ? Number(form.InputMin) : '',
    LevelIds: form.LevelIds.join(','),
    NickName: form.NickName.trim(),
    PayType: PAY_TYPE,
    PlatformType: form.PlatformType.toSorted().join(','),
    Priority: Number(form.Priority || 0),
    TestChannel: form.TestChannel.join(','),
  } as UsdtRechargePayload;
  if (mode.value === 'create') {
    delete common.Id;
    common.Hash = md5(String(Date.now())).toString();
    common.ResetTime = '';
    common.Open = 2;
    common.Index = rows.value.length;
  }
  return common;
}

async function refreshAfterMutation() {
  await loadList();
  emit('changed');
}

async function submit() {
  const error = validateForm();
  if (error) {
    message.error(error);
    return;
  }
  saving.value = true;
  try {
    const payload = buildPayload();
    if (mode.value === 'create') {
      await createUsdtRechargeApi(payload);
      message.success('新增成功');
    } else {
      await updateUsdtRechargeApi(payload);
      message.success('保存成功');
    }
    baseline.value = snapshotForm();
    modalOpen.value = false;
    await refreshAfterMutation();
  } catch {
    message.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

function requestClose() {
  if (saving.value) return;
  if (!isDirty.value) {
    modalOpen.value = false;
    return;
  }
  Modal.confirm({
    cancelText: '继续编辑',
    content: '关闭后未保存的修改将丢失。',
    okText: '放弃修改',
    onOk: () => {
      modalOpen.value = false;
    },
    title: '放弃修改？',
  });
}

function handleSwitch(row: UsdtRechargeItem, checked: boolean) {
  const next = checked ? 1 : 2;
  Modal.confirm({
    content: `确认${checked ? '开启' : '关闭'}通道「${row.NickName || row.Id}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await switchUsdtRechargeApi({ Id: row.Id, Open: next });
        message.success('状态更新成功');
        await refreshAfterMutation();
      } catch {
        message.error('状态更新失败，请重试');
      } finally {
        actionId.value = undefined;
      }
    },
    title: '状态确认',
  });
}

function handleDelete(row: UsdtRechargeItem) {
  Modal.confirm({
    content: `删除后无法恢复，确认删除「${row.NickName || row.Id}」？`,
    okButtonProps: { danger: true },
    okText: '删除',
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await deleteUsdtRechargeApi(row.Id);
        message.success('删除成功');
        await refreshAfterMutation();
      } catch {
        message.error('删除失败，请重试');
      } finally {
        actionId.value = undefined;
      }
    },
    title: '删除通道',
  });
}

async function moveRow(index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= rows.value.length) return;
  const prepared = [...rows.value];
  [prepared[index], prepared[target]] = [prepared[target]!, prepared[index]!];
  ordering.value = true;
  try {
    await sortUsdtRechargeApi({
      Ids: prepared
        .map((item) => item.Id)
        .toReversed()
        .join(','),
    });
    message.success('排序已更新');
    await refreshAfterMutation();
  } catch {
    message.error('排序失败，请重试');
    await loadList();
  } finally {
    ordering.value = false;
  }
}

function applyTemplate(item: RechargeQuickTemplate) {
  form.TestChannel = splitWire(item.TestChannel);
}

async function saveTemplate() {
  if (!templateName.value.trim()) {
    message.error('请输入模板名称');
    return;
  }
  if (form.TestChannel.length === 0) {
    message.error('指定渠道为空');
    return;
  }
  saving.value = true;
  try {
    await createRechargeQuickTemplateApi({
      Conditions: JSON.stringify({
        RegTime: form.timeCheck ? form.RegTime : [0, 0],
        VipV2: form.vipCheck ? form.VipV2 : [ALL_VIP],
      }),
      LevelIds: form.LevelIds.join(','),
      ModelName: templateName.value.trim(),
      PlatformType: form.PlatformType.join(','),
      TestChannel: form.TestChannel.join(','),
    });
    templateName.value = '';
    await loadDependencies();
    emit('changed');
    message.success('模板已收藏');
  } catch {
    message.error('模板保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

function deleteTemplate(item: RechargeQuickTemplate) {
  Modal.confirm({
    content: `确认删除模板「${item.ModelName || item.Id}」？`,
    onOk: async () => {
      try {
        await deleteRechargeQuickTemplateApi(item.Id);
        await loadDependencies();
        emit('changed');
        message.success('模板已删除');
      } catch {
        message.error('模板删除失败，请重试');
      }
    },
    title: '删除模板',
  });
}

function platformText(value: unknown) {
  const values = splitWire(value).map(Number);
  if (values.length === 0 || values.length === platformOptions.length) {
    return '所有设备';
  }
  return platformOptions
    .filter((item) => values.includes(item.value))
    .map((item) => item.label)
    .join('、');
}

function levelText(value: unknown) {
  const values = splitWire(value);
  if (values.length === 0) return '所有层级';
  return values.map((item) => levelNameMap.value.get(item) || item).join('、');
}

function channelText(value: unknown) {
  const values = splitWire(value);
  if (values.length === 0) return '所有渠道';
  return values
    .map((item) => channelNameMap.value.get(item) || item)
    .join('、');
}

function audienceText(value: unknown) {
  const conditions = parseConditions(value);
  const parts: string[] = [];
  if (conditions.RegTime[0] || conditions.RegTime[1]) {
    parts.push(`注册 ${conditions.RegTime[0]}-${conditions.RegTime[1]} 小时`);
  }
  if (!conditions.VipV2.includes(ALL_VIP)) {
    parts.push(conditions.VipV2.map((item) => `VIP${item}`).join('、'));
  }
  return parts.join('；') || '全部用户';
}

onMounted(() => {
  void Promise.all([loadList(), loadDependencies()]);
});
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <Space wrap>
        <Tag color="green">开启 {{ total.Opened || 0 }}</Tag>
        <Tag>关闭 {{ total.Closed || 0 }}</Tag>
        <Button :loading="listLoading" @click="loadList">刷新</Button>
        <Button :loading="dependenciesLoading" @click="loadDependencies">
          重试依赖
        </Button>
      </Space>
      <Button v-if="canManage" type="primary" @click="openCreate">
        新增 USDT 通道
      </Button>
    </div>

    <Result
      v-if="listError && !listLoading"
      status="error"
      title="USDT 通道加载失败"
      :sub-title="listError"
    >
      <template #extra>
        <Button type="primary" @click="loadList">重试</Button>
      </template>
    </Result>

    <Table
      v-else
      :columns="columns"
      :data-source="rows"
      :loading="listLoading"
      :pagination="false"
      :row-key="(row) => row.Id"
      :scroll="{ x: 1740 }"
      size="small"
    >
      <template #bodyCell="{ column, index, record: row }">
        <template v-if="column.key === 'order'">
          <Space v-if="canManage" :size="2">
            <Button
              :disabled="index === 0 || ordering"
              size="small"
              @click="moveRow(index, -1)"
            >
              ↑
            </Button>
            <Button
              :disabled="index === rows.length - 1 || ordering"
              size="small"
              @click="moveRow(index, 1)"
            >
              ↓
            </Button>
          </Space>
          <span v-else>{{ index + 1 }}</span>
        </template>
        <template v-else-if="column.key === 'Open'">
          <Switch
            v-if="canManage"
            :checked="Number(row.Open) === 1"
            :loading="actionId === row.Id"
            @change="
              (checked) =>
                handleSwitch(row as UsdtRechargeItem, Boolean(checked))
            "
          />
          <Tag v-else :color="Number(row.Open) === 1 ? 'success' : 'default'">
            {{ Number(row.Open) === 1 ? '开启' : '关闭' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'amount'">
          <div>固定：{{ row.Gears || '-' }}</div>
          <div
            v-if="Number(row.AllowInput) === 1"
            class="text-xs text-gray-500"
          >
            范围：{{ row.InputMin }} - {{ row.InputMax }}
          </div>
        </template>
        <template v-else-if="column.key === 'levels'">
          {{ levelText(row.LevelIds) }}
        </template>
        <template v-else-if="column.key === 'audience'">
          {{ audienceText(row.Conditions) }}
        </template>
        <template v-else-if="column.key === 'platform'">
          {{ platformText(row.PlatformType) }}
        </template>
        <template v-else-if="column.key === 'channels'">
          {{ channelText(row.TestChannel) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Space v-if="canManage" :size="4">
            <Button size="small" @click="openEdit(row as UsdtRechargeItem)">
              编辑
            </Button>
            <Button
              danger
              :loading="actionId === row.Id"
              size="small"
              @click="handleDelete(row as UsdtRechargeItem)"
            >
              删除
            </Button>
          </Space>
          <span v-else>-</span>
        </template>
      </template>
    </Table>

    <Modal
      :confirm-loading="saving"
      :mask-closable="false"
      :ok-button-props="{ disabled: detailLoading || !!detailError }"
      :open="modalOpen"
      :title="mode === 'create' ? '新增 USDT 通道' : '编辑 USDT 通道'"
      width="min(760px, calc(100vw - 24px))"
      cancel-text="取消"
      destroy-on-close
      ok-text="保存"
      @cancel="requestClose"
      @ok="submit"
    >
      <div class="max-h-[70vh] overflow-y-auto px-1">
        <div
          v-if="detailLoading"
          class="flex min-h-64 items-center justify-center"
        >
          <Spin tip="正在加载完整通道详情…" />
        </div>
        <Result
          v-else-if="detailError"
          status="error"
          title="详情加载失败"
          :sub-title="detailError"
        >
          <template #extra>
            <Button type="primary" @click="retryDetail">重试</Button>
          </template>
        </Result>
        <Form v-else layout="vertical">
          <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item label="通道名称" required>
              <Input
                v-model:value="form.NickName"
                :maxlength="100"
                placeholder="请输入通道名称"
              />
            </Form.Item>
            <Form.Item label="协议类型" required>
              <Radio.Group v-model:value="form.Agreement">
                <Radio value="TRC20">TRC20</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="通道地址" required>
              <Input
                v-model:value="form.ChannelAddress"
                :maxlength="200"
                placeholder="仅字母、数字和连字符"
              />
            </Form.Item>
            <Form.Item label="每日充值限额" required>
              <InputNumber
                v-model:value="form.DailyLimit"
                :min="0"
                :precision="0"
                class="w-full"
                placeholder="非负整数"
              />
            </Form.Item>
            <Form.Item class="md:col-span-2" label="设备显示" required>
              <Checkbox.Group
                v-model:value="form.PlatformType"
                :options="platformOptions"
              />
            </Form.Item>
            <Form.Item class="md:col-span-2" label="快捷金额" required>
              <Select
                v-model:value="form.Gears"
                mode="tags"
                :open="false"
                placeholder="输入整数后按回车，自动去重并排序"
              />
            </Form.Item>
            <Form.Item label="允许玩家输入">
              <Switch
                :checked="form.AllowInput === 1"
                checked-children="允许"
                un-checked-children="不允许"
                @change="form.AllowInput = $event ? 1 : 2"
              />
            </Form.Item>
            <Form.Item label="优先级">
              <InputNumber
                v-model:value="form.Priority"
                :precision="0"
                class="w-full"
              />
            </Form.Item>
            <Form.Item label="最小金额" :required="form.AllowInput === 1">
              <InputNumber
                v-model:value="form.InputMin"
                :disabled="form.AllowInput !== 1"
                :max="100000"
                :min="1"
                :precision="0"
                class="w-full"
              />
            </Form.Item>
            <Form.Item label="最大金额" :required="form.AllowInput === 1">
              <InputNumber
                v-model:value="form.InputMax"
                :disabled="form.AllowInput !== 1"
                :max="100000"
                :min="1"
                :precision="0"
                class="w-full"
              />
            </Form.Item>
            <Form.Item class="md:col-span-2" label="指定渠道">
              <Select
                v-model:value="form.TestChannel"
                allow-clear
                mode="multiple"
                :options="channelOptions"
                placeholder="不选表示所有渠道"
                show-search
              />
              <div
                v-if="templates.length > 0"
                class="mt-2 flex flex-wrap gap-1"
              >
                <Tag
                  v-for="item in templates"
                  :key="item.Id"
                  :closable="canManage"
                  class="cursor-pointer"
                  @click="applyTemplate(item)"
                  @close.prevent="deleteTemplate(item)"
                >
                  {{ item.ModelName || item.Id }}
                </Tag>
              </div>
              <div v-if="canManage" class="mt-2 flex w-full">
                <Input
                  v-model:value="templateName"
                  class="min-w-0 flex-1"
                  placeholder="模板名称"
                  @press-enter="saveTemplate"
                />
                <Button :loading="saving" @click="saveTemplate"
                  >收藏模板</Button
                >
              </div>
            </Form.Item>
            <Form.Item class="md:col-span-2" label="会员层级">
              <Select
                v-model:value="form.LevelIds"
                allow-clear
                mode="multiple"
                :options="levelOptions"
                placeholder="不选表示所有层级"
                show-search
              />
            </Form.Item>
            <Form.Item label="限制注册时长">
              <Switch v-model:checked="form.timeCheck" />
            </Form.Item>
            <Form.Item label="注册时长（小时）">
              <div class="flex">
                <InputNumber
                  v-model:value="form.RegTime[0]"
                  :disabled="!form.timeCheck"
                  :min="0"
                  :precision="0"
                  placeholder="开始"
                />
                <InputNumber
                  v-model:value="form.RegTime[1]"
                  :disabled="!form.timeCheck"
                  :min="0"
                  :precision="0"
                  placeholder="结束"
                />
              </div>
            </Form.Item>
            <Form.Item label="限制 VIP">
              <Switch v-model:checked="form.vipCheck" />
            </Form.Item>
            <Form.Item label="开放 VIP">
              <Select
                v-model:value="form.VipV2"
                :disabled="!form.vipCheck"
                mode="multiple"
                :options="vipOptions"
                placeholder="请选择 VIP"
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  </div>
</template>

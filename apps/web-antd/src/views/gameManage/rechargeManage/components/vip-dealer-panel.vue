<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';
import type { SelectValue } from 'ant-design-vue/es/select';

import type {
  AvailableCoinDealer,
  RechargeChannelId,
  RechargeChildChannelOption,
  RechargeConditions,
  RechargeQuickTemplate,
  VipDealerItem,
  VipDealerPayload,
} from '#/types/recharge-channel';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Checkbox,
  Col,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Radio,
  Result,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import md5 from 'crypto-js/md5';

import { getProjectConfigApi } from '#/api/core/project';
import {
  createRechargeQuickTemplateApi,
  createVipDealerApi,
  deleteRechargeQuickTemplateApi,
  deleteVipDealerApi,
  fetchAvailableCoinDealersApi,
  fetchRechargePlayerLevelsApi,
  fetchRechargeQuickTemplatesApi,
  fetchVipDealerDetailApi,
  fetchVipDealerListApi,
  fetchVipDealerOrderModeApi,
  sortVipDealersApi,
  updateVipDealerApi,
  updateVipDealerOrderModeApi,
  updateVipDealerStatusApi,
} from '#/api/gameManage/recharge-channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { getServiceImageUrl } from '#/utils/media';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

defineOptions({ name: 'VipDealerPanel' });

const emit = defineEmits<{ changed: [] }>();

const ALL_CHANNEL = '__ALL_CHANNEL__';
const DEVICE_OPTIONS = [
  { label: '安卓', value: 1 },
  { label: 'iOS', value: 2 },
  { label: 'H5', value: 3 },
  { label: 'PC', value: 4 },
];

interface DealerForm {
  CoinDealerId?: RechargeChannelId;
  ConditionsExtra: Record<string, unknown>;
  LevelIds: RechargeChannelId[];
  NickName: string;
  PlatformType: number[];
  Priority: number | undefined;
  RegTime: [number | undefined, number | undefined];
  TestChannel: RechargeChannelId[];
  TimeCheck: boolean;
  Types: Array<number | string>;
  Username: string;
  VipCheck: boolean;
  VipV2: number[];
}

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const canManage = computed(() => checkPermission(10_821));

const rows = ref<VipDealerItem[]>([]);
const total = ref(0);
const loading = ref(false);
const loadError = ref('');
const actionId = ref<RechargeChannelId>();
const availableLoading = ref(false);
const availableDealers = ref<AvailableCoinDealer[]>([]);
const playerLevels = ref<Array<{ Id: RechargeChannelId; LevelName?: string }>>(
  [],
);
const templates = ref<RechargeQuickTemplate[]>([]);
const orderMode = ref(1);
const modeSaving = ref(false);
const query = reactive({
  Keyword: '',
  Page: 1,
  PageSize: 20,
  Status: undefined as number | undefined,
});

const modalOpen = ref(false);
const modalMode = ref<'create' | 'edit'>('create');
const modalLoading = ref(false);
const saving = ref(false);
const detailBase = ref<Record<string, unknown>>({});
const formSnapshot = ref('');
const templateName = ref('');
const templateSaving = ref(false);

const form = reactive<DealerForm>(freshForm());

const vipOptions = computed(() => {
  const source = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId?: number;
    VipLevelName?: string;
  }>;
  return source.map((item, index) => ({
    label: item.VipLevelName || `VIP${item.VipLevelId ?? index}`,
    value: Number(item.VipLevelId ?? index),
  }));
});

const allVipIds = computed(() => vipOptions.value.map((item) => item.value));

const channelOptions = computed(() => {
  const source = (projectConfig.value?.ChildChannelInfo ||
    []) as RechargeChildChannelOption[];
  return [
    { label: '全部渠道', value: ALL_CHANNEL },
    ...source
      .filter((item) => Number(item.IsHidden) !== 2)
      .map((item) => ({
        label: `${item.ChannelName || '渠道'}(${item.ChannelId})`,
        value: item.ChannelId,
      })),
  ];
});

const levelOptions = computed(() =>
  playerLevels.value.map((item) => ({
    label: item.LevelName || String(item.Id),
    value: item.Id,
  })),
);

const availableOptions = computed(() =>
  availableDealers.value.map((item) => ({
    label: `${item.Username || item.Id}${
      item.nick_name || item.NickName
        ? ` / ${item.nick_name || item.NickName}`
        : ''
    }`,
    value: item.Id,
  })),
);

const columns: TableColumnsType<VipDealerItem> = [
  { key: 'sort', title: '排序', width: 112 },
  { key: 'status', title: '开关', width: 80 },
  { dataIndex: 'Username', key: 'Username', title: '所属币商账号', width: 140 },
  { dataIndex: 'NickName', key: 'NickName', title: '客服名称', width: 140 },
  { key: 'online', title: '营业状态', width: 90 },
  { key: 'photo', title: '头像', width: 74 },
  { key: 'types', title: '支付方式', width: 180 },
  { dataIndex: 'CallCount', key: 'CallCount', title: '累计进线', width: 90 },
  { dataIndex: 'OrderCount', key: 'OrderCount', title: '累计订单', width: 90 },
  { key: 'rate', title: '下单率', width: 88 },
  { key: 'levels', title: '会员层级', width: 160 },
  { key: 'audience', title: '开放人群', width: 220 },
  { key: 'platform', title: '设备显示', width: 150 },
  { key: 'channels', title: '指定渠道', width: 220 },
  { key: 'action', fixed: 'right' as const, title: '操作', width: 126 },
];

function freshForm(): DealerForm {
  return {
    ConditionsExtra: {},
    LevelIds: [],
    NickName: '',
    PlatformType: DEVICE_OPTIONS.map((item) => item.value),
    Priority: 100,
    RegTime: [0, 0],
    TestChannel: [ALL_CHANNEL],
    TimeCheck: false,
    Types: [],
    Username: '',
    VipCheck: false,
    VipV2: [],
  };
}

function replaceForm(value: DealerForm) {
  Object.assign(form, freshForm(), value);
}

function parseWireList(
  value: unknown,
  numberValues = false,
): Array<number | string> {
  const values = (Array.isArray(value) ? value : String(value ?? '').split(','))
    .map((item) => String(item).trim())
    .filter(Boolean);
  return values.map((item) => {
    if (!numberValues) return item as number | string;
    const parsed = Number(item);
    return Number.isFinite(parsed) ? parsed : String(item);
  });
}

function parseConditions(value: unknown): {
  conditions: RechargeConditions;
  extra: Record<string, unknown>;
} {
  let parsed: Record<string, unknown>;
  try {
    if (typeof value === 'string') {
      parsed = JSON.parse(value) as Record<string, unknown>;
    } else if (value && typeof value === 'object') {
      parsed = { ...value } as Record<string, unknown>;
    } else {
      parsed = {};
    }
  } catch {
    parsed = {};
  }
  const reg =
    Array.isArray(parsed.RegTime) && parsed.RegTime.length >= 2
      ? parsed.RegTime
      : [0, 0];
  const vip =
    Array.isArray(parsed.VipV2) && parsed.VipV2.length > 0
      ? parsed.VipV2
      : [9999];
  const { RegTime: _reg, VipV2: _vip, ...extra } = parsed;
  return {
    conditions: {
      RegTime: [Number(reg[0]) || 0, Number(reg[1]) || 0],
      VipV2: vip.map(Number).filter((item) => Number.isFinite(item)),
    },
    extra,
  };
}

function formState() {
  const sortedConditionsExtra: Record<string, unknown> = {};
  for (const key of Object.keys(form.ConditionsExtra).toSorted()) {
    sortedConditionsExtra[key] = form.ConditionsExtra[key];
  }
  return JSON.stringify({
    ...form,
    ConditionsExtra: sortedConditionsExtra,
  });
}

function isDirty() {
  return modalOpen.value && formSnapshot.value !== formState();
}

function normalizeSelectedChannels(values: RechargeChannelId[]) {
  if (values.includes(ALL_CHANNEL)) return [ALL_CHANNEL];
  return values.filter((item) => item !== ALL_CHANNEL);
}

function isRechargeChannelId(value: unknown): value is RechargeChannelId {
  return typeof value === 'number' || typeof value === 'string';
}

function onChannelsChange(value: SelectValue) {
  const values = Array.isArray(value) ? value.filter(isRechargeChannelId) : [];
  if (values.includes(ALL_CHANNEL)) {
    form.TestChannel =
      form.TestChannel.includes(ALL_CHANNEL) && values.length > 1
        ? values.filter((item) => item !== ALL_CHANNEL)
        : [ALL_CHANNEL];
    return;
  }
  form.TestChannel = values;
}

function wireChannels(values: RechargeChannelId[]) {
  return values.includes(ALL_CHANNEL) ? '' : values.join(',');
}

function dealerTypes(value: unknown) {
  return parseWireList(value).map(String);
}

function displayLevels(value: unknown) {
  const ids = parseWireList(value).map(String);
  if (ids.length === 0) return '全部层级';
  const names = ids.map(
    (id) =>
      playerLevels.value.find((item) => String(item.Id) === id)?.LevelName ||
      id,
  );
  return names.join('、');
}

function displayAudience(value: unknown) {
  const { conditions } = parseConditions(value);
  const parts: string[] = [];
  if (conditions.RegTime.some((item) => Number(item) !== 0)) {
    parts.push(`注册 ${conditions.RegTime[0]}–${conditions.RegTime[1]} 小时`);
  }
  if (!conditions.VipV2.includes(9999)) {
    const labels = conditions.VipV2.map(
      (id) =>
        vipOptions.value.find((item) => item.value === id)?.label || `VIP${id}`,
    );
    parts.push(labels.join('、') || '未选 VIP');
  }
  return parts.join('；') || '全部人群';
}

function displayPlatforms(value: unknown) {
  const ids = parseWireList(value, true).map(Number);
  if (ids.length === 0 || ids.length === DEVICE_OPTIONS.length)
    return '所有设备';
  return DEVICE_OPTIONS.filter((item) => ids.includes(item.value))
    .map((item) => item.label)
    .join('、');
}

function displayChannels(value: unknown) {
  const ids = parseWireList(value).map(String);
  if (ids.length === 0) return '所有渠道';
  const source = channelOptions.value.slice(1);
  return ids
    .map(
      (id) =>
        source.find((item) => String(item.value) === id)?.label || `渠道 ${id}`,
    )
    .join('、');
}

function avatarUrl(photo: unknown) {
  const value = String(photo || '');
  if (!value) return '';
  if (/^https?:\/\//.test(value) || value.includes('/')) {
    return getServiceImageUrl(value);
  }
  return getServiceImageUrl(`avatar/${value}.png`);
}

async function refreshAfterMutation(options: { available?: boolean } = {}) {
  const tasks: Promise<unknown>[] = [loadList(), getProjectConfigApi()];
  if (options.available) tasks.push(loadAvailable());
  await Promise.all(tasks);
  emit('changed');
}

async function loadList() {
  if (!canManage.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const result = await fetchVipDealerListApi({
      Keyword: query.Keyword.trim() || undefined,
      Page: query.Page,
      PageSize: query.PageSize,
      Status: query.Status,
    });
    rows.value = result.Items.toSorted(
      (a, b) => Number(b.Index || 0) - Number(a.Index || 0),
    );
    total.value = Number(result.Pagination?.MaxCount ?? rows.value.length);
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '币商客服列表加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadAvailable() {
  availableLoading.value = true;
  try {
    const result = await fetchAvailableCoinDealersApi();
    availableDealers.value = result.Items;
  } finally {
    availableLoading.value = false;
  }
}

async function loadDependencies() {
  const [levels, quickTemplates, mode] = await Promise.all([
    fetchRechargePlayerLevelsApi({ Page: 1, PageSize: 1000 }),
    fetchRechargeQuickTemplatesApi(),
    fetchVipDealerOrderModeApi(),
  ]);
  playerLevels.value = levels.Items;
  templates.value = quickTemplates.Items;
  orderMode.value = Number(mode.OrderSwitch || 1);
}

async function reloadAll() {
  loadError.value = '';
  try {
    await Promise.all([loadList(), loadAvailable(), loadDependencies()]);
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '关联配置加载失败，请重试';
  }
}

function search() {
  query.Page = 1;
  void loadList();
}

function resetSearch() {
  query.Keyword = '';
  query.Status = undefined;
  query.Page = 1;
  void loadList();
}

function changePage(page: number, pageSize: number) {
  query.Page = page;
  query.PageSize = pageSize;
  void loadList();
}

function selectAvailableDealer(value: SelectValue) {
  if (!isRechargeChannelId(value)) return;
  const id = value;
  const dealer = availableDealers.value.find((item) => item.Id === id);
  if (!dealer) return;
  form.CoinDealerId = dealer.Id;
  form.Username = String(dealer.Username || '');
  form.NickName = String(dealer.nick_name || dealer.NickName || '');
  form.Types = dealerTypes(dealer.Types);
}

function openCreate() {
  modalMode.value = 'create';
  detailBase.value = {};
  replaceForm({
    ...freshForm(),
    VipV2: [...allVipIds.value],
  });
  modalOpen.value = true;
  formSnapshot.value = formState();
}

async function openEdit(row: VipDealerItem) {
  modalMode.value = 'edit';
  modalOpen.value = true;
  modalLoading.value = true;
  try {
    const detail = await fetchVipDealerDetailApi(row.Id);
    detailBase.value = { ...detail };
    const { conditions, extra } = parseConditions(detail.Conditions);
    const unrestrictedVip = conditions.VipV2.includes(9999);
    replaceForm({
      CoinDealerId: detail.CoinDealerId,
      ConditionsExtra: extra,
      LevelIds: parseWireList(detail.LevelIds),
      NickName: String(detail.NickName || ''),
      PlatformType: parseWireList(detail.PlatformType, true).map(Number),
      Priority: Number(detail.Priority || 100),
      RegTime: [
        Number(conditions.RegTime[0]) || 0,
        Number(conditions.RegTime[1]) || 0,
      ],
      TestChannel: detail.TestChannel
        ? parseWireList(detail.TestChannel)
        : [ALL_CHANNEL],
      TimeCheck: conditions.RegTime.some((item) => Number(item) !== 0),
      Types: dealerTypes(detail.Types),
      Username: String(detail.Username || ''),
      VipCheck: !unrestrictedVip,
      VipV2: unrestrictedVip ? [...allVipIds.value] : [...conditions.VipV2],
    });
    if (form.PlatformType.length === 0) {
      form.PlatformType = DEVICE_OPTIONS.map((item) => item.value);
    }
    formSnapshot.value = formState();
    await loadTemplates();
  } catch {
    modalOpen.value = false;
  } finally {
    modalLoading.value = false;
  }
}

function validateForm() {
  if (modalMode.value === 'create' && !form.CoinDealerId) {
    message.error('请选择币商账号');
    return false;
  }
  if (form.PlatformType.length === 0) {
    message.error('请至少选择一个设备');
    return false;
  }
  if (form.VipCheck && form.VipV2.length === 0) {
    message.error('请至少选择一个 VIP 等级');
    return false;
  }
  if (form.TimeCheck) {
    const [min, max] = form.RegTime;
    if (
      min == null ||
      max == null ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max > 99_999_999 ||
      max <= min
    ) {
      message.error('注册时间需为非负整数，且结束时间必须大于开始时间');
      return false;
    }
  }
  if (
    form.Priority == null ||
    !Number.isInteger(form.Priority) ||
    form.Priority < 1 ||
    form.Priority > 100
  ) {
    message.error('分配权重需为 1–100 的整数');
    return false;
  }
  return true;
}

function buildPayload(): VipDealerPayload {
  const conditions = {
    ...form.ConditionsExtra,
    RegTime: form.TimeCheck
      ? [Number(form.RegTime[0]), Number(form.RegTime[1])]
      : [0, 0],
    VipV2: form.VipCheck ? form.VipV2 : [9999],
  };
  return {
    ...detailBase.value,
    CoinDealerId: form.CoinDealerId,
    Conditions: JSON.stringify(conditions),
    Hash: md5(String(Date.now())).toString(),
    LevelIds: form.LevelIds.join(','),
    NickName: form.NickName,
    PlatformType: form.PlatformType.join(','),
    Priority: form.Priority,
    TestChannel: wireChannels(form.TestChannel),
    Types: form.Types.join(','),
    Username: form.Username,
  };
}

async function submitForm() {
  if (!validateForm()) return;
  saving.value = true;
  try {
    const payload = buildPayload();
    if (modalMode.value === 'create') {
      await createVipDealerApi(payload);
      query.Page = 1;
    } else {
      await updateVipDealerApi(payload);
    }
    message.success(modalMode.value === 'create' ? '添加成功' : '修改成功');
    formSnapshot.value = formState();
    modalOpen.value = false;
    await refreshAfterMutation({ available: true });
  } finally {
    saving.value = false;
  }
}

function requestCloseModal() {
  if (!isDirty()) {
    modalOpen.value = false;
    return;
  }
  Modal.confirm({
    content: '当前设置尚未保存，确认关闭？',
    onOk: () => {
      modalOpen.value = false;
    },
    title: '放弃更改',
  });
}

function changeStatus(row: VipDealerItem, checked: boolean) {
  const next = checked ? 1 : 2;
  Modal.confirm({
    content: `确认${next === 1 ? '开启' : '关闭'}客服「${row.NickName || row.Username || row.Id}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        const detail = await fetchVipDealerDetailApi(row.Id);
        await updateVipDealerStatusApi({
          ...detail,
          Status: next,
        });
        message.success('状态更新成功');
        await refreshAfterMutation();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '状态确认',
  });
}

function removeDealer(row: VipDealerItem) {
  Modal.confirm({
    content: `确认删除客服「${row.NickName || row.Username || row.Id}」？此操作不可恢复。`,
    okButtonProps: { danger: true },
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await deleteVipDealerApi(row.Id);
        if (rows.value.length === 1 && query.Page > 1) query.Page -= 1;
        message.success('删除成功');
        await refreshAfterMutation({ available: true });
      } finally {
        actionId.value = undefined;
      }
    },
    title: '删除确认',
  });
}

async function moveRow(row: VipDealerItem, direction: -1 | 1) {
  const index = rows.value.findIndex((item) => item.Id === row.Id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= rows.value.length) return;
  const reordered = [...rows.value];
  [reordered[index], reordered[target]] = [
    reordered[target]!,
    reordered[index]!,
  ];
  actionId.value = row.Id;
  try {
    // The legacy exchange endpoint expects visible top-to-bottom ids reversed.
    await sortVipDealersApi({
      Ids: reordered
        .map((item) => item.Id)
        .toReversed()
        .join(','),
    });
    rows.value = reordered;
    message.success('排序已更新');
    await getProjectConfigApi();
    emit('changed');
  } finally {
    actionId.value = undefined;
  }
}

function changeOrderMode(value: number) {
  const previous = orderMode.value;
  Modal.confirm({
    content: `确认切换为${value === 2 ? '顺序分配' : '随机分配'}？`,
    onCancel: () => {
      orderMode.value = previous;
    },
    onOk: async () => {
      modeSaving.value = true;
      try {
        await updateVipDealerOrderModeApi({ OrderSwitch: value });
        orderMode.value = value;
        message.success('分配模式已更新');
        await getProjectConfigApi();
        emit('changed');
      } catch (error) {
        orderMode.value = previous;
        throw error;
      } finally {
        modeSaving.value = false;
      }
    },
    title: '切换分配模式',
  });
}

async function loadTemplates() {
  const result = await fetchRechargeQuickTemplatesApi();
  templates.value = result.Items;
}

function applyTemplate(template: RechargeQuickTemplate) {
  form.TestChannel = template.TestChannel
    ? normalizeSelectedChannels(parseWireList(template.TestChannel))
    : [ALL_CHANNEL];
}

async function saveTemplate() {
  const name = templateName.value.trim();
  if (!name) {
    message.error('请输入模板名称');
    return;
  }
  if (form.TestChannel.length === 0 || form.TestChannel.includes(ALL_CHANNEL)) {
    message.error('“全部渠道”无需收藏，请选择具体渠道');
    return;
  }
  templateSaving.value = true;
  try {
    await createRechargeQuickTemplateApi({
      ModelName: name,
      TestChannel: wireChannels(form.TestChannel),
    });
    templateName.value = '';
    await loadTemplates();
    message.success('模板已收藏');
  } finally {
    templateSaving.value = false;
  }
}

function removeTemplate(template: RechargeQuickTemplate) {
  Modal.confirm({
    content: `确认删除渠道模板「${template.ModelName || template.Id}」？`,
    onOk: async () => {
      await deleteRechargeQuickTemplateApi(template.Id);
      await loadTemplates();
      message.success('模板已删除');
    },
    title: '删除模板',
  });
}

function asVipDealer(record: unknown) {
  return record as VipDealerItem;
}

onMounted(() => {
  if (canManage.value) void reloadAll();
});
</script>

<template>
  <Result
    v-if="!canManage"
    status="403"
    sub-title="缺少币商客服管理权限（10821）"
    title="403"
  />
  <div v-else class="space-y-3">
    <Alert v-if="loadError" :message="loadError" show-icon type="error">
      <template #action>
        <Button size="small" @click="reloadAll">重试</Button>
      </template>
    </Alert>

    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="query.Keyword"
            allow-clear
            @press-enter="search"
            placeholder="请输入关键词"
          >
            <template #addonBefore>关键词</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">状态</span>
          <Select
            v-model:value="query.Status"
            allow-clear
            :options="[
              { label: '开启', value: 1 },
              { label: '关闭', value: 2 },
            ]"
            @change="search"
            placeholder="请选择状态"
          />
        </Space.Compact>
        <div class="query-filter-actions">
          <Button type="primary" @click="search">查询</Button>
          <Button @click="resetSearch">重置</Button>
          <Space wrap>
            <span class="text-sm text-gray-500">客服分配：</span>
            <Radio.Group
              :value="orderMode"
              :disabled="modeSaving"
              button-style="solid"
              size="small"
              @change="changeOrderMode(Number($event.target.value))"
            >
              <Radio.Button :value="2">顺序</Radio.Button>
              <Radio.Button :value="1">随机</Radio.Button>
            </Radio.Group>
            <Button type="primary" @click="openCreate">添加账号</Button>
          </Space>
        </div>
      </div>
    </div>

    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1960 }"
      row-key="Id"
      size="small"
    >
      <template #emptyText>
        <Empty description="暂无币商客服" />
      </template>
      <template #bodyCell="{ column, record: row, index }">
        <template v-if="column.key === 'sort'">
          <Space :size="4">
            <Button
              :disabled="index === 0"
              :loading="actionId === asVipDealer(row).Id"
              size="small"
              @click="moveRow(asVipDealer(row), -1)"
            >
              上移
            </Button>
            <Button
              :disabled="index === rows.length - 1"
              :loading="actionId === asVipDealer(row).Id"
              size="small"
              @click="moveRow(asVipDealer(row), 1)"
            >
              下移
            </Button>
          </Space>
        </template>
        <template v-else-if="column.key === 'status'">
          <Switch
            :checked="Number(asVipDealer(row).Status) === 1"
            :loading="actionId === asVipDealer(row).Id"
            checked-children="开"
            un-checked-children="关"
            @change="changeStatus(asVipDealer(row), !!$event)"
          />
        </template>
        <template v-else-if="column.key === 'online'">
          <Tag
            :color="
              Number(asVipDealer(row).CoinDealerOnline) === 1
                ? 'success'
                : 'error'
            "
          >
            {{
              Number(asVipDealer(row).CoinDealerOnline) === 1
                ? '营业中'
                : '已关闭'
            }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'photo'">
          <Tooltip :title="asVipDealer(row).Photo ? '点击预览' : '暂无头像'">
            <Image
              v-if="asVipDealer(row).Photo"
              :src="avatarUrl(asVipDealer(row).Photo)"
              :width="34"
              class="rounded"
            />
            <span v-else class="text-gray-400">无</span>
          </Tooltip>
        </template>
        <template v-else-if="column.key === 'types'">
          <Space
            v-if="dealerTypes(asVipDealer(row).Types).length > 0"
            :size="[4, 4]"
            wrap
          >
            <Tag
              v-for="type in dealerTypes(asVipDealer(row).Types)"
              :key="type"
            >
              {{ type }}
            </Tag>
          </Space>
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'rate'">
          {{
            Number(asVipDealer(row).CallCount)
              ? `${((Number(asVipDealer(row).OrderCount || 0) / Number(asVipDealer(row).CallCount)) * 100).toFixed(2)}%`
              : '0.00%'
          }}
        </template>
        <template v-else-if="column.key === 'levels'">
          <a @click="openEdit(asVipDealer(row))">
            {{ displayLevels(asVipDealer(row).LevelIds) }}
          </a>
        </template>
        <template v-else-if="column.key === 'audience'">
          <a @click="openEdit(asVipDealer(row))">
            {{ displayAudience(asVipDealer(row).Conditions) }}
          </a>
        </template>
        <template v-else-if="column.key === 'platform'">
          <a @click="openEdit(asVipDealer(row))">
            {{ displayPlatforms(asVipDealer(row).PlatformType) }}
          </a>
        </template>
        <template v-else-if="column.key === 'channels'">
          <Tooltip :title="displayChannels(asVipDealer(row).TestChannel)">
            <a class="line-clamp-2" @click="openEdit(asVipDealer(row))">
              {{ displayChannels(asVipDealer(row).TestChannel) }}
            </a>
          </Tooltip>
        </template>
        <template v-else-if="column.key === 'action'">
          <Space :size="4">
            <Button size="small" @click="openEdit(asVipDealer(row))">
              设置
            </Button>
            <Button danger size="small" @click="removeDealer(asVipDealer(row))">
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <div class="flex justify-end">
      <Pagination
        v-model:current="query.Page"
        v-model:page-size="query.PageSize"
        :page-size-options="TABLE_ANT_PAGE_SIZE_OPTIONS"
        :show-total="(value: number) => `共 ${value} 条`"
        :total="total"
        show-size-changer
        @change="changePage"
      />
    </div>

    <Modal
      :confirm-loading="saving"
      :open="modalOpen"
      :title="modalMode === 'create' ? '添加币商客服' : '通道显示设置'"
      destroy-on-close
      width="min(760px, 96vw)"
      @cancel="requestCloseModal"
      @ok="submitForm"
    >
      <div v-if="modalLoading" class="py-12 text-center text-gray-500">
        正在加载完整配置…
      </div>
      <Form v-else class="pt-2" layout="vertical">
        <Row :gutter="16">
          <Col :md="12" :xs="24">
            <Form.Item label="币商账号" required>
              <Select
                v-if="modalMode === 'create'"
                :value="form.CoinDealerId"
                :loading="availableLoading"
                :options="availableOptions"
                placeholder="选择已有币商账号"
                show-search
                :filter-option="
                  (input: string, option: any) =>
                    String(option.label)
                      .toLowerCase()
                      .includes(input.toLowerCase())
                "
                @change="selectAvailableDealer"
              />
              <Input v-else :value="form.Username" disabled />
              <div
                v-if="
                  modalMode === 'create' &&
                  !availableLoading &&
                  availableOptions.length === 0
                "
                class="mt-1 text-xs text-red-500"
              >
                没有可用币商账号，请先在币商模块创建。
              </div>
            </Form.Item>
          </Col>
          <Col :md="12" :xs="24">
            <Form.Item label="客服名称">
              <Input :value="form.NickName" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="支付方式">
          <Space v-if="form.Types.length > 0" :size="[4, 4]" wrap>
            <Tag v-for="type in form.Types" :key="type">{{ type }}</Tag>
          </Space>
          <span v-else class="text-gray-400">该账号未配置支付方式</span>
        </Form.Item>

        <Form.Item label="指定渠道">
          <Select
            :value="form.TestChannel"
            class="w-full"
            mode="multiple"
            :options="channelOptions"
            placeholder="选择全部渠道或具体渠道"
            show-search
            @change="onChannelsChange"
          />
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <Tag
              v-for="template in templates"
              :key="template.Id"
              closable
              class="cursor-pointer"
              @click.stop="applyTemplate(template)"
              @close.prevent.stop="removeTemplate(template)"
            >
              {{ template.ModelName || template.Id }}
            </Tag>
            <Input
              v-model:value="templateName"
              placeholder="新模板名称"
              size="small"
              style="width: 150px"
              @press-enter="saveTemplate"
            />
            <Button
              :loading="templateSaving"
              size="small"
              @click="saveTemplate"
            >
              收藏当前渠道
            </Button>
          </div>
        </Form.Item>

        <Form.Item label="设备显示" required>
          <Checkbox.Group
            v-model:value="form.PlatformType"
            :options="DEVICE_OPTIONS"
          />
        </Form.Item>

        <Form.Item label="会员层级">
          <Select
            v-model:value="form.LevelIds"
            class="w-full"
            mode="multiple"
            :options="levelOptions"
            placeholder="不选择表示全部层级"
            show-search
          />
        </Form.Item>

        <Form.Item label="开放人群">
          <Row :gutter="[16, 12]">
            <Col :md="8" :xs="24">
              <Checkbox v-model:checked="form.TimeCheck">限制注册时间</Checkbox>
            </Col>
            <Col :md="16" :xs="24">
              <Space>
                <InputNumber
                  v-model:value="form.RegTime[0]"
                  :disabled="!form.TimeCheck"
                  :min="0"
                  :precision="0"
                  placeholder="最小"
                  style="width: 110px"
                />
                <span>至</span>
                <InputNumber
                  v-model:value="form.RegTime[1]"
                  :disabled="!form.TimeCheck"
                  :min="0"
                  :precision="0"
                  placeholder="最大"
                  style="width: 110px"
                />
                <span>小时</span>
              </Space>
            </Col>
            <Col :md="8" :xs="24">
              <Checkbox v-model:checked="form.VipCheck">限制 VIP</Checkbox>
            </Col>
            <Col :md="16" :xs="24">
              <Select
                v-model:value="form.VipV2"
                class="w-full"
                :disabled="!form.VipCheck"
                mode="multiple"
                :options="vipOptions"
                placeholder="选择 VIP 等级"
              />
            </Col>
          </Row>
        </Form.Item>

        <Form.Item label="分配权重">
          <InputNumber
            v-model:value="form.Priority"
            :max="100"
            :min="1"
            :precision="0"
            style="width: 160px"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  PrivateCardItem,
  PrivateCardPayload,
  RechargeChannelId,
  RechargeConditions,
  RechargeQuickTemplate,
} from '#/types/recharge-channel';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createPrivateCardApi,
  createRechargeQuickTemplateApi,
  deletePrivateCardApi,
  deleteRechargeQuickTemplateApi,
  fetchPrivateCardDetailApi,
  fetchPrivateCardListApi,
  fetchPrivateCardTotalApi,
  fetchRechargePlayerLevelsApi,
  fetchRechargeQuickTemplatesApi,
  sortPrivateCardsApi,
  switchPrivateCardApi,
  updatePrivateCardApi,
} from '#/api/gameManage/recharge-channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { createRequestHash } from '#/utils/crypto';

defineOptions({ name: 'PrivateCardPanel' });

const emit = defineEmits<{ changed: [] }>();

interface ChannelOption {
  ChannelId: RechargeChannelId;
  ChannelName?: string;
  IsHidden?: number;
}

interface EditorForm {
  AllowInput: number;
  Bank: string;
  CardNo: string;
  Gears: string[];
  InputMax: number | undefined;
  InputMin: number | undefined;
  LevelIds: RechargeChannelId[];
  Name: string;
  NickName: string;
  PlatformType: number[];
  Priority: number;
  Rate: number | undefined;
  RegTimeEnabled: boolean;
  RegTimeMax: number | undefined;
  RegTimeMin: number | undefined;
  TestChannel: RechargeChannelId[];
  VipEnabled: boolean;
  VipV2: number[];
}

const PAY_TYPE = 10;
const ALL_VIP = 9999;
const PAGE_SIZE = 500;
const platformOptions = [
  { label: '安卓', value: 1 },
  { label: 'iOS', value: 2 },
  { label: 'H5', value: 3 },
  { label: 'PC', value: 4 },
];

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const canManage = computed(() => checkPermission(10_821));

const rows = ref<PrivateCardItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const total = ref<{ Closed?: number; Opened?: number }>({});
const actionId = ref<RechargeChannelId>();
const sorting = ref(false);

const playerLevels = ref<Array<{ Id: RechargeChannelId; LevelName?: string }>>(
  [],
);
const templates = ref<RechargeQuickTemplate[]>([]);
const dependenciesLoading = ref(false);

const channelOptions = computed(() => {
  const list = (projectConfig.value?.ChildChannelInfo || []) as ChannelOption[];
  return list
    .filter((item) => Number(item.IsHidden) !== 2)
    .map((item) => ({
      label: `${item.ChannelName || '-'} (${item.ChannelId})`,
      value: String(item.ChannelId),
    }));
});

const vipOptions = computed(() => {
  const list = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId: number;
    VipLevelName?: string;
  }>;
  return list.map((item) => ({
    label: item.VipLevelName || `VIP${item.VipLevelId}`,
    value: item.VipLevelId,
  }));
});

const levelOptions = computed(() =>
  playerLevels.value.map((item) => ({
    label: item.LevelName || String(item.Id),
    value: String(item.Id),
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

const columns: TableColumnsType<PrivateCardItem> = [
  { key: 'sort', title: '排序', width: 104 },
  { key: 'status', title: '状态', width: 84 },
  { dataIndex: 'NickName', key: 'NickName', title: '通道名称', width: 130 },
  { dataIndex: 'CardNo', key: 'CardNo', title: '银行卡账号', width: 180 },
  { dataIndex: 'Name', key: 'Name', title: '银行卡姓名', width: 120 },
  { dataIndex: 'Bank', key: 'Bank', title: '开户行', width: 140 },
  { key: 'amount', title: '充值金额', width: 180 },
  { key: 'levels', title: '玩家层级', width: 150 },
  { key: 'conditions', title: '注册时间 / VIP', width: 190 },
  { key: 'platform', title: '设备', width: 130 },
  { key: 'channels', title: '指定渠道', width: 180 },
  { fixed: 'right', key: 'actions', title: '操作', width: 130 },
];

function safeCommaList(
  value: unknown,
  convertNumber = false,
): RechargeChannelId[] {
  const values = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
  return values
    .map((item) => {
      if (!convertNumber) return item as RechargeChannelId;
      const parsed = Number(item);
      return Number.isFinite(parsed) ? parsed : undefined;
    })
    .filter((item): item is RechargeChannelId => item !== undefined);
}

function safeConditions(value: unknown): RechargeConditions {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = {};
    }
  }
  const object =
    parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {};
  const reg = Array.isArray(object.RegTime)
    ? object.RegTime.map(Number).filter((item) => Number.isFinite(item))
    : [];
  const vip = Array.isArray(object.VipV2)
    ? object.VipV2.map(Number).filter((item) => Number.isFinite(item))
    : [];
  return {
    ...object,
    RegTime: reg.length >= 2 ? [reg[0]!, reg[1]!] : [0, 0],
    VipV2: vip.length > 0 ? vip : [ALL_VIP],
  };
}

function rowConditions(row: PrivateCardItem) {
  return safeConditions(row.Conditions);
}

function displayLevels(value: unknown) {
  const ids = safeCommaList(value);
  if (ids.length === 0) return '全部';
  return ids.map((id) => levelNameMap.value.get(String(id)) || id).join('、');
}

function displayChannels(value: unknown) {
  const ids = safeCommaList(value);
  if (ids.length === 0) return '全部渠道';
  return ids
    .map((id) => channelNameMap.value.get(String(id)) || String(id))
    .join('、');
}

function displayPlatforms(value: unknown) {
  const ids = safeCommaList(value, true).map(Number);
  if (ids.length === 0 || ids.length === platformOptions.length)
    return '全部设备';
  return platformOptions
    .filter((item) => ids.includes(item.value))
    .map((item) => item.label)
    .join('、');
}

function displayConditions(row: PrivateCardItem) {
  const condition = rowConditions(row);
  const parts: string[] = [];
  if (condition.RegTime[0] !== 0 || condition.RegTime[1] !== 0) {
    parts.push(`注册 ${condition.RegTime[0]}–${condition.RegTime[1]} 小时`);
  }
  if (!condition.VipV2.includes(ALL_VIP)) {
    parts.push(condition.VipV2.map((item) => `VIP${item}`).join('、'));
  }
  return parts.length > 0 ? parts.join('；') : '全部人群';
}

async function loadTotal() {
  try {
    const result = await fetchPrivateCardTotalApi();
    total.value = result.Items || {};
  } catch {
    message.error('银行卡统计加载失败，请重试');
  }
}

async function loadList() {
  if (!canManage.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const first = await fetchPrivateCardListApi({
      Page: 1,
      PageSize: PAGE_SIZE,
      PayType: PAY_TYPE,
      Sort: '',
    });
    const count = Math.max(
      first.Items.length,
      Number(first.Pagination?.MaxCount || 0),
    );
    const pageCount = Math.ceil(count / PAGE_SIZE);
    const remaining =
      pageCount > 1
        ? await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, index) =>
              fetchPrivateCardListApi({
                Page: index + 2,
                PageSize: PAGE_SIZE,
                PayType: PAY_TYPE,
                Sort: '',
              }),
            ),
          )
        : [];
    const items = [
      ...first.Items,
      ...remaining.flatMap((result) => result.Items),
    ];
    rows.value = items.toSorted(
      (left, right) => Number(right.Index || 0) - Number(left.Index || 0),
    );
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '银行卡配置加载失败';
  } finally {
    loading.value = false;
  }
}

async function loadDependencies() {
  dependenciesLoading.value = true;
  try {
    const [firstLevels, quickTemplates] = await Promise.all([
      // 勿传 BeginTime/EndTime=1，否则本环境层级列表空
      fetchRechargePlayerLevelsApi({
        Page: 1,
        PageSize: PAGE_SIZE,
      }),
      fetchRechargeQuickTemplatesApi(),
    ]);
    const count = Math.max(
      firstLevels.Items.length,
      Number(firstLevels.Pagination?.MaxCount || 0),
    );
    const pageCount = Math.ceil(count / PAGE_SIZE);
    const remainingLevels =
      pageCount > 1
        ? await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, index) =>
              fetchRechargePlayerLevelsApi({
                Page: index + 2,
                PageSize: PAGE_SIZE,
              }),
            ),
          )
        : [];
    playerLevels.value = [
      ...firstLevels.Items,
      ...remainingLevels.flatMap((result) => result.Items),
    ];
    templates.value = quickTemplates.Items || [];
  } catch {
    message.error('层级或快捷模板加载失败，请重试');
  } finally {
    dependenciesLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([loadList(), loadTotal()]);
}

async function refreshTotalAndNotify() {
  try {
    await loadTotal();
  } finally {
    emit('changed');
  }
}

async function moveRow(index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= rows.value.length || sorting.value) return;
  const previous = [...rows.value];
  const reordered = [...rows.value];
  const [moved] = reordered.splice(index, 1);
  if (!moved) return;
  reordered.splice(target, 0, moved);
  rows.value = reordered;
  sorting.value = true;
  try {
    await sortPrivateCardsApi({
      Ids: reordered
        .map((item) => item.Id)
        .toReversed()
        .join(','),
    });
    message.success('排序已保存');
    emit('changed');
    await loadList();
  } catch {
    rows.value = previous;
    message.error('排序保存失败，已恢复原顺序');
  } finally {
    sorting.value = false;
  }
}

function handleSwitch(row: PrivateCardItem, checked: boolean) {
  const next = checked ? 1 : 2;
  Modal.confirm({
    content: `开放人群：${displayConditions(row)}。确认${checked ? '开启' : '关闭'}「${row.NickName || row.Id}」？`,
    title: '确认切换状态',
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await switchPrivateCardApi({ Id: row.Id, Open: next });
        message.success('状态切换成功');
        await loadList();
        await refreshTotalAndNotify();
      } catch {
        message.error('状态切换失败，请重试');
        await loadList();
        throw new Error('switch failed');
      } finally {
        actionId.value = undefined;
      }
    },
  });
}

function handleDelete(row: PrivateCardItem) {
  Modal.confirm({
    content: `确认删除银行卡「${row.NickName || row.CardNo || row.Id}」？`,
    okType: 'danger',
    title: '删除银行卡',
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await deletePrivateCardApi(row.Id);
        message.success('删除成功');
        await loadList();
        await refreshTotalAndNotify();
      } catch {
        message.error('删除失败，请重试');
        throw new Error('delete failed');
      } finally {
        actionId.value = undefined;
      }
    },
  });
}

const editorOpen = ref(false);
const editorMode = ref<'create' | 'edit'>('create');
const editorLoading = ref(false);
const saving = ref(false);
const originalDetail = ref<Record<string, unknown>>({});
const originalFormSnapshot = ref('');
const conditionExtra = ref<Record<string, unknown>>({});

const form = reactive<EditorForm>({
  AllowInput: 2,
  Bank: '',
  CardNo: '',
  Gears: [],
  InputMax: undefined,
  InputMin: undefined,
  LevelIds: [],
  Name: '',
  NickName: '',
  PlatformType: [1, 2, 3, 4],
  Priority: 100,
  Rate: undefined,
  RegTimeEnabled: false,
  RegTimeMax: undefined,
  RegTimeMin: undefined,
  TestChannel: [],
  VipEnabled: false,
  VipV2: [],
});

function resetForm() {
  Object.assign(form, {
    AllowInput: 2,
    Bank: '',
    CardNo: '',
    Gears: [],
    InputMax: undefined,
    InputMin: undefined,
    LevelIds: [],
    Name: '',
    NickName: '',
    PlatformType: [1, 2, 3, 4],
    Priority: 100,
    Rate: undefined,
    RegTimeEnabled: false,
    RegTimeMax: undefined,
    RegTimeMin: undefined,
    TestChannel: [],
    VipEnabled: false,
    VipV2: vipOptions.value.map((item) => item.value),
  });
  originalDetail.value = {};
  conditionExtra.value = {};
}

function formSnapshot() {
  return JSON.stringify(form);
}

const isDirty = computed(
  () => editorOpen.value && formSnapshot() !== originalFormSnapshot.value,
);

function openCreate() {
  editorMode.value = 'create';
  resetForm();
  editorOpen.value = true;
  originalFormSnapshot.value = formSnapshot();
}

async function openEdit(row: PrivateCardItem) {
  editorMode.value = 'edit';
  resetForm();
  editorOpen.value = true;
  editorLoading.value = true;
  try {
    const detail = await fetchPrivateCardDetailApi(row.Id);
    originalDetail.value = { ...detail };
    const conditions = safeConditions(detail.Conditions);
    const { RegTime: _regTime, VipV2: _vipV2, ...extra } = conditions;
    conditionExtra.value = extra;
    Object.assign(form, {
      AllowInput: Number(detail.AllowInput || 2),
      Bank: String(detail.Bank || ''),
      CardNo: String(detail.CardNo || ''),
      Gears: safeCommaList(detail.Gears, true).map(String),
      InputMax:
        detail.InputMax === '' || detail.InputMax == null
          ? undefined
          : Number(detail.InputMax),
      InputMin:
        detail.InputMin === '' || detail.InputMin == null
          ? undefined
          : Number(detail.InputMin),
      LevelIds: safeCommaList(detail.LevelIds),
      Name: String(detail.Name || ''),
      NickName: String(detail.NickName || ''),
      PlatformType: detail.PlatformType
        ? safeCommaList(detail.PlatformType, true).map(Number)
        : [1, 2, 3, 4],
      Priority: Number(detail.Priority || 100),
      Rate:
        detail.Rate === '' || detail.Rate == null
          ? undefined
          : Number(detail.Rate),
      RegTimeEnabled:
        conditions.RegTime[0] !== 0 || conditions.RegTime[1] !== 0,
      RegTimeMax: Number(conditions.RegTime[1]),
      RegTimeMin: Number(conditions.RegTime[0]),
      TestChannel: safeCommaList(detail.TestChannel),
      VipEnabled: !conditions.VipV2.includes(ALL_VIP),
      VipV2: conditions.VipV2.includes(ALL_VIP)
        ? vipOptions.value.map((item) => item.value)
        : [...conditions.VipV2],
    });
    originalFormSnapshot.value = formSnapshot();
  } catch {
    message.error('详情加载失败，请重试');
    editorOpen.value = false;
  } finally {
    editorLoading.value = false;
  }
}

function requestEditorClose() {
  if (!isDirty.value) {
    editorOpen.value = false;
    return;
  }
  Modal.confirm({
    content: '当前修改尚未保存，确认关闭？',
    okText: '放弃修改',
    title: '未保存的修改',
    onOk: () => {
      editorOpen.value = false;
    },
  });
}

function normalizedGears() {
  const raw = form.Gears.map((item) => String(item).trim()).filter(Boolean);
  if (raw.length === 0) throw new Error('请至少添加一个快捷金额');
  if (raw.length > 8) throw new Error('快捷金额最多 8 个');
  if (raw.some((item) => !/^\d+$/.test(item))) {
    throw new Error('快捷金额必须是正整数');
  }
  const values = raw.map(Number);
  if (values.some((item) => item <= 0 || item > 100_000)) {
    throw new Error('快捷金额必须在 1–100000 之间');
  }
  const unique = [...new Set(values)].toSorted((left, right) => left - right);
  if (unique.length !== values.length) throw new Error('快捷金额不能重复');
  return unique;
}

function validateEditor() {
  if (!form.NickName.trim()) throw new Error('请输入通道名称');
  if (!form.CardNo.trim()) throw new Error('请输入银行卡号');
  if (!form.Name.trim()) throw new Error('请输入开户姓名');
  if (!form.Bank.trim()) throw new Error('请输入开户行');
  const gears = normalizedGears();
  if (form.PlatformType.length === 0) throw new Error('请至少选择一个设备');
  if (
    !Number.isInteger(form.Priority) ||
    form.Priority < 1 ||
    form.Priority > 100
  ) {
    throw new Error('分配权重必须是 1–100 的整数');
  }
  if (form.Rate == null || !Number.isFinite(form.Rate) || form.Rate < 0) {
    throw new Error('请输入有效费率');
  }
  if (form.AllowInput === 1) {
    const min = form.InputMin;
    const max = form.InputMax;
    if (
      min == null ||
      max == null ||
      !Number.isInteger(min) ||
      !Number.isInteger(max)
    ) {
      throw new Error('输入金额上下限必须是整数');
    }
    if (min <= 0 || max > 100_000 || max < min) {
      throw new Error('输入区间须满足 0 < 最小值 ≤ 最大值 ≤ 100000');
    }
    if (min > gears[0]!) throw new Error('输入最小值不能大于最小快捷金额');
    if (max < gears.at(-1)!) throw new Error('输入最大值不能小于最大快捷金额');
  }
  if (form.RegTimeEnabled) {
    const min = form.RegTimeMin;
    const max = form.RegTimeMax;
    if (
      min == null ||
      max == null ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max > 99_999_999 ||
      max <= min
    ) {
      throw new Error('注册时间须为 0–99999999 的整数，且最大值大于最小值');
    }
  }
  if (form.VipEnabled && form.VipV2.length === 0) {
    throw new Error('请至少选择一个 VIP 等级');
  }
  return gears;
}

function buildPayload(gears: number[]): PrivateCardPayload {
  const conditions: RechargeConditions = {
    ...conditionExtra.value,
    RegTime: form.RegTimeEnabled
      ? [Number(form.RegTimeMin), Number(form.RegTimeMax)]
      : [0, 0],
    VipV2: form.VipEnabled ? [...form.VipV2] : [ALL_VIP],
  };
  const payload: PrivateCardPayload = {
    ...(editorMode.value === 'edit' ? originalDetail.value : {}),
    AllowInput: form.AllowInput,
    Bank: form.Bank.trim(),
    CardNo: form.CardNo.trim(),
    Conditions: JSON.stringify(conditions),
    Gears: gears.join(','),
    InputMax: form.AllowInput === 1 ? Number(form.InputMax) : '',
    InputMin: form.AllowInput === 1 ? Number(form.InputMin) : '',
    LevelIds: form.LevelIds.join(','),
    Name: form.Name.trim(),
    NickName: form.NickName.trim(),
    PayType: PAY_TYPE,
    PlatformType: form.PlatformType.join(','),
    Priority: form.Priority,
    Rate: Number(form.Rate),
    TestChannel: form.TestChannel.join(','),
  };
  if (editorMode.value === 'create') payload.Hash = createRequestHash();
  return payload;
}

function asPrivateCard(record: unknown) {
  return record as PrivateCardItem;
}

async function submitEditor() {
  let gears: number[];
  try {
    gears = validateEditor();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '请检查表单');
    return;
  }
  saving.value = true;
  try {
    const payload = buildPayload(gears);
    await (editorMode.value === 'create'
      ? createPrivateCardApi(payload)
      : updatePrivateCardApi(payload));
    message.success(editorMode.value === 'create' ? '添加成功' : '保存成功');
    originalFormSnapshot.value = formSnapshot();
    editorOpen.value = false;
    await loadList();
    if (editorMode.value === 'create') {
      await refreshTotalAndNotify();
    } else {
      emit('changed');
    }
  } catch {
    message.error('保存失败，请检查后重试');
  } finally {
    saving.value = false;
  }
}

const templateModalOpen = ref(false);
const templateName = ref('');
const templateSaving = ref(false);
const deletingTemplateId = ref<RechargeChannelId>();

function openTemplateModal() {
  if (form.TestChannel.length === 0) {
    message.error('指定渠道为空，无法收藏模板');
    return;
  }
  templateName.value = '';
  templateModalOpen.value = true;
}

async function createTemplate() {
  if (!templateName.value.trim()) {
    message.error('请输入模板名称');
    return;
  }
  templateSaving.value = true;
  try {
    await createRechargeQuickTemplateApi({
      ModelName: templateName.value.trim(),
      TestChannel: form.TestChannel.join(','),
    });
    message.success('模板已收藏');
    templateModalOpen.value = false;
    await loadDependencies();
    emit('changed');
  } catch {
    message.error('模板收藏失败，请重试');
  } finally {
    templateSaving.value = false;
  }
}

function applyTemplate(template: RechargeQuickTemplate) {
  form.TestChannel = safeCommaList(template.TestChannel);
}

function deleteTemplate(template: RechargeQuickTemplate) {
  Modal.confirm({
    content: `确认删除渠道模板「${template.ModelName || template.Id}」？`,
    okType: 'danger',
    title: '删除模板',
    onOk: async () => {
      deletingTemplateId.value = template.Id;
      try {
        await deleteRechargeQuickTemplateApi(template.Id);
        message.success('模板已删除');
        await loadDependencies();
        emit('changed');
      } catch {
        message.error('模板删除失败，请重试');
        throw new Error('template delete failed');
      } finally {
        deletingTemplateId.value = undefined;
      }
    },
  });
}

onMounted(() => {
  if (!canManage.value) return;
  void refreshAll();
  void loadDependencies();
});
</script>

<template>
  <Result
    v-if="!canManage"
    status="403"
    sub-title="缺少私人银行卡管理权限（10821）"
    title="无权访问"
  />
  <div v-else class="space-y-3">
    <Card size="small">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <Descriptions :column="2" size="small">
          <Descriptions.Item label="已开启">
            {{ Number(total.Opened || 0) }}
          </Descriptions.Item>
          <Descriptions.Item label="已关闭">
            {{ Number(total.Closed || 0) }}
          </Descriptions.Item>
        </Descriptions>
        <Space>
          <Button :loading="loading" @click="refreshAll">刷新</Button>
          <Button type="primary" @click="openCreate">添加私人银行卡</Button>
        </Space>
      </div>
    </Card>

    <Result
      v-if="loadError"
      status="error"
      :sub-title="loadError"
      title="加载失败"
    >
      <template #extra>
        <Button type="primary" @click="loadList">重试</Button>
      </template>
    </Result>
    <Table
      v-else
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1720 }"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'sort'">
          <Space :size="2">
            <Button
              aria-label="上移"
              :disabled="index === 0 || sorting"
              size="small"
              @click="moveRow(index, -1)"
            >
              ↑
            </Button>
            <Button
              aria-label="下移"
              :disabled="index === rows.length - 1 || sorting"
              size="small"
              @click="moveRow(index, 1)"
            >
              ↓
            </Button>
          </Space>
        </template>
        <template v-else-if="column.key === 'status'">
          <Switch
            :checked="Number(record.Open) === 1"
            :loading="actionId === record.Id"
            checked-children="开"
            un-checked-children="关"
            @change="
              (checked) => handleSwitch(asPrivateCard(record), !!checked)
            "
          />
        </template>
        <template v-else-if="column.key === 'amount'">
          <div>固定：{{ record.Gears || '-' }}</div>
          <div
            v-if="Number(record.AllowInput) === 1"
            class="text-xs text-gray-500"
          >
            输入：{{ record.InputMin }}–{{ record.InputMax }}
          </div>
        </template>
        <template v-else-if="column.key === 'levels'">
          {{ displayLevels(record.LevelIds) }}
        </template>
        <template v-else-if="column.key === 'conditions'">
          {{ displayConditions(asPrivateCard(record)) }}
        </template>
        <template v-else-if="column.key === 'platform'">
          {{ displayPlatforms(record.PlatformType) }}
        </template>
        <template v-else-if="column.key === 'channels'">
          {{ displayChannels(record.TestChannel) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space :size="4">
            <Button size="small" @click="openEdit(asPrivateCard(record))">
              编辑
            </Button>
            <Button
              danger
              :loading="actionId === record.Id"
              size="small"
              @click="handleDelete(asPrivateCard(record))"
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
      :open="editorOpen"
      :title="editorMode === 'create' ? '添加私人银行卡' : '编辑私人银行卡'"
      width="min(860px, calc(100vw - 24px))"
      @cancel="requestEditorClose"
      @ok="submitEditor"
    >
      <Spin :spinning="editorLoading || dependenciesLoading">
        <Form class="pt-2" layout="vertical">
          <Row :gutter="16">
            <Col :md="12" :xs="24">
              <Form.Item label="通道名称" required>
                <Input v-model:value="form.NickName" :maxlength="100" />
              </Form.Item>
            </Col>
            <Col :md="12" :xs="24">
              <Form.Item label="银行卡号" required>
                <Input v-model:value="form.CardNo" :maxlength="100" />
              </Form.Item>
            </Col>
            <Col :md="12" :xs="24">
              <Form.Item label="开户姓名" required>
                <Input v-model:value="form.Name" :maxlength="100" />
              </Form.Item>
            </Col>
            <Col :md="12" :xs="24">
              <Form.Item label="开户行" required>
                <Input v-model:value="form.Bank" :maxlength="100" />
              </Form.Item>
            </Col>
            <Col :md="12" :xs="24">
              <Form.Item label="快捷金额（回车添加，最多 8 个）" required>
                <Select
                  v-model:value="form.Gears"
                  :max-tag-count="8"
                  mode="tags"
                  placeholder="例如 100、200、500"
                />
              </Form.Item>
            </Col>
            <Col :md="6" :xs="12">
              <Form.Item label="费率" required>
                <InputNumber
                  v-model:value="form.Rate"
                  :min="0"
                  :precision="4"
                  class="w-full"
                />
              </Form.Item>
            </Col>
            <Col :md="6" :xs="12">
              <Form.Item label="分配权重" required>
                <InputNumber
                  v-model:value="form.Priority"
                  :max="100"
                  :min="1"
                  :precision="0"
                  class="w-full"
                />
              </Form.Item>
            </Col>
            <Col :xs="24">
              <Form.Item label="允许玩家输入">
                <Switch
                  :checked="form.AllowInput === 1"
                  checked-children="允许"
                  un-checked-children="不允许"
                  @update:checked="form.AllowInput = $event ? 1 : 2"
                />
              </Form.Item>
            </Col>
            <template v-if="form.AllowInput === 1">
              <Col :md="12" :xs="24">
                <Form.Item label="输入最小金额" required>
                  <InputNumber
                    v-model:value="form.InputMin"
                    :max="100000"
                    :min="1"
                    :precision="0"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
              <Col :md="12" :xs="24">
                <Form.Item label="输入最大金额" required>
                  <InputNumber
                    v-model:value="form.InputMax"
                    :max="100000"
                    :min="1"
                    :precision="0"
                    class="w-full"
                  />
                </Form.Item>
              </Col>
            </template>
            <Col :xs="24">
              <Form.Item label="设备显示" required>
                <Checkbox.Group
                  v-model:value="form.PlatformType"
                  :options="platformOptions"
                />
              </Form.Item>
            </Col>
            <Col :xs="24">
              <Form.Item label="指定渠道">
                <div class="flex flex-wrap gap-2">
                  <Select
                    v-model:value="form.TestChannel"
                    class="min-w-0 flex-1"
                    :options="channelOptions"
                    mode="multiple"
                    placeholder="空值表示全部渠道"
                    show-search
                  />
                  <Button @click="openTemplateModal">收藏模板</Button>
                </div>
                <div
                  v-if="templates.length > 0"
                  class="mt-2 flex flex-wrap gap-2"
                >
                  <Tag
                    v-for="template in templates"
                    :key="template.Id"
                    closable
                    class="cursor-pointer"
                    :aria-label="`应用模板 ${template.ModelName || template.Id}`"
                    @click="applyTemplate(template)"
                    @close.prevent="deleteTemplate(template)"
                  >
                    <Spin
                      :spinning="deletingTemplateId === template.Id"
                      size="small"
                    >
                      {{ template.ModelName || template.Id }}
                    </Spin>
                  </Tag>
                </div>
              </Form.Item>
            </Col>
            <Col :xs="24">
              <Form.Item label="玩家层级">
                <Select
                  v-model:value="form.LevelIds"
                  :options="levelOptions"
                  mode="multiple"
                  placeholder="空值表示全部层级"
                  show-search
                />
              </Form.Item>
            </Col>
            <Col :xs="24">
              <Form.Item label="注册时间限制">
                <Space wrap>
                  <Checkbox v-model:checked="form.RegTimeEnabled">
                    启用
                  </Checkbox>
                  <InputNumber
                    v-model:value="form.RegTimeMin"
                    :disabled="!form.RegTimeEnabled"
                    :max="99999999"
                    :min="0"
                    :precision="0"
                    placeholder="最小小时"
                  />
                  <span>至</span>
                  <InputNumber
                    v-model:value="form.RegTimeMax"
                    :disabled="!form.RegTimeEnabled"
                    :max="99999999"
                    :min="0"
                    :precision="0"
                    placeholder="最大小时"
                  />
                </Space>
              </Form.Item>
            </Col>
            <Col :xs="24">
              <Form.Item label="VIP 限制">
                <div class="flex flex-wrap items-start gap-3">
                  <Checkbox v-model:checked="form.VipEnabled"> 启用 </Checkbox>
                  <Select
                    v-model:value="form.VipV2"
                    class="min-w-[240px] flex-1"
                    :disabled="!form.VipEnabled"
                    mode="multiple"
                    :options="vipOptions"
                    placeholder="选择 VIP 等级"
                  />
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>

    <Modal
      v-model:open="templateModalOpen"
      :confirm-loading="templateSaving"
      title="收藏渠道模板"
      @ok="createTemplate"
    >
      <Form layout="vertical">
        <Form.Item label="模板名称" required>
          <Input
            v-model:value="templateName"
            :maxlength="100"
            placeholder="请输入模板名称"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

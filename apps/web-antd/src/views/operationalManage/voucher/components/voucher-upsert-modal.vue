<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  createVoucherApi,
  fetchVoucherDetailApi,
  fetchVoucherListAllApi,
  updateVoucherApi,
} from '#/api/operationManage/voucher';
import { getServiceImageUrl } from '#/utils/media';
import { useCloudPlatformStore } from '#/store/cloud-platform';

import {
  DURATION_OPTIONS,
  REDEEM_REQUIREMENT_OPTIONS,
  REDIRECT_TYPE,
  REWARD_TYPE,
  VOUCHER_TYPE,
  VOUCHER_TYPE_OPTIONS,
  type VoucherRuleItem,
  assembleVoucherSubmitPayload,
  breakupVoucherDetail,
  createDefaultVoucherForm,
  createEmptyDrawWaterSrctp,
  formatCentsToYuan,
  formatVoucherAmount,
  getDrawWaterPath,
  getObjectPath,
  getRewardTiersPath,
  resolveDefaultLangGroupId,
  resolveLangGroupIds,
  resolveVoucherName,
  setObjectPath,
  yuanToCents,
} from './voucher-shared';
import VoucherImageField from './voucher-image-field.vue';
import VoucherRewardTierModal from './voucher-reward-tier-modal.vue';
import VoucherRuleModal from './voucher-rule-modal.vue';
import VoucherVenueField from './voucher-venue-field.vue';
import VoucherRedirectField from './voucher-redirect-field.vue';

defineOptions({ name: 'VoucherUpsertModal' });

type UpsertMode = 'add' | 'clone' | 'edit';

const props = defineProps<{
  mode?: UpsertMode;
  voucherId?: number | string;
  voucherType?: number;
}>();

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const cloudStore = useCloudPlatformStore();
const langGroupIds = computed(() =>
  resolveLangGroupIds(cloudStore.projectConfig),
);
const defaultLangGroupId = computed(() =>
  resolveDefaultLangGroupId(cloudStore.projectConfig),
);

const loading = ref(false);
const saving = ref(false);
const activeLangTab = ref(String(defaultLangGroupId.value));

const form = reactive(
  createDefaultVoucherForm(Number(props.voucherType || 1), langGroupIds.value),
);

const modalTitle = computed(() => {
  if (props.mode === 'clone') {
    return '克隆票券';
  }
  if (props.mode === 'edit') {
    return '编辑票券';
  }
  return '新增票券';
});

const typeOptions = computed(() =>
  VOUCHER_TYPE_OPTIONS.filter((item) => item.value !== ''),
);

const isRedPacket = computed(() => form.Type === VOUCHER_TYPE.RED_PACKET);
const isCash = computed(() => form.Type === VOUCHER_TYPE.CASH);
const isGoldenEgg = computed(() => form.Type === VOUCHER_TYPE.GOLDEN_EGG);
const isPrizeWheel = computed(() => form.Type === VOUCHER_TYPE.PRIZE_WHEEL);

const rewardTiersTitle = computed(() => {
  if (isRedPacket.value) return '幸运红包奖励金额配置';
  if (isCash.value) return '现金兑换奖励配置';
  if (isGoldenEgg.value) return '砸金蛋奖励配置';
  if (isPrizeWheel.value) return '豪礼转盘奖励配置';
  return '奖励配置';
});

const canAddReward = computed(() => isRedPacket.value || isGoldenEgg.value);
const canDeleteReward = computed(() => isRedPacket.value || isGoldenEgg.value);

/* ------------------------------------------------------------------ */
/* 奖励档位 / 提款流水场馆 (路径依据票券类型动态解析)                             */
/* ------------------------------------------------------------------ */

const rewardTiersPath = computed(() => getRewardTiersPath(form.Type));
const drawWaterPath = computed(() => getDrawWaterPath(form.Type));

const rewardTiers = computed<Array<Record<string, unknown>>>({
  get: () => getObjectPath(form.ExInfo, rewardTiersPath.value) || [],
  set: (val) => setObjectPath(form.ExInfo, rewardTiersPath.value, val),
});

const drawWaterPickMode = computed<number>({
  get: () =>
    getObjectPath(form.ExInfo, [
      ...drawWaterPath.value,
      'WithdrawWaterGameType',
    ]) ?? 0,
  set: (val) =>
    setObjectPath(
      form.ExInfo,
      [...drawWaterPath.value, 'WithdrawWaterGameType'],
      val,
    ),
});
const drawWaterCategories = computed<number[]>({
  get: () =>
    getObjectPath(form.ExInfo, [
      ...drawWaterPath.value,
      'WithdrawWaterGamesPlatform',
    ]) || [],
  set: (val) =>
    setObjectPath(
      form.ExInfo,
      [...drawWaterPath.value, 'WithdrawWaterGamesPlatform'],
      val,
    ),
});
const drawWaterVenues = computed<number[]>({
  get: () =>
    getObjectPath(form.ExInfo, [
      ...drawWaterPath.value,
      'WithdrawWaterGames',
    ]) || [],
  set: (val) =>
    setObjectPath(
      form.ExInfo,
      [...drawWaterPath.value, 'WithdrawWaterGames'],
      val,
    ),
});

function ensureDrawWaterSrctp() {
  if (!getObjectPath(form.ExInfo, drawWaterPath.value)) {
    setObjectPath(
      form.ExInfo,
      drawWaterPath.value,
      createEmptyDrawWaterSrctp(),
    );
  }
}

const rewardsTotalWeight = computed(
  () =>
    rewardTiers.value.reduce(
      (sum, item) => sum + (Number(item.PriceProbabilityWeight) || 0),
      0,
    ) || 1,
);

function describeWeight(row: Record<string, unknown>) {
  const weight = Number(row.PriceProbabilityWeight) || 0;
  const percent = ((weight / rewardsTotalWeight.value) * 100).toFixed(2);
  return `${weight} (${percent}%)`;
}

function describePrize(row: Record<string, unknown>) {
  const priceType = Number(row.PriceType);
  const lgId = activeLangTab.value;
  if (
    priceType === REWARD_TYPE.CASH ||
    (priceType === REWARD_TYPE.GENERAL && Number(row.Gold) > 0)
  ) {
    return `彩金 ${formatVoucherAmount(row.Gold as number)}`;
  }
  if (
    priceType === REWARD_TYPE.POINT ||
    (priceType === REWARD_TYPE.GENERAL && Number(row.Points) > 0)
  ) {
    return `积分 ${row.Points}`;
  }
  if (priceType === REWARD_TYPE.PHYSICAL) {
    const lang = (row.PhysicalProduct as Record<string, unknown>)?.LangText as
      | Record<string, { ProductName?: string }>
      | undefined;
    return `实物：${lang?.[lgId]?.ProductName || '-'}`;
  }
  if (priceType === REWARD_TYPE.VIRTUAL) {
    const lang = (row.VirtualProduct as Record<string, unknown>)?.LangText as
      | Record<string, { ProductName?: string }>
      | undefined;
    return `虚拟：${lang?.[lgId]?.ProductName || '-'}`;
  }
  return '-';
}

function prizeImages(row: Record<string, unknown>) {
  const priceType = Number(row.PriceType);
  const lgId = activeLangTab.value;
  if (priceType === REWARD_TYPE.PHYSICAL) {
    const lang = (row.PhysicalProduct as Record<string, unknown>)?.LangText as
      | Record<string, { ProductPic?: string }>
      | undefined;
    return [lang?.[lgId]?.ProductPic].filter(Boolean) as string[];
  }
  if (priceType === REWARD_TYPE.VIRTUAL) {
    const lang = (row.VirtualProduct as Record<string, unknown>)?.LangText as
      | Record<string, { ProductPic?: string }>
      | undefined;
    return [lang?.[lgId]?.ProductPic].filter(Boolean) as string[];
  }
  const lang = (row.LangText as Record<string, unknown>)?.[lgId] as
    | { PrizePopupImage?: string; PrizeWheelImage?: string }
    | undefined;
  return [lang?.PrizeWheelImage, lang?.PrizePopupImage].filter(
    Boolean,
  ) as string[];
}

const rewardColumns = computed(() => {
  if (isRedPacket.value) {
    return [
      { key: 'index', title: '序号', width: 60 },
      { key: 'amount', title: '奖励金额' },
      { dataIndex: 'DrawWater', key: 'DrawWater', title: '流水倍数' },
      { key: 'weight', title: '中奖概率权重(占比)' },
      { key: 'action', title: '操作', width: 150 },
    ];
  }
  if (isCash.value) {
    return [
      { key: 'index', title: '序号', width: 60 },
      { key: 'amount', title: '奖励金额' },
      { dataIndex: 'DrawWater', key: 'DrawWater', title: '流水倍数' },
      { key: 'action', title: '操作', width: 100 },
    ];
  }
  return [
    { key: 'index', title: '序号', width: 60 },
    { key: 'prize', title: '奖品' },
    { key: 'weight', title: '中奖概率权重(占比)' },
    { key: 'image', title: '奖品图片' },
    { key: 'action', title: '操作', width: 150 },
  ];
});

/* ------------------------------------------------------------------ */
/* 奖励档位弹窗                                                          */
/* ------------------------------------------------------------------ */

const rewardModalOpen = ref(false);
const rewardModalMode = ref<'add' | 'edit'>('add');
const rewardEditIndex = ref(-1);
const rewardEditingRow = computed(() =>
  rewardEditIndex.value >= 0
    ? (rewardTiers.value[rewardEditIndex.value] ?? null)
    : null,
);

function openAddReward() {
  rewardModalMode.value = 'add';
  rewardEditIndex.value = -1;
  rewardModalOpen.value = true;
}
function openEditReward(index: number) {
  rewardModalMode.value = 'edit';
  rewardEditIndex.value = index;
  rewardModalOpen.value = true;
}
function handleDeleteReward(index: number) {
  Modal.confirm({
    content: '确认删除该档奖励吗？',
    onOk: () => {
      const list = [...rewardTiers.value];
      list.splice(index, 1);
      rewardTiers.value = list;
    },
    title: '删除确认',
  });
}
function handleRewardSubmit(row: Record<string, unknown>) {
  const list = [...rewardTiers.value];
  if (rewardModalMode.value === 'edit' && rewardEditIndex.value >= 0) {
    list.splice(rewardEditIndex.value, 1, row);
  } else {
    list.push(row);
  }
  rewardTiers.value = list;
}

/* ------------------------------------------------------------------ */
/* 票券规则 (VoucherRules) 弹窗                                            */
/* ------------------------------------------------------------------ */

const ruleModalOpen = ref(false);
const ruleModalMode = ref<'add' | 'edit'>('add');
const ruleEditIndex = ref(-1);
const ruleEditingRow = computed<VoucherRuleItem | null>(() =>
  ruleEditIndex.value >= 0
    ? ((form.ExInfo.VoucherRules[ruleEditIndex.value] as VoucherRuleItem) ??
      null)
    : null,
);

function openAddRule() {
  ruleModalMode.value = 'add';
  ruleEditIndex.value = -1;
  ruleModalOpen.value = true;
}
function openEditRule(index: number) {
  ruleModalMode.value = 'edit';
  ruleEditIndex.value = index;
  ruleModalOpen.value = true;
}
function handleDeleteRule(index: number) {
  Modal.confirm({
    content: '确认删除该条规则吗？',
    onOk: () => form.ExInfo.VoucherRules.splice(index, 1),
    title: '删除确认',
  });
}
function handleRuleSubmit(rule: VoucherRuleItem) {
  if (ruleModalMode.value === 'edit' && ruleEditIndex.value >= 0) {
    form.ExInfo.VoucherRules.splice(ruleEditIndex.value, 1, rule);
  } else {
    form.ExInfo.VoucherRules.push(rule);
  }
}

function ruleText(rule: VoucherRuleItem) {
  const html = String(rule.LangText?.[activeLangTab.value]?.Text || '');
  const text = html.replace(/<[^>]+>/g, '').trim();
  return text || '-';
}
function ruleTypeLabel(type: number) {
  switch (type) {
    case REDIRECT_TYPE.ACTIVITY: {
      return '活动接口';
    }
    case REDIRECT_TYPE.NONE: {
      return '无';
    }
    case REDIRECT_TYPE.NOTICE: {
      return '公告接口';
    }
    case REDIRECT_TYPE.UI_PAGE: {
      return '功能页面';
    }
    case REDIRECT_TYPE.URL: {
      return '网址';
    }
    case REDIRECT_TYPE.VENUE: {
      return '场馆接口';
    }
    default: {
      return '-';
    }
  }
}

/* ------------------------------------------------------------------ */
/* 有效期 / 投注存款要求                                                     */
/* ------------------------------------------------------------------ */

const durationRange = computed<[Dayjs, Dayjs] | undefined>({
  get: (): [Dayjs, Dayjs] | undefined =>
    form.DurationStartTime && form.DurationEndTime
      ? [
          dayjs.unix(Number(form.DurationStartTime)),
          dayjs.unix(Number(form.DurationEndTime)),
        ]
      : undefined,
  set: (val: [Dayjs, Dayjs] | undefined) => {
    form.DurationStartTime = val ? val[0].startOf('day').unix() : 0;
    form.DurationEndTime = val ? val[1].endOf('day').unix() : 0;
  },
});

const betRequirementYuan = computed<number>({
  get: () => formatCentsToYuan(form.BetRequirementAmount),
  set: (val) => {
    form.BetRequirementAmount = yuanToCents(val);
  },
});
const depositRequirementYuan = computed<number>({
  get: () => formatCentsToYuan(form.DepositRequirementAmount),
  set: (val) => {
    form.DepositRequirementAmount = yuanToCents(val);
  },
});

const durationLocked = computed(() => props.mode === 'edit');
const typeLocked = computed(() => props.mode !== 'add');

/* ------------------------------------------------------------------ */
/* 下一轮票券                                                             */
/* ------------------------------------------------------------------ */

const triggerOptions = ref<Array<{ label: string; value: number }>>([]);

async function loadTriggerOptions() {
  try {
    const result = await fetchVoucherListAllApi();
    const items = result.Items || [];
    triggerOptions.value = items
      .filter((item) => Number(item.Id) !== Number(props.voucherId))
      .map((item) => ({
        label: `${resolveVoucherName(item.LangText)} (${item.Id})`,
        value: Number(item.Id),
      }));
  } catch {
    triggerOptions.value = [];
  }
}

/* ------------------------------------------------------------------ */
/* 加载 / 提交                                                            */
/* ------------------------------------------------------------------ */

async function loadDetail() {
  if (!props.voucherId) {
    return;
  }
  loading.value = true;
  try {
    const detail = await fetchVoucherDetailApi(props.voucherId);
    if (!detail) {
      return;
    }
    const breakup = breakupVoucherDetail(detail, langGroupIds.value);
    Object.assign(form, breakup);
    form.Type = Number(detail.Type || props.voucherType || form.Type);
    if (props.mode === 'clone') {
      form.Id = undefined;
    }
    ensureDrawWaterSrctp();
  } finally {
    loading.value = false;
  }
}

watch(
  () => [open.value, props.voucherId, props.mode, props.voucherType] as const,
  ([visible]) => {
    if (!visible) {
      return;
    }
    activeLangTab.value = String(defaultLangGroupId.value);
    if (props.mode === 'add') {
      Object.assign(
        form,
        createDefaultVoucherForm(
          Number(props.voucherType || 1),
          langGroupIds.value,
        ),
      );
    } else {
      void loadDetail();
    }
    void loadTriggerOptions();
  },
);

function validateForm(): boolean {
  for (const lgId of langGroupIds.value) {
    const isDefault = lgId === defaultLangGroupId.value;
    const lang = form.LangText[String(lgId)];
    const active = isDefault || Boolean(lang?.IsActive);
    if (!active) {
      continue;
    }
    if (!String(lang?.Name || '').trim()) {
      message.warning(`请填写语言组 ${lgId} 的票券名称`);
      activeLangTab.value = String(lgId);
      return false;
    }
    if (!String(lang?.Desc || '').trim()) {
      message.warning(`请填写语言组 ${lgId} 的票券描述`);
      activeLangTab.value = String(lgId);
      return false;
    }
    const icons = form.ExInfo.LangText[String(lgId)];
    if (!icons?.IconApp) {
      message.warning(`请上传语言组 ${lgId} 的 APP 图标`);
      activeLangTab.value = String(lgId);
      return false;
    }
    if (!icons?.IconPc) {
      message.warning(`请上传语言组 ${lgId} 的 PC 图标`);
      activeLangTab.value = String(lgId);
      return false;
    }
  }

  if (form.Duration === 2 && !(Number(form.DurationDays) > 0)) {
    message.warning('请输入有效天数');
    return false;
  }
  if (form.Duration === 3 && !durationRange.value) {
    message.warning('请选择固定有效期');
    return false;
  }
  if (form.IsTriggerNext && !form.TriggerNextId) {
    message.warning('请选择下一轮票券');
    return false;
  }
  if (form.IsBetRequirement && !(betRequirementYuan.value > 0)) {
    message.warning('请输入投注要求金额');
    return false;
  }
  if (form.IsDepositRequirement && !(depositRequirementYuan.value > 0)) {
    message.warning('请输入存款要求金额');
    return false;
  }
  if (!rewardTiers.value.length) {
    message.warning('请至少添加一档奖励');
    return false;
  }
  if (isPrizeWheel.value && rewardTiers.value.length !== 8) {
    message.warning('豪礼转盘券必须配置 8 个奖品');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  const payload = assembleVoucherSubmitPayload(form, {
    langGroupIds: langGroupIds.value,
    mode: props.mode || 'add',
  });
  saving.value = true;
  try {
    if (props.mode === 'edit') {
      await updateVoucherApi(payload);
      message.success('保存成功');
    } else {
      await createVoucherApi(payload);
      message.success(props.mode === 'clone' ? '克隆成功' : '创建成功');
    }
    open.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :confirm-loading="saving"
    destroy-on-close
    :title="modalTitle"
    width="90%"
    :style="{ maxWidth: '1200px' }"
    @ok="handleSubmit"
  >
    <Spin :spinning="loading">
      <div class="max-h-[75vh] overflow-y-auto pr-2">
        <!-- 多语言 -->
        <Tabs v-model:active-key="activeLangTab" type="line" size="small">
          <Tabs.TabPane
            v-for="lgId in langGroupIds"
            :key="String(lgId)"
            :tab="langGroupIds.length > 1 ? `语言组 ${lgId}` : '基本信息'"
          >
            <Form layout="vertical">
              <Form.Item v-if="lgId !== defaultLangGroupId" label="多语言开关">
                <Switch
                  v-model:checked="form.LangText[String(lgId)]!.IsActive"
                />
              </Form.Item>
              <Form.Item label="票券名称" required>
                <Input
                  v-model:value="form.LangText[String(lgId)]!.Name"
                  allow-clear
                  placeholder="请输入票券名称"
                />
              </Form.Item>
              <Form.Item label="票券描述" required>
                <Input.TextArea
                  v-model:value="form.LangText[String(lgId)]!.Desc"
                  :auto-size="{ maxRows: 4, minRows: 2 }"
                  placeholder="请输入票券描述"
                />
              </Form.Item>
              <div class="flex flex-wrap gap-6">
                <Form.Item label="APP 图标" required>
                  <VoucherImageField
                    v-model="form.ExInfo.LangText[String(lgId)]!.IconApp"
                    dimension-hint="建议尺寸 84 * 84，PNG，≤500K"
                    :max-size-kb="500"
                  />
                </Form.Item>
                <Form.Item label="PC 图标" required>
                  <VoucherImageField
                    v-model="form.ExInfo.LangText[String(lgId)]!.IconPc"
                    dimension-hint="建议尺寸 100 * 100，PNG，≤1M"
                    :max-size-kb="1024"
                  />
                </Form.Item>
              </div>
            </Form>
          </Tabs.TabPane>
        </Tabs>

        <!-- 基础设置 -->
        <div class="mb-2 mt-6 text-base font-semibold text-primary">
          基础设置
        </div>
        <Form layout="vertical">
          <Form.Item label="票券类型" required>
            <Select
              v-model:value="form.Type"
              :disabled="typeLocked"
              :options="typeOptions"
              style="width: 220px"
            />
          </Form.Item>

          <Form.Item label="票券有效期" required>
            <Radio.Group
              v-model:value="form.Duration"
              :disabled="durationLocked"
              :options="DURATION_OPTIONS"
            />
            <div v-if="form.Duration === 2" class="mt-2">
              <InputNumber
                v-model:value="form.DurationDays"
                :disabled="durationLocked"
                :min="1"
                style="width: 200px"
              />
              <span class="ml-2 text-gray-500">天</span>
            </div>
            <div v-if="form.Duration === 3" class="mt-2">
              <DatePicker.RangePicker
                v-model:value="durationRange"
                :disabled="durationLocked"
              />
            </div>
          </Form.Item>

          <Form.Item label="票券任务完成时">
            <Radio.Group v-model:value="form.IsTriggerNext">
              <Radio :value="true">触发下一轮票券任务</Radio>
              <Radio :value="false">不触发</Radio>
            </Radio.Group>
            <Select
              v-if="form.IsTriggerNext"
              v-model:value="form.TriggerNextId"
              allow-clear
              class="mt-2"
              :options="triggerOptions"
              placeholder="请选择下一轮票券"
              show-search
              style="width: 320px"
            />
          </Form.Item>
        </Form>

        <!-- 可兑换玩家设置 -->
        <div class="mb-2 mt-6 text-base font-semibold text-primary">
          可兑换玩家设置
        </div>
        <Form layout="vertical">
          <Form.Item label="账号要求">
            <Radio.Group
              v-model:value="form.RedeemRequirement"
              :options="REDEEM_REQUIREMENT_OPTIONS"
            />
          </Form.Item>

          <Form.Item label="投注要求">
            <Checkbox v-model:checked="form.IsBetRequirement"
              >需要投注要求</Checkbox
            >
            <div
              v-if="form.IsBetRequirement"
              class="mt-2 flex items-center gap-2"
            >
              <span class="text-gray-500"
                >自票券领取后累计投注要求金额（元）</span
              >
              <InputNumber
                v-model:value="betRequirementYuan"
                :min="0.01"
                :precision="2"
                style="width: 200px"
              />
            </div>
          </Form.Item>

          <Form.Item v-if="form.IsBetRequirement" label="参与场馆">
            <VoucherVenueField
              v-model:categories="form.VenueParticipationType"
              v-model:pick-mode="form.VenueParticipationSelection"
              v-model:venues="form.VenueParticipation"
              format="csv"
            />
          </Form.Item>

          <Form.Item v-if="form.IsBetRequirement" label="参与场馆跳转">
            <VoucherRedirectField
              v-model:param="form.VenueParticipationJumpParam"
              v-model:type="form.VenueParticipationJumpType"
              :allowed-types="[REDIRECT_TYPE.VENUE, REDIRECT_TYPE.NONE]"
            />
          </Form.Item>

          <Form.Item label="存款要求">
            <Checkbox v-model:checked="form.IsDepositRequirement"
              >需要存款要求</Checkbox
            >
            <div
              v-if="form.IsDepositRequirement"
              class="mt-2 flex items-center gap-2"
            >
              <span class="text-gray-500"
                >自票券领取后累计存款要求金额（元）</span
              >
              <InputNumber
                v-model:value="depositRequirementYuan"
                :min="0.01"
                :precision="2"
                style="width: 200px"
              />
            </div>
          </Form.Item>
        </Form>

        <!-- 奖励设置 -->
        <div class="mb-2 mt-6 text-base font-semibold text-primary">
          奖励设置
        </div>
        <Form layout="vertical">
          <Form.Item :label="rewardTiersTitle">
            <Table
              :columns="rewardColumns"
              :data-source="rewardTiers"
              :pagination="false"
              row-key="__row__"
              size="small"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'index'">{{
                  index + 1
                }}</template>
                <template v-else-if="column.key === 'amount'">
                  <template v-if="isRedPacket">
                    {{
                      formatVoucherAmount(record.MinimumGoldAmount as number)
                    }}
                    ~
                    {{
                      formatVoucherAmount(record.MaximumGoldAmount as number)
                    }}
                  </template>
                  <template v-else>
                    {{ formatVoucherAmount(record.Gold as number) }}
                  </template>
                </template>
                <template v-else-if="column.key === 'weight'">
                  {{ describeWeight(record) }}
                </template>
                <template v-else-if="column.key === 'prize'">
                  {{ describePrize(record) }}
                </template>
                <template v-else-if="column.key === 'image'">
                  <div class="flex gap-2">
                    <img
                      v-for="(img, imgIndex) in prizeImages(record)"
                      :key="imgIndex"
                      alt="奖品图片"
                      class="h-9 w-11 rounded border object-contain"
                      :src="getServiceImageUrl(img)"
                    />
                    <span
                      v-if="!prizeImages(record).length"
                      class="text-gray-400"
                      >-</span
                    >
                  </div>
                </template>
                <template v-else-if="column.key === 'action'">
                  <Space>
                    <Button
                      size="small"
                      type="link"
                      @click="openEditReward(index)"
                    >
                      编辑
                    </Button>
                    <Button
                      v-if="canDeleteReward"
                      danger
                      size="small"
                      type="link"
                      @click="handleDeleteReward(index)"
                    >
                      删除
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
            <Button
              v-if="canAddReward"
              class="mt-2"
              type="dashed"
              @click="openAddReward"
            >
              新增一档
            </Button>
          </Form.Item>

          <Form.Item label="提款流水场馆">
            <VoucherVenueField
              v-model:categories="drawWaterCategories"
              v-model:pick-mode="drawWaterPickMode"
              v-model:venues="drawWaterVenues"
              :disabled="durationLocked"
              format="array"
            />
          </Form.Item>

          <Form.Item label="票券规则">
            <Table
              :columns="[
                { key: 'index', title: '序号', width: 60 },
                { key: 'text', title: '文字' },
                { key: 'appPic', title: 'APP 图片' },
                { key: 'pcPic', title: 'PC 图片' },
                { key: 'type', title: '跳转类型' },
                { key: 'action', title: '操作', width: 150 },
              ]"
              :data-source="form.ExInfo.VoucherRules"
              :pagination="false"
              row-key="__row__"
              size="small"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'index'">{{
                  index + 1
                }}</template>
                <template v-else-if="column.key === 'text'">
                  {{ ruleText(record as VoucherRuleItem) }}
                </template>
                <template v-else-if="column.key === 'appPic'">
                  <img
                    v-if="
                      (record as VoucherRuleItem).LangText[activeLangTab]
                        ?.AppPic
                    "
                    alt="APP图片"
                    class="h-9 w-11 rounded border object-contain"
                    :src="
                      getServiceImageUrl(
                        (record as VoucherRuleItem).LangText[activeLangTab]
                          ?.AppPic,
                      )
                    "
                  />
                  <span v-else class="text-gray-400">-</span>
                </template>
                <template v-else-if="column.key === 'pcPic'">
                  <img
                    v-if="
                      (record as VoucherRuleItem).LangText[activeLangTab]?.PcPic
                    "
                    alt="PC图片"
                    class="h-9 w-11 rounded border object-contain"
                    :src="
                      getServiceImageUrl(
                        (record as VoucherRuleItem).LangText[activeLangTab]
                          ?.PcPic,
                      )
                    "
                  />
                  <span v-else class="text-gray-400">-</span>
                </template>
                <template v-else-if="column.key === 'type'">
                  {{ ruleTypeLabel((record as VoucherRuleItem).Type) }}
                </template>
                <template v-else-if="column.key === 'action'">
                  <Space>
                    <Button
                      size="small"
                      type="link"
                      @click="openEditRule(index)"
                    >
                      编辑
                    </Button>
                    <Button
                      danger
                      size="small"
                      type="link"
                      @click="handleDeleteRule(index)"
                    >
                      删除
                    </Button>
                  </Space>
                </template>
              </template>
            </Table>
            <Button class="mt-2" type="dashed" @click="openAddRule"
              >新增规则</Button
            >
          </Form.Item>
        </Form>
      </div>
    </Spin>

    <VoucherRewardTierModal
      v-model:open="rewardModalOpen"
      :lang-group-ids="langGroupIds"
      :mode="rewardModalMode"
      :row="rewardEditingRow"
      :voucher-type="form.Type"
      @submit="handleRewardSubmit"
    />
    <VoucherRuleModal
      v-model:open="ruleModalOpen"
      :lang-group-ids="langGroupIds"
      :mode="ruleModalMode"
      :rule="ruleEditingRow"
      @submit="handleRuleSubmit"
    />
  </Modal>
</template>

<script lang="ts" setup>
import type {
  RechargeChannelItem,
  RechargeConditions,
  RechargeQuickTemplate,
} from '#/types/recharge-channel';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

import {
  createRechargeQuickTemplateApi,
  deleteRechargeQuickTemplateApi,
  fetchRechargePlayerLevelsApi,
  fetchRechargeQuickTemplatesApi,
  updateRechargeChannelApi,
} from '#/api/gameManage/recharge-channel';
import { useProjectConfig } from '#/composables/use-project-config';

defineOptions({ name: 'OrdinaryChannelEditor' });

const props = defineProps<{
  open: boolean;
  row: null | RechargeChannelItem;
}>();
const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

type EditorForm = {
  AllowInput: number;
  CustomRate: number | undefined;
  ExpirationTime: number | undefined;
  Gears: number[];
  InputMax: number | undefined;
  InputMin: number | undefined;
  LevelIds: Array<number | string>;
  PlatformType: number[];
  Priority: number | undefined;
  Rate: number | undefined;
  RateType: number;
  RegTime: number[];
  ShowName: string;
  TestChannel: Array<number | string>;
  timeCheck: boolean;
  vipCheck: boolean;
  VipV2: number[];
};

const { projectConfig } = useProjectConfig();
const saving = ref(false);
const auxiliaryLoading = ref(false);
const initialSnapshot = ref('');
const gearInput = ref<number>();
const templateName = ref('');
const templates = ref<RechargeQuickTemplate[]>([]);
const levelOptions = ref<Array<{ label: string; value: number | string }>>([]);
const form = reactive<EditorForm>({
  AllowInput: 2,
  CustomRate: undefined,
  ExpirationTime: 0,
  Gears: [],
  InputMax: undefined,
  InputMin: undefined,
  LevelIds: [],
  PlatformType: [1, 2, 3, 4],
  Priority: 100,
  Rate: undefined,
  RateType: 0,
  RegTime: [0, 0],
  ShowName: '',
  TestChannel: [],
  VipV2: [],
  timeCheck: false,
  vipCheck: false,
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
const channelOptions = computed(() => {
  const list = (projectConfig.value?.ChildChannelInfo || []) as Array<{
    ChannelId: number | string;
    ChannelName?: string;
    IsHidden?: number;
  }>;
  return list
    .filter((item) => Number(item.IsHidden) !== 2)
    .map((item) => ({
      label: `${item.ChannelName || '-'} (${item.ChannelId})`,
      value: item.ChannelId,
    }));
});
const dirty = computed(
  () => !!props.row && JSON.stringify(form) !== initialSnapshot.value,
);

function splitWire(value: unknown) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseConditions(value: unknown): RechargeConditions {
  const fallback: RechargeConditions = { RegTime: [0, 0], VipV2: [9999] };
  if (!value) return fallback;
  try {
    const parsed =
      typeof value === 'string'
        ? (JSON.parse(value) as Partial<RechargeConditions>)
        : (value as Partial<RechargeConditions>);
    return {
      ...parsed,
      RegTime:
        Array.isArray(parsed.RegTime) && parsed.RegTime.length >= 2
          ? parsed.RegTime.map(Number)
          : [0, 0],
      VipV2: Array.isArray(parsed.VipV2) ? parsed.VipV2.map(Number) : [9999],
    };
  } catch {
    return fallback;
  }
}

function fillForm(row: RechargeChannelItem) {
  const conditions = parseConditions(row.Conditions);
  const regTime = conditions.RegTime.slice(0, 2);
  const vipUnlimited = conditions.VipV2.includes(9999);
  Object.assign(form, {
    AllowInput: Number(row.AllowInput || 2),
    CustomRate:
      row.CustomRate === '' || row.CustomRate == null
        ? undefined
        : Number(row.CustomRate) / 10_000,
    ExpirationTime: Number(row.ExpirationTime ?? 0),
    Gears: splitWire(row.Gears)
      .map(Number)
      .filter((value) => Number.isFinite(value)),
    InputMax:
      row.InputMax === '' || row.InputMax == null
        ? undefined
        : Number(row.InputMax),
    InputMin:
      row.InputMin === '' || row.InputMin == null
        ? undefined
        : Number(row.InputMin),
    LevelIds: splitWire(row.LevelIds),
    PlatformType:
      splitWire(row.PlatformType).length > 0
        ? splitWire(row.PlatformType).map(Number)
        : [1, 2, 3, 4],
    Priority: Number(row.Priority || 100),
    Rate: row.Rate === '' || row.Rate == null ? undefined : Number(row.Rate),
    RateType: Number(row.RateType ?? 0),
    RegTime: regTime,
    ShowName: String(row.ShowName || ''),
    TestChannel: splitWire(row.TestChannel),
    VipV2: vipUnlimited ? [] : [...conditions.VipV2],
    timeCheck: regTime.some((item) => Number(item) !== 0),
    vipCheck: !vipUnlimited,
  });
  initialSnapshot.value = JSON.stringify(form);
}

async function loadAuxiliary() {
  auxiliaryLoading.value = true;
  try {
    const [levelResult, templateResult] = await Promise.all([
      fetchRechargePlayerLevelsApi({
        Page: 1,
        PageSize: 200,
      }),
      fetchRechargeQuickTemplatesApi(),
    ]);
    levelOptions.value = levelResult.Items.map((item) => ({
      label: item.LevelName || String(item.Id),
      value: item.Id,
    }));
    templates.value = templateResult.Items;
  } finally {
    auxiliaryLoading.value = false;
  }
}

watch(
  () => [props.open, props.row] as const,
  ([open, row]) => {
    if (open && row) {
      fillForm(row);
      void loadAuxiliary();
    }
  },
  { immediate: true },
);

function addGear() {
  const value = Number(gearInput.value);
  if (!Number.isInteger(value) || value <= 0 || value > 1_000_000) {
    message.error('固定金额须为 1 至 1,000,000 的整数');
    return;
  }
  if (form.Gears.includes(value)) {
    message.warning('固定金额不能重复');
    return;
  }
  if (form.Gears.length >= 15) {
    message.error('最多添加 15 个固定金额');
    return;
  }
  form.Gears.push(value);
  form.Gears.sort((a, b) => a - b);
  gearInput.value = undefined;
}

function validate() {
  if (!form.ShowName.trim()) return '请输入显示名称';
  if (![0, 1, 2].includes(form.RateType)) return '请选择费率模式';
  if (form.RateType !== 1 && (form.Rate == null || form.Rate < 0))
    return '请输入正确的通道费率';
  if (form.RateType !== 0 && (form.CustomRate == null || form.CustomRate < 0))
    return '请输入正确的自定义费率';
  if (form.Gears.length === 0) return '请至少添加一个固定金额';
  if (form.Priority == null || form.Priority < 1 || form.Priority > 100)
    return '权重必须为 1 至 100';
  if (form.ExpirationTime == null || form.ExpirationTime < 0)
    return '支付倒计时不能小于 0';
  if (form.PlatformType.length === 0) return '请至少选择一个设备';
  if (form.vipCheck && form.VipV2.length === 0) return '请至少选择一个 VIP';
  if (form.timeCheck) {
    const min = Number(form.RegTime[0]);
    const max = Number(form.RegTime[1]);
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min < 0 ||
      max < 0 ||
      min > 99_999_999 ||
      max > 99_999_999
    )
      return '注册时长须为不超过 99999999 的非负整数';
    if (max <= min) return '注册时长最大值必须大于最小值';
  }
  if (form.AllowInput === 1) {
    const min = Number(form.InputMin);
    const max = Number(form.InputMax);
    if (
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min <= 0 ||
      max <= 0 ||
      min > 1_000_000 ||
      max > 1_000_000
    )
      return '输入金额须为 1 至 1,000,000 的整数';
    if (max < min) return '最大输入金额不能小于最小输入金额';
    if (min > Math.min(...form.Gears))
      return '最小输入金额不能大于最小固定金额';
    if (max < Math.max(...form.Gears))
      return '最大输入金额不能小于最大固定金额';
  }
  return '';
}

function buildPayload() {
  const row = props.row as RechargeChannelItem;
  const originalConditions = parseConditions(row.Conditions);
  return {
    ...row,
    AllowInput: form.AllowInput,
    Conditions: JSON.stringify({
      ...originalConditions,
      RegTime: form.timeCheck ? form.RegTime.map(Number) : [0, 0],
      VipV2: form.vipCheck ? [...form.VipV2].map(Number) : [9999],
    }),
    CustomRate:
      form.RateType === 0 ? row.CustomRate : Number(form.CustomRate) * 10_000,
    ExpirationTime: Number(form.ExpirationTime),
    Gears: form.Gears.toSorted((a, b) => a - b).join(','),
    InputMax: form.AllowInput === 1 ? Number(form.InputMax) : row.InputMax,
    InputMin: form.AllowInput === 1 ? Number(form.InputMin) : row.InputMin,
    LevelIds: form.LevelIds.join(','),
    PlatformType: form.PlatformType.join(','),
    Priority: Number(form.Priority),
    Rate: form.RateType === 1 ? row.Rate : Number(form.Rate),
    RateType: form.RateType,
    ShowName: form.ShowName.trim(),
    TestChannel: form.TestChannel.join(','),
  };
}

async function submit() {
  const error = validate();
  if (error) {
    message.error(error);
    return;
  }
  saving.value = true;
  try {
    await updateRechargeChannelApi(buildPayload());
    message.success('通道设置已保存');
    initialSnapshot.value = JSON.stringify(form);
    emit('update:open', false);
    emit('success');
  } finally {
    saving.value = false;
  }
}

function requestClose() {
  if (!dirty.value) {
    emit('update:open', false);
    return;
  }
  Modal.confirm({
    content: '尚有未保存的修改，确定关闭吗？',
    onOk: () => emit('update:open', false),
    title: '放弃修改',
  });
}

function applyTemplate(template: RechargeQuickTemplate) {
  form.TestChannel = splitWire(template.TestChannel);
}

async function createTemplate() {
  const name = templateName.value.trim();
  if (!name) return message.error('请输入模板名称');
  if (form.TestChannel.length === 0) return message.error('请先选择指定渠道');
  await createRechargeQuickTemplateApi({
    ModelName: name,
    TestChannel: form.TestChannel.join(','),
  });
  templateName.value = '';
  message.success('模板已收藏');
  await loadAuxiliary();
}

function removeTemplate(template: RechargeQuickTemplate) {
  Modal.confirm({
    content: `确认删除模板「${template.ModelName || template.Id}」？`,
    onOk: async () => {
      await deleteRechargeQuickTemplateApi(template.Id);
      message.success('模板已删除');
      await loadAuxiliary();
    },
    title: '删除模板',
  });
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :open="open"
    destroy-on-close
    title="编辑充值通道"
    width="min(920px, 94vw)"
    @cancel="requestClose"
    @ok="submit"
  >
    <Form layout="vertical" class="max-h-[70vh] overflow-y-auto pr-2">
      <Row :gutter="16">
        <Col :xs="24" :md="12">
          <Form.Item label="通道名称">
            <Input :value="row?.NickName" disabled />
          </Form.Item>
        </Col>
        <Col :xs="24" :md="12">
          <Form.Item label="支付类型">
            <Input :value="String(row?.PayType ?? '-')" disabled />
          </Form.Item>
        </Col>
        <Col :xs="24" :md="12">
          <Form.Item label="显示名称" required>
            <Input v-model:value="form.ShowName" :maxlength="100" />
          </Form.Item>
        </Col>
        <Col :xs="24" :md="12">
          <Form.Item label="费率模式" required>
            <Select
              v-model:value="form.RateType"
              :options="[
                { label: '平台费率', value: 0 },
                { label: '自定义费率', value: 1 },
                { label: '平台费率 + 自定义费率', value: 2 },
              ]"
            />
          </Form.Item>
        </Col>
        <Col v-if="form.RateType !== 1" :xs="24" :md="12">
          <Form.Item label="通道费率（%）" required>
            <InputNumber v-model:value="form.Rate" :min="0" class="w-full" />
          </Form.Item>
        </Col>
        <Col v-if="form.RateType !== 0" :xs="24" :md="12">
          <Form.Item label="自定义费率" required>
            <InputNumber
              v-model:value="form.CustomRate"
              :min="0"
              :precision="4"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col :span="24">
          <Form.Item label="固定充值金额（最多 15 个）" required>
            <div class="mb-2 flex flex-wrap gap-2">
              <Tag
                v-for="gear in form.Gears"
                :key="gear"
                closable
                @close.prevent="form.Gears.splice(form.Gears.indexOf(gear), 1)"
              >
                {{ gear }}
              </Tag>
            </div>
            <div class="flex gap-2">
              <InputNumber
                v-model:value="gearInput"
                :max="1_000_000"
                :min="1"
                :precision="0"
                placeholder="输入固定金额"
                @press-enter="addGear"
              />
              <Button :disabled="form.Gears.length >= 15" @click="addGear">
                添加
              </Button>
            </div>
          </Form.Item>
        </Col>
        <Col :xs="24" :md="8">
          <Form.Item label="允许玩家输入">
            <Switch
              :checked="form.AllowInput === 1"
              checked-children="允许"
              un-checked-children="关闭"
              @change="form.AllowInput = $event ? 1 : 2"
            />
          </Form.Item>
        </Col>
        <Col v-if="form.AllowInput === 1" :xs="12" :md="8">
          <Form.Item label="最小输入金额" required>
            <InputNumber
              v-model:value="form.InputMin"
              :max="1_000_000"
              :min="1"
              :precision="0"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col v-if="form.AllowInput === 1" :xs="12" :md="8">
          <Form.Item label="最大输入金额" required>
            <InputNumber
              v-model:value="form.InputMax"
              :max="1_000_000"
              :min="1"
              :precision="0"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col :xs="24" :md="12">
          <Form.Item label="分配权重（1-100）" required>
            <InputNumber
              v-model:value="form.Priority"
              :max="100"
              :min="1"
              :precision="0"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col :xs="24" :md="12">
          <Form.Item label="支付倒计时（分钟）" required>
            <InputNumber
              v-model:value="form.ExpirationTime"
              :min="0"
              :precision="0"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col :span="24">
          <Form.Item label="设备显示" required>
            <Checkbox.Group
              v-model:value="form.PlatformType"
              :options="[
                { label: 'Android', value: 1 },
                { label: 'iOS', value: 2 },
                { label: 'H5', value: 3 },
                { label: 'PC', value: 4 },
              ]"
            />
          </Form.Item>
        </Col>
        <Col :span="24">
          <Form.Item label="指定渠道">
            <Select
              v-model:value="form.TestChannel"
              :loading="auxiliaryLoading"
              :options="channelOptions"
              mode="multiple"
              placeholder="不选表示全部渠道"
              show-search
            />
            <div class="mt-2 flex flex-wrap gap-2">
              <Tag
                v-for="template in templates"
                :key="template.Id"
                closable
                class="cursor-pointer"
                @click="applyTemplate(template)"
                @close.prevent="removeTemplate(template)"
              >
                {{ template.ModelName || template.Id }}
              </Tag>
            </div>
            <div class="mt-2 flex gap-2">
              <Input
                v-model:value="templateName"
                placeholder="当前指定渠道收藏为模板"
              />
              <Button @click="createTemplate">收藏</Button>
            </div>
          </Form.Item>
        </Col>
        <Col :span="24">
          <Form.Item label="玩家层级">
            <Select
              v-model:value="form.LevelIds"
              :loading="auxiliaryLoading"
              :options="levelOptions"
              mode="multiple"
              placeholder="不选表示不限制"
            />
          </Form.Item>
        </Col>
      </Row>
      <Divider orientation="left">开放人群</Divider>
      <Row :gutter="16">
        <Col :xs="24" :md="8">
          <Form.Item label="限制注册时长">
            <Switch v-model:checked="form.timeCheck" />
          </Form.Item>
        </Col>
        <Col v-if="form.timeCheck" :xs="12" :md="8">
          <Form.Item label="最小时长（小时）" required>
            <InputNumber
              v-model:value="form.RegTime[0]"
              :max="99_999_999"
              :min="0"
              :precision="0"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col v-if="form.timeCheck" :xs="12" :md="8">
          <Form.Item label="最大时长（小时）" required>
            <InputNumber
              v-model:value="form.RegTime[1]"
              :max="99_999_999"
              :min="0"
              :precision="0"
              class="w-full"
            />
          </Form.Item>
        </Col>
        <Col :xs="24" :md="8">
          <Form.Item label="限制 VIP">
            <Switch v-model:checked="form.vipCheck" />
          </Form.Item>
        </Col>
        <Col v-if="form.vipCheck" :xs="24" :md="16">
          <Form.Item label="开放 VIP" required>
            <Select
              v-model:value="form.VipV2"
              :options="vipOptions"
              mode="multiple"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  </Modal>
</template>

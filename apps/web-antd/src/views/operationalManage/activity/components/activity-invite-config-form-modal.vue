<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type {
  InviteFriendConfig,
  InviteFriendConfigPayload,
  InviteFriendTier,
} from '#/api/operationManage/invite-friend-activity';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Switch,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { saveInviteFriendConfigApi } from '#/api/operationManage/invite-friend-activity';
import { useProjectConfig } from '#/composables/use-project-config';
import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';

import {
  centToYuan,
  createDefaultInviteConfigForm,
  createDefaultInviteTiers,
  INVITE_DEPOSIT_TYPE_OPTIONS,
  INVITE_IS_ACTIVE_OPTIONS,
  INVITE_RISK_ACTION_OPTIONS,
  INVITE_RISK_DIMENSION_OPTIONS,
  yuanToCent,
} from './activity-invite-shared';

defineOptions({ name: 'ActivityInviteConfigFormModal' });

const props = defineProps<{
  open: boolean;
  record?: InviteFriendConfig | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { projectConfig } = useProjectConfig();
const submitting = ref(false);

const langGroupOptions = computed(() => {
  const groups = (projectConfig.value?.LangGroup || []) as Array<{
    Default?: boolean;
    Id?: number | string;
    IsActive?: boolean;
    IsOpen?: boolean;
    Name?: string;
  }>;
  const filtered = groups.filter(
    (group) => group.IsActive !== false && group.IsOpen !== false,
  );
  const options = filtered.map((group) => ({
    label: String(group.Name || `语言组 ${group.Id}`),
    value: Number(group.Id),
  }));
  if (!options.some((item) => item.value === 0)) {
    options.unshift({ label: '默认语言组 (0)', value: 0 });
  }
  return options;
});

interface FormState {
  Banner: string;
  DepositThresholdYuan: number;
  IncludeDepositTypes: string[];
  InviteeRewardYuan: number;
  InviterTiers: Array<{
    MaxCount: null | number;
    MinCount: number;
    RewardYuan: number;
  }>;
  IsActive: number;
  LangGroupId: number;
  Open: boolean;
  RiskAction: number;
  RiskDimensions: string[];
  RuleContent: string[];
  ShareImage: string;
  ShareUrlTemplate: string;
  TimeRange: [Dayjs, Dayjs] | undefined;
  Title: string;
  WaterMultiple: number;
}

function parseJsonArray<T = unknown>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function buildFormState(record?: InviteFriendConfig | null): FormState {
  const base = createDefaultInviteConfigForm(
    Number(langGroupOptions.value[0]?.value ?? 0),
  );
  const source = record || base;
  const rawTiers = parseJsonArray<InviteFriendTier>(
    source.InviterTiers,
    createDefaultInviteTiers(),
  );
  const tiers = (rawTiers.length > 0 ? rawTiers : createDefaultInviteTiers()).map(
    (tier) => ({
      MaxCount: Number(tier.MaxCount) === 0 ? null : Number(tier.MaxCount),
      MinCount: Number(tier.MinCount) || 1,
      RewardYuan: centToYuan(tier.Reward),
    }),
  );
  const ruleContent = parseJsonArray<string>(source.RuleContent, ['']).map(
    (item) => String(item ?? ''),
  );

  return {
    Banner: String(source.Banner || ''),
    DepositThresholdYuan: centToYuan(source.DepositThreshold),
    IncludeDepositTypes: parseJsonArray<string>(source.IncludeDepositTypes, [
      'success',
    ]),
    InviteeRewardYuan: centToYuan(source.InviteeReward),
    InviterTiers: tiers,
    IsActive: Number(source.IsActive) || 1,
    LangGroupId: Number(source.LangGroupId ?? 0),
    Open: Boolean(source.Open),
    RiskAction: Number(source.RiskAction) || 1,
    RiskDimensions: parseJsonArray<string>(source.RiskDimensions, []),
    RuleContent: ruleContent.length > 0 ? ruleContent : [''],
    ShareImage: String(source.ShareImage || ''),
    ShareUrlTemplate: String(source.ShareUrlTemplate || ''),
    TimeRange:
      Number(source.BeginTime) > 0 && Number(source.EndTime) > 0
        ? [
            dayjs.unix(Number(source.BeginTime)),
            dayjs.unix(Number(source.EndTime)),
          ]
        : undefined,
    Title: String(source.Title || ''),
    WaterMultiple: Number(source.WaterMultiple ?? 1),
  };
}

const form = reactive<FormState>(buildFormState());

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    Object.assign(form, buildFormState(props.record));
  },
);

watch(
  () => form.IsActive,
  (value) => {
    if (Number(value) === 2) {
      form.Open = false;
    }
  },
);

const modalTitle = computed(() =>
  props.record?.Id ? '编辑邀请好友配置' : '新建邀请好友配置',
);

function closeModal() {
  emit('update:open', false);
}

function addTier() {
  const last = form.InviterTiers[form.InviterTiers.length - 1];
  const nextMin = last ? Number(last.MaxCount || last.MinCount || 0) + 1 : 1;
  if (last && (last.MaxCount === null || last.MaxCount === undefined)) {
    last.MaxCount = Math.max(nextMin - 1, last.MinCount);
  }
  form.InviterTiers.push({
    MaxCount: null,
    MinCount: nextMin,
    RewardYuan: 0,
  });
}

function removeTier(index: number) {
  if (form.InviterTiers.length <= 1) {
    message.warning('至少保留一档邀请人奖励');
    return;
  }
  form.InviterTiers.splice(index, 1);
  if (form.InviterTiers[0]) {
    form.InviterTiers[0].MinCount = 1;
  }
}

function addRule() {
  form.RuleContent.push('');
}

function removeRule(index: number) {
  if (form.RuleContent.length <= 1) {
    form.RuleContent[0] = '';
    return;
  }
  form.RuleContent.splice(index, 1);
}

function validateTiers(tiers: InviteFriendTier[]): string | undefined {
  if (tiers.length === 0) return '请至少配置一档邀请人奖励';
  if (tiers[0]?.MinCount !== 1) return '第一档邀请人数必须从 1 开始';
  for (let i = 0; i < tiers.length; i += 1) {
    const tier = tiers[i]!;
    if (tier.MinCount < 1) return `第 ${i + 1} 档最小人数无效`;
    if (tier.Reward < 0) return `第 ${i + 1} 档奖励不能小于 0`;
    const isLast = i === tiers.length - 1;
    if (!isLast && tier.MaxCount <= 0) {
      return '只有最后一档允许不设上限';
    }
    if (tier.MaxCount > 0 && tier.MaxCount < tier.MinCount) {
      return `第 ${i + 1} 档人数区间无效`;
    }
    if (i > 0) {
      const prev = tiers[i - 1]!;
      if (prev.MaxCount <= 0 || tier.MinCount !== prev.MaxCount + 1) {
        return '邀请人奖励阶梯必须连续';
      }
    }
  }
  return undefined;
}

function buildPayload(): InviteFriendConfigPayload | undefined {
  const title = String(form.Title || '').trim();
  if (!title) {
    message.warning('请填写活动标题');
    return;
  }
  if (!form.TimeRange?.[0] || !form.TimeRange?.[1]) {
    message.warning('请选择活动时间');
    return;
  }
  const beginTime = form.TimeRange[0].unix();
  const endTime = form.TimeRange[1].unix();
  if (beginTime <= 0 || endTime <= beginTime) {
    message.warning('结束时间必须晚于开始时间');
    return;
  }
  if (Number(form.DepositThresholdYuan) <= 0) {
    message.warning('充值门槛必须大于 0');
    return;
  }
  if (Number(form.InviteeRewardYuan) < 0 || Number(form.WaterMultiple) < 0) {
    message.warning('被邀请人奖励和流水倍数不能小于 0');
    return;
  }
  const shareUrl = String(form.ShareUrlTemplate || '').trim();
  if (!/^https?:\/\//i.test(shareUrl)) {
    message.warning('分享链接必须是完整的 HTTP/HTTPS 地址');
    return;
  }
  const invalidPlaceholders = (shareUrl.match(/\{[^{}]+\}/g) || []).filter(
    (token) => token !== '{inviteCode}' && token !== '{playerId}',
  );
  if (invalidPlaceholders.length > 0) {
    message.warning('分享链接只支持 {inviteCode}、{playerId} 占位符');
    return;
  }

  const tiers: InviteFriendTier[] = form.InviterTiers.map((tier) => ({
    MaxCount:
      tier.MaxCount === null || tier.MaxCount === undefined
        ? 0
        : Number(tier.MaxCount),
    MinCount: Number(tier.MinCount) || 0,
    Reward: yuanToCent(tier.RewardYuan),
  }));
  const tierError = validateTiers(tiers);
  if (tierError) {
    message.warning(tierError);
    return;
  }

  const isActive = Number(form.IsActive) || 1;
  const open = isActive === 2 ? false : Boolean(form.Open);

  return {
    Banner: form.Banner || '',
    BeginTime: beginTime,
    DepositThreshold: yuanToCent(form.DepositThresholdYuan),
    EndTime: endTime,
    IncludeDepositTypes: form.IncludeDepositTypes.length > 0
      ? [...form.IncludeDepositTypes]
      : ['success'],
    InviterTiers: tiers,
    InviteeReward: yuanToCent(form.InviteeRewardYuan),
    IsActive: isActive,
    LangGroupId: Number(form.LangGroupId) || 0,
    Open: open,
    RiskAction: Number(form.RiskAction) || 1,
    RiskDimensions: [...form.RiskDimensions],
    RuleContent: form.RuleContent.map((item) =>
      String(item ?? '').trim(),
    ).filter(Boolean),
    ShareImage: form.ShareImage || '',
    ShareUrlTemplate: shareUrl,
    Title: title,
    WaterMultiple: Number(form.WaterMultiple) || 0,
  };
}

async function handleSubmit() {
  let payload: InviteFriendConfigPayload | undefined;
  try {
    payload = buildPayload();
  } catch (error) {
    console.error('[invite-config] buildPayload failed', error);
    message.error('表单数据异常，请检查后重试');
    return;
  }
  if (!payload) return;

  submitting.value = true;
  try {
    await saveInviteFriendConfigApi(payload);
    message.success('保存成功');
    closeModal();
    emit('success');
  } catch {
    // 业务错误已由 request 拦截器提示，避免 Modal @ok 未捕获 Promise
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
    :title="modalTitle"
    :width="760"
    @cancel="closeModal"
    @ok="handleSubmit"
  >
    <Form class="max-h-[70vh] overflow-y-auto pr-2" layout="vertical">
      <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <Form.Item label="语言组" required>
          <Select
            v-model:value="form.LangGroupId"
            :disabled="Boolean(record?.Id)"
            :options="langGroupOptions"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="活动标题" required>
          <Input
            v-model:value="form.Title"
            allow-clear
            :maxlength="100"
            placeholder="请输入活动标题"
          />
        </Form.Item>
        <Form.Item label="活动时间（UTC）" required class="md:col-span-2">
          <DatePicker.RangePicker
            v-model:value="form.TimeRange"
            class="w-full"
            show-time
            :placeholder="['开始时间 UTC', '结束时间 UTC']"
          />
          <div class="mt-1 text-xs text-gray-400">
            提交为 Unix 秒；请按 UTC 配置起止时间。
          </div>
        </Form.Item>
        <Form.Item label="活动开关">
          <Switch
            v-model:checked="form.Open"
            :disabled="form.IsActive === 2"
            checked-children="开启"
            un-checked-children="关闭"
          />
          <div class="mt-1 text-xs text-gray-400">
            同一代理仅允许一个语言组开启；开启时会关闭其他语言组。
          </div>
        </Form.Item>
        <Form.Item label="启用状态">
          <Select
            v-model:value="form.IsActive"
            :options="INVITE_IS_ACTIVE_OPTIONS"
            style="width: 100%"
          />
          <div class="mt-1 text-xs text-gray-400">
            停用时会强制关闭活动开关。
          </div>
        </Form.Item>
        <Form.Item label="充值达标门槛（元）" required>
          <InputNumber
            v-model:value="form.DepositThresholdYuan"
            :min="0.01"
            :precision="2"
            class="w-full"
            placeholder="默认 100"
          />
          <div class="mt-1 text-xs text-gray-400">
            对应字段 DepositThreshold，提交按最小金额单位（分）。
          </div>
        </Form.Item>
        <Form.Item label="计入充值类型" required>
          <Checkbox.Group
            v-model:value="form.IncludeDepositTypes"
            :options="INVITE_DEPOSIT_TYPE_OPTIONS"
          />
          <div class="mt-1 text-xs text-gray-400">
            对接约定值：success（真实充值成功）。
          </div>
        </Form.Item>
        <Form.Item label="被邀请人奖励（元）">
          <InputNumber
            v-model:value="form.InviteeRewardYuan"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="流水倍数">
          <InputNumber
            v-model:value="form.WaterMultiple"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="风控维度" class="md:col-span-2">
          <Checkbox.Group
            v-model:value="form.RiskDimensions"
            :options="INVITE_RISK_DIMENSION_OPTIONS"
          />
        </Form.Item>
        <Form.Item label="风控动作">
          <Select
            v-model:value="form.RiskAction"
            :options="INVITE_RISK_ACTION_OPTIONS"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="分享链接模板" required class="md:col-span-2">
          <Input
            v-model:value="form.ShareUrlTemplate"
            allow-clear
            placeholder="https://example.com/register?inviteCode={inviteCode}"
          />
          <div class="mt-1 text-xs text-gray-400">
            仅支持占位符 {inviteCode}、{playerId}
          </div>
        </Form.Item>
        <Form.Item label="Banner 图">
          <VoucherImageField
            v-model="form.Banner"
            :max-size-kb="2048"
            dimension-hint="活动 Banner，建议不超过 2M"
          />
        </Form.Item>
        <Form.Item label="分享图">
          <VoucherImageField
            v-model="form.ShareImage"
            :max-size-kb="2048"
            dimension-hint="分享缩略图，建议不超过 2M"
          />
        </Form.Item>
      </div>

      <Form.Item label="邀请人奖励阶梯" required>
        <div class="mb-2 text-xs text-gray-400">
          第一档须从 MinCount=1 开始；区间连续；仅最后一档允许 MaxCount
          为空（提交为 0，表示无上限）。
        </div>
        <div class="space-y-2">
          <div
            v-for="(tier, index) in form.InviterTiers"
            :key="index"
            class="flex flex-wrap items-center gap-2 rounded border border-border bg-accent p-2"
          >
            <span class="text-sm text-gray-500">第 {{ index + 1 }} 档</span>
            <InputNumber
              v-model:value="tier.MinCount"
              :disabled="index === 0"
              :min="1"
              :precision="0"
              placeholder="最少人数"
              style="width: 110px"
            />
            <span>~</span>
            <InputNumber
              :value="tier.MaxCount ?? undefined"
              :min="0"
              :precision="0"
              placeholder="不限"
              style="width: 110px"
              @update:value="(value) => (tier.MaxCount = value == null ? null : Number(value))"
            />
            <span class="text-xs text-gray-400">人（空=无上限）</span>
            <InputNumber
              v-model:value="tier.RewardYuan"
              :min="0"
              :precision="2"
              placeholder="奖励"
              style="width: 130px"
            />
            <span class="text-sm">元</span>
            <Button danger size="small" type="link" @click="removeTier(index)">
              删除
            </Button>
          </div>
          <Button size="small" type="dashed" @click="addTier">添加阶梯</Button>
        </div>
      </Form.Item>

      <Form.Item label="活动规则">
        <div class="space-y-2">
          <div
            v-for="(_, index) in form.RuleContent"
            :key="index"
            class="flex items-start gap-2"
          >
            <Input.TextArea
              v-model:value="form.RuleContent[index]"
              :auto-size="{ minRows: 2, maxRows: 4 }"
              :placeholder="`规则第 ${index + 1} 条`"
            />
            <Button danger size="small" type="link" @click="removeRule(index)">
              删除
            </Button>
          </div>
          <Button size="small" type="dashed" @click="addRule">添加规则</Button>
        </div>
      </Form.Item>
    </Form>
  </Modal>
</template>

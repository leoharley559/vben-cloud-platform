<script lang="ts" setup>
import type {
  WithdrawRiskRule,
  WithdrawRiskScheme,
  WithdrawRiskSetting,
} from '#/api/gameManage/withdraw-config';

import { computed, onMounted, ref } from 'vue';

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Result,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  createWithdrawRiskSchemeApi,
  deleteWithdrawRiskSchemeApi,
  fetchWithdrawRiskRulesApi,
  fetchWithdrawRiskSchemesApi,
  renameWithdrawRiskSchemeApi,
  resetWithdrawRiskSchemeApi,
  updateWithdrawRiskRuleApi,
} from '#/api/gameManage/withdraw-config';
import { fetchPlayerTagListApi } from '#/api/operationManage/player';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';

defineOptions({ name: 'WithdrawRiskPanel' });

type OptionValue = number | string;
type RiskEditRule = Omit<WithdrawRiskRule, 'Setting' | 'Str'> & {
  Setting: WithdrawRiskSetting[];
  Str: OptionValue[] | string;
};

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const canView = computed(() => checkPermission(10_991));
const canEdit = computed(() => checkPermission(10_992));
const canSwitch = computed(() => checkPermission(10_993));
const canDeleteScheme = computed(() => checkPermission(12_411));

const loading = ref(false);
const saving = ref(false);
const schemes = ref<WithdrawRiskScheme[]>([]);
const selectedScheme = ref<WithdrawRiskScheme>();
const rules = ref<WithdrawRiskRule[]>([]);
const tagOptions = ref<Array<{ label: string; value: OptionValue }>>([]);
const editorOpen = ref(false);
const schemeModalOpen = ref(false);
const schemeModalMode = ref<'create' | 'rename'>('create');
const schemeName = ref('');
const editingRule = ref<RiskEditRule>();

const ruleNameMap: Record<string, string> = {
  '24HWithdrawAmount': '24 小时提现金额',
  '24HWithdrawCount': '24 小时提现次数',
  AbsPaymentWithdraw: '充值与提现差额',
  AfterNameChanged: '修改姓名后提现',
  AfterPhoneChanged: '修改手机号后提现',
  BettingChanges: '投注变化',
  CumulativeWithdraw: '累计提现金额',
  DayBetLastPaymentRate: '当日投注/末次充值比例',
  DepositWithdrawBehavior: '存提款行为异常',
  FirstWithdraw: '首次提现金额',
  FirstWithdrawToday: '当日首次提现金额',
  IpLimit: 'IP 限制',
  LargeAmountWinProfit: '大额盈利',
  LastPaymentGreaterAverage: '末次充值大于平均充值',
  LastPaymentGreaterMaximum: '末次充值大于历史最大充值',
  MultipleAccountsWithSameIP: '同 IP 多账号',
  NewPlayerFirstWithdraw: '新玩家首次提现',
  OnlineTime: '玩家在线时间',
  PayAndWithdrawInterval: '充值提现间隔',
  PaymentAmount: '充值金额',
  PaymentWithdrawRate: '充值提现比例',
  PlayerFirstWithdraw: '玩家首次提现',
  RegisterTime: '注册时间',
  RiskLabel: '风控标签',
  RiskPaymentAccountType: '风险充值账号类型',
  SameDeviceAccount: '同设备多账号',
  SameNameAccount: '同名账号',
  SetWithdrawLimitNum: '玩家提现次数',
  UsdAndEbPayFirstWithdraw: 'USDT/易币付首次提现',
  VIPLimit: 'VIP 限制',
  WalletBalance: '钱包余额',
  WhiteLabel: '白名单标签',
  WithdrawAfterRed: '红包后提现',
  WithdrawAfterSpecialAddGold: '特殊加金后提现',
  WithdrawBigMoney: '大额提现',
  WithdrawWaterLimit: '提现流水限制',
};

const symbolMap: Record<string, string> = {
  '24HWithdrawAmount': '>',
  '24HWithdrawCount': '>',
  AbsPaymentWithdraw: '>',
  DayBetLastPaymentRate: '<',
  LargeAmountWinProfit: '≥',
  OnlineTime: '<',
  PayAndWithdrawInterval: '<',
  PaymentAmount: '≤',
  PaymentWithdrawRate: '>',
  SameDeviceAccount: '≥',
  SameNameAccount: '≥',
  UsdAndEbPayFirstWithdraw: '≤',
  WalletBalance: '<',
  WithdrawBigMoney: '≥',
  WithdrawWaterLimit: '≥',
};

const detailTemplates: Record<string, string> = {
  CumulativeWithdraw: '{0} 天内累计提现 {1} {2}',
  DepositWithdrawBehavior: '{2} 天内充值 {0}、提现 {1}，差额阈值 {3}',
  FirstWithdraw: '首次提现 {0} {1}',
  FirstWithdrawToday: '当日首次提现 {0} {1}',
  MultipleAccountsWithSameIP: '{0} 小时内同 IP 账号数达到 {1}',
  RegisterTime: '以 {0} 注册未满 {1} 天',
  SameDeviceAccount: '{0} 小时内同设备账号数达到 {1}',
};

const timeRuleNames = new Set([
  'BettingChanges',
  'DayBetLastPaymentRate',
  'LastPaymentGreaterAverage',
  'LastPaymentGreaterMaximum',
  'RiskPaymentAccountType',
]);
const plainStringRuleNames = new Set([
  ...timeRuleNames,
  'IpLimit',
  'MultipleAccountsWithSameIP',
  'SameDeviceAccount',
]);
const noParameterRuleNames = new Set([
  'NewPlayerFirstWithdraw',
  'PlayerFirstWithdraw',
  'WithdrawAfterRed',
  'WithdrawAfterSpecialAddGold',
]);

const columns = computed(() => [
  { key: 'index', title: '序号', width: 70 },
  { dataIndex: 'Abbr', key: 'Abbr', title: '规则简称', width: 160 },
  { key: 'description', minWidth: 280, title: '命中条件提示' },
  { dataIndex: 'Index', key: 'Index', title: '派单优先级', width: 120 },
  { key: 'level', title: '提醒等级', width: 110 },
  { key: 'status', title: '状态', width: 90 },
  { key: 'auto', title: '参与自动审核', width: 120 },
  ...(canEdit.value ? [{ key: 'action', title: '操作', width: 90 }] : []),
]);

const vipOptions = computed(() => {
  const list = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId?: OptionValue;
    VipLevelName?: string;
  }>;
  return list.map((item) => ({
    label: item.VipLevelName || String(item.VipLevelId ?? ''),
    value: item.VipLevelId ?? '',
  }));
});

const rechargeOptions = computed(() => {
  const list = (
    projectConfig.value as null | {
      RechargeTypeList?: Array<{
        IsOpen?: boolean | number;
        Key?: OptionValue;
        Name?: string;
      }>;
    }
  )?.RechargeTypeList;
  return [
    { label: '代理', value: -1 },
    ...(list || [])
      .filter((item) => item.IsOpen === undefined || Boolean(item.IsOpen))
      .map((item) => ({
        label: item.Name || String(item.Key ?? ''),
        value: item.Key ?? '',
      })),
  ];
});

const currencyOptions = computed(() => {
  const parent = projectConfig.value?.ParentInfo as
    | undefined
    | { Currency?: string };
  return [
    { label: parent?.Currency || '法币', value: 1 },
    { label: 'USDT', value: 2 },
  ];
});

const activeMultiOptions = computed(() => {
  const name = editingRule.value?.Name;
  if (name === 'VIPLimit') return vipOptions.value;
  if (name === 'RiskPaymentAccountType') return rechargeOptions.value;
  return tagOptions.value;
});

const usesMultiSelect = computed(() =>
  ['RiskLabel', 'RiskPaymentAccountType', 'VIPLimit', 'WhiteLabel'].includes(
    editingRule.value?.Name || '',
  ),
);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseSettings(value: WithdrawRiskRule['Setting']) {
  if (Array.isArray(value)) return clone(value);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureSetting(rule: RiskEditRule) {
  if (!rule.Setting[0]) rule.Setting[0] = {};
  return rule.Setting[0];
}

function currencyName(value: unknown) {
  return (
    currencyOptions.value.find((item) => String(item.value) === String(value))
      ?.label || String(value ?? '-')
  );
}

function optionNames(
  value: unknown,
  options: Array<{ label: string; value: OptionValue }>,
) {
  const ids = String(value || '')
    .split(',')
    .filter(Boolean);
  return ids
    .map((id) => options.find((item) => String(item.value) === id)?.label || id)
    .join('、');
}

function formatTemplate(template: string, values: unknown[]) {
  return template.replaceAll(/\{(\d+)\}/g, (_, index: string) =>
    String(values[Number(index)] ?? '-'),
  );
}

function formatRule(row: WithdrawRiskRule) {
  const settings = parseSettings(row.Setting);
  const setting = settings[0] || {};
  const detailTemplate = detailTemplates[row.Name];
  if (detailTemplate) {
    const values: unknown[] =
      row.Name === 'DepositWithdrawBehavior'
        ? [
            currencyName(setting.DepositCurrency),
            currencyName(setting.WithdrawCurrency),
            setting.Number,
            setting.Trigger,
          ]
        : row.Name === 'CumulativeWithdraw'
          ? [
              row.Number,
              currencyName(setting.WithdrawCurrency),
              setting.WithdrawAmount,
            ]
          : row.Name === 'RegisterTime'
            ? [currencyName(setting.RegisterCurrency), setting.Number]
            : ['FirstWithdraw', 'FirstWithdrawToday'].includes(row.Name)
              ? [currencyName(setting.WithdrawCurrency), setting.WithdrawAmount]
              : [row.Number, row.Str];
    return formatTemplate(detailTemplate, values);
  }
  const name = ruleNameMap[row.Name] || row.Name;
  if (['RiskLabel', 'WhiteLabel'].includes(row.Name)) {
    return `${name}（${optionNames(row.Str, tagOptions.value)}）`;
  }
  if (row.Name === 'VIPLimit') {
    return `${name}（${optionNames(row.Str, vipOptions.value)}）`;
  }
  if (row.Name === 'RiskPaymentAccountType') {
    return `${name}（${optionNames(row.Str, rechargeOptions.value)}）`;
  }
  if (noParameterRuleNames.has(row.Name)) return name;
  const value = ['AfterNameChanged', 'AfterPhoneChanged'].includes(row.Name)
    ? `${row.Number ?? '-'} 次提现`
    : row.Name === 'PaymentWithdrawRate'
      ? `${row.Number ?? '-'}%`
      : timeRuleNames.has(row.Name)
        ? `${row.Number ?? '-'} 小时；参数 ${row.Str || '-'}`
        : row.Name === 'IpLimit'
          ? row.Str
          : row.Number;
  return `${name} ${symbolMap[row.Name] || ''} ${value ?? '-'}`.trim();
}

function levelText(level: unknown) {
  return (
    { 1: '待定', 2: '低风险', 3: '中风险', 4: '高风险' }[Number(level)] ||
    '待定'
  );
}

function levelColor(level: unknown) {
  return { 1: 'default', 2: 'blue', 3: 'orange', 4: 'red' }[Number(level)];
}

async function loadRules() {
  if (!selectedScheme.value) {
    rules.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await fetchWithdrawRiskRulesApi(selectedScheme.value.Id);
    const items = result || [];
    rules.value = items
      .map((item) => ({ ...item, Setting: parseSettings(item.Setting) }))
      .toSorted((a, b) => Number(a.Index || 0) - Number(b.Index || 0));
  } finally {
    loading.value = false;
  }
}

async function loadSchemes(preferredId?: OptionValue) {
  const result = await fetchWithdrawRiskSchemesApi();
  schemes.value = result || [];
  selectedScheme.value =
    schemes.value.find((item) => String(item.Id) === String(preferredId)) ||
    schemes.value[0];
  await loadRules();
}

async function loadTags() {
  const result = await fetchPlayerTagListApi({ Page: 1, PageSize: 9999 });
  tagOptions.value = result.Items.map((item) => ({
    label: String(item.TagName || item.Name || item.Id || ''),
    value: (item.Id as OptionValue) ?? '',
  }));
}

function selectScheme(scheme: WithdrawRiskScheme) {
  if (String(selectedScheme.value?.Id) === String(scheme.Id)) return;
  selectedScheme.value = scheme;
  void loadRules();
}

function openSchemeModal(mode: 'create' | 'rename') {
  schemeModalMode.value = mode;
  schemeName.value = mode === 'rename' ? selectedScheme.value?.Name || '' : '';
  schemeModalOpen.value = true;
}

async function submitScheme() {
  const name = schemeName.value.trim();
  if (!name) {
    message.warning('请输入方案名称');
    return;
  }
  saving.value = true;
  try {
    if (schemeModalMode.value === 'rename' && selectedScheme.value) {
      await renameWithdrawRiskSchemeApi({
        Id: selectedScheme.value.Id,
        Name: name,
      });
      message.success('方案名称已更新');
      await loadSchemes(selectedScheme.value.Id);
    } else {
      await createWithdrawRiskSchemeApi({ Name: name });
      message.success('方案已创建');
      await loadSchemes();
      selectedScheme.value = schemes.value.at(-1) || selectedScheme.value;
      await loadRules();
    }
    schemeModalOpen.value = false;
  } finally {
    saving.value = false;
  }
}

function confirmDeleteScheme() {
  if (!selectedScheme.value) return;
  const scheme = selectedScheme.value;
  Modal.confirm({
    content: `确认删除方案“${scheme.Name}”？此操作不可撤销。`,
    okButtonProps: { danger: true },
    onOk: async () => {
      await deleteWithdrawRiskSchemeApi(scheme.Id);
      message.success('方案已删除');
      await loadSchemes();
    },
    title: '删除方案',
  });
}

function confirmResetScheme() {
  if (!selectedScheme.value) return;
  const scheme = selectedScheme.value;
  Modal.confirm({
    content: `确认将方案“${scheme.Name}”恢复为系统预设规则？`,
    onOk: async () => {
      await resetWithdrawRiskSchemeApi(scheme.Id);
      message.success('已恢复系统预设');
      await loadRules();
    },
    title: '恢复默认',
  });
}

function openEditor(row: WithdrawRiskRule) {
  const copy = clone(row);
  const multiple = [
    'RiskLabel',
    'RiskPaymentAccountType',
    'VIPLimit',
    'WhiteLabel',
  ].includes(copy.Name);
  editingRule.value = {
    ...copy,
    Setting: parseSettings(copy.Setting),
    Str: multiple
      ? String(copy.Str || '')
          .split(',')
          .filter(Boolean)
          .map((value) => (Number.isNaN(Number(value)) ? value : Number(value)))
      : String(copy.Str ?? ''),
  };
  ensureSetting(editingRule.value!);
  editorOpen.value = true;
}

function validateRule(rule: RiskEditRule) {
  if (!String(rule.Abbr || '').trim()) return '请输入规则简称';
  if (!rule.Index || Number(rule.Index) < 1) return '派单优先级必须大于 0';
  if (usesMultiSelect.value && (rule.Str as OptionValue[]).length === 0) {
    return '请至少选择一个条件参数';
  }
  if (
    ['IpLimit', ...timeRuleNames].includes(rule.Name) &&
    !String(rule.Str).trim()
  ) {
    return '请输入条件参数';
  }
  if (
    !noParameterRuleNames.has(rule.Name) &&
    !usesMultiSelect.value &&
    !detailTemplates[rule.Name] &&
    rule.Number !== 0 &&
    !String(rule.Number ?? '').trim()
  ) {
    return '请输入条件参数';
  }
  return '';
}

function serializeRule(rule: RiskEditRule): WithdrawRiskRule {
  return {
    ...clone(rule),
    Setting: rule.Setting.length > 0 ? JSON.stringify(rule.Setting) : '',
    Str: Array.isArray(rule.Str) ? rule.Str.join(',') : rule.Str,
  };
}

async function submitRule() {
  if (!editingRule.value) return;
  const error = validateRule(editingRule.value);
  if (error) {
    message.warning(error);
    return;
  }
  saving.value = true;
  try {
    await updateWithdrawRiskRuleApi(serializeRule(editingRule.value));
    message.success('规则已更新');
    editorOpen.value = false;
    await loadRules();
  } finally {
    saving.value = false;
  }
}

function changeRuleStatus(row: WithdrawRiskRule, status: number) {
  const enabled = status === 1;
  Modal.confirm({
    content: `确认${enabled ? '开启' : '关闭'}规则“${row.Abbr || row.Name}”？`,
    onCancel: () => void loadRules(),
    onOk: async () => {
      try {
        await updateWithdrawRiskRuleApi(
          serializeRule({
            ...clone(row),
            Setting: parseSettings(row.Setting),
            Status: status,
            Str: String(row.Str ?? ''),
          }),
        );
        message.success(`规则已${enabled ? '开启' : '关闭'}`);
      } finally {
        await loadRules();
      }
    },
    title: '切换规则状态',
  });
}

onMounted(async () => {
  if (!canView.value) return;
  await Promise.all([loadTags(), loadSchemes()]);
});
</script>

<template>
  <Card v-if="canView" :bordered="false" title="兑换风控规则">
    <template #extra>
      <Tooltip title="自定义方案可独立调整规则；恢复默认会覆盖当前方案配置">
        <span class="cursor-help text-gray-400">方案说明</span>
      </Tooltip>
    </template>

    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Space wrap>
        <span class="text-sm text-gray-500">风控方案</span>
        <Button
          v-for="scheme in schemes"
          :key="String(scheme.Id)"
          :type="
            String(selectedScheme?.Id) === String(scheme.Id)
              ? 'primary'
              : 'default'
          "
          @click="selectScheme(scheme)"
        >
          {{ scheme.Name }}
        </Button>
        <Button v-if="canEdit" type="dashed" @click="openSchemeModal('create')">
          新建方案
        </Button>
      </Space>
      <Space wrap>
        <Button
          v-if="canEdit && selectedScheme"
          @click="openSchemeModal('rename')"
        >
          重命名
        </Button>
        <Button v-if="canEdit && selectedScheme" @click="confirmResetScheme">
          恢复系统预设
        </Button>
        <Button
          v-if="canDeleteScheme && selectedScheme?.SchemeType"
          danger
          @click="confirmDeleteScheme"
        >
          删除方案
        </Button>
      </Space>
    </div>

    <Alert
      v-if="selectedScheme"
      class="mb-4"
      :message="`当前方案：${selectedScheme.Name}`"
      show-icon
      type="info"
    />

    <Table
      :columns="columns"
      :data-source="rules"
      :loading="loading"
      :pagination="false"
      :row-key="(row: WithdrawRiskRule) => String(row.Id)"
      bordered
      size="middle"
      :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
        </template>
        <template v-else-if="column.key === 'description'">
          {{ formatRule(record as WithdrawRiskRule) }}
        </template>
        <template v-else-if="column.key === 'level'">
          <Tag :color="levelColor((record as WithdrawRiskRule).Level)">
            {{ levelText((record as WithdrawRiskRule).Level) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'status'">
          <Switch
            :checked="Number((record as WithdrawRiskRule).Status) === 1"
            :disabled="!canSwitch"
            @change="
              (checked: boolean | number | string) =>
                changeRuleStatus(record as WithdrawRiskRule, checked ? 1 : 2)
            "
          />
        </template>
        <template v-else-if="column.key === 'auto'">
          <Tag
            :color="
              Number((record as WithdrawRiskRule).IsAutoVerify) === 1
                ? 'green'
                : 'red'
            "
          >
            {{
              Number((record as WithdrawRiskRule).IsAutoVerify) === 1
                ? '是'
                : '否'
            }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            type="link"
            size="small"
            @click="openEditor(record as WithdrawRiskRule)"
          >
            编辑
          </Button>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="schemeModalOpen"
      :confirm-loading="saving"
      :title="schemeModalMode === 'create' ? '新建风控方案' : '重命名风控方案'"
      @ok="submitScheme"
    >
      <Form layout="vertical" class="pt-3">
        <Form.Item label="方案名称" required>
          <Input
            v-model:value="schemeName"
            :maxlength="30"
            placeholder="请输入方案名称"
            @press-enter="submitScheme"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editorOpen"
      :confirm-loading="saving"
      destroy-on-close
      title="编辑风控规则"
      width="680px"
      @ok="submitRule"
    >
      <Form
        v-if="editingRule"
        layout="vertical"
        class="max-h-[65vh] overflow-y-auto pr-2 pt-3"
      >
        <Form.Item label="规则简称" required>
          <Input v-model:value="editingRule.Abbr" :maxlength="50" />
        </Form.Item>

        <template
          v-if="
            ['SameDeviceAccount', 'MultipleAccountsWithSameIP'].includes(
              editingRule.Name,
            )
          "
        >
          <div class="grid grid-cols-2 gap-3">
            <Form.Item label="账号数量" required>
              <InputNumber
                v-model:value="editingRule.Str as string"
                :max="999999"
                :min="-1"
                class="!w-full"
              />
            </Form.Item>
            <Form.Item label="时间（小时）" required>
              <InputNumber
                v-model:value="editingRule.Number as number"
                :max="999999"
                :min="-1"
                class="!w-full"
              />
            </Form.Item>
          </div>
        </template>

        <template v-else-if="editingRule.Name === 'DepositWithdrawBehavior'">
          <Form.Item label="天数" required>
            <InputNumber
              v-model:value="editingRule.Setting[0]!.Number"
              :min="-1"
              class="!w-full"
            />
          </Form.Item>
          <div class="grid grid-cols-2 gap-3">
            <Form.Item label="充值币种">
              <Select
                v-model:value="editingRule.Setting[0]!.DepositCurrency"
                :options="currencyOptions"
                disabled
              />
            </Form.Item>
            <Form.Item label="提现币种">
              <Select
                v-model:value="editingRule.Setting[0]!.WithdrawCurrency"
                :options="currencyOptions"
                disabled
              />
            </Form.Item>
          </div>
          <Form.Item label="阈值" required>
            <InputNumber
              v-model:value="editingRule.Setting[0]!.Trigger"
              :min="0"
              class="!w-full"
            />
          </Form.Item>
        </template>

        <template
          v-else-if="
            ['FirstWithdrawToday', 'FirstWithdraw'].includes(editingRule.Name)
          "
        >
          <div class="grid grid-cols-2 gap-3">
            <Form.Item label="提现币种">
              <Select
                v-model:value="editingRule.Setting[0]!.WithdrawCurrency"
                :options="currencyOptions"
                disabled
              />
            </Form.Item>
            <Form.Item label="提现金额" required>
              <InputNumber
                v-model:value="editingRule.Setting[0]!.WithdrawAmount"
                :min="0"
                class="!w-full"
              />
            </Form.Item>
          </div>
        </template>

        <template v-else-if="editingRule.Name === 'CumulativeWithdraw'">
          <Form.Item label="天数" required>
            <InputNumber
              v-model:value="editingRule.Number as number"
              :min="-1"
              class="!w-full"
            />
          </Form.Item>
          <div class="grid grid-cols-2 gap-3">
            <Form.Item label="提现币种">
              <Select
                v-model:value="editingRule.Setting[0]!.WithdrawCurrency"
                :options="currencyOptions"
                disabled
              />
            </Form.Item>
            <Form.Item label="提现金额" required>
              <InputNumber
                v-model:value="editingRule.Setting[0]!.WithdrawAmount"
                :min="0"
                class="!w-full"
              />
            </Form.Item>
          </div>
        </template>

        <template v-else-if="editingRule.Name === 'RegisterTime'">
          <Form.Item label="注册币种">
            <Select
              v-model:value="editingRule.Setting[0]!.RegisterCurrency"
              :options="currencyOptions"
              disabled
            />
          </Form.Item>
          <Form.Item label="天数" required>
            <InputNumber
              v-model:value="editingRule.Setting[0]!.Number"
              :min="-1"
              class="!w-full"
            />
          </Form.Item>
        </template>

        <template v-else>
          <Form.Item
            v-if="timeRuleNames.has(editingRule.Name)"
            label="时间条件"
            required
          >
            <Select
              v-model:value="editingRule.Number"
              :options="[
                { label: '24 小时', value: 24 },
                { label: '48 小时', value: 48 },
                { label: '72 小时', value: 72 },
              ]"
            />
          </Form.Item>
          <Form.Item v-if="usesMultiSelect" label="条件参数" required>
            <Select
              v-model:value="editingRule.Str as OptionValue[]"
              :options="activeMultiOptions"
              mode="multiple"
              option-filter-prop="label"
              placeholder="请选择"
              show-search
            />
          </Form.Item>
          <Form.Item
            v-else-if="!noParameterRuleNames.has(editingRule.Name)"
            label="条件参数"
            required
          >
            <Input
              v-if="plainStringRuleNames.has(editingRule.Name)"
              v-model:value="editingRule.Str as string"
              placeholder="请输入"
            />
            <InputNumber
              v-else
              v-model:value="editingRule.Number as number"
              :min="-1"
              class="!w-full"
            />
          </Form.Item>
          <Alert
            v-else
            class="mb-4"
            message="该规则无需额外条件参数"
            show-icon
            type="info"
          />
        </template>

        <div class="grid grid-cols-2 gap-3">
          <Form.Item label="派单优先级" required>
            <InputNumber
              v-model:value="editingRule.Index"
              :min="1"
              class="!w-full"
            />
          </Form.Item>
          <Form.Item label="提醒等级" required>
            <Select
              v-model:value="editingRule.Level"
              :options="[
                { label: '待定', value: 1 },
                { label: '低风险', value: 2 },
                { label: '中风险', value: 3 },
                { label: '高风险', value: 4 },
              ]"
            />
          </Form.Item>
        </div>
        <Form.Item label="参与自动审核">
          <Radio.Group v-model:value="editingRule.IsAutoVerify">
            <Radio :value="1">是</Radio>
            <Radio :value="0">否</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  </Card>
  <Result
    v-else
    status="403"
    sub-title="需要兑换风控列表权限 10991"
    title="无权限"
  />
</template>

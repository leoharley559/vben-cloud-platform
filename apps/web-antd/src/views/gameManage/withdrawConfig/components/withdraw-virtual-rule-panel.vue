<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  message,
} from 'ant-design-vue';

import {
  addVirtualWithdrawWhitelistApi,
  checkVirtualWithdrawWhitelistApi,
  deletePlayerQuotaApi,
  deleteVirtualWithdrawWhitelistApi,
  fetchPlayerLevelsForWithdrawApi,
  fetchPlayerQuotaListApi,
  fetchUsdtWithdrawRateApi,
  fetchVirtualWithdrawWhitelistApi,
  fetchWithdrawFirstConfigApi,
  multiAddVirtualWithdrawWhitelistApi,
  updatePlayerQuotaApi,
  updateUsdtWithdrawRateApi,
  updateWithdrawFirstConfigApi,
} from '#/api/gameManage/withdraw-rules';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useOperationOptions } from '#/composables/use-operation-options';

const { packageOptions } = useOperationOptions();
const loading = ref(false);
const saving = ref('');
const rateSnapshot = ref<Record<string, unknown>>({});
const ruleSnapshot = ref<Record<string, unknown>>({});
const rate = reactive({
  UsdtExchangeRate: undefined as number | undefined,
  UsdtOption: 1,
  UsdtRate: undefined as number | undefined,
});
const rule = reactive({
  CurrencyList: [] as string[],
  MemberQuotaStatus: 0,
  NoWithdrawCryptoCoinHintText: '',
  WhiteType: 0,
});
const currencyOptions = [
  { label: 'USDT-TRC20', value: '1' },
  { label: 'USDT-ERC20', value: '2' },
];

function toWhiteType(data: Record<string, unknown>) {
  if (Number(data.NoRechargeCryptoCoinShowWithdraw) === 1) return 1;
  if (Number(data.NoWithdrawCryptoCoinHint) === 1) return 2;
  return 0;
}

async function loadMain() {
  loading.value = true;
  try {
    const [rateData, ruleData] = await Promise.all([
      fetchUsdtWithdrawRateApi(),
      fetchWithdrawFirstConfigApi(),
    ]);
    rateSnapshot.value = { ...rateData };
    ruleSnapshot.value = { ...ruleData };
    rate.UsdtOption = Number(rateData.UsdtOption || 1);
    rate.UsdtRate =
      rateData.UsdtRate == null ? undefined : Number(rateData.UsdtRate) / 100;
    rate.UsdtExchangeRate =
      rateData.UsdtExchangeRate == null
        ? undefined
        : Number(rateData.UsdtExchangeRate) / 100;
    rule.CurrencyList = String(ruleData.CurrencyList || '')
      .split(',')
      .filter(Boolean);
    rule.MemberQuotaStatus = Number(ruleData.MemberQuotaStatus || 0);
    rule.NoWithdrawCryptoCoinHintText = String(
      ruleData.NoWithdrawCryptoCoinHintText || '',
    );
    rule.WhiteType = toWhiteType(ruleData);
  } finally {
    loading.value = false;
  }
}

async function saveRate() {
  const current = rate.UsdtOption === 2 ? rate.UsdtExchangeRate : rate.UsdtRate;
  if (
    rate.UsdtOption !== 1 &&
    (current === undefined || current < 0 || current > 100)
  ) {
    message.warning('汇率请输入 0 至 100，最多两位小数');
    return;
  }
  saving.value = 'rate';
  try {
    await updateUsdtWithdrawRateApi({
      ...rateSnapshot.value,
      UsdtExchangeRate:
        rate.UsdtExchangeRate == null
          ? ''
          : Math.round(rate.UsdtExchangeRate * 100),
      UsdtOption: rate.UsdtOption,
      UsdtRate: rate.UsdtRate == null ? '' : Math.round(rate.UsdtRate * 100),
    });
    message.success('汇率保存成功');
    await loadMain();
  } finally {
    saving.value = '';
  }
}

async function saveRule() {
  if (rule.WhiteType === 2 && !rule.NoWithdrawCryptoCoinHintText.trim()) {
    message.warning('请输入弹窗提示文本');
    return;
  }
  saving.value = 'rule';
  try {
    await updateWithdrawFirstConfigApi({
      ...ruleSnapshot.value,
      CurrencyList: rule.CurrencyList.join(','),
      MemberQuotaStatus: rule.MemberQuotaStatus,
      NeedBindCardWithdrawCryptoCoin: rule.WhiteType === 0 ? 1 : 0,
      NoRechargeCryptoCoinShowWithdraw: rule.WhiteType === 1 ? 1 : 0,
      NoWithdrawCryptoCoinHint: rule.WhiteType === 2 ? 1 : 0,
      NoWithdrawCryptoCoinHintText: rule.NoWithdrawCryptoCoinHintText,
    });
    message.success('限制规则保存成功');
    await loadMain();
  } finally {
    saving.value = '';
  }
}

const whitelistOpen = ref(false);
const whitelistLoading = ref(false);
const whitelistRows = ref<Record<string, unknown>[]>([]);
const whitelistTotal = ref(0);
const whitelistQuery = reactive({
  Account: '',
  ChannelId: '',
  PackageId: undefined as number | string | undefined,
  Page: 1,
  PageSize: 20,
});
const whitelistColumns = [
  { dataIndex: 'Account', key: 'Account', title: '游戏账号' },
  { dataIndex: 'PackageName', key: 'PackageName', title: '产品名称' },
  { dataIndex: 'ChannelId', key: 'ChannelId', title: '渠道号' },
  { dataIndex: 'Creator', key: 'Creator', title: '操作人' },
  { dataIndex: 'CreateTimestamp', key: 'CreateTimestamp', title: '创建时间' },
  { key: 'actions', title: '操作', width: 90 },
];
const productOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '' && item.PackageId != null)
    .map((item) => ({
      label: String(item.PackageName),
      value: item.PackageId as number | string,
    })),
);

async function loadWhitelist() {
  whitelistLoading.value = true;
  try {
    const result = await fetchVirtualWithdrawWhitelistApi({
      ...whitelistQuery,
      PackageId: whitelistQuery.PackageId ?? '',
      WhiteType: rule.WhiteType,
    });
    whitelistRows.value = result.Items;
    whitelistTotal.value = Number(
      result.Pagination.MaxCount || whitelistRows.value.length,
    );
  } finally {
    whitelistLoading.value = false;
  }
}

function openWhitelist() {
  whitelistOpen.value = true;
  void loadWhitelist();
}

const whitelistAddOpen = ref(false);
const whitelistAddSubmitting = ref(false);
const whitelistForm = reactive<{
  Account: string;
  PackageId?: number | string;
}>({ Account: '' });

function openWhitelistAdd() {
  whitelistForm.Account = '';
  whitelistForm.PackageId = undefined;
  whitelistAddOpen.value = true;
}

async function addWhitelist() {
  if (!whitelistForm.Account.trim() || whitelistForm.PackageId === undefined) {
    message.warning('请输入游戏账号并选择产品');
    return;
  }
  whitelistAddSubmitting.value = true;
  try {
    await addVirtualWithdrawWhitelistApi({
      ...whitelistForm,
      Account: whitelistForm.Account.trim(),
      WhiteType: rule.WhiteType,
    });
    message.success('添加成功');
    whitelistAddOpen.value = false;
    await loadWhitelist();
  } finally {
    whitelistAddSubmitting.value = false;
  }
}

const batchOpen = ref(false);
const batchChecking = ref(false);
const batchSubmitting = ref(false);
const batchText = ref('');
const batchFileInput = ref<HTMLInputElement | null>(null);
const batchRows = ref<Record<string, unknown>[]>([]);
const batchSelectedIds = ref<Array<number | string>>([]);
const batchColumns = [
  { dataIndex: 'Account', key: 'Account', title: '游戏账号' },
  { dataIndex: 'PackageName', key: 'PackageName', title: '产品名称' },
  { dataIndex: 'PlayerId', key: 'PlayerId', title: '玩家 ID' },
];
const batchRowSelection = computed(() => ({
  getCheckboxProps: (record: Record<string, unknown>) => ({
    disabled: !record.PlayerId || Number(record.PlayerId) === 0,
  }),
  onChange: (keys: Array<number | string>) => {
    batchSelectedIds.value = keys;
  },
  selectedRowKeys: batchSelectedIds.value,
}));

function openBatch() {
  batchText.value = '';
  batchRows.value = [];
  batchSelectedIds.value = [];
  batchOpen.value = true;
}

function downloadBatchTemplate() {
  const content = '\uFEFF游戏账号,产品名称\r\n';
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '虚拟币提现白名单模板.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function onBatchFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size / 1024 / 1024 >= 1) {
    message.warning('文件大小不能超过 1M');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '').replace(/^\uFEFF/, '');
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const body = /游戏账号|产品名称|account|package/i.test(lines[0] || '')
      ? lines.slice(1)
      : lines;
    batchText.value = body.join('\n');
    batchRows.value = [];
    batchSelectedIds.value = [];
    message.success(`已读取 ${body.length} 行，请检查匹配结果`);
  };
  reader.readAsText(file);
  input.value = '';
}

function parseBatchText() {
  const accounts: string[] = [];
  const packages: string[] = [];
  for (const line of batchText.value.split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized) continue;
    const [account, packageName] = normalized
      .split(/[,，\t]/)
      .map((part) => part.trim());
    if (!account || !packageName) {
      message.warning(`格式错误：${line}（应为 游戏账号,产品名称）`);
      return null;
    }
    accounts.push(account.toLowerCase().replaceAll(/\s/g, ''));
    packages.push(packageName);
  }
  if (!accounts.length) {
    message.warning('请粘贴数据或导入 CSV 文件');
    return null;
  }
  return { accounts, packages };
}

async function checkBatch() {
  const parsed = parseBatchText();
  if (!parsed) return;
  batchChecking.value = true;
  try {
    const result = await checkVirtualWithdrawWhitelistApi({
      Account: parsed.accounts.join(','),
      PackageName: parsed.packages.join(','),
      WhiteType: rule.WhiteType,
    });
    batchRows.value = Array.isArray(result)
      ? result
      : (((result as unknown as { Items?: Record<string, unknown>[] }).Items ||
          []) as Record<string, unknown>[]);
    batchSelectedIds.value = batchRows.value
      .filter((row) => row.PlayerId && Number(row.PlayerId) !== 0)
      .map((row) => row.PlayerId as number | string);
    if (!batchRows.value.length) {
      message.warning('未匹配到可确认的数据');
    }
  } finally {
    batchChecking.value = false;
  }
}

async function submitBatch() {
  if (!batchSelectedIds.value.length) {
    message.warning('请选择至少一名有效玩家');
    return;
  }
  batchSubmitting.value = true;
  try {
    await multiAddVirtualWithdrawWhitelistApi({
      PlayerIds: batchSelectedIds.value.join(','),
      WhiteType: rule.WhiteType,
    });
    message.success(`批量添加成功，共 ${batchSelectedIds.value.length} 条`);
    batchOpen.value = false;
    await loadWhitelist();
  } finally {
    batchSubmitting.value = false;
  }
}

function removeWhitelist(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确认删除白名单账号「${row.Account || ''}」？`,
    okType: 'danger',
    title: '删除',
    onOk: async () => {
      await deleteVirtualWithdrawWhitelistApi({
        PlayerIds: String(row.PlayerId),
        WhiteType: rule.WhiteType,
      });
      message.success('删除成功');
      await loadWhitelist();
    },
  });
}

const quotaOpen = ref(false);
const quotaLoading = ref(false);
const quotaRows = ref<Record<string, unknown>[]>([]);
const levels = ref<Record<string, unknown>[]>([]);
const quotaColumns = [
  { key: 'levels', title: '玩家等级' },
  { dataIndex: 'Quota', key: 'Quota', title: '提现额度' },
  { key: 'actions', title: '操作', width: 140 },
];
const quotaEditOpen = ref(false);
const quotaSubmitting = ref(false);
const quotaForm = reactive({
  Id: -1 as number | string,
  PlayerLevelList: [] as string[],
  Quota: undefined as number | undefined,
});

async function loadQuota() {
  quotaLoading.value = true;
  try {
    const [quotaResult, levelResult] = await Promise.all([
      fetchPlayerQuotaListApi(),
      fetchPlayerLevelsForWithdrawApi(),
    ]);
    quotaRows.value = Array.isArray(quotaResult)
      ? quotaResult
      : (((quotaResult as unknown as { Items?: Record<string, unknown>[] })
          .Items || []) as Record<string, unknown>[]);
    levels.value = levelResult.Items;
  } finally {
    quotaLoading.value = false;
  }
}

function levelNames(value: unknown) {
  if (!value || String(value) === '0') return '默认';
  const ids = String(value).split(',');
  return levels.value
    .filter((item) => ids.includes(String(item.Id)))
    .map((item) => String(item.LevelName || item.Name || item.Id))
    .join('、');
}

const usedLevelIds = computed(() =>
  quotaRows.value.flatMap((row) =>
    String(row.PlayerLevelList || '')
      .split(',')
      .filter(
        (id) => id && id !== '0' && String(row.Id) !== String(quotaForm.Id),
      ),
  ),
);
const levelOptions = computed(() =>
  levels.value.map((item) => ({
    disabled: usedLevelIds.value.includes(String(item.Id)),
    label: String(item.LevelName || item.Name || item.Id),
    value: String(item.Id),
  })),
);

function openQuota() {
  quotaOpen.value = true;
  void loadQuota();
}

function editQuota(row?: Record<string, unknown>) {
  quotaForm.Id = row?.Id == null ? -1 : String(row.Id);
  quotaForm.Quota = row?.Quota == null ? undefined : Number(row.Quota);
  quotaForm.PlayerLevelList =
    !row?.PlayerLevelList || String(row.PlayerLevelList) === '0'
      ? []
      : String(row.PlayerLevelList).split(',');
  quotaEditOpen.value = true;
}

async function submitQuota() {
  const isDefault =
    quotaForm.Id !== -1 && quotaForm.PlayerLevelList.length === 0;
  if (
    quotaForm.Quota === undefined ||
    quotaForm.Quota < 1 ||
    (!isDefault && quotaForm.PlayerLevelList.length === 0)
  ) {
    message.warning('请输入正整数额度并选择玩家等级');
    return;
  }
  quotaSubmitting.value = true;
  try {
    await updatePlayerQuotaApi({
      Currency: 2,
      Id: quotaForm.Id,
      PlayerLevelList: isDefault ? '0' : quotaForm.PlayerLevelList.join(','),
      Quota: Math.trunc(quotaForm.Quota),
    });
    message.success(quotaForm.Id === -1 ? '添加成功' : '编辑成功');
    quotaEditOpen.value = false;
    await loadQuota();
  } finally {
    quotaSubmitting.value = false;
  }
}

function removeQuota(row: Record<string, unknown>) {
  Modal.confirm({
    content: '确认删除该提现额度方案？',
    okType: 'danger',
    title: '删除',
    onOk: async () => {
      await deletePlayerQuotaApi(String(row.Id));
      message.success('删除成功');
      await loadQuota();
    },
  });
}

onMounted(loadMain);
</script>

<template>
  <div class="space-y-4">
    <Card :loading="loading" size="small" title="USDT 提现汇率">
      <Form layout="vertical">
        <Form.Item label="汇率方式">
          <Radio.Group v-model:value="rate.UsdtOption">
            <Radio :value="1">实时汇率</Radio>
            <Radio :value="2">关联充值汇率</Radio>
            <Radio :value="3">自定义汇率</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item v-if="rate.UsdtOption === 2" label="高于充值汇率">
          <InputNumber
            v-model:value="rate.UsdtExchangeRate"
            :max="100"
            :min="0"
            :precision="2"
          />
        </Form.Item>
        <Form.Item v-if="rate.UsdtOption === 3" label="自定义汇率">
          <InputNumber
            v-model:value="rate.UsdtRate"
            :max="100"
            :min="0"
            :precision="2"
          />
        </Form.Item>
        <Button :loading="saving === 'rate'" type="primary" @click="saveRate">
          保存汇率
        </Button>
      </Form>
    </Card>

    <Card :loading="loading" size="small" title="虚拟货币提现限制">
      <Form layout="vertical">
        <Form.Item label="生效币种">
          <Checkbox.Group
            v-model:value="rule.CurrencyList"
            :options="currencyOptions"
          />
        </Form.Item>
        <Form.Item label="限制规则">
          <Radio.Group v-model:value="rule.WhiteType">
            <Space direction="vertical">
              <Radio :value="0">绑定银行卡或支付宝并提现成功后可用</Radio>
              <Radio :value="1">无虚拟币充值时隐藏提现通道</Radio>
              <Radio :value="2">无虚拟币提现时显示提示弹窗</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        <Form.Item v-if="rule.WhiteType === 2" label="弹窗提示文本">
          <Input.TextArea
            v-model:value="rule.NoWithdrawCryptoCoinHintText"
            :rows="3"
          />
        </Form.Item>
        <Space wrap>
          <Button :loading="saving === 'rule'" type="primary" @click="saveRule">
            保存限制规则
          </Button>
          <Button
            v-if="rule.WhiteType === 1 || rule.WhiteType === 2"
            @click="openWhitelist"
          >
            白名单设置
          </Button>
          <span>提现额度限制</span>
          <Switch
            :checked="rule.MemberQuotaStatus === 1"
            @change="
              (checked) => {
                rule.MemberQuotaStatus = checked ? 1 : 0;
                saveRule();
              }
            "
          />
          <Button @click="openQuota">额度方案</Button>
        </Space>
      </Form>
    </Card>
  </div>

  <Modal
    v-model:open="whitelistOpen"
    :footer="null"
    title="虚拟币限制白名单"
    width="950px"
  >
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="whitelistQuery.Account"
          allow-clear
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="whitelistQuery.ChannelId"
          allow-clear
          placeholder="请输入渠道号"
        >
          <template #addonBefore>渠道号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">产品</span>
        <Select
          v-model:value="whitelistQuery.PackageId"
          :options="productOptions"
          allow-clear
          placeholder="请选择产品"
        />
      </Space.Compact>
        <div class="query-filter-actions">
          <Button type="primary" @click="loadWhitelist">查询</Button>
      <Button type="primary" @click="openWhitelistAdd">新增白名单</Button>
      <Button @click="openBatch">Excel/批量导入</Button>
        </div>
    </div>
  </div>
    <Table
      :columns="whitelistColumns"
      :data-source="whitelistRows"
      :loading="whitelistLoading"
      :pagination="false"
      :row-key="(row) => String(row.PlayerId ?? row.Id)"
      size="small"
    >
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.key === 'Account'">
          <PlayerAccountLink
            :login-account="String(record.Account || '')"
            :player-id="record.PlayerId as number | string | undefined"
          />
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button danger type="link" @click="removeWhitelist(record)"
            >删除</Button
          >
        </template>
        <template v-else>{{ text }}</template>
      </template>
    </Table>
    <Pagination
      v-if="whitelistTotal > whitelistQuery.PageSize"
      v-model:current="whitelistQuery.Page"
      v-model:page-size="whitelistQuery.PageSize"
      class="mt-3 text-right"
      :total="whitelistTotal"
      @change="loadWhitelist"
    />
  </Modal>

  <Modal
    v-model:open="whitelistAddOpen"
    :confirm-loading="whitelistAddSubmitting"
    title="新增白名单"
    @ok="addWhitelist"
  >
    <Form layout="vertical">
      <Form.Item label="产品" required>
        <Select
          v-model:value="whitelistForm.PackageId"
          :options="productOptions"
        />
      </Form.Item>
      <Form.Item label="游戏账号" required>
        <Input v-model:value="whitelistForm.Account" />
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="batchOpen"
    :confirm-loading="batchSubmitting"
    ok-text="确认批量添加"
    title="Excel/批量导入白名单"
    width="760px"
    @ok="submitBatch"
  >
    <div class="mb-3 flex flex-wrap gap-2">
      <Button @click="downloadBatchTemplate">下载导入模板</Button>
      <Button @click="batchFileInput?.click()">导入 CSV 文件</Button>
      <input
        ref="batchFileInput"
        accept=".csv,.txt,text/csv,text/plain"
        class="hidden"
        type="file"
        @change="onBatchFileChange"
      />
      <Button :loading="batchChecking" type="primary" @click="checkBatch">
        检查并匹配
      </Button>
    </div>
    <div class="mb-2 text-sm text-gray-500">
      可粘贴 Excel 两列内容，或将 Excel 另存为 CSV
      后导入；每行为“游戏账号,产品名称”。
    </div>
    <Input.TextArea
      v-model:value="batchText"
      :rows="6"
      placeholder="示例：&#10;player01,产品A&#10;player02,产品B"
    />
    <Table
      v-if="batchRows.length"
      class="mt-3"
      :columns="batchColumns"
      :data-source="batchRows"
      :pagination="false"
      :row-key="
        (row) => String(row.PlayerId || `${row.Account}-${row.PackageName}`)
      "
      :row-selection="batchRowSelection"
      size="small"
    >
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.key === 'Account'">
          <PlayerAccountLink
            :login-account="String(record.Account || '')"
            :player-id="record.PlayerId as number | string | undefined"
          />
        </template>
        <template v-else>{{ text }}</template>
      </template>
    </Table>
    <div v-if="batchRows.length" class="mt-2 text-sm text-gray-500">
      已匹配 {{ batchRows.length }} 条，已选择
      {{ batchSelectedIds.length }} 条； 玩家 ID 为 0 的记录不可提交。
    </div>
  </Modal>

  <Modal
    v-model:open="quotaOpen"
    :footer="null"
    title="提现额度方案"
    width="800px"
  >
    <Button class="mb-3" type="primary" @click="editQuota()">新增方案</Button>
    <Table
      :columns="quotaColumns"
      :data-source="quotaRows"
      :loading="quotaLoading"
      :pagination="false"
      row-key="Id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'levels'">
          {{ levelNames(record.PlayerLevelList) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button type="link" @click="editQuota(record)">编辑</Button>
          <Button
            v-if="String(record.PlayerLevelList || '0') !== '0'"
            danger
            type="link"
            @click="removeQuota(record)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
  </Modal>

  <Modal
    v-model:open="quotaEditOpen"
    :confirm-loading="quotaSubmitting"
    title="额度方案"
    @ok="submitQuota"
  >
    <Form layout="vertical">
      <Form.Item label="提现额度" required>
        <InputNumber
          v-model:value="quotaForm.Quota"
          :min="1"
          :precision="0"
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="玩家等级" required>
        <Select
          v-model:value="quotaForm.PlayerLevelList"
          :options="levelOptions"
          mode="multiple"
          placeholder="默认方案无需选择等级"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

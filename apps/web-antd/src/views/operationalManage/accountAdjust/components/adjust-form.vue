<script lang="ts" setup>
import { computed, ref } from 'vue';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Result,
  Select,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import {
  batchCreateAccountAdjustApi,
  createAccountAdjustApi,
} from '#/api/operationManage/account-adjust';
import {
  fetchPlayerBasicInfoApi,
  queryPlayerByAccountApi,
  queryPlayerByExcelApi,
} from '#/api/operationManage/player';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { createRequestHash } from '#/utils/crypto';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatPlayerStatus } from '#/utils/player-status';

defineOptions({ name: 'AdjustFormPanel' });

interface BatchRow {
  AmountYuan: number;
  LoginAccount: string;
  PackageName: string;
  PlayerId: number | string;
  valid: boolean;
}

interface FailItem {
  Amount?: number;
  LoginAccount?: string;
  Msg?: string;
  PackageName?: string;
}

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewPage = computed(() => checkPermission(10094));
const canSingle = computed(() => checkPermission(10108));
const canBatch = computed(() => checkPermission(10109));

const saveType = ref<'batch' | 'single'>(canSingle.value ? 'single' : 'batch');
const submitting = ref(false);
const lookupLoading = ref(false);

const loginAccount = ref('');
const packageName = ref(
  packageOptions.value.find((item) => item.PackageName)?.PackageName || '',
);
const playerId = ref<number | string>('');
const playerGold = ref<number | string>('');
const playerStatus = ref<number | string>('');

const handleType = ref<number | string>('');
const reason = ref<number | string>('');
const amount = ref<number | undefined>();
const handleDesc = ref('');
const waterType = ref(1);
const water = ref<number>(0);
const waterAmount = ref<number | undefined>();

const batchText = ref('');
const batchFileInput = ref<HTMLInputElement | null>(null);
const batchRows = ref<BatchRow[]>([]);
const batchResultOpen = ref(false);
const batchResult = ref<{
  Count: number;
  FailCount: number;
  FailItems: FailItem[];
  SuccessCount: number;
} | null>(null);

const handleTypeOptions = [
  { label: '上分', value: 1 },
  { label: '下分', value: 2 },
];

const reasonOptions = [
  { label: '系统调整', value: 1 },
  { label: '输赢调整', value: 2 },
  { label: '充值调整', value: 111 },
];

const packageSelectOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageName)
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageName,
    })),
);

const validBatchCount = computed(
  () => batchRows.value.filter((row) => row.valid).length,
);

function resetPlayerInfo() {
  playerId.value = '';
  playerGold.value = '';
  playerStatus.value = '';
}

function onHandleTypeChange() {
  water.value = 0;
  waterAmount.value = undefined;
  waterType.value = 1;
}

function resetWaterFields() {
  if (waterType.value === 1) {
    waterAmount.value = undefined;
  } else {
    water.value = 0;
  }
}

async function lookupPlayer() {
  if (!loginAccount.value || !packageName.value) {
    return;
  }
  const packageId = packageOptions.value.find(
    (item) => item.PackageName === packageName.value,
  )?.PackageId;
  if (!packageId) {
    message.warning('请选择有效产品');
    return;
  }

  lookupLoading.value = true;
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: loginAccount.value
        .trim()
        .toLowerCase()
        .replaceAll(/\s/g, ''),
      PackageId: packageId,
    });
    const first = result?.Items?.[0];
    if (!first?.PlayerId) {
      resetPlayerInfo();
      message.error('未找到对应玩家');
      return;
    }
    playerId.value = first.PlayerId;
    const info = await fetchPlayerBasicInfoApi(first.PlayerId);
    playerGold.value = info?.Gold ?? '';
    playerStatus.value = info?.Status ?? '';
  } finally {
    lookupLoading.value = false;
  }
}

function downloadBatchTemplate() {
  const content = `\uFEFF游戏账号,产品名称,调整金额\nplayer01,乐赢网,100\n`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '账户调整批量模板.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function onBatchFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }
  if (file.size / 1024 / 1024 >= 1) {
    message.warning('文件大小不能超过 1M');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || '');
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) {
      message.warning('文件为空');
      return;
    }
    const first = lines[0] || '';
    const body = /游戏账号|产品名称|调整金额/i.test(first)
      ? lines.slice(1)
      : lines;
    batchText.value = body.join('\n');
    message.success(`已读取 ${body.length} 行，请预览匹配`);
  };
  reader.readAsText(file);
  input.value = '';
}

function parseBatchLines() {
  const lines = batchText.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const accounts: string[] = [];
  const packages: string[] = [];
  const amounts: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[,，\t]/).map((part) => part.trim());
    if (parts.length < 3) {
      message.warning(`格式错误：${line}（需要 账号,产品名称,金额）`);
      return null;
    }
    const [account, pkg, amt] = parts;
    if (!account || !pkg || !amt || Number(amt) <= 0) {
      message.warning(`数据无效：${line}`);
      return null;
    }
    accounts.push(account.toLowerCase().replaceAll(/\s/g, ''));
    packages.push(pkg);
    amounts.push(amt);
  }
  if (!accounts.length) {
    message.warning('请先导入或粘贴批量数据');
    return null;
  }
  return { accounts, amounts, packages };
}

async function previewBatch() {
  const parsed = parseBatchLines();
  if (!parsed) {
    return;
  }
  lookupLoading.value = true;
  batchRows.value = [];
  try {
    const result = await queryPlayerByExcelApi({
      LoginAccount: parsed.accounts.join(','),
      MultiAmount: parsed.amounts.join(','),
      PackageName: parsed.packages.join(','),
    });
    const items = (result.Items || []) as unknown as Record<string, unknown>[];
    batchRows.value = items.map((item, index) => {
      const pid = Number(item.PlayerId || 0);
      return {
        AmountYuan: Number(parsed.amounts[index] || 0),
        LoginAccount: String(item.LoginAccount || parsed.accounts[index]),
        PackageName: String(item.PackageName || parsed.packages[index]),
        PlayerId: pid,
        valid: pid !== 0,
      };
    });
    if (!validBatchCount.value) {
      message.warning('没有可调整的有效玩家');
    } else {
      message.success(`匹配到 ${validBatchCount.value} 名有效玩家`);
    }
  } finally {
    lookupLoading.value = false;
  }
}

function buildSharedPayload() {
  return {
    HandleDesc: handleDesc.value,
    HandleType: handleType.value,
    Hash: createRequestHash(),
    Reason: reason.value,
    Water:
      waterType.value === 1 ? Math.round(Number(water.value || 0) * 100) : 0,
    WaterAmount:
      waterType.value === 2
        ? Math.round(Number(waterAmount.value || 0) * 100)
        : 0,
    WaterType: waterType.value,
  };
}

function validateSharedFields() {
  if (!handleType.value || !reason.value) {
    message.warning('请选择调整方式和调整类型');
    return false;
  }
  if (!handleDesc.value.trim()) {
    message.warning('请填写备注');
    return false;
  }
  if (Number(handleType.value) === 1 || Number(handleType.value) === 2) {
    if (waterType.value === 1) {
      if (
        water.value === undefined ||
        water.value === null ||
        water.value < 0
      ) {
        message.warning('请输入流水倍数');
        return false;
      }
      if (!/^(0|[1-9]\d*)$/.test(String(water.value))) {
        message.warning('流水倍数须为非负整数');
        return false;
      }
    } else if (!waterAmount.value || waterAmount.value <= 0) {
      message.warning('请输入流水金额');
      return false;
    }
  }
  return true;
}

function resetFormFields() {
  handleType.value = '';
  reason.value = '';
  amount.value = undefined;
  handleDesc.value = '';
  waterType.value = 1;
  water.value = 0;
  waterAmount.value = undefined;
}

function handleReset() {
  if (saveType.value === 'single') {
    loginAccount.value = '';
    resetPlayerInfo();
  } else {
    batchText.value = '';
    batchRows.value = [];
    batchResult.value = null;
  }
  resetFormFields();
}

async function submitSingle() {
  if (!validateSharedFields()) {
    return;
  }
  if (!playerId.value) {
    message.warning('请先查询玩家信息');
    return;
  }
  if (!amount.value || amount.value <= 0) {
    message.warning('请填写调整金额');
    return;
  }
  if (Number(handleType.value) === 1 && Number(amount.value) > 100_000) {
    message.warning('上分金额不能超过 100000');
    return;
  }

  submitting.value = true;
  try {
    await createAccountAdjustApi({
      ...buildSharedPayload(),
      Amount: Math.round(Number(amount.value) * 100),
      MultiAmount: '',
      PlayerId: playerId.value,
      PlayersId: '',
    });
    message.success('提交成功，等待审核');
    amount.value = undefined;
    handleDesc.value = '';
  } finally {
    submitting.value = false;
  }
}

async function submitBatch() {
  if (!validateSharedFields()) {
    return;
  }
  if (!validBatchCount.value) {
    message.warning('请先预览并确认有效玩家');
    return;
  }

  const validRows = batchRows.value.filter((row) => row.valid);
  const multiAmount = validRows.map((row) => ({
    Amount: Math.round(row.AmountYuan * 100),
    LoginAccount: row.LoginAccount,
    PackageName: row.PackageName,
    PlayerId: row.PlayerId,
  }));
  const playerIds = [...new Set(validRows.map((row) => String(row.PlayerId)))];

  submitting.value = true;
  try {
    const result = (await batchCreateAccountAdjustApi({
      ...buildSharedPayload(),
      Amount: '',
      MultiAmount: JSON.stringify(multiAmount),
      PlayerId: '',
      PlayersId: playerIds.join(','),
    })) as Record<string, unknown>;

    const failItems = ((result?.FailItems as FailItem[]) || []).map((item) => {
      let msg = item.Msg || '';
      try {
        if (msg && msg.startsWith('{')) {
          msg = String((JSON.parse(msg) as { Msg?: string }).Msg || msg);
        }
      } catch {
        // keep raw
      }
      return {
        ...item,
        Amount: item.Amount ? Number(item.Amount) / 100 : 0,
        Msg: msg,
      };
    });

    batchResult.value = {
      Count: Number(result?.Count ?? validRows.length),
      FailCount: Number(result?.FailCount ?? failItems.length),
      FailItems: failItems,
      SuccessCount: Number(result?.SuccessCount ?? 0),
    };
    batchResultOpen.value = true;
    message.success('批量调整已提交');
    batchText.value = '';
    batchRows.value = [];
    handleDesc.value = '';
  } finally {
    submitting.value = false;
  }
}

function handleSubmit() {
  Modal.confirm({
    content:
      saveType.value === 'single'
        ? `确认对玩家 ${playerId.value} 提交账户调整？金额：${amount.value ?? '-'} 元`
        : `确认提交批量账户调整？有效 ${validBatchCount.value} 人`,
    title: '确认提交',
    onOk: async () => {
      if (saveType.value === 'single') {
        await submitSingle();
      } else {
        await submitBatch();
      }
    },
  });
}

function exportFailItems() {
  const rows = batchResult.value?.FailItems || [];
  if (!rows.length) {
    message.warning('暂无失败数据可导出');
    return;
  }
  exportRowsToCsv(
    rows,
    [
      { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
      { header: '产品名称', value: (row) => row.PackageName || '-' },
      { header: '调整金额', value: (row) => row.Amount ?? '-' },
      { header: '失败原因', value: (row) => row.Msg || '-' },
    ],
    `账户调整导入失败_${Date.now()}`,
  );
}
</script>

<template>
  <div v-if="canViewPage">
    <div class="mb-3">
      <Radio.Group v-model:value="saveType" button-style="solid">
        <Radio.Button v-if="canSingle" value="single">单人调整</Radio.Button>
        <Radio.Button v-if="canBatch" value="batch">批量调整</Radio.Button>
      </Radio.Group>
    </div>

    <Card class="mb-4" title="玩家信息">
      <template v-if="saveType === 'single'">
        <div class="mb-4 flex flex-wrap items-end gap-2">
          <Input
            v-model:value="loginAccount"
            allow-clear
            placeholder="请输入"
            style="width: 260px"
            @blur="lookupPlayer"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
          <Select
            v-model:value="packageName"
            allow-clear
            class="w-48"
            :options="packageSelectOptions"
            placeholder="请选择产品"
            show-search
            @change="lookupPlayer"
          />
          <Button :loading="lookupLoading" type="primary" @click="lookupPlayer">
            查询玩家
          </Button>
        </div>
        <div
          v-if="playerId"
          class="rounded border bg-gray-50 px-3 py-2 text-sm"
        >
          <div>玩家 ID：{{ playerId }}</div>
          <div>账户余额：{{ formatAmountFromCent(playerGold) }}</div>
          <div>玩家状态：{{ formatPlayerStatus(playerStatus) }}</div>
        </div>
      </template>

      <template v-else>
        <div class="mb-3 flex flex-wrap gap-2">
          <Button @click="downloadBatchTemplate">下载模板</Button>
          <Button @click="batchFileInput?.click()">导入CSV</Button>
          <input
            ref="batchFileInput"
            accept=".csv,text/csv,.xlsx,.xls"
            class="hidden"
            type="file"
            @change="onBatchFileChange"
          />
          <Button :loading="lookupLoading" type="primary" @click="previewBatch">
            预览匹配
          </Button>
        </div>
        <div class="mb-2 text-sm text-gray-500">
          每行一条：游戏账号,产品名称,调整金额（元）；也可粘贴
        </div>
        <Input.TextArea
          v-model:value="batchText"
          :rows="6"
          placeholder="示例：&#10;player01,乐赢网,100&#10;player02,乐赢网,50"
        />
        <Table
          v-if="batchRows.length"
          class="mt-3"
          size="small"
          :pagination="false"
          :data-source="batchRows"
          :row-key="(row: BatchRow) => `${row.LoginAccount}-${row.PackageName}`"
          :columns="[
            { title: '游戏账号', dataIndex: 'LoginAccount' },
            { title: '产品名称', dataIndex: 'PackageName' },
            {
              title: '玩家ID',
              dataIndex: 'PlayerId',
              customRender: ({ text }: { text: number | string }) =>
                Number(text) === 0 ? '无' : text,
            },
            { title: '调整金额(元)', dataIndex: 'AmountYuan' },
            {
              title: '状态',
              dataIndex: 'valid',
              customRender: ({ text }: { text: boolean }) =>
                text ? '有效' : '无效',
            },
          ]"
        />
      </template>
    </Card>

    <Card title="账号调整">
      <Form layout="vertical" class="max-w-3xl">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Form.Item label="调整方式" required>
            <Select
              v-model:value="handleType"
              :options="handleTypeOptions"
              placeholder="请选择"
              @change="onHandleTypeChange"
            />
          </Form.Item>
          <Form.Item label="调整类型" required>
            <Select
              v-model:value="reason"
              :options="reasonOptions"
              placeholder="请选择"
            />
          </Form.Item>
          <Form.Item v-if="saveType === 'single'" label="调整金额(元)" required>
            <InputNumber
              v-model:value="amount"
              :min="0.01"
              class="w-full"
              :precision="2"
              placeholder="请输入调整金额"
            />
          </Form.Item>
          <Form.Item label="备注" required>
            <Input v-model:value="handleDesc" placeholder="请输入备注" />
          </Form.Item>
        </div>

        <template v-if="handleType === 1 || handleType === 2">
          <Form.Item label="流水要求类型">
            <Radio.Group v-model:value="waterType" @change="resetWaterFields">
              <Radio :value="1">
                {{ handleType === 1 ? '增加倍数' : '减少倍数' }}
              </Radio>
              <Radio :value="2">
                {{ handleType === 1 ? '增加金额' : '减少金额' }}
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item v-if="waterType === 1" label="流水倍数" required>
            <InputNumber
              v-model:value="water"
              :min="0"
              class="w-60"
              placeholder="请输入流水倍数"
            />
          </Form.Item>
          <Form.Item v-else label="流水金额(元)" required>
            <InputNumber
              v-model:value="waterAmount"
              :min="0.01"
              class="w-60"
              :precision="2"
              placeholder="请输入流水金额"
            />
          </Form.Item>
        </template>

        <Space>
          <Button :loading="submitting" type="primary" @click="handleSubmit">
            申请调整
          </Button>
          <Button @click="handleReset">重置</Button>
        </Space>
      </Form>
    </Card>

    <Modal
      v-model:open="batchResultOpen"
      title="导入结果"
      :footer="null"
      width="720px"
    >
      <div v-if="batchResult" class="mb-3 flex flex-wrap gap-4 text-sm">
        <span>导入总数：{{ batchResult.Count }}</span>
        <span>成功：{{ batchResult.SuccessCount }}</span>
        <span>失败：{{ batchResult.FailCount }}</span>
      </div>
      <Table
        size="small"
        :pagination="false"
        :data-source="batchResult?.FailItems || []"
        :row-key="(row) => String(row.LoginAccount ?? row.PlayerId ?? JSON.stringify(row))"
        :columns="[
          { title: '游戏账号', dataIndex: 'LoginAccount' },
          { title: '产品名称', dataIndex: 'PackageName' },
          { title: '调整金额', dataIndex: 'Amount' },
          { title: '失败原因', dataIndex: 'Msg' },
        ]"
      />
      <div class="mt-4 flex justify-end gap-2">
        <Button @click="exportFailItems">导出失败</Button>
        <Button type="primary" @click="batchResultOpen = false">关闭</Button>
      </div>
    </Modal>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10094 才能进行账户调整"
    title="无权限"
  />
</template>

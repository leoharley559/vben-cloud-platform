<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Table,
  Tabs,
  message,
} from 'ant-design-vue';

import {
  batchCreatePlayerGoldHandleApi,
  createPlayerGoldHandleApi,
  getPlayerGoldRedTitleApi,
} from '#/api/operationManage/player-gold-handle';
import {
  queryPlayerByAccountApi,
  queryPlayerByExcelApi,
} from '#/api/operationManage/player';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'GoldGrantPanel' });

interface BatchRow {
  AmountYuan: number;
  DataFlag?: number;
  LoginAccount: string;
  PackageName: string;
  PlayerId: number | string;
  valid: boolean;
}

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canSingle = computed(() => checkPermission(10088));
const canBatch = computed(() => checkPermission(10089));
const canView = computed(() => canSingle.value || canBatch.value);

const grantMode = ref<'single' | 'batch'>(canSingle.value ? 'single' : 'batch');

const querying = ref(false);
const submitting = ref(false);
const playerReady = ref(false);
const playerInfo = reactive({
  DataFlag: null as null | number,
  Gold: 0,
  LoginAccount: '',
  PackageName: '',
  PlayerId: '' as number | string,
});

const queryForm = reactive({
  LoginAccount: '',
  PackageName: '',
});

const form = reactive({
  Amount: undefined as number | undefined,
  HandleDesc: '',
  /** 对齐旧站：默认空，提交前必选 */
  Reason: undefined as number | undefined,
  /** 1=自定义标题 2=活动标题（旧站 redType） */
  RedType: 1 as 1 | 2,
  Title: '',
  Water: undefined as number | undefined,
  WaterAmount: undefined as number | undefined,
  WaterType: 1 as 1 | 2,
});

const batchText = ref('');
const batchFileInput = ref<HTMLInputElement | null>(null);
const batchRows = ref<BatchRow[]>([]);
const batchResult = ref<{
  Count?: number;
  FailCount?: number;
  FailItems?: Array<{ Amount?: number; LoginAccount?: string; Msg?: string }>;
  SuccessCount?: number;
} | null>(null);

const redTitles = ref<string[]>([]);

const reasonOptions = [
  { label: '平台红利', value: 3 },
  { label: 'VIP升级红利', value: 4 },
  { label: '每月红包', value: 5 },
  { label: '生日礼金', value: 6 },
  { label: '代理红利', value: 7 },
  { label: '推广红利', value: 8 },
  { label: '存款优惠', value: 9 },
  { label: '活动红利', value: 10 },
  { label: '负值清零', value: 11 },
  { label: '推荐红利', value: 12 },
];

const packageSelectOptions = computed(() =>
  packageOptions.value
    .filter((item) => item.PackageId !== '')
    .map((item) => ({
      label: item.PackageName,
      value: item.PackageName,
    })),
);

const validBatchCount = computed(
  () => batchRows.value.filter((row) => row.valid).length,
);

async function loadRedTitles() {
  try {
    const data = await getPlayerGoldRedTitleApi();
    const items = Array.isArray(data)
      ? data
      : (data as { Items?: unknown[] })?.Items || [];
    redTitles.value = items.map((item) => String(item)).filter(Boolean);
    if (form.RedType === 2 && redTitles.value[0]) {
      form.Title = redTitles.value[0];
    }
  } catch {
    redTitles.value = [];
  }
}

function onRedTypeChange() {
  if (form.RedType === 2) {
    form.Title = redTitles.value[0] || '';
    if (!redTitles.value.length) {
      void loadRedTitles();
    }
  } else {
    form.Title = '';
  }
}

function downloadBatchTemplate() {
  const content = `\uFEFF游戏账号,产品名称,存入金额\nplayer01,乐赢网,100\n`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '批量红利发放模板.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function onBatchFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
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
    // 跳过表头
    const first = lines[0] || '';
    const body = /游戏账号|gameAcc|账号/i.test(first) ? lines.slice(1) : lines;
    batchText.value = body.join('\n');
    message.success(`已读取 ${body.length} 行，请预览匹配`);
  };
  reader.readAsText(file);
  input.value = '';
}

function validateWater() {
  if (form.WaterType === 1) {
    if (form.Water === undefined || form.Water === null || form.Water < 0) {
      message.warning('请输入流水倍数');
      return false;
    }
    // 对齐旧站：流水倍数仅允许整数
    if (!Number.isInteger(Number(form.Water))) {
      message.warning('流水倍数须为整数');
      return false;
    }
  }
  if (form.WaterType === 2 && (!form.WaterAmount || form.WaterAmount <= 0)) {
    message.warning('请输入流水金额');
    return false;
  }
  return true;
}

function parseFailMsg(raw?: string) {
  if (!raw) {
    return '-';
  }
  try {
    const parsed = JSON.parse(raw) as { Msg?: string };
    return parsed?.Msg || raw;
  } catch {
    return raw;
  }
}

function buildWaterPayload() {
  return {
    Water: form.WaterType === 1 ? Math.round((form.Water || 0) * 100) : 0,
    WaterAmount:
      form.WaterType === 2 ? Math.round((form.WaterAmount || 0) * 100) : 0,
    WaterType: form.WaterType,
  };
}

async function queryPlayer() {
  const account = queryForm.LoginAccount.toLowerCase().replace(/\s/g, '');
  queryForm.LoginAccount = account;
  if (!account || !queryForm.PackageName) {
    message.warning('请填写游戏账号与产品包');
    return;
  }
  querying.value = true;
  playerReady.value = false;
  try {
    const result = await queryPlayerByAccountApi({
      LoginAccount: account,
      PackageName: queryForm.PackageName,
    });
    const item = result.Items?.[0] as Record<string, unknown> | undefined;
    const playerId = item?.PlayerId;
    if (!playerId || Number(playerId) === 0) {
      message.error('未匹配到有效玩家');
      return;
    }
    playerInfo.PlayerId = playerId as number | string;
    playerInfo.LoginAccount = String(
      item?.LoginAccount || queryForm.LoginAccount,
    );
    playerInfo.PackageName = String(item?.PackageName || queryForm.PackageName);
    playerInfo.Gold = Number(item?.Gold || 0);
    playerInfo.DataFlag = Number(item?.DataFlag ?? 0);
    playerReady.value = true;
    void loadRedTitles();
  } finally {
    querying.value = false;
  }
}

function resetSingle() {
  playerReady.value = false;
  playerInfo.PlayerId = '';
  playerInfo.Gold = 0;
  playerInfo.DataFlag = null;
  form.Amount = undefined;
}

async function submitGrant() {
  if (!playerReady.value || !playerInfo.PlayerId) {
    message.warning('请先查询玩家');
    return;
  }
  if (Number(playerInfo.DataFlag) === 1) {
    message.error('测试账号不可操作');
    return;
  }
  if (!form.Amount || form.Amount <= 0) {
    message.warning('请输入存入金额');
    return;
  }
  if (form.Reason === undefined || form.Reason === null) {
    message.warning('请选择红利类型');
    return;
  }
  if (form.Amount > 100_000) {
    message.warning('金额最大不能超过十万');
    return;
  }
  if (!validateWater()) {
    return;
  }

  Modal.confirm({
    content: `确认为玩家 ${playerInfo.PlayerId} 存入 ${form.Amount} 元？`,
    onOk: async () => {
      submitting.value = true;
      try {
        await createPlayerGoldHandleApi({
          Amount: Math.round(form.Amount! * 100),
          HandleDesc: form.HandleDesc,
          HandleType: 1,
          Hash: createRequestHash(),
          Mail: '',
          MultiAmount: '',
          PlayerId: String(playerInfo.PlayerId),
          Reason: form.Reason,
          Title: form.Title,
          ...buildWaterPayload(),
        });
        message.success('发放成功');
        resetSingle();
      } finally {
        submitting.value = false;
      }
    },
    title: '确认发放',
  });
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
      message.warning(`格式错误：${line}（需要 账号,产品包,金额）`);
      return null;
    }
    const [account, pkg, amount] = parts;
    if (!account || !pkg || !amount || Number(amount) <= 0) {
      message.warning(`数据无效：${line}`);
      return null;
    }
    accounts.push(account);
    packages.push(pkg);
    amounts.push(amount);
  }
  if (!accounts.length) {
    message.warning('请先粘贴批量数据');
    return null;
  }
  return { accounts, amounts, packages };
}

async function previewBatch() {
  const parsed = parseBatchLines();
  if (!parsed) {
    return;
  }
  querying.value = true;
  batchRows.value = [];
  batchResult.value = null;
  try {
    const result = await queryPlayerByExcelApi({
      LoginAccount: parsed.accounts.join(','),
      MultiAmount: parsed.amounts.join(','),
      PackageName: parsed.packages.join(','),
    });
    const items = (result.Items || []) as unknown as Record<string, unknown>[];
    batchRows.value = items.map((item, index) => {
      const playerId = (item.PlayerId as number | string) || 0;
      const dataFlag = Number(item.DataFlag ?? 0);
      const amountYuan = Number(parsed.amounts[index] || 0);
      return {
        AmountYuan: amountYuan,
        DataFlag: dataFlag,
        LoginAccount: String(item.LoginAccount || parsed.accounts[index]),
        PackageName: String(item.PackageName || parsed.packages[index]),
        PlayerId: playerId,
        valid: Number(playerId) !== 0 && dataFlag !== 1,
      };
    });
    if (!validBatchCount.value) {
      message.warning('没有可发放的有效玩家');
    } else {
      message.success(`匹配到 ${validBatchCount.value} 名有效玩家`);
    }
    void loadRedTitles();
  } finally {
    querying.value = false;
  }
}

async function submitBatch() {
  if (!validBatchCount.value) {
    message.warning('请先预览并确认有效玩家');
    return;
  }
  if (form.Reason === undefined || form.Reason === null) {
    message.warning('请选择红利类型');
    return;
  }
  if (!validateWater()) {
    return;
  }
  const validRows = batchRows.value.filter((row) => row.valid);
  const multiAmount = validRows.map((row) => ({
    Amount: Math.round(row.AmountYuan * 100),
    DataFlag: row.DataFlag,
    LoginAccount: row.LoginAccount,
    PackageName: row.PackageName,
    PlayerId: row.PlayerId,
  }));

  Modal.confirm({
    content: `确认批量发放 ${validRows.length} 人？`,
    onOk: async () => {
      submitting.value = true;
      try {
        const result = (await batchCreatePlayerGoldHandleApi({
          Amount: '',
          HandleDesc: form.HandleDesc,
          HandleType: 1,
          Hash: createRequestHash(),
          Mail: '',
          MultiAmount: JSON.stringify(multiAmount),
          PlayerId: '',
          PlayersId: [...new Set(validRows.map((row) => row.PlayerId))].join(
            ',',
          ),
          Reason: form.Reason,
          Title: form.Title,
          ...buildWaterPayload(),
        })) as Record<string, unknown>;
        const failItems = (
          (result?.FailItems as Array<{
            Amount?: number;
            LoginAccount?: string;
            Msg?: string;
          }>) || []
        ).map((item) => ({
          ...item,
          Msg: parseFailMsg(item.Msg),
        }));
        batchResult.value = {
          Count: Number(result?.Count ?? validRows.length),
          FailCount: Number(result?.FailCount ?? failItems.length),
          FailItems: failItems,
          SuccessCount: Number(result?.SuccessCount ?? validRows.length),
        };
        message.success('批量发放完成');
      } finally {
        submitting.value = false;
      }
    },
    title: '确认批量发放',
  });
}

void loadRedTitles();
</script>

<template>
  <div v-if="canView" class="max-w-4xl space-y-4">
    <div class="text-xs text-gray-400">
      金额单位为元，提交时按分换算。批量格式：每行
      <code>游戏账号,产品包名,金额</code>
    </div>
    <Tabs v-model:active-key="grantMode" type="line" size="small">
      <Tabs.TabPane v-if="canSingle" key="single" tab="单人发放">
        <div class="pt-2">
          <div class="mb-4 flex flex-wrap items-end gap-2">
            <Input
              v-model:value="queryForm.LoginAccount"
              allow-clear
              placeholder="请输入"
              style="width: 240px"
              @blur="
                () => {
                  if (queryForm.LoginAccount && queryForm.PackageName) {
                    void queryPlayer();
                  }
                }
              "
            >
              <template #addonBefore>游戏账号</template>
            </Input>
            <Select
              v-model:value="queryForm.PackageName"
              allow-clear
              class="w-48"
              :options="packageSelectOptions"
              placeholder="请选择产品"
              show-search
            />
            <Button type="primary" :loading="querying" @click="queryPlayer">
              查询玩家
            </Button>
          </div>
          <div
            v-if="playerReady"
            class="mb-2 rounded border border-dashed px-3 py-2 text-sm text-gray-600"
          >
            玩家ID：{{ playerInfo.PlayerId }} ｜ 账号：{{
              playerInfo.LoginAccount
            }}
            ｜ 余额：{{ formatAmountFromCent(playerInfo.Gold) }}
            <span
              v-if="Number(playerInfo.DataFlag) === 1"
              class="ml-2 text-red-500"
            >
              （测试账号）
            </span>
          </div>
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane v-if="canBatch" key="batch" tab="批量发放">
        <div class="pt-2">
          <div class="mb-3 flex flex-wrap gap-2">
            <Button @click="downloadBatchTemplate">下载模板</Button>
            <Button @click="batchFileInput?.click()">导入CSV</Button>
            <input
              ref="batchFileInput"
              accept=".csv,text/csv"
              class="hidden"
              type="file"
              @change="onBatchFileChange"
            />
          </div>
          <Form layout="vertical">
            <Form.Item label="批量数据（也可粘贴）">
              <Input.TextArea
                v-model:value="batchText"
                :rows="6"
                placeholder="每行：账号,产品包,金额&#10;例如：player01,乐赢网,100"
              />
            </Form.Item>
          </Form>
          <Button class="mb-3" :loading="querying" @click="previewBatch">
            预览匹配
          </Button>
          <Table
            v-if="batchRows.length"
            size="small"
            :pagination="false"
            :data-source="batchRows"
            :row-key="
              (row: BatchRow) => `${row.LoginAccount}-${row.PackageName}`
            "
            :columns="[
              { title: '账号', dataIndex: 'LoginAccount' },
              { title: '产品包', dataIndex: 'PackageName' },
              { title: '玩家ID', dataIndex: 'PlayerId' },
              { title: '金额(元)', dataIndex: 'AmountYuan' },
              {
                title: '状态',
                dataIndex: 'valid',
                customRender: ({ text }: { text: boolean }) =>
                  text ? '有效' : '无效/测试号',
              },
            ]"
          />
          <div v-if="batchResult" class="mt-3 space-y-2 text-sm text-gray-600">
            <div>
              结果：总数 {{ batchResult.Count }} ／ 成功
              {{ batchResult.SuccessCount }} ／ 失败
              {{ batchResult.FailCount }}
            </div>
            <Table
              v-if="batchResult.FailItems?.length"
              size="small"
              :pagination="false"
              :data-source="batchResult.FailItems"
              :row-key="
                (row: { LoginAccount?: string }, index: number) =>
                  `${row.LoginAccount || 'fail'}-${index}`
              "
              :columns="[
                { title: '账号', dataIndex: 'LoginAccount' },
                {
                  title: '金额(元)',
                  dataIndex: 'Amount',
                  customRender: ({ text }: { text: number }) =>
                    formatAmountFromCent(Number(text || 0)),
                },
                { title: '失败原因', dataIndex: 'Msg' },
              ]"
            />
          </div>
        </div>
      </Tabs.TabPane>
    </Tabs>

    <Form layout="vertical" class="max-w-3xl">
      <Form.Item v-if="grantMode === 'single'" label="存入金额（元）" required>
        <InputNumber
          v-model:value="form.Amount"
          :min="0.01"
          :max="100000"
          class="w-60"
          :precision="2"
          placeholder="请输入金额"
        />
      </Form.Item>
      <Form.Item label="红利标题类型">
        <Radio.Group v-model:value="form.RedType" @change="onRedTypeChange">
          <Radio :value="1">自定义</Radio>
          <Radio :value="2">活动标题</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="红利标题">
        <Select
          v-if="form.RedType === 2"
          v-model:value="form.Title"
          class="w-full"
          :options="redTitles.map((item) => ({ label: item, value: item }))"
          placeholder="请选择活动标题"
        />
        <Input
          v-else
          v-model:value="form.Title"
          allow-clear
          placeholder="请输入自定义标题"
        />
      </Form.Item>
      <Form.Item label="存入类型" required>
        <Select
          v-model:value="form.Reason"
          allow-clear
          class="w-full"
          :options="reasonOptions"
          placeholder="请选择"
        />
      </Form.Item>
      <Form.Item label="流水要求类型">
        <Radio.Group v-model:value="form.WaterType">
          <Radio :value="1">倍数</Radio>
          <Radio :value="2">金额</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item v-if="form.WaterType === 1" label="流水倍数" required>
        <InputNumber
          v-model:value="form.Water"
          :min="0"
          class="!w-full"
          :precision="0"
          placeholder="仅支持整数"
        />
      </Form.Item>
      <Form.Item v-else label="流水金额（元）" required>
        <InputNumber
          v-model:value="form.WaterAmount"
          :min="0"
          class="!w-full"
          :precision="2"
        />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea v-model:value="form.HandleDesc" :rows="3" />
      </Form.Item>
      <Button
        v-if="grantMode === 'single'"
        type="primary"
        :disabled="!playerReady"
        :loading="submitting"
        @click="submitGrant"
      >
        确认发放
      </Button>
      <Button
        v-else
        type="primary"
        :disabled="!validBatchCount"
        :loading="submitting"
        @click="submitBatch"
      >
        确认批量发放（{{ validBatchCount }}）
      </Button>
    </Form>
  </div>
  <div v-else class="text-sm text-gray-400">无红利发放权限</div>
</template>

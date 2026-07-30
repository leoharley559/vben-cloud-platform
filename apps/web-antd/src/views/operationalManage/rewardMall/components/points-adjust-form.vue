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
  batchCreateRewardPointAdjustApi,
  createRewardPointAdjustApi,
} from '#/api/operationManage/reward-mall';
import {
  fetchPlayerBasicInfoApi,
  queryPlayerByAccountApi,
  queryPlayerByExcelApi,
} from '#/api/operationManage/player';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { exportRowsToCsv } from '#/utils/export-csv';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';

defineOptions({ name: 'PointsAdjustFormPanel' });

interface BatchRow {
  AmountPoint: number;
  LoginAccount: string;
  PackageName: string;
  PlayerId: number | string;
  valid: boolean;
}

interface FailItem {
  Amount?: number | string;
  LoginAccount?: string;
  Msg?: string;
  PackageName?: string;
}

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canView = computed(() => checkPermission(13335));

const saveType = ref<'batch' | 'single'>('single');
const submitting = ref(false);
const lookupLoading = ref(false);

const loginAccount = ref('');
const packageName = ref('');
const playerId = ref<number | string>('');
const playerPoint = ref<number | string>('');
const playerStatus = ref<number | string>('');

const handleType = ref<number>(1);
const amount = ref<number | undefined>();
const applyRemark = ref('');

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

const validBatchCount = computed(
  () => batchRows.value.filter((row) => row.valid).length,
);

function resetPlayerInfo() {
  playerId.value = '';
  playerPoint.value = '';
  playerStatus.value = '';
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
    playerPoint.value = (info as { Point?: number | string })?.Point ?? '';
    playerStatus.value = info?.Status ?? '';
  } finally {
    lookupLoading.value = false;
  }
}

function downloadBatchTemplate() {
  const content = `\uFEFF游戏账号,产品名称,调整积分\nplayer01,乐赢网,100\n`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '积分调整批量模板.csv';
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
    const body = /游戏账号|产品名称|调整积分/i.test(first)
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
      message.warning(`格式错误：${line}（需要 游戏账号,产品名称,调整积分）`);
      return null;
    }
    const [account, pkg, amt] = parts;
    if (
      !account ||
      !pkg ||
      !amt ||
      !Number.isInteger(Number(amt)) ||
      Number(amt) <= 0
    ) {
      message.warning(`积分须为正整数：${line}`);
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
        AmountPoint: Number(parsed.amounts[index] || 0),
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

async function submitSingle() {
  if (!playerId.value) {
    message.warning('请先查询玩家信息');
    return;
  }
  if (!amount.value || amount.value <= 0 || !Number.isInteger(amount.value)) {
    message.warning('请输入正整数积分');
    return;
  }
  if (!applyRemark.value.trim()) {
    message.warning('请填写申请备注');
    return;
  }
  if (handleType.value === 1 && amount.value > 100_000) {
    message.warning('上分积分不能超过 100000');
    return;
  }

  Modal.confirm({
    content: `确认对玩家 ${loginAccount.value} ${
      handleType.value === 1 ? '上分' : '下分'
    } ${amount.value} 积分？`,
    title: '确认提交',
    onOk: async () => {
      submitting.value = true;
      try {
        await createRewardPointAdjustApi({
          AdjustType: 1,
          Amount: amount.value,
          ApplyRemark: applyRemark.value.trim(),
          HandleType: handleType.value,
          PlayerId: playerId.value,
        });
        message.success('提交成功，等待审核');
        amount.value = undefined;
        applyRemark.value = '';
      } finally {
        submitting.value = false;
      }
    },
  });
}

async function submitBatch() {
  if (!applyRemark.value.trim()) {
    message.warning('请填写申请备注');
    return;
  }
  if (!validBatchCount.value) {
    message.warning('请先预览并确认有效玩家');
    return;
  }

  const validRows = batchRows.value.filter((row) => row.valid);
  const multiAmount = validRows.map((row) => ({
    Amount: row.AmountPoint,
    LoginAccount: row.LoginAccount,
    PackageName: row.PackageName,
    PlayerId: row.PlayerId,
  }));
  const playerIds = [...new Set(validRows.map((row) => String(row.PlayerId)))];

  submitting.value = true;
  try {
    const result = (await batchCreateRewardPointAdjustApi({
      AdjustType: 1,
      ApplyRemark: applyRemark.value.trim(),
      HandleType: handleType.value,
      MultiAmount: JSON.stringify(multiAmount),
      PlayerIds: playerIds.join(','),
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
      return { ...item, Msg: msg };
    });

    batchResult.value = {
      Count: Number(result?.Count ?? validRows.length),
      FailCount: Number(result?.FailCount ?? failItems.length),
      FailItems: failItems,
      SuccessCount: Number(result?.SuccessCount ?? 0),
    };
    batchResultOpen.value = true;
    message.success('批量调整已提交，等待审核');
    batchText.value = '';
    batchRows.value = [];
    applyRemark.value = '';
  } finally {
    submitting.value = false;
  }
}

function handleSubmit() {
  if (saveType.value === 'single') {
    void submitSingle();
  } else {
    void submitBatch();
  }
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
      { header: '调整积分', value: (row) => row.Amount ?? '-' },
      { header: '失败原因', value: (row) => row.Msg || '-' },
    ],
    `积分调整导入失败_${Date.now()}`,
  );
}
</script>

<template>
  <div v-if="canView">
    <Card size="small" title="积分账户调整">
      <div class="mb-3">
        <Radio.Group v-model:value="saveType" button-style="solid">
          <Radio.Button value="single">单个调整</Radio.Button>
          <Radio.Button value="batch">批量调整</Radio.Button>
        </Radio.Group>
      </div>

      <Form layout="vertical" class="max-w-2xl">
        <Form.Item label="上分/下分" required>
          <Select
            v-model:value="handleType"
            :options="handleTypeOptions"
            style="width: 200px"
          />
        </Form.Item>

        <template v-if="saveType === 'single'">
          <Form.Item label="游戏账号" required>
            <Space>
              <Input
                v-model:value="loginAccount"
                allow-clear
                placeholder="游戏账号"
                style="width: 200px"
                @blur="lookupPlayer"
              />
              <Select
                v-model:value="packageName"
                :options="
                  packageOptions.map((item) => ({
                    label: item.PackageName,
                    value: item.PackageName,
                  }))
                "
                placeholder="产品"
                style="width: 180px"
                @change="lookupPlayer"
              />
              <Button :loading="lookupLoading" @click="lookupPlayer">
                查询
              </Button>
            </Space>
          </Form.Item>
          <div v-if="playerId" class="mb-4 text-sm text-gray-600">
            玩家ID：{{ playerId }} · 当前积分：{{ playerPoint || 0 }} · 状态：
            <PlayerStatusTag :status="playerStatus" />
          </div>
          <Form.Item label="调整积分（正整数）" required>
            <InputNumber
              v-model:value="amount"
              :min="1"
              :precision="0"
              class="w-full"
              placeholder="单位：积分"
            />
          </Form.Item>
        </template>

        <template v-else>
          <Form.Item label="批量导入">
            <div class="mb-2 flex flex-wrap gap-2">
              <Button @click="downloadBatchTemplate">下载模板</Button>
              <Button @click="batchFileInput?.click()">导入文件</Button>
              <input
                ref="batchFileInput"
                accept=".csv,text/csv,.xlsx,.xls"
                class="hidden"
                type="file"
                @change="onBatchFileChange"
              />
              <Button
                :loading="lookupLoading"
                type="primary"
                @click="previewBatch"
              >
                预览匹配
              </Button>
            </div>
            <div class="mb-2 text-sm text-gray-500">
              每行一条：游戏账号,产品名称,调整积分（正整数）；也可直接粘贴
            </div>
            <Input.TextArea
              v-model:value="batchText"
              :rows="6"
              placeholder="示例：&#10;player01,乐赢网,100&#10;player02,乐赢网,50"
            />
          </Form.Item>
          <Table
            v-if="batchRows.length"
            class="mb-4"
            size="small"
            :pagination="false"
            :data-source="batchRows"
            :row-key="
              (row: BatchRow) => `${row.LoginAccount}-${row.PackageName}`
            "
            :columns="[
              { title: '游戏账号', dataIndex: 'LoginAccount' },
              { title: '产品名称', dataIndex: 'PackageName' },
              {
                title: '玩家ID',
                dataIndex: 'PlayerId',
                customRender: ({ text }: { text: number | string }) =>
                  Number(text) === 0 ? '无' : text,
              },
              { title: '调整积分', dataIndex: 'AmountPoint' },
              {
                title: '状态',
                dataIndex: 'valid',
                customRender: ({ text }: { text: boolean }) =>
                  text ? '有效' : '无效',
              },
            ]"
          />
        </template>

        <Form.Item label="申请备注" required>
          <Input.TextArea
            v-model:value="applyRemark"
            :rows="3"
            placeholder="请填写备注"
          />
        </Form.Item>

        <Button type="primary" :loading="submitting" @click="handleSubmit">
          提交审核
        </Button>
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
        :row-key="(row: FailItem) => String(row.LoginAccount ?? row.PlayerId ?? JSON.stringify(row))"
        :columns="[
          { title: '游戏账号', dataIndex: 'LoginAccount' },
          { title: '产品名称', dataIndex: 'PackageName' },
          { title: '调整积分', dataIndex: 'Amount' },
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
    sub-title="需要权限 13335 才能提交积分调整"
    title="无权限"
  />
</template>

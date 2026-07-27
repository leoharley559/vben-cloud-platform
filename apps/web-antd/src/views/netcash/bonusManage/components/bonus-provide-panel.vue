<script lang="ts" setup>
import type { BonusAdminItem, BonusBatchResult } from '#/types/netcash';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';
import * as XLSX from 'xlsx';

import {
  batchProvideBonusApi,
  provideBonusApi,
  queryBonusAdminIdApi,
} from '#/api/netcash/bonus-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { createRequestHash } from '#/utils/crypto';
import { formatAmountFromCent } from '#/utils/format-amount';

import { exportWorkbook, validAmount, validRemark } from '../shared';

defineOptions({ name: 'BonusProvidePanel' });

interface BatchPreviewRow extends BonusAdminItem {
  Amount: number;
  AmountYuan: number;
  valid: boolean;
}

const { checkPermission } = useCloudPermission();
const canSingleProvide = computed(() => checkPermission(11_358));
const canBatchProvide = computed(() => checkPermission(11_359));

const provideMode = ref<'batch' | 'single'>(
  canSingleProvide.value ? 'single' : 'batch',
);
const provideForm = reactive({
  AdminName: '',
  Amount: undefined as number | undefined,
  BonusType: 1,
  HandleDesc: '',
  WalletType: 1,
});
const provideSubmitting = ref(false);
const provideQuerying = ref(false);
const batchInput = ref<HTMLInputElement>();
const batchSource = ref<Array<{ amount: number; username: string }>>([]);
const batchPreview = ref<BatchPreviewRow[]>([]);
const batchUsed = ref(false);
const batchPreviewOpen = ref(false);
const batchResult = ref<BonusBatchResult | null>(null);
const batchResultOpen = ref(false);

const validBatchRows = computed(() =>
  batchPreview.value.filter((row) => row.valid),
);
const batchPreviewSummary = computed(() => ({
  all: batchPreview.value.length,
  invalid: batchPreview.value.length - validBatchRows.value.length,
  valid: validBatchRows.value.length,
}));

function resetProvide() {
  provideForm.AdminName = '';
  provideForm.Amount = undefined;
  provideForm.HandleDesc = '';
  batchSource.value = [];
  batchPreview.value = [];
  batchUsed.value = false;
}

function validateProvideCommon() {
  if (!validRemark(provideForm.HandleDesc, false)) {
    message.warning('备注长度不能超过 400 个字符');
    return false;
  }
  return true;
}

async function submitSingleProvide() {
  const username = provideForm.AdminName.trim();
  if (!username) {
    message.warning('请输入代理账号');
    return;
  }
  if (!validAmount(provideForm.Amount)) {
    message.warning('金额须为最多两位小数且不能为 0，最大 100000 元');
    return;
  }
  if (!validateProvideCommon()) return;

  provideQuerying.value = true;
  try {
    const result = await queryBonusAdminIdApi({ Username: username });
    const account = result.Items?.[0];
    if (!account || Number(account.AdminId) === 0) {
      message.error('未找到有效代理账号');
      return;
    }
    if (Number(account.Type) === 3) {
      message.error('测试代理账号不可发放红利');
      return;
    }
    Modal.confirm({
      content: `确认向代理 ${username} 发放 ${provideForm.Amount} 元？`,
      onOk: async () => {
        provideSubmitting.value = true;
        try {
          await provideBonusApi({
            AdminId: account.AdminId,
            AdminName: username,
            Amount: Math.round(Number(provideForm.Amount) * 100),
            BonusType: provideForm.BonusType,
            HandleDesc: provideForm.HandleDesc,
            Hash: createRequestHash(),
            MultiInfo: '',
            WalletType: provideForm.WalletType,
          });
          message.success('发放成功');
          resetProvide();
        } catch {
          // requestClient 已提示业务错误（如 10196）
        } finally {
          provideSubmitting.value = false;
        }
      },
      title: '确认发放',
    });
  } catch {
    // queryadminid 失败（如 10000）由 requestClient 提示
  } finally {
    provideQuerying.value = false;
  }
}

function downloadBatchTemplate() {
  exportWorkbook(
    [['agent01', 100]],
    ['代理账号', '申请金额'],
    '红利批量发放模板.xlsx',
  );
}

function pickBatchFile() {
  batchInput.value?.click();
}

async function handleBatchFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (file.size >= 1024 * 1024) {
    message.error('上传文件不能超过 1MB');
    return;
  }
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0] || ''];
    if (!sheet) throw new Error('empty');
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });
    const parsed: Array<{ amount: number; username: string }> = [];
    for (const [index, row] of rows.entries()) {
      const username = String(
        row['代理账号'] ?? row.Username ?? row.username ?? '',
      ).trim();
      const rawAmount = row['申请金额'] ?? row.Amount ?? row.amount ?? '';
      if (!username || !validAmount(String(rawAmount))) {
        message.error(`第 ${index + 2} 行格式错误，请检查代理账号和申请金额`);
        return;
      }
      parsed.push({ amount: Number(rawAmount), username });
    }
    if (parsed.length === 0) {
      message.warning('文件中没有可导入的数据');
      return;
    }
    batchSource.value = parsed;
    batchUsed.value = false;
    await validateBatchFile();
  } catch {
    message.error('Excel 文件无法解析，请使用下载的模板');
  }
}

async function validateBatchFile() {
  if (batchSource.value.length === 0) {
    message.warning('请先上传 Excel 文件');
    return;
  }
  if (!validateProvideCommon()) return;
  provideQuerying.value = true;
  batchUsed.value = false;
  try {
    const result = await queryBonusAdminIdApi({
      Username: batchSource.value.map((item) => item.username).join(','),
    });
    const items = result.Items || [];
    batchPreview.value = batchSource.value.map((source, index) => {
      const account = items[index] || {};
      const adminId = account.AdminId ?? 0;
      const type = Number(account.Type ?? 0);
      return {
        ...account,
        AdminId: adminId,
        Amount: Math.round(source.amount * 100),
        AmountYuan: source.amount,
        Type: type,
        Username: String(account.Username || source.username),
        valid: Number(adminId) !== 0 && type !== 3,
      };
    });
    batchPreviewOpen.value = true;
  } catch {
    batchPreview.value = [];
  } finally {
    provideQuerying.value = false;
  }
}

function useBatchPreview() {
  if (validBatchRows.value.length === 0) {
    message.warning('没有可使用的有效代理数据');
    return;
  }
  batchPreviewOpen.value = false;
  batchUsed.value = true;
  message.success(`已使用 ${validBatchRows.value.length} 条有效数据`);
}

function parseFailureMessage(value?: string) {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value) as { Msg?: string };
    return parsed.Msg || value;
  } catch {
    return value;
  }
}

function submitBatchProvide() {
  if (!batchUsed.value || validBatchRows.value.length === 0) {
    message.warning('请先上传、验证并使用有效数据');
    return;
  }
  if (!validateProvideCommon()) return;
  Modal.confirm({
    content: `确认批量发放 ${validBatchRows.value.length} 条红利？`,
    onOk: async () => {
      provideSubmitting.value = true;
      try {
        const result = await batchProvideBonusApi({
          AdminId: '',
          AdminName: '',
          Amount: '',
          BonusType: provideForm.BonusType,
          HandleDesc: provideForm.HandleDesc,
          MultiInfo: JSON.stringify(validBatchRows.value),
          WalletType: provideForm.WalletType,
        });
        batchResult.value = {
          Count: Number(result.Count ?? validBatchRows.value.length),
          FailCount: Number(result.FailCount ?? 0),
          FailItems: Array.isArray(result.FailItems)
            ? result.FailItems.map((item) => ({
                ...item,
                Msg: parseFailureMessage(item.Msg),
              }))
            : [],
          SuccessCount: Number(
            result.SuccessCount ?? validBatchRows.value.length,
          ),
        };
        batchResultOpen.value = true;
        message.success('批量发放处理完成');
        resetProvide();
      } catch {
        // requestClient 已提示业务错误
      } finally {
        provideSubmitting.value = false;
      }
    },
    title: '确认批量发放',
  });
}

function exportBatchFailures() {
  const failures = batchResult.value?.FailItems || [];
  if (failures.length === 0) {
    message.warning('没有失败数据可导出');
    return;
  }
  exportWorkbook(
    failures.map((row) => [
      String(row.Username || ''),
      String(row.AdminId || ''),
      Number((Number(row.Amount || 0) / 100).toFixed(2)),
      String(row.Msg || ''),
    ]),
    ['代理账号', '代理ID', '申请金额', '失败原因'],
    '红利批量发放失败结果.xlsx',
  );
}
</script>

<template>
  <div class="space-y-4">
    <Tabs v-model:active-key="provideMode" type="line" size="small">
      <Tabs.TabPane v-if="canSingleProvide" key="single" tab="单笔发放" />
      <Tabs.TabPane v-if="canBatchProvide" key="batch" tab="批量发放" />
    </Tabs>

    <div
      v-if="provideMode === 'batch'"
      class="rounded border border-dashed p-4"
    >
      <Space wrap>
        <Button @click="downloadBatchTemplate">下载 Excel 模板</Button>
        <Button :loading="provideQuerying" @click="pickBatchFile">
          上传并验证 Excel
        </Button>
        <Button
          :disabled="batchSource.length === 0"
          :loading="provideQuerying"
          @click="validateBatchFile"
        >
          重新验证
        </Button>
        <span v-if="batchUsed && validBatchRows.length > 0" class="text-green-600">
          已使用 {{ validBatchRows.length }} 条有效数据
        </span>
      </Space>
      <input
        ref="batchInput"
        accept=".xlsx,.xls,.csv"
        class="hidden"
        type="file"
        @change="handleBatchFile"
      />
      <div class="mt-2 text-xs text-gray-400">
        文件不超过 1MB；表头必须包含“代理账号、申请金额”。
      </div>
    </div>

    <Form class="max-w-2xl" layout="vertical">
      <Form.Item v-if="provideMode === 'single'" label="代理账号" required>
        <Input
          v-model:value="provideForm.AdminName"
          allow-clear
          :maxlength="100"
          placeholder="请输入代理账号"
        />
      </Form.Item>
      <Form.Item label="钱包类型">
        <Radio.Group v-model:value="provideForm.WalletType">
          <Radio :value="1">佣金钱包</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="红利类型">
        <Select
          v-model:value="provideForm.BonusType"
          :options="[{ label: '代理红利', value: 1 }]"
        />
      </Form.Item>
      <Form.Item
        v-if="provideMode === 'single'"
        label="申请金额（元）"
        required
      >
        <InputNumber
          v-model:value="provideForm.Amount"
          class="!w-full"
          :max="100000"
          :precision="2"
          placeholder="最多两位小数，不能为 0"
        />
      </Form.Item>
      <Form.Item label="申请备注">
        <Input.TextArea
          v-model:value="provideForm.HandleDesc"
          :maxlength="400"
          placeholder="最多 400 个字符"
          :rows="3"
          show-count
        />
      </Form.Item>
      <Space>
        <Button
          type="primary"
          :loading="provideSubmitting || provideQuerying"
          @click="
            provideMode === 'single'
              ? submitSingleProvide()
              : submitBatchProvide()
          "
        >
          {{ provideMode === 'single' ? '确认发放' : '确认批量发放' }}
        </Button>
        <Button @click="resetProvide">取消</Button>
      </Space>
    </Form>

    <Modal
      v-model:open="batchPreviewOpen"
      title="Excel 验证结果"
      width="760px"
      :ok-button-props="{ disabled: validBatchRows.length === 0 }"
      ok-text="使用有效数据"
      cancel-text="不使用"
      @ok="useBatchPreview"
    >
      <div class="mb-3">
        共 {{ batchPreviewSummary.all }} 条，有效
        {{ batchPreviewSummary.valid }} 条，无效
        {{ batchPreviewSummary.invalid }} 条
      </div>
      <Table
        :columns="[
          { title: '代理账号', dataIndex: 'Username' },
          { title: '代理ID', dataIndex: 'AdminId' },
          { title: '代理类型', dataIndex: 'Type' },
          { title: '申请金额', dataIndex: 'AmountYuan' },
          { title: '验证结果', dataIndex: 'valid' },
        ]"
        :data-source="batchPreview"
        :pagination="false"
        :row-key="(row: BatchPreviewRow) => `${row.Username}-${row.AdminId ?? row.AmountYuan ?? ''}`"
        :scroll="{ y: 420 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'Type'">
            {{ Number(record.Type) === 3 ? '测试代理' : '正常代理' }}
          </template>
          <Tag
            v-else-if="column.dataIndex === 'valid'"
            :color="record.valid ? 'success' : 'error'"
          >
            {{ record.valid ? '有效' : '无效/测试账号' }}
          </Tag>
        </template>
      </Table>
    </Modal>

    <Modal
      v-model:open="batchResultOpen"
      title="批量发放结果"
      width="760px"
      :footer="null"
    >
      <div class="mb-3">
        总数 {{ batchResult?.Count || 0 }}，成功
        {{ batchResult?.SuccessCount || 0 }}，失败
        {{ batchResult?.FailCount || 0 }}
      </div>
      <Table
        :columns="[
          { title: '代理账号', dataIndex: 'Username' },
          { title: '代理ID', dataIndex: 'AdminId' },
          { title: '申请金额', dataIndex: 'Amount' },
          { title: '失败原因', dataIndex: 'Msg' },
        ]"
        :data-source="batchResult?.FailItems || []"
        :pagination="false"
        :row-key="(row: Record<string, unknown>) => `${row.Username}-${row.AdminId ?? row.Amount ?? ''}`"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'Amount'">
            {{ formatAmountFromCent(Number(record.Amount || 0)) }}
          </template>
        </template>
      </Table>
      <div class="mt-4 flex justify-end gap-2">
        <Button
          :disabled="(batchResult?.FailItems || []).length === 0"
          @click="exportBatchFailures"
        >
          导出失败结果
        </Button>
        <Button type="primary" @click="batchResultOpen = false">关闭</Button>
      </div>
    </Modal>
  </div>
</template>

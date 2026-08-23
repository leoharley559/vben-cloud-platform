<script lang="ts" setup>
import type { BankCardImportRow } from '#/utils/risk-import';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Table,
  Upload,
} from 'ant-design-vue';

import {
  createBankCardBlackApi,
  fetchBankCardBlackInfoApi,
} from '#/api/operationManage/game-risk-control';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatBankCode } from '#/utils/bank-card';
import { downloadRiskImportTemplate, parseBankCardRiskImportText } from '#/utils/risk-import';

defineOptions({ name: 'BankCardRiskImportModal' });

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { adminInfo } = useCloudPermission();
const { projectConfig } = useProjectConfig();

const parsing = ref(false);
const previewing = ref(false);
const saving = ref(false);
const desc = ref('');
const importedRows = ref<BankCardImportRow[]>([]);
const previewRows = ref<Array<Record<string, unknown>>>([]);

const bankList = computed(
  () =>
    (projectConfig.value?.BankList as Array<{
      BankCode?: string;
      BankName?: string;
    }>) || [],
);

const previewColumns = [
  { dataIndex: 'BankCardNum', key: 'BankCardNum', title: '银行卡号' },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatBankCode(String(record.BankCode || ''), bankList.value) ||
      String(record.BankName || '-'),
    key: 'BankCode',
    title: '银行',
  },
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号' },
  { dataIndex: 'PackageName', key: 'PackageName', title: '产品包' },
];

function resolveOperator() {
  const info = adminInfo.value as null | Record<string, unknown>;
  const admin = info?.Admin as undefined | { Username?: string };
  return admin?.Username || String(info?.AdminName || info?.Account || '');
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    desc.value = '';
    importedRows.value = [];
    previewRows.value = [];
  },
);

function close() {
  emit('update:open', false);
}

function handleDownloadTemplate() {
  downloadRiskImportTemplate('银行卡黑名单导入模板', ['银行卡号', '银行名称']);
}

async function handleFile(file: File) {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.csv') && !name.endsWith('.txt')) {
    message.warning('请上传 CSV/TXT（Excel 请另存为 CSV）');
    return false;
  }
  if (file.size / 1024 / 1024 >= 1) {
    message.error('文件大小不能超过 1MB');
    return false;
  }

  parsing.value = true;
  try {
    const text = await file.text();
    const parsed = parseBankCardRiskImportText(text, bankList.value);
    if (parsed.error) {
      message.warning(parsed.error);
      return false;
    }
    importedRows.value = parsed.rows;
    await loadPreview(parsed.rows);
  } finally {
    parsing.value = false;
  }
  return false;
}

async function loadPreview(rows: BankCardImportRow[]) {
  previewing.value = true;
  try {
    const result = await fetchBankCardBlackInfoApi({
      MultiInfo: JSON.stringify(
        rows.map((item) => ({
          BankCardNum: item.BankCardNum,
          BankCode: item.BankCode,
        })),
      ),
      Type: 1,
    });
    const items = result?.Items || [];
    previewRows.value = items.length > 0
      ? items
      : rows.map((item) => ({
          BankCardNum: item.BankCardNum,
          BankCode: item.BankCode,
          BankName: item.BankName,
        }));
    message.success(
      `已解析 ${rows.length} 条，预览 ${previewRows.value.length} 条关联结果`,
    );
  } finally {
    previewing.value = false;
  }
}

async function handleOk() {
  if (importedRows.value.length === 0 && previewRows.value.length === 0) {
    message.warning('请先上传导入文件');
    return;
  }
  saving.value = true;
  try {
    const info: Array<Record<string, unknown>> =
      previewRows.value.length > 0
        ? previewRows.value
        : importedRows.value.map((item) => ({
            BankCardNum: item.BankCardNum,
            BankCode: item.BankCode,
          }));
    const result = (await createBankCardBlackApi({
      Desc: desc.value.trim(),
      Enabled: 1,
      LoginAccount: info
        .map((item) => String(item.LoginAccount || ''))
        .filter(Boolean)
        .join(','),
      MultiInfo: JSON.stringify(info),
      Operator: resolveOperator(),
      RadioType: 2,
      Type: 1,
    })) as { FailCount?: number; SuccessCount?: number };

    const fail = Number(result?.FailCount || 0);
    const success = Number(result?.SuccessCount || 0);
    if (fail === 0) {
      message.success('批量导入成功');
    } else if (success === 0) {
      message.error('批量导入失败');
    } else {
      message.warning(`部分成功：成功 ${success}，失败 ${fail}`);
    }
    close();
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving || previewing || parsing"
    destroy-on-close
    :open="open"
    title="批量导入银行卡黑名单"
    width="760px"
    @cancel="close"
    @ok="handleOk"
    @update:open="(v) => emit('update:open', v)"
  >
    <div class="mb-3 flex flex-wrap gap-2">
      <Button @click="handleDownloadTemplate">下载 CSV 模板</Button>
      <Upload
        :before-upload="handleFile"
        :show-upload-list="false"
        accept=".csv,.txt"
      >
        <Button type="primary" :loading="parsing || previewing">
          上传文件
        </Button>
      </Upload>
    </div>
    <p class="mb-3 text-xs text-gray-500">
      仅支持 CSV/TXT（≤1MB，≤1000
      行）。两列：银行卡号、银行名称（须与系统银行列表一致）。Excel 请另存为 CSV
      后上传。
    </p>

    <Form layout="vertical">
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="desc"
          :rows="2"
          allow-clear
          placeholder="选填"
        />
      </Form.Item>
    </Form>

    <div class="mb-2 text-sm">
      预览：解析 {{ importedRows.length }} 条 / 关联结果
      {{ previewRows.length }} 条
    </div>
    <Table
      :columns="previewColumns"
      :data-source="previewRows"
      :loading="previewing"
      :pagination="{ pageSize: 8 }"
      :row-key="
        (row) => String(row.BankCardNum || row.LoginAccount || Math.random())
      "
      size="small"
    />
  </Modal>
</template>

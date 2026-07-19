<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Table,
  Upload,
  message,
} from 'ant-design-vue';

import {
  createDeviceRiskApi,
  createIpRiskApi,
  fetchDeviceRiskPlayersApi,
  fetchIpRiskPlayersApi,
} from '#/api/operationManage/game-risk-control';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  downloadRiskImportTemplate,
  parseRiskImportText,
} from '#/utils/risk-import';

defineOptions({ name: 'RiskRecordImportModal' });

const props = defineProps<{
  kind: 'device' | 'ip';
  listType?: 'blacklist' | 'whitelist';
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { adminInfo } = useCloudPermission();

const parsing = ref(false);
const previewing = ref(false);
const saving = ref(false);
const desc = ref('');
const blockAccount = ref(false);
const importedValues = ref<string[]>([]);
const previewRows = ref<Array<Record<string, unknown>>>([]);

const listType = computed(() => props.listType || 'blacklist');
const typeValue = computed(() => (listType.value === 'whitelist' ? 2 : 1));
const kindLabel = computed(() => (props.kind === 'ip' ? 'IP' : '设备'));
const listLabel = computed(() =>
  listType.value === 'whitelist' ? '白名单' : '黑名单',
);
const columnHeader = computed(() =>
  props.kind === 'ip' ? 'IP地址' : '设备标识',
);
const columnHints = computed(() =>
  props.kind === 'ip'
    ? ['IP', 'ip', '地址']
    : ['设备', 'device', 'Device', '标识'],
);

const title = computed(() => `批量导入 ${kindLabel.value}${listLabel.value}`);

const previewColumns = [
  { dataIndex: 'RiskValue', key: 'RiskValue', title: columnHeader.value },
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号' },
  { dataIndex: 'PackageName', key: 'PackageName', title: '产品包' },
];

function resolveOperator() {
  const info = adminInfo.value as Record<string, unknown> | null;
  const admin = info?.Admin as { Username?: string } | undefined;
  return admin?.Username || String(info?.AdminName || info?.Account || '');
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    desc.value = '';
    blockAccount.value = false;
    importedValues.value = [];
    previewRows.value = [];
  },
);

function close() {
  emit('update:open', false);
}

function handleDownloadTemplate() {
  downloadRiskImportTemplate(
    `${kindLabel.value}${listLabel.value}导入模板`,
    columnHeader.value,
  );
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
    const values = parseRiskImportText(text, columnHints.value);
    if (!values.length) {
      message.warning('上传文件为空或格式不正确');
      return false;
    }
    if (values.length > 1000) {
      message.warning('单次最多导入 1000 条');
      return false;
    }
    importedValues.value = values;
    await loadPreview(values);
  } finally {
    parsing.value = false;
  }
  return false;
}

async function loadPreview(values: string[]) {
  previewing.value = true;
  try {
    const payload = {
      Enabled: 1,
      Operator: resolveOperator(),
      RiskType: props.kind === 'ip' ? 1 : 4,
      RiskValue: values.join(','),
      Type: typeValue.value,
    };
    const result =
      props.kind === 'ip'
        ? await fetchIpRiskPlayersApi(payload)
        : await fetchDeviceRiskPlayersApi(payload);
    const items = result?.Items || [];
    previewRows.value = items.length
      ? items
      : values.map((value) => ({ RiskValue: value }));
    message.success(
      `已解析 ${values.length} 条，预览 ${previewRows.value.length} 条关联结果`,
    );
  } finally {
    previewing.value = false;
  }
}

async function handleOk() {
  if (!importedValues.value.length && !previewRows.value.length) {
    message.warning('请先上传导入文件');
    return;
  }
  saving.value = true;
  try {
    const info =
      previewRows.value.length > 0
        ? previewRows.value
        : importedValues.value.map((value) => ({ RiskValue: value }));
    const payload: Record<string, unknown> = {
      Desc: desc.value.trim(),
      Enabled: 1,
      LoginAccount: info
        .map((item) => String(item.LoginAccount || ''))
        .filter(Boolean)
        .join(','),
      MultiInfo: JSON.stringify(info),
      Operator: resolveOperator(),
      RadioType: 2,
      RiskType: props.kind === 'ip' ? 1 : 4,
      Type: typeValue.value,
    };
    if (listType.value === 'blacklist') {
      payload.BlockAccount = blockAccount.value ? 1 : 0;
    }
    const result =
      props.kind === 'ip'
        ? await createIpRiskApi(payload)
        : await createDeviceRiskApi(payload);

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
    :title="title"
    width="720px"
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
      仅支持 CSV/TXT（≤1MB，≤1000 行）。Excel 请用「另存为
      CSV」后上传；首列标题为「{{ columnHeader }}」。
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
      <Checkbox
        v-if="listType === 'blacklist'"
        v-model:checked="blockAccount"
        class="mb-3"
      >
        同时封停关联账号
      </Checkbox>
    </Form>

    <div class="mb-2 text-sm">
      预览：解析 {{ importedValues.length }} 条 / 关联结果
      {{ previewRows.length }} 条
    </div>
    <Table
      :columns="previewColumns"
      :data-source="previewRows"
      :loading="previewing"
      :pagination="{ pageSize: 8 }"
      :row-key="
        (row) => String(row.RiskValue || row.LoginAccount || Math.random())
      "
      size="small"
    />
  </Modal>
</template>

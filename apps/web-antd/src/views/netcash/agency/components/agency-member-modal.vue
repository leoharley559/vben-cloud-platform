<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import {
  addAgencyPlayerApi,
  checkAgencyPlayersApi,
} from '#/api/netcash/agency';
import { useCloudPermission } from '#/composables/use-cloud-permission';

type Row = Record<string, any>;

const props = defineProps<{
  adminId?: number | string;
  adminName?: string;
  open: boolean;
}>();
const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { projectConfig } = useCloudPermission();
const packageOptions = computed(() =>
  (projectConfig.value?.RealPackageIdNameMap || []).map((item) => ({
    label: item.PackageName,
    value: item.PackageName,
  })),
);
const checking = ref(false);
const submitting = ref(false);
const account = ref('');
const packageName = ref<string>();
const bulkNote = ref('');
const rows = ref<Row[]>([]);
const selectedKeys = ref<Array<number | string>>([]);

const columns = [
  { dataIndex: 'PlayerAccount', key: 'PlayerAccount', title: '游戏账号' },
  { dataIndex: 'PackageName', key: 'PackageName', title: '所属产品' },
  { dataIndex: 'OriginalAdmin', key: 'OriginalAdmin', title: '原代理' },
  { dataIndex: 'valid', key: 'valid', title: '预校验', width: 90 },
  { dataIndex: 'Note', key: 'Note', title: '备注', width: 220 },
];
const stats = computed(() => ({
  invalid: rows.value.filter((item) => !isValid(item)).length,
  total: rows.value.length,
  valid: rows.value.filter(isValid).length,
}));
const rowSelection = computed(() => ({
  getCheckboxProps: (row: Row) => ({ disabled: !isValid(row) }),
  onChange: (keys: Array<number | string>) => {
    selectedKeys.value = keys;
  },
  selectedRowKeys: selectedKeys.value,
}));

function isValid(row: Row) {
  return Boolean(
    row.PlayerExists && row.HasChannelInAgent && row.SameAdmin === false,
  );
}
function normalizeChecked(items: Row[]) {
  rows.value = items.map((item, index) => ({
    ...item,
    AdminName: props.adminName,
    Note: item.Note || '转移代理',
    _key: item.PlayerId || `${item.PlayerAccount}-${item.PackageName}-${index}`,
  }));
  selectedKeys.value = rows.value.filter(isValid).map((item) => item._key);
}
async function precheck(players: Array<{ PackageName: string; PlayerAccount: string }>) {
  if (!props.adminId) return;
  checking.value = true;
  try {
    const result = await checkAgencyPlayersApi({
      AdminId: props.adminId,
      Players: JSON.stringify(players),
    });
    normalizeChecked(result);
    if (!result.length) message.warning('未匹配到游戏账号');
  } finally {
    checking.value = false;
  }
}
function checkSingle() {
  const playerAccount = account.value.trim().toLowerCase();
  if (!playerAccount || !packageName.value) {
    message.warning('请输入游戏账号并选择所属产品');
    return;
  }
  precheck([{ PackageName: packageName.value, PlayerAccount: playerAccount }]);
}
function writeTemplate() {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([{ 游戏账号: '', 所属产品: '' }]);
  XLSX.utils.book_append_sheet(book, sheet, '代理会员模板');
  XLSX.writeFile(book, `代理会员模板_${dayjs().format('YYYYMMDD')}.xlsx`);
}
const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
  if (file.size / 1024 / 1024 >= 1) {
    message.error('文件大小不能超过 1MB');
    return Upload.LIST_IGNORE;
  }
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = book.Sheets[book.SheetNames[0] || ''];
  const raw = sheet
    ? (XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Row[])
    : [];
  if (!raw.length || raw.length > 1000) {
    message.warning(raw.length ? '单次最多导入 1000 条' : '上传文件为空');
    return Upload.LIST_IGNORE;
  }
  const players = raw.map((item) => ({
    PackageName: String(item.所属产品 ?? item.PackageName ?? '').trim(),
    PlayerAccount: String(item.游戏账号 ?? item.PlayerAccount ?? '')
      .trim()
      .toLowerCase(),
  }));
  if (players.some((item) => !item.PlayerAccount || !item.PackageName)) {
    message.error('文件格式错误，请使用模板并完整填写游戏账号、所属产品');
    return Upload.LIST_IGNORE;
  }
  await precheck(players);
  return Upload.LIST_IGNORE;
};
function applyBulkNote() {
  const note = bulkNote.value.trim();
  if (!note || note.length > 400) {
    message.warning('请输入 1-400 个字符的备注');
    return;
  }
  const keys = new Set(selectedKeys.value.map(String));
  rows.value.forEach((item) => {
    if (keys.has(String(item._key)) && isValid(item)) item.Note = note;
  });
}
async function submit() {
  if (!props.adminId) return;
  const keys = new Set(selectedKeys.value.map(String));
  const players = rows.value
    .filter((item) => keys.has(String(item._key)) && isValid(item))
    .map(({ _key, ...item }) => item);
  if (!players.length) {
    message.warning('请选择至少一条有效记录');
    return;
  }
  if (players.some((item) => !item.Note || String(item.Note).length > 400)) {
    message.warning('每条有效记录必须填写 1-400 个字符的备注');
    return;
  }
  submitting.value = true;
  try {
    await addAgencyPlayerApi({
      AdminId: props.adminId,
      Players: JSON.stringify(players),
    });
    message.success('添加成功');
    emit('update:open', false);
    emit('success');
  } finally {
    submitting.value = false;
  }
}
watch(
  () => props.open,
  (open) => {
    if (open) {
      account.value = '';
      packageName.value = undefined;
      bulkNote.value = '';
      rows.value = [];
      selectedKeys.value = [];
    }
  },
);
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    :title="`添加下级会员 · ${adminName || ''}`"
    width="960px"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <Form layout="inline" class="mb-4">
      <Form.Item label="游戏账号">
        <Input v-model:value="account" placeholder="请输入游戏账号" @press-enter="checkSingle" />
      </Form.Item>
      <Form.Item label="所属产品">
        <Select
          v-model:value="packageName"
          :options="packageOptions"
          placeholder="请选择所属产品"
          show-search
          style="width: 180px"
        />
      </Form.Item>
      <Form.Item>
        <Button :loading="checking" type="primary" @click="checkSingle">预校验</Button>
      </Form.Item>
    </Form>
    <Space class="mb-4" wrap>
      <Upload
        accept=".xlsx,.xls,.csv"
        :before-upload="beforeUpload"
        :show-upload-list="false"
      >
        <Button :loading="checking">Excel 批量导入</Button>
      </Upload>
      <Button @click="writeTemplate">下载模板</Button>
      <span class="text-gray-500">最多 1000 条，文件不超过 1MB</span>
    </Space>
    <div class="mb-4 grid grid-cols-3 gap-3">
      <Statistic title="总数" :value="stats.total" />
      <Statistic title="有效" :value="stats.valid" :value-style="{ color: '#3f8600' }" />
      <Statistic title="无效" :value="stats.invalid" :value-style="{ color: '#cf1322' }" />
    </div>
    <Space class="mb-3">
      <Input v-model:value="bulkNote" :maxlength="400" placeholder="批量备注" style="width: 320px" />
      <Button @click="applyBulkNote">应用到已选有效记录</Button>
    </Space>
    <Table
      :columns="columns"
      :data-source="rows"
      :loading="checking"
      :pagination="false"
      :row-selection="rowSelection"
      row-key="_key"
      :scroll="{ y: 280 }"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'OriginalAdmin'">
          {{ record.OriginalAdmin || '玩家不存在' }}
        </template>
        <template v-else-if="column.key === 'valid'">
          <Tag :color="isValid(record) ? 'green' : 'red'">
            {{ isValid(record) ? '有效' : '无效' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'Note'">
          <Input v-model:value="record.Note" :disabled="!isValid(record)" :maxlength="400" />
        </template>
      </template>
    </Table>
  </Modal>
</template>

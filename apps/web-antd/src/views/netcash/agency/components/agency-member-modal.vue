<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tooltip,
  Upload,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import {
  addAgencyPlayerApi,
  checkAgencyPlayersApi,
} from '#/api/netcash/agency';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useOperationOptions } from '#/composables/use-operation-options';

type Row = Record<string, unknown> & {
  AdminName?: string;
  Edit?: boolean;
  HasChannelInAgent?: boolean;
  Note?: string;
  OriginalAdmin?: string;
  PackageName?: string;
  PlayerAccount?: string;
  PlayerExists?: boolean;
  PlayerId?: number | string;
  SameAdmin?: boolean;
  TempNote?: string;
  _key?: number | string;
};

const props = defineProps<{
  adminId?: number | string;
  adminName?: string;
  open: boolean;
}>();
const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const { packageOptions: allPackageOptions } = useOperationOptions();
const packageOptions = computed(() =>
  allPackageOptions.value
    .filter((item) => item.PackageId !== '')
    .map((item) => ({
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
const importResultOpen = ref(false);
const importPreviewRows = ref<Row[]>([]);

const columns = [
  { dataIndex: 'PlayerAccount', key: 'PlayerAccount', title: '游戏账号', width: 180 },
  { dataIndex: 'PackageName', key: 'PackageName', title: '所属产品', width: 120 },
  { dataIndex: 'OriginalAdmin', key: 'OriginalAdmin', title: '转代前代理账号', width: 150 },
  { dataIndex: 'AdminName', key: 'AdminName', title: '转代后代理账号', width: 150 },
  { dataIndex: 'Note', key: 'Note', title: '备注', width: 240 },
];

const importPreviewColumns = [
  { dataIndex: 'PlayerAccount', key: 'PlayerAccount', title: '游戏账号', width: 180 },
  { dataIndex: 'PackageName', key: 'PackageName', title: '所属产品', width: 120 },
  { dataIndex: 'OriginalAdmin', key: 'OriginalAdmin', title: '转代前代理账号', width: 130 },
  { dataIndex: 'AdminName', key: 'AdminName', title: '转代后代理账号', width: 130 },
  { dataIndex: 'Note', key: 'Note', title: '备注', width: 180 },
];

function calcStats(list: Row[]) {
  const valid = list.filter((item) => isValid(item)).length;
  return {
    invalid: list.length - valid,
    total: list.length,
    valid,
  };
}

const stats = computed(() => calcStats(rows.value));
const importStats = computed(() => calcStats(importPreviewRows.value));

const summaryItems = computed(() => [
  { label: '总数', value: stats.value.total },
  { label: '有效', value: stats.value.valid, valueClass: 'text-emerald-500' },
  { label: '无效', value: stats.value.invalid, valueClass: 'text-red-500' },
]);
const importSummaryItems = computed(() => [
  { label: '导入总数', value: importStats.value.total },
  {
    label: '有效',
    value: importStats.value.valid,
    valueClass: 'text-emerald-500',
  },
  {
    label: '无效',
    value: importStats.value.invalid,
    valueClass: 'text-red-500',
  },
]);

const rowSelection = computed(() => ({
  getCheckboxProps: (row: Row) => ({ disabled: !isValid(row) }),
  onChange: (keys: Array<number | string>) => {
    selectedKeys.value = keys;
  },
  selectedRowKeys: selectedKeys.value,
}));

function normalizeAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
}

function invalidReason(row: Row) {
  if (!row.PlayerExists) return '玩家不存在';
  if (!row.HasChannelInAgent) return '无对应产品';
  if (row.SameAdmin) return '已归属于该代理';
  return null;
}

function isValid(row: Row) {
  return !invalidReason(row);
}

function validRemark(value: string) {
  return /^.{1,400}$/.test(value);
}

function buildRowKey(item: Row, index: number): number | string {
  const key = item._key ?? item.PlayerId;
  if (key !== undefined && key !== null && key !== '') {
    return key as number | string;
  }
  return `${item.PlayerAccount}-${item.PackageName}-${index}`;
}

function normalizeChecked(items: Row[]) {
  return items.map((item, index) => ({
    ...item,
    AdminName: props.adminName || item.AdminName,
    Edit: false,
    Note: String(item.Note || '转代'),
    TempNote: '',
    _key: buildRowKey(item, index),
  }));
}

function applyRows(items: Row[]) {
  rows.value = normalizeChecked(items);
  selectedKeys.value = rows.value
    .filter((item) => isValid(item))
    .map((item) => item._key as number | string);
}

async function precheck(
  players: Array<{ PackageName: string; PlayerAccount: string }>,
  options?: { previewOnly?: boolean },
) {
  if (!props.adminId) return;
  checking.value = true;
  try {
    const result = await checkAgencyPlayersApi({
      AdminId: props.adminId,
      Players: JSON.stringify(players),
    });
    const normalized = normalizeChecked(result);
    if (normalized.length === 0) {
      message.error('未找到匹配玩家，请核对后查询！');
      return;
    }
    if (options?.previewOnly) {
      importPreviewRows.value = normalized;
      importResultOpen.value = true;
      return;
    }
    applyRows(normalized);
  } finally {
    checking.value = false;
  }
}

function handleAccountInput() {
  account.value = normalizeAccount(account.value);
}

async function queryAccount() {
  const playerAccount = normalizeAccount(account.value);
  account.value = playerAccount;
  if (!playerAccount) return;
  if (!packageName.value) {
    message.warning('请选择所属产品');
    return;
  }
  await precheck([
    { PackageName: packageName.value, PlayerAccount: playerAccount },
  ]);
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
  if (raw.length === 0) {
    message.warning('上传文件为空');
    return Upload.LIST_IGNORE;
  }
  if (raw.length > 1000) {
    message.warning('单次最多导入 1000 条');
    return Upload.LIST_IGNORE;
  }
  const players = raw.map((item) => ({
    PackageName: String(item.所属产品 ?? item.PackageName ?? '').trim(),
    PlayerAccount: normalizeAccount(
      String(item.游戏账号 ?? item.PlayerAccount ?? ''),
    ),
  }));
  if (players.some((item) => !item.PlayerAccount || !item.PackageName)) {
    message.error('文件格式错误，请使用模板并完整填写游戏账号、所属产品');
    return Upload.LIST_IGNORE;
  }
  await precheck(players, { previewOnly: true });
  return Upload.LIST_IGNORE;
};

function employImport() {
  applyRows(importPreviewRows.value);
  importResultOpen.value = false;
  importPreviewRows.value = [];
}

function discardImport() {
  importPreviewRows.value = [];
  importResultOpen.value = false;
}

function applyBulkNote() {
  const note = bulkNote.value.trim();
  if (!note) {
    message.warning('请输入备注');
    return;
  }
  if (!validRemark(note)) {
    message.warning('备注长度为 1-400 个字符');
    return;
  }
  if (selectedKeys.value.length === 0) {
    message.warning('请先勾选需要批量备注的有效记录');
    return;
  }
  const keys = new Set(selectedKeys.value.map(String));
  rows.value.forEach((item) => {
    if (keys.has(String(item._key)) && isValid(item)) {
      item.Note = note;
    }
  });
}

function startNoteEdit(row: Row) {
  row.Edit = true;
  row.TempNote = String(row.Note || '');
}

function confirmNoteEdit(row: Row) {
  const note = String(row.TempNote || '').trim();
  if (!validRemark(note)) {
    message.warning('备注长度为 1-400 个字符');
    return;
  }
  row.Note = note;
  row.TempNote = '';
  row.Edit = false;
}

function cancelNoteEdit(row: Row) {
  row.TempNote = '';
  row.Edit = false;
}

function serializePlayer(row: Row) {
  const { Edit, TempNote, _key, ...rest } = row;
  return rest;
}

async function submit() {
  if (!props.adminId) return;
  const players = rows.value.filter((item) => isValid(item)).map(serializePlayer);
  if (players.length === 0) {
    message.warning('没有可提交的有效记录');
    return;
  }
  if (players.some((item) => !item.Note || !validRemark(String(item.Note)))) {
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

function resetState() {
  account.value = '';
  packageName.value = packageOptions.value[0]?.value;
  bulkNote.value = '';
  rows.value = [];
  selectedKeys.value = [];
  importPreviewRows.value = [];
  importResultOpen.value = false;
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetState();
    }
  },
);
</script>

<template>
  <Modal
    :confirm-loading="submitting"
    :open="open"
    :title="`添加下级会员 · ${adminName || ''}`"
    width="1000px"
    @cancel="emit('update:open', false)"
    @ok="submit"
  >
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <Form layout="inline" class="flex-1">
        <Form.Item label="游戏账号">
          <Input
            v-model:value="account"
            placeholder="请输入游戏账号"
            style="width: 200px"
            @blur="queryAccount"
            @input="handleAccountInput"
            @press-enter="queryAccount"
          />
        </Form.Item>
        <Form.Item label="所属产品">
          <Select
            v-model:value="packageName"
            :options="packageOptions"
            placeholder="请选择所属产品"
            show-search
            style="width: 180px"
            @change="queryAccount"
          />
        </Form.Item>
      </Form>
      <Space wrap>
        <Upload
          accept=".xlsx,.xls,.csv"
          :before-upload="beforeUpload"
          :show-upload-list="false"
        >
          <Button :loading="checking">选择系统文件</Button>
        </Upload>
        <Button @click="writeTemplate">下载模板</Button>
        <Tooltip>
          <template #title>
            <div class="text-xs leading-5">
              <div>导入格式：第一行为表头</div>
              <div>游戏账号 | 所属产品</div>
              <div class="mt-1 text-red-400">单次最多 1000 条，文件不超过 1MB</div>
            </div>
          </template>
          <IconifyIcon
            class="size-4 text-gray-400"
            icon="lucide:circle-help"
          />
        </Tooltip>
      </Space>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <span class="text-sm text-gray-600">批量备注：</span>
      <Input
        v-model:value="bulkNote"
        :maxlength="400"
        placeholder="请输入备注"
        style="width: 420px"
      />
      <Button type="primary" @click="applyBulkNote">批量同步</Button>
    </div>

    <SummaryCards v-if="rows.length > 0" :items="summaryItems" class="mb-3" />

    <Table
      :columns="columns"
      :data-source="rows"
      :loading="checking"
      :pagination="false"
      :row-selection="rowSelection"
      row-key="_key"
      :scroll="{ y: 320 }"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'PlayerAccount'">
          <PlayerAccountLink
            :login-account="String(record.PlayerAccount || '')"
            :player-id="record.PlayerId"
          />
        </template>
        <template v-else-if="column.key === 'Note'">
          <div v-if="invalidReason(record)" class="text-red-500">
            {{ invalidReason(record) }}
          </div>
          <div v-else-if="record.Edit" class="flex items-center gap-1">
            <Input v-model:value="record.TempNote" :maxlength="400" size="small" />
            <Button size="small" type="primary" @click="confirmNoteEdit(record)">
              <IconifyIcon class="size-3.5" icon="lucide:check" />
            </Button>
            <Button size="small" @click="cancelNoteEdit(record)">
              <IconifyIcon class="size-3.5" icon="lucide:x" />
            </Button>
          </div>
          <div v-else class="flex items-center justify-center gap-2">
            <IconifyIcon
              class="size-4 cursor-pointer text-primary"
              icon="lucide:pencil"
              @click="startNoteEdit(record)"
            />
            <span>{{ record.Note || '转代' }}</span>
          </div>
        </template>
      </template>
    </Table>
  </Modal>

  <Modal
    v-model:open="importResultOpen"
    :footer="null"
    destroy-on-close
    title="导入结果"
    width="760px"
  >
    <SummaryCards :items="importSummaryItems" class="mb-3" />
    <Table
      bordered
      :columns="importPreviewColumns"
      :data-source="importPreviewRows"
      :pagination="false"
      row-key="_key"
      :scroll="{ y: 280 }"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'Note'">
          <span :class="invalidReason(record) ? 'text-red-500' : ''">
            {{ invalidReason(record) || record.Note || '转代' }}
          </span>
        </template>
      </template>
    </Table>
    <div class="mt-4 flex justify-end gap-2">
      <Button @click="discardImport">不使用</Button>
      <Button :loading="checking" type="primary" @click="employImport">
        使用
      </Button>
    </div>
  </Modal>
</template>

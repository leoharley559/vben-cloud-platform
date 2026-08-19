<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { Column, Option, Row } from '../shared';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import {
  changeJuniorAgentApi,
  fetchJuniorAgentChannelsApi,
  fetchJuniorAgentOptionsApi,
  fetchJuniorAlgorithmOptionsApi,
  fetchJuniorChangeChannelListApi,
  fetchJuniorMemberListApi,
  submitJuniorImportApi,
  validateJuniorImportApi,
} from '#/api/netcash/junior-member';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';
import { buildPlayerDetailPath } from '#/utils/player-detail-route';

import { mapPackageOptions, writeWorkbook } from '../shared';

defineOptions({ name: 'JuniorMemberListPanel' });

const router = useRouter();
const { checkPermission, projectConfig } = useCloudPermission();
const canChangeChannel = computed(() => checkPermission(10_155));
const canBatchImport = computed(() => checkPermission(10_286));
const canViewTable = computed(() => checkPermission(11_422));
const canViewDetail = computed(() => checkPermission(11_447));

const loading = ref(false);
const exportLoading = ref(false);
const rows = ref<Row[]>([]);
const total = ref(0);
const totals = ref<Record<string, number>>({});
const page = ref(1);
const pageSize = ref(20);

const defaultStatisticsRange = (): [Dayjs, Dayjs] => [
  dayjs().subtract(1, 'day').startOf('day'),
  dayjs().subtract(1, 'day').endOf('day'),
];

const filters = reactive({
  ActiveStatus: undefined as number | undefined,
  AlgorithmTemplateId: undefined as number | string | undefined,
  FirstPayTime: undefined as [Dayjs, Dayjs] | undefined,
  LoginAccount: '',
  PackageId: undefined as number | string | undefined,
  Promoter: '',
  RegTime: undefined as [Dayjs, Dayjs] | undefined,
  StatisticsTime: defaultStatisticsRange(),
  Status: undefined as number | undefined,
  VipLevel: undefined as number | string | undefined,
});

const packageOptions = computed<Option[]>(() =>
  mapPackageOptions(projectConfig.value?.RealPackageIdNameMap),
);
const vipOptions = computed<Option[]>(() =>
  (
    (projectConfig.value?.VIPLevelMap || []) as Array<{
      VipLevelId: number | string;
      VipLevelName: string;
    }>
  ).map((item) => ({
    label: item.VipLevelName || `VIP${item.VipLevelId}`,
    value: item.VipLevelId,
  })),
);
const algorithmOptions = ref<Option[]>([]);
const agentOptions = ref<Option[]>([]);

const statusMap: Record<number, string> = {
  0: '正常',
  1: '良好',
  2: '订阅',
  3: '封禁',
  4: '禁止取款',
  6: '暂时关闭',
  8: '测试',
};

const memberColumns = computed<Column[]>(() => [
  { dataIndex: 'ActiveStatus', fixed: 'left', title: '活跃状态', width: 95 },
  { dataIndex: 'LoginAccount', fixed: 'left', title: '游戏账号', width: 150 },
  { dataIndex: 'DataFlag', title: '成员类型', width: 95 },
  { dataIndex: 'VipLevel', title: 'VIP等级', width: 90 },
  { dataIndex: 'PromoterUserName', title: '归属代理', width: 130 },
  { dataIndex: 'PackageName', title: '所属产品', width: 130 },
  { dataIndex: 'Gold', title: '中心钱包', width: 120 },
  { dataIndex: 'TagName', title: '玩家标签', width: 110 },
  { dataIndex: 'PayMoney', title: '存款', width: 120 },
  { dataIndex: 'WithDrawMoney', title: '取款', width: 120 },
  { dataIndex: 'RedMoney', title: '红利', width: 120 },
  { dataIndex: 'BetGold', title: '总流水', width: 120 },
  { dataIndex: 'WinLoss', title: '总输赢', width: 120 },
  { dataIndex: 'FirstPayTime', title: '首存时间', width: 170 },
  { dataIndex: 'ChangeAgentTime', title: '改代理时间', width: 170 },
  { dataIndex: 'LastTime', title: '最后登录时间', width: 170 },
  { dataIndex: 'LastIp', title: '最后登录IP', width: 140 },
  { dataIndex: 'CreateTime', title: '注册时间', width: 170 },
  ...(canChangeChannel.value
    ? [
        {
          dataIndex: 'action',
          fixed: 'right' as const,
          title: '操作',
          width: 90,
        },
      ]
    : []),
]);

function memberQuery(extra: Record<string, unknown> = {}) {
  const statistics = filters.StatisticsTime;
  return {
    ActiveStatus: filters.ActiveStatus ?? -1,
    AlgorithmTemplateId: filters.AlgorithmTemplateId ?? '',
    BeginTime: statistics?.[0]?.startOf('day').unix() ?? '',
    EndTime: statistics?.[1]?.endOf('day').unix() ?? '',
    FirstPayBeginTime: filters.FirstPayTime?.[0]?.startOf('day').unix() ?? '',
    FirstPayEndTime: filters.FirstPayTime?.[1]?.endOf('day').unix() ?? '',
    LoginAccount: filters.LoginAccount.trim().toLowerCase(),
    PackageId: filters.PackageId ?? '',
    Page: page.value,
    PageSize: pageSize.value,
    Promoter: filters.Promoter.trim(),
    RegBeginTime: filters.RegTime?.[0]?.startOf('day').unix() ?? '',
    RegEndTime: filters.RegTime?.[1]?.endOf('day').unix() ?? '',
    Sort: '',
    Status: filters.Status ?? '',
    VipLevel: filters.VipLevel ?? '',
    ...extra,
  };
}

function validAccount() {
  const account = filters.LoginAccount.trim();
  if (account && !/^[a-zA-Z0-9]{4,20}$/.test(account)) {
    message.warning('游戏账号须为 4-20 位英文字母或数字');
    return false;
  }
  if (!filters.StatisticsTime) {
    message.warning('请选择统计时间');
    return false;
  }
  return true;
}

async function loadMembers() {
  if (!canViewTable.value || !validAccount()) return;
  loading.value = true;
  try {
    const result = await fetchJuniorMemberListApi(memberQuery());
    rows.value = (result.Items || []).map((item) => ({
      ...item,
      WinLoss: Number(item.WinGold || 0) - Number(item.BetGold || 0),
    }));
    total.value = Number(result.Pagination.MaxCount || 0);
    totals.value = result.Total;
  } finally {
    loading.value = false;
  }
}

function searchMembers() {
  page.value = 1;
  loadMembers();
}

function resetFilters() {
  Object.assign(filters, {
    ActiveStatus: undefined,
    AlgorithmTemplateId: algorithmOptions.value[0]?.value,
    FirstPayTime: undefined,
    LoginAccount: '',
    PackageId: undefined,
    Promoter: '',
    RegTime: undefined,
    StatisticsTime: defaultStatisticsRange(),
    Status: undefined,
    VipLevel: undefined,
  });
  page.value = 1;
  loadMembers();
}

const amountFields = new Set([
  'BetGold',
  'Gold',
  'PayMoney',
  'RedMoney',
  'WinLoss',
  'WithDrawMoney',
]);
const dateFields = new Set([
  'ChangeAgentTime',
  'CreateTime',
  'FirstPayTime',
  'LastTime',
]);

function displayCell(field: string, value: unknown, row?: Row) {
  if (amountFields.has(field)) return formatAmountFromCent(Number(value || 0));
  if (dateFields.has(field)) return formatNetcashDateTime(value as number);
  if (field === 'ActiveStatus') return Number(value) === 1 ? '活跃' : '不活跃';
  if (field === 'DataFlag') return Number(value) === 0 ? '正式' : '测试';
  if (field === 'VipLevel') return value === null || value === undefined ? '-' : `VIP${value}`;
  if (field === 'Status') return statusMap[Number(value)] || String(value ?? '-');
  if (field === 'LoginAccount') return String(row?.LoginAccount ?? '-');
  return value === null || value === undefined || value === '' ? '-' : String(value);
}

function totalValue(field: string) {
  const map: Record<string, string> = {
    BetGold: 'TotalBetGold',
    Gold: 'TotalGold',
    PayMoney: 'TotalPayMoney',
    RedMoney: 'TotalRedMoney',
    WithDrawMoney: 'TotalWithDrawMoney',
  };
  if (field === 'WinLoss') {
    return formatAmountFromCent(
      Number(totals.value.TotalWinGold || 0) -
        Number(totals.value.TotalBetGold || 0),
    );
  }
  return map[field]
    ? formatAmountFromCent(Number(totals.value[map[field]] || 0))
    : '-';
}

function openDetail(row: Row) {
  if (!canViewDetail.value) return;
  router.push(buildPlayerDetailPath(row.PlayerId, row.LoginAccount));
}

async function exportMembers() {
  if (!validAccount()) return;
  exportLoading.value = true;
  try {
    const result = await fetchJuniorMemberListApi(
      memberQuery({ IsExp: true, Page: 1, PageSize: Math.max(total.value + 1, 1) }),
    );
    if (!result.Items?.length) {
      message.info('暂无可导出数据');
      return;
    }
    const exportRows = result.Items.map((row) => {
      const normalized: Row = {
        ...row,
        WinLoss: Number(row.WinGold || 0) - Number(row.BetGold || 0),
      };
      return Object.fromEntries(
        memberColumns.value
          .filter((column) => column.dataIndex !== 'action')
          .map((column) => [
            String(column.title),
            displayCell(String(column.dataIndex), normalized[String(column.dataIndex)], normalized),
          ]),
      );
    });
    exportRows.push(
      Object.fromEntries(
        memberColumns.value
          .filter((column) => column.dataIndex !== 'action')
          .map((column, index) => [
            String(column.title),
            index === 0 ? '合计' : totalValue(String(column.dataIndex)),
          ]),
      ),
    );
    writeWorkbook(exportRows, '下级成员');
  } finally {
    exportLoading.value = false;
  }
}

const changeModalOpen = ref(false);
const changeSubmitting = ref(false);
const changeChannelOptions = ref<Option[]>([]);
const changeRow = ref<Row>({});
const changeForm = reactive({
  AdminId: undefined as number | string | undefined,
  DataFlag: 0,
  FromChannelId: '' as number | string,
  LoginAccount: '',
  Note: '',
  PlayerId: '' as number | string,
  PromoterUserName: '',
  ToChannelId: undefined as number | string | undefined,
});

async function loadChangeChannels() {
  const list = await fetchJuniorChangeChannelListApi({
    AdminId: changeForm.AdminId,
    ChannelId: changeForm.FromChannelId,
    DataSearchType: changeForm.DataFlag,
  });
  changeChannelOptions.value = list
    .filter((item) => String(item.ChannelId) !== String(changeForm.FromChannelId))
    .map((item) => ({
      label: `${item.Name || '-'} (${item.ChannelName || item.ChannelId || '-'})`,
      value: item.ChannelId as number | string,
    }));
  changeForm.ToChannelId = changeChannelOptions.value[0]?.value;
}

async function openChangeModal(row: Row) {
  changeRow.value = row;
  Object.assign(changeForm, {
    AdminId: undefined,
    DataFlag: Number(row.DataFlag || 0),
    FromChannelId: row.ChannelId ?? '',
    LoginAccount: row.LoginAccount ?? '',
    Note: '',
    PlayerId: row.PlayerId ?? '',
    PromoterUserName: row.PromoterUserName ?? '',
    ToChannelId: undefined,
  });
  changeModalOpen.value = true;
  await loadChangeChannels();
}

async function submitChangeModal() {
  if (!changeForm.ToChannelId) {
    message.warning('请选择变更渠道');
    return;
  }
  if (changeForm.Note && changeForm.Note.length > 400) {
    message.warning('备注最多 400 个字符');
    return;
  }
  changeSubmitting.value = true;
  try {
    await changeJuniorAgentApi({ ...changeForm });
    message.success('变更成功');
    changeModalOpen.value = false;
    loadMembers();
  } finally {
    changeSubmitting.value = false;
  }
}

const importOpen = ref(false);
const importLoading = ref(false);
const importSubmitting = ref(false);
const importRows = ref<Row[]>([]);
const importForm = reactive({
  AdminId: undefined as number | string | undefined,
  BulkNotes: '',
  ToChannel: undefined as number | string | undefined,
});
const importChannelOptions = ref<Option[]>([]);
const importStats = computed(() => ({
  invalid: importRows.value.filter((item) => !item.PlayerExists).length,
  total: importRows.value.length,
  valid: importRows.value.filter((item) => item.PlayerExists).length,
}));
const importSummaryItems = computed(() => [
  { label: '导入总数', value: importStats.value.total },
  { label: '有效', value: importStats.value.valid, valueClass: 'text-emerald-500' },
  { label: '无效', value: importStats.value.invalid, valueClass: 'text-red-500' },
]);
const importColumns: Column[] = [
  { dataIndex: 'PlayerAccount', title: '游戏账号', width: 180 },
  { dataIndex: 'PackageName', title: '所属产品', width: 150 },
  { dataIndex: 'OriginalAdmin', title: '原代理', width: 150 },
  { dataIndex: 'PlayerExists', title: '预验证', width: 90 },
];

function downloadTemplate() {
  writeWorkbook([{ 游戏账号: '', 所属产品: '' }], '批量转代理模板');
}

const beforeImportUpload: UploadProps['beforeUpload'] = async (file) => {
  if (file.size / 1024 / 1024 >= 1) {
    message.error('文件大小不能超过 1MB');
    return Upload.LIST_IGNORE;
  }
  importLoading.value = true;
  try {
    const data = await file.arrayBuffer();
    const book = XLSX.read(data, { type: 'array' });
    const firstSheet = book.Sheets[book.SheetNames[0] || ''];
    const raw = firstSheet
      ? (XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as Row[])
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
      PlayerAccount: String(item.游戏账号 ?? item.PlayerAccount ?? '').trim(),
    }));
    if (players.some((item) => !item.PlayerAccount || !item.PackageName)) {
      message.error('文件格式错误，请使用模板并完整填写游戏账号、所属产品');
      return Upload.LIST_IGNORE;
    }
    importRows.value = await validateJuniorImportApi(players);
    message.success('预验证完成，请确认有效与无效统计');
  } finally {
    importLoading.value = false;
  }
  return Upload.LIST_IGNORE;
};

async function loadImportChannels() {
  importForm.ToChannel = undefined;
  importChannelOptions.value = [];
  const selected = agentOptions.value.find(
    (option) => option.value === importForm.AdminId,
  );
  if (!selected) return;
  const list = await fetchJuniorAgentChannelsApi({
    ChannelType: 2,
    PromoterAdminId: selected.value,
  });
  importChannelOptions.value = list.map((item) => ({
    label: `${item.ChannelId || '-'} (${item.PackageName || '-'})`,
    value: item.ChannelId as number | string,
  }));
}

async function submitImport() {
  const validPlayers = importRows.value.filter((item) => item.PlayerExists);
  if (validPlayers.length === 0) {
    message.warning('请先上传并使用预验证有效的数据');
    return;
  }
  if (!importForm.AdminId || !importForm.ToChannel) {
    message.warning('请选择目标代理和渠道');
    return;
  }
  if (importForm.BulkNotes.length > 400) {
    message.warning('备注最多 400 个字符');
    return;
  }
  importSubmitting.value = true;
  try {
    const players = validPlayers.map((item) => ({
      ...item,
      Note: importForm.BulkNotes,
      ToCloneChannelId: importForm.ToChannel,
    }));
    await submitJuniorImportApi({
      AdminId: importForm.AdminId,
      Players: JSON.stringify(players),
    });
    message.success('批量转代理成功');
    importOpen.value = false;
    loadMembers();
  } finally {
    importSubmitting.value = false;
  }
}

async function loadOptions() {
  const [algorithms, agents] = await Promise.all([
    fetchJuniorAlgorithmOptionsApi(),
    fetchJuniorAgentOptionsApi({
      AdminId: '',
      AdminType: 7,
      ChannelId: '',
      ChannelName: '',
      IsChangeAdmin: true,
      PromoterAdminName: '',
      PromoterAdminUserName: '',
    }),
  ]);
  algorithmOptions.value = algorithms.map((item) => ({
    label: String(item.TemplateName || item.Name || '-'),
    value: item.Id as number | string,
  }));
  filters.AlgorithmTemplateId = algorithmOptions.value[0]?.value;
  agentOptions.value = agents.map((item) => ({
    label: String(item.Username || item.Name || item.Id || '-'),
    value: item.Id as number | string,
  }));
}

onMounted(async () => {
  await loadOptions();
  if (canViewTable.value) loadMembers();
});
</script>

<template>
  <template v-if="canViewTable">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filters.LoginAccount"
          allow-clear
          @press-enter="searchMembers"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filters.Promoter"
          allow-clear
          @press-enter="searchMembers"
          placeholder="请输入归属代理"
        >
          <template #addonBefore>归属代理</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">产品包</span>
        <Select
          v-model:value="filters.PackageId"
          allow-clear
          :options="packageOptions"
          placeholder="请选择产品包"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">玩家状态</span>
        <Select
          v-model:value="filters.Status"
          allow-clear
          :options="Object.entries(statusMap).map(([value, label]) => ({ label, value: Number(value) }))"
          placeholder="请选择玩家状态"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">活跃状态</span>
        <Select
          v-model:value="filters.ActiveStatus"
          allow-clear
          :options="[{ label: '不活跃', value: 0 }, { label: '活跃', value: 1 }]"
          placeholder="请选择活跃状态"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">VIP等级</span>
        <Select
          v-model:value="filters.VipLevel"
          allow-clear
          :options="vipOptions"
          placeholder="请选择VIP等级"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">佣金算法</span>
        <Select
          v-model:value="filters.AlgorithmTemplateId"
          allow-clear
          :options="algorithmOptions"
          placeholder="请选择佣金算法"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filters.RegTime" />
        </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filters.FirstPayTime" />
        </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filters.StatisticsTime" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="searchMembers">查询</Button>
      <Button @click="resetFilters">重置</Button>
        </div>
    </div>
  </div>
    <div class="mb-3 flex justify-end gap-2">
      <Button
        v-if="canBatchImport"
        type="primary"
        @click="importOpen = true"
      >
        批量转代理
      </Button>
      <Button
        v-if="canBatchImport"
        :loading="exportLoading"
        @click="exportMembers"
      >
        导出 Excel
      </Button>
    </div>
    <Table
      :columns="memberColumns"
      :data-source="rows"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        showSizeChanger: true,
        total,
      }"
      row-key="PlayerId"
      :scroll="{ x: 2300 }"
      size="small"
      bordered
      @change="(pagination) => {
        page = pagination.current || 1;
        pageSize = pagination.pageSize || 20;
        loadMembers();
      }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'ActiveStatus'">
          <Tag :color="Number(record.ActiveStatus) === 1 ? 'green' : 'red'">
            {{ displayCell('ActiveStatus', record.ActiveStatus) }}
          </Tag>
        </template>
        <template v-else-if="column.dataIndex === 'LoginAccount'">
          <Button
            v-if="canViewDetail"
            type="link"
            size="small"
            @click="openDetail(record)"
          >
            {{ record.LoginAccount || '-' }}
          </Button>
          <span v-else>{{ record.LoginAccount || '-' }}</span>
          <Tag v-if="Number(record.Status) !== 0" class="ml-1">
            {{ statusMap[Number(record.Status)] || record.Status }}
          </Tag>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <Button type="link" size="small" @click="openChangeModal(record)">
            改代理/渠道
          </Button>
        </template>
        <template v-else>
          {{ displayCell(String(column.dataIndex), record[String(column.dataIndex)], record) }}
        </template>
      </template>
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell
              v-for="(column, index) in memberColumns"
              :key="String(column.dataIndex)"
              :index="index"
            >
              <strong v-if="index === 0">合计</strong>
              <strong v-else-if="amountFields.has(String(column.dataIndex))">
                {{ totalValue(String(column.dataIndex)) }}
              </strong>
              <span v-else>-</span>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>
  </template>
  <Result v-else status="403" sub-title="无成员列表权限（11422）" title="403" />

  <Modal
    v-model:open="changeModalOpen"
    :confirm-loading="changeSubmitting"
    title="改代理与渠道"
    @ok="submitChangeModal"
  >
    <Form layout="vertical">
      <Form.Item label="游戏账号">
        <Input v-model:value="changeForm.LoginAccount" disabled />
      </Form.Item>
      <Form.Item label="当前归属代理">
        <Input v-model:value="changeForm.PromoterUserName" disabled />
      </Form.Item>
      <Form.Item label="目标代理">
        <Select
          v-model:value="changeForm.AdminId"
          allow-clear
          :options="agentOptions"
          placeholder="请选择目标代理（可选）"
          show-search
          style="width: 100%"
          @change="loadChangeChannels"
        />
      </Form.Item>
      <Form.Item label="目标渠道" required>
        <Select
          v-model:value="changeForm.ToChannelId"
          :options="changeChannelOptions"
          placeholder="请选择目标渠道"
          show-search
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="changeForm.Note"
          :maxlength="400"
          placeholder="请输入备注"
          show-count
        />
        <p class="mt-1 text-xs text-red-500">
          变更后玩家将归属新代理及渠道，请确认后再提交
        </p>
      </Form.Item>
    </Form>
  </Modal>

  <Modal
    v-model:open="importOpen"
    :confirm-loading="importSubmitting"
    title="批量转代理"
    width="850px"
    @ok="submitImport"
    @cancel="importRows = []"
  >
    <Space class="mb-4" wrap>
      <Upload
        accept=".xlsx,.xls,.csv"
        :before-upload="beforeImportUpload"
        :show-upload-list="false"
      >
        <Button :loading="importLoading" type="primary">上传 Excel</Button>
      </Upload>
      <Button @click="downloadTemplate">下载模板</Button>
      <span class="text-gray-500">最多 1000 条，文件不超过 1MB</span>
    </Space>
    <SummaryCards :items="importSummaryItems" />
    <Table
      class="mb-4"
      :columns="importColumns"
      :data-source="importRows"
      :pagination="false"
      row-key="PlayerAccount"
      :scroll="{ y: 220 }"
      size="small"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'OriginalAdmin'">
          {{ record.OriginalAdmin || '玩家不存在' }}
        </template>
        <template v-else-if="column.dataIndex === 'PlayerExists'">
          <Tag :color="record.PlayerExists ? 'green' : 'red'">
            {{ record.PlayerExists ? '有效' : '无效' }}
          </Tag>
        </template>
      </template>
    </Table>
    <Form layout="vertical">
      <Form.Item label="目标代理" required>
        <Select
          v-model:value="importForm.AdminId"
          :options="agentOptions"
          placeholder="请选择目标代理"
          show-search
          style="width: 100%"
          @change="loadImportChannels"
        />
      </Form.Item>
      <Form.Item label="目标渠道" required>
        <Select
          v-model:value="importForm.ToChannel"
          :options="importChannelOptions"
          placeholder="请选择目标渠道"
          show-search
          style="width: 100%"
        />
      </Form.Item>
      <Form.Item label="备注">
        <Input.TextArea
          v-model:value="importForm.BulkNotes"
          :maxlength="400"
          placeholder="请输入备注"
          show-count
        />
      </Form.Item>
    </Form>
  </Modal>
</template>

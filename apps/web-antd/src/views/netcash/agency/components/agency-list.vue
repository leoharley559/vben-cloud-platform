<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AgencyListItem } from '#/types/netcash';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchAgencyListApi,
  switchAgencyStatusApi,
} from '#/api/netcash/agency';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  AGENCY_ACCOUNT_TYPE_MAP,
  AGENCY_SEND_COMMISSION_TYPE_MAP,
  AGENCY_SETTLEMENT_TYPE_MAP,
  AGENCY_STATUS_MAP,
  AGENCY_TYPE_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';

import AgencyFanDianModal from './agency-fandian-modal.vue';
import AgencyFormModal from './agency-form-modal.vue';
import AgencyMemberDetailModal from './agency-member-detail-modal.vue';
import AgencyMemberModal from './agency-member-modal.vue';

defineOptions({ name: 'AgencyList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

/** 真实产品列表（不含「全部产品」占位） */
const realPackageList = computed(() =>
  packageOptions.value.filter(
    (item) => item.PackageId !== '' && item.PackageId != null,
  ),
);

/** 对齐旧站 packageIdFilter：仅空/-1 视为全部产品；具体 ID 反查名称 */
function formatPackageNames(packageId?: null | number | string) {
  const raw =
    packageId === undefined || packageId === null
      ? ''
      : String(packageId).trim();
  if (!raw || raw === '-1') {
    return '全部产品';
  }

  const selectedIds = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (selectedIds.length === 0 || selectedIds.includes('-1')) {
    return '全部产品';
  }

  const list = realPackageList.value;
  const names: string[] = [];
  for (const id of selectedIds) {
    const hit = list.find(
      (item) =>
        String(item.PackageId) === String(id) ||
        Number(item.PackageId) === Number(id),
    );
    if (hit?.PackageName) {
      names.push(String(hit.PackageName).trim());
    }
  }

  // 接口偶发仍回传「全部勾选后的 id 列表」而非 -1，此时才显示全部产品
  if (
    list.length > 1 &&
    selectedIds.length === list.length &&
    names.length === list.length
  ) {
    return '全部产品';
  }

  if (names.length > 0) {
    return names.join(', ');
  }

  // 配置未命中时回退原始值，避免误显示「全部产品」
  return raw;
}

const canViewList = computed(() => checkPermission(10_085));
const canSwitch = computed(() => checkPermission(10_111));
const canAdd = computed(() => checkPermission(10_106));
const canEdit = computed(() => checkPermission(10_110));
const canAddMember = computed(() => checkPermission(11_353));

const formModalOpen = ref(false);
const formModalMode = ref<'create' | 'edit'>('create');
const formModalRow = ref<AgencyListItem | null>(null);

function openCreateModal() {
  formModalMode.value = 'create';
  formModalRow.value = null;
  formModalOpen.value = true;
}

function openEditModal(row: AgencyListItem) {
  formModalMode.value = 'edit';
  formModalRow.value = row;
  formModalOpen.value = true;
}

const filterUsername = ref('');
const filterTeamName = ref('');
const filterDeveloperName = ref('');
const filterMaintainerName = ref('');
const filterStatus = ref<number | string>();
const filterType = ref<Array<number | string>>([]);
const filterMobile = ref('');
const filterRegistIP = ref('');
const filterLastLoginIP = ref('');
const filterRegistDevice = ref('');
const filterLastLoginDevice = ref('');
const filterWithdrawAccName = ref('');
const filterWithdrawAccNum = ref('');
const filterMainUsername = ref('');
const filterParentAdminId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const statisticsRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().startOf('month'),
  dayjs().endOf('day'),
]);
const drillPath = ref<Array<{ id: number | string; username: string }>>([]);
const totalData = ref<Record<string, number>>({});

const COLUMN_STORAGE_KEY = 'agencyListMore';
/** 显示列候选（含默认选中项，对齐会员列表交互） */
const COLUMN_OPTIONS = [
  { label: '代理账号', value: 'Username' },
  { label: '状态', value: 'Status' },
  { label: '姓名', value: 'Name' },
  { label: '手机号', value: 'MobileNumber' },
  { label: '发展人', value: 'DeveloperName' },
  { label: '创建时间', value: 'CreateTime' },
  { label: '代理类型', value: 'Type' },
  { label: '代理模式', value: 'AccountType' },
  { label: '上级账号', value: 'MainUsername' },
  { label: '代理层级', value: 'AccountLevel' },
  { label: '团队', value: 'TeamName' },
  { label: '下级代理', value: 'LowerAgent' },
  { label: '佣金级距', value: 'CommissionRateDiff' },
  { label: '佣金算法', value: 'AlgorithmTemplateName' },
  { label: '佣金周期', value: 'SettlementType' },
  { label: '发佣方式', value: 'SendCommissionType' },
  { label: '返水配置', value: 'AgentFanDianConfig' },
  { label: '推广产品', value: 'PackageId' },
  { label: '场馆费率', value: 'ApiFeeTemplateName' },
  { label: '下级会员', value: 'Members' },
  { label: '活跃人数', value: 'SumActiveStatus' },
  { label: '存款', value: 'SumPayMoney' },
  { label: '提款', value: 'SumWithDrawMoney' },
  { label: '有效投注', value: 'SumBetValidMoney' },
  { label: '总输赢', value: 'SumWinGold' },
  { label: '注册IP', value: 'RegIp' },
  { label: '注册地址', value: 'RegAddress' },
  { label: '最后登录IP', value: 'LastLoginIp' },
  { label: '最后登录地址', value: 'LastLoginAddress' },
  { label: '维护人', value: 'MaintainerName' },
  { label: '备注', value: 'RemarkOnDeactivation' },
];

const DEFAULT_COLUMNS = [
  'Username',
  'Status',
  'Name',
  'CreateTime',
  'Type',
  'AccountType',
  'MainUsername',
  'SettlementType',
  'AgentFanDianConfig',
  'Members',
  'SumActiveStatus',
  'SumPayMoney',
  'SumWithDrawMoney',
  'SumBetValidMoney',
  'SumWinGold',
  'LastLoginIp',
  'MaintainerName',
  'RemarkOnDeactivation',
];

const visibleColumns = ref<string[]>(
  (() => {
    try {
      const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return parsed.length > 0 ? parsed : [...DEFAULT_COLUMNS];
    } catch {
      return [...DEFAULT_COLUMNS];
    }
  })(),
);

function showColumn(field: string) {
  // 代理账号与操作列常驻，保证列表可用性
  if (field === 'Username' || field === 'action') {
    return true;
  }
  return visibleColumns.value.includes(field);
}

function getQueryParams(page: { currentPage: number; pageSize: number }) {
  return {
    DeveloperName: filterDeveloperName.value,
    BeginTime: filterDateRange.value?.[0]?.unix() || '',
    EndTime: filterDateRange.value?.[1]?.unix() || '',
    CountBeginTime: statisticsRange.value?.[0]?.unix() || '',
    CountEndTime: statisticsRange.value?.[1]?.unix() || '',
    LastLoginDevice: filterLastLoginDevice.value,
    LastLoginIP: filterLastLoginIP.value,
    MainUsername: filterMainUsername.value,
    MaintainerName: filterMaintainerName.value,
    MobileNumber: filterMobile.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    ParentAdminId: filterParentAdminId.value,
    RegistDevice: filterRegistDevice.value,
    RegistIP: filterRegistIP.value,
    Status: filterStatus.value || '',
    TeamName: filterTeamName.value,
    // 对齐旧站：多选 Type；空选默认传 1,2,3（普通/特殊/测试）
    Type: filterType.value.length
      ? filterType.value.map(String).join(',')
      : '1,2,3',
    Username: filterUsername.value,
    WithdrawAccName: filterWithdrawAccName.value,
    WithdrawAccNum: filterWithdrawAccNum.value,
  };
}

function buildColumns(): VxeTableGridOptions<AgencyListItem>['columns'] {
  const allColumns: VxeTableGridOptions<AgencyListItem>['columns'] = [
    {
      field: 'Username',
      fixed: 'left',
      minWidth: 130,
      slots: { default: 'username' },
      title: '代理账号',
    },
    {
      field: 'Status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'Name', minWidth: 100, title: '姓名' },
    { field: 'MobileNumber', minWidth: 120, title: '手机号' },
    { field: 'DeveloperName', minWidth: 120, title: '发展人' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatNetcashDateTime(cellValue),
      minWidth: 160,
      title: '创建时间',
    },
    {
      field: 'Type',
      formatter: ({ cellValue }) =>
        AGENCY_TYPE_MAP[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 100,
      title: '代理类型',
    },
    {
      field: 'AccountType',
      formatter: ({ cellValue }) =>
        AGENCY_ACCOUNT_TYPE_MAP[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 110,
      title: '代理模式',
    },
    {
      field: 'MainUsername',
      minWidth: 120,
      slots: { default: 'mainUsername' },
      title: '上级账号',
    },
    { field: 'AccountLevel', minWidth: 90, title: '代理层级' },
    { field: 'TeamName', minWidth: 120, title: '团队' },
    {
      field: 'LowerAgent',
      minWidth: 90,
      slots: { default: 'lowerAgent' },
      title: '下级代理',
    },
    {
      field: 'CommissionRateDiff',
      formatter: ({ cellValue }) =>
        `${(Number(cellValue || 0) / 100).toFixed(2)}%`,
      minWidth: 110,
      title: '佣金级距',
    },
    { field: 'AlgorithmTemplateName', minWidth: 130, title: '佣金算法' },
    {
      field: 'SettlementType',
      formatter: ({ cellValue }) =>
        AGENCY_SETTLEMENT_TYPE_MAP[Number(cellValue)] ||
        String(cellValue ?? '-'),
      minWidth: 100,
      title: '佣金周期',
    },
    {
      field: 'SendCommissionType',
      formatter: ({ cellValue }) =>
        AGENCY_SEND_COMMISSION_TYPE_MAP[Number(cellValue)] ||
        String(cellValue ?? '-'),
      minWidth: 140,
      title: '发佣方式',
    },
    {
      field: 'AgentFanDianConfig',
      minWidth: 100,
      slots: { default: 'fanDian' },
      title: '返水配置',
    },
    {
      field: 'PackageId',
      formatter: ({ cellValue }) => formatPackageNames(cellValue),
      minWidth: 130,
      title: '推广产品',
    },
    { field: 'ApiFeeTemplateName', minWidth: 130, title: '场馆费率' },
    { field: 'Members', minWidth: 90, slots: { default: 'members' }, title: '下级会员' },
    { field: 'SumActiveStatus', minWidth: 90, slots: { default: 'activeMembers' }, title: '活跃人数' },
    {
      field: 'SumPayMoney',
      formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '存款',
    },
    {
      field: 'SumWithDrawMoney',
      formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '提款',
    },
    {
      field: 'SumBetValidMoney',
      formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue || 0)),
      minWidth: 110,
      title: '有效投注',
    },
    {
      field: 'SumWinGold',
      minWidth: 110,
      slots: { default: 'winLoss' },
      title: '总输赢',
    },
    { field: 'RegIp', minWidth: 130, title: '注册 IP' },
    { field: 'RegAddress', minWidth: 140, title: '注册地址' },
    { field: 'LastLoginIp', minWidth: 130, title: '最后登录 IP' },
    { field: 'LastLoginAddress', minWidth: 140, title: '最后登录地址' },
    { field: 'MaintainerName', minWidth: 110, title: '维护人' },
    {
      field: 'RemarkOnDeactivation',
      minWidth: 150,
      title: '备注',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 230,
      slots: { default: 'action' },
      title: '操作',
    },
  ];
  return (allColumns || []).filter((col) =>
    showColumn(String((col as { field?: string }).field ?? '')),
  );
}

const gridOptions: VxeTableGridOptions<AgencyListItem> = {
  columns: buildColumns(),
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await fetchAgencyListApi(getQueryParams(page));
          const items = result.Items || [];
          totalData.value = (result.Total || {}) as Record<string, number>;
          return {
            items,
            total: Number(result.Pagination?.MaxCount || items.length),
          };
        } catch {
          totalData.value = {};
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function persistColumns() {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns.value));
  try {
    gridApi.setGridOptions?.({ columns: buildColumns() });
  } catch {
    // 适配器差异时忽略
  }
}

function resetFilters() {
  filterUsername.value = '';
  filterTeamName.value = '';
  filterDeveloperName.value = '';
  filterMaintainerName.value = '';
  filterStatus.value = undefined;
  filterType.value = [];
  filterMobile.value = '';
  filterRegistIP.value = '';
  filterLastLoginIP.value = '';
  filterRegistDevice.value = '';
  filterLastLoginDevice.value = '';
  filterWithdrawAccName.value = '';
  filterWithdrawAccNum.value = '';
  filterMainUsername.value = '';
  filterParentAdminId.value = '';
  filterDateRange.value = undefined;
  statisticsRange.value = [
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ];
  drillPath.value = [];
  gridApi.reload();
}

/** 行内 AdminId / Id 收窄为接口可用的 id，避免索引签名带来的 unknown */
function resolveRowAdminId(row: AgencyListItem | null | undefined) {
  const value = row?.AdminId ?? row?.Id;
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value);
}

/** 金额类字段收窄，供 formatAmount / 输赢计算使用 */
function asAmountInput(value: unknown): null | number | string | undefined {
  if (value === undefined || value === null) return value;
  if (typeof value === 'number' || typeof value === 'string') return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/** 文本类字段收窄，供链接 username 等展示使用 */
function asDisplayText(value: unknown): number | string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' || typeof value === 'string') return value;
  return String(value);
}

function drillDown(row: AgencyListItem) {
  const adminId = resolveRowAdminId(row);
  if (!adminId || Number(row.LowerAgent || 0) <= 0) {
    return;
  }
  drillPath.value.push({
    id: adminId,
    username: String(row.Username || adminId),
  });
  filterParentAdminId.value = String(adminId);
  gridApi.reload();
}

function drillBack(index: number) {
  const target = drillPath.value[index - 1];
  drillPath.value = drillPath.value.slice(0, index);
  filterParentAdminId.value = target ? String(target.id) : '';
  gridApi.reload();
}

const statusModalOpen = ref(false);
const statusRow = ref<AgencyListItem>();
const statusRemark = ref('');
const statusSubmitting = ref(false);

function handleSwitch(row: AgencyListItem) {
  statusRow.value = row;
  statusRemark.value = '';
  statusModalOpen.value = true;
}

async function submitStatus() {
  if (!/^[^\r\n]{1,400}$/.test(statusRemark.value.trim())) {
    message.warning('请输入 1-400 个字符的状态变更备注，不能包含换行');
    return;
  }
  const row = statusRow.value;
  const adminId = resolveRowAdminId(row);
  if (!row || !adminId) {
    return;
  }
  statusSubmitting.value = true;
  try {
    await switchAgencyStatusApi({
      AdminId: adminId,
      Name: String(row.Username || row.Name || ''),
      RemarkOnDeactivation: statusRemark.value.trim(),
      Status: Number(row.Status) === 1 ? 2 : 1,
    });
    message.success('操作成功');
    statusModalOpen.value = false;
    gridApi.reload();
  } catch {
    // 全局拦截已提示；避免未捕获异常
  } finally {
    statusSubmitting.value = false;
  }
}

const memberModalOpen = ref(false);
const memberRow = ref<AgencyListItem>();
function openMemberModal(row: AgencyListItem) {
  if (!row.AdminId) return;
  memberRow.value = row;
  memberModalOpen.value = true;
}

const fanDianOpen = ref(false);
const fanDianRow = ref<AgencyListItem | null>(null);
function openFanDianModal(row: AgencyListItem) {
  fanDianRow.value = row;
  fanDianOpen.value = true;
}

const memberDetailOpen = ref(false);
const memberDetailActiveOnly = ref(false);
const memberDetailRow = ref<AgencyListItem>();
function openMemberDetail(row: AgencyListItem, activeOnly: boolean) {
  if (!row.AdminId) return;
  memberDetailRow.value = row;
  memberDetailActiveOnly.value = activeOnly;
  memberDetailOpen.value = true;
}

function getWinLossAmount(sumWinGold?: null | number | string) {
  const amount = Number(sumWinGold || 0);
  return amount === 0 ? 0 : -amount;
}

/** 输赢着色：盈利绿、亏损红 */
function winLossClass(amount: number) {
  if (amount > 0) return 'text-emerald-500';
  return amount < 0 ? 'text-red-500' : '';
}

const summaryItems = computed(() => {
  const winLoss = getWinLossAmount(totalData.value.SumWinGold);
  return [
    {
      label: '会员',
      value: totalData.value.TotalMember ?? totalData.value.Members ?? 0,
    },
    {
      label: '存款',
      value: formatAmountFromCent(
        totalData.value.SumPayMoney ?? totalData.value.TotalPayMoney ?? 0,
      ),
    },
    {
      label: '提款',
      value: formatAmountFromCent(
        totalData.value.SumWithDrawMoney ??
          totalData.value.TotalWithDrawMoney ??
          0,
      ),
    },
    {
      label: '有效投注',
      value: formatAmountFromCent(
        totalData.value.SumBetValidMoney ?? totalData.value.TotalBetMoney ?? 0,
      ),
    },
    {
      label: '输赢',
      value: formatAmountFromCent(winLoss),
      valueClass: winLossClass(winLoss),
    },
  ];
});

const exportLoading = ref(false);
async function exportAgencyList() {
  exportLoading.value = true;
  try {
    const result = await fetchAgencyListApi({
      ...getQueryParams({ currentPage: 1, pageSize: 100_000 }),
      IsExp: true,
    });
    const data = (result?.Items || []).map((row) => ({
      状态: AGENCY_STATUS_MAP[Number(row.Status)] || row.Status,
      代理账号: row.Username,
      姓名: row.Name,
      手机号: row.MobileNumber,
      发展人: row.DeveloperName,
      创建时间: formatNetcashDateTime(row.CreateTime),
      代理类型: AGENCY_TYPE_MAP[Number(row.Type)] || row.Type,
      代理模式: AGENCY_ACCOUNT_TYPE_MAP[Number(row.AccountType)] || row.AccountType,
      上级账号: row.MainUsername,
      代理层级: row.AccountLevel,
      团队: row.TeamName,
      下级代理: row.LowerAgent,
      佣金级距: `${(Number(row.CommissionRateDiff || 0) / 100).toFixed(2)}%`,
      佣金算法: row.AlgorithmTemplateName || row.AlgorithmTemplateId,
      佣金周期:
        AGENCY_SETTLEMENT_TYPE_MAP[Number(row.SettlementType)] ||
        row.SettlementType,
      发佣方式:
        AGENCY_SEND_COMMISSION_TYPE_MAP[Number(row.SendCommissionType)] ||
        row.SendCommissionType,
      推广产品: formatPackageNames(asDisplayText(row.PackageId)),
      场馆费率: row.ApiFeeTemplateName || row.ApiFeeTemplateId,
      下级会员: row.Members,
      活跃人数: row.SumActiveStatus,
      存款: formatAmountFromCent(Number(row.SumPayMoney || 0)),
      提款: formatAmountFromCent(Number(row.SumWithDrawMoney || 0)),
      有效投注: formatAmountFromCent(Number(row.SumBetValidMoney || 0)),
      总输赢: formatAmountFromCent(
        getWinLossAmount(asAmountInput(row.SumWinGold)),
      ),
      注册IP: row.RegIp,
      注册地址: row.RegAddress,
      最后登录IP: row.LastLoginIp,
      最后登录地址: row.LastLoginAddress,
      维护人: row.MaintainerName,
      备注: row.RemarkOnDeactivation,
    }));
    if (data.length === 0) return void message.warning('暂无可导出数据');
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(data), '代理列表');
    XLSX.writeFile(book, `代理列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
  } catch {
    // 全局拦截已提示
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canViewList.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewList">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterUsername"
          allow-clear
          placeholder="请输入代理账号"
        >
          <template #addonBefore>代理账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterTeamName"
          allow-clear
          placeholder="请输入团队名称"
        >
          <template #addonBefore>团队名称</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterDeveloperName"
          allow-clear
          placeholder="请输入发展人"
        >
          <template #addonBefore>发展人</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterMaintainerName"
          allow-clear
          placeholder="请输入维护人"
        >
          <template #addonBefore>维护人</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
         
          :options="[
            { label: '启用', value: 1 },
            { label: '停用', value: 2 },
          ]"
          placeholder="请选择状态"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">代理类型</span>
        <Select
          v-model:value="filterType"
          allow-clear
          mode="multiple"
          :max-tag-count="1"
          :options="[
            { label: '普通代理', value: 1 },
            { label: '特殊代理', value: 2 },
            { label: '测试代理', value: 3 },
          ]"
          placeholder="请选择代理类型"
        />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterMobile"
          allow-clear
          placeholder="请输入手机号"
        >
          <template #addonBefore>手机号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterMainUsername"
          allow-clear
          placeholder="请输入上级账号"
        >
          <template #addonBefore>上级账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterParentAdminId"
          allow-clear
          placeholder="请输入下级代理 ID"
        >
          <template #addonBefore>下级代理 ID</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterWithdrawAccName"
          allow-clear
          placeholder="请输入银行姓名"
        >
          <template #addonBefore>银行姓名</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterWithdrawAccNum"
          allow-clear
          placeholder="请输入银行卡号"
        >
          <template #addonBefore>银行卡号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterRegistIP"
          allow-clear
          placeholder="请输入注册 IP"
        >
          <template #addonBefore>注册 IP</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLastLoginIP"
          allow-clear
          placeholder="请输入最后登录 IP"
        >
          <template #addonBefore>最后登录 IP</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterRegistDevice"
          allow-clear
          placeholder="请输入注册设备"
        >
          <template #addonBefore>注册设备</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLastLoginDevice"
          allow-clear
          placeholder="请输入最后登录设备"
        >
          <template #addonBefore>最后登录设备</template>
        </Input>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="statisticsRange" label="统计时间" />
        </div>
      <div class="query-filter-wide">
        <Space.Compact>
          <span class="query-field-addon">显示列</span>
          <Select
            v-model:value="visibleColumns"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            :options="COLUMN_OPTIONS"
            placeholder="请选择显示列"
            @change="persistColumns"
          />
        </Space.Compact>
      </div>
        <div class="query-filter-actions">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button :loading="exportLoading" @click="exportAgencyList">导出 Excel</Button>
      <Button v-if="canAdd" type="primary" @click="openCreateModal">
        新增代理
      </Button>
        </div>
    </div>
  </div>

    <div v-if="drillPath.length > 0" class="mb-3 flex items-center gap-1 text-sm">
      <Button size="small" type="link" @click="drillBack(0)">全部代理</Button>
      <template v-for="(item, index) in drillPath" :key="item.id">
        <span>/</span>
        <Button size="small" type="link" @click="drillBack(index + 1)">
          {{ item.username }}
        </Button>
      </template>
    </div>
    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #status="{ row }">
        <Tag :color="row.Status === 1 ? 'success' : 'error'">
          {{ AGENCY_STATUS_MAP[Number(row.Status)] || row.Status }}
        </Tag>
      </template>
      <template #lowerAgent="{ row }">
        <Button
          v-if="Number(row.LowerAgent || 0) > 0"
          size="small"
          type="link"
          @click="drillDown(row)"
        >
          {{ row.LowerAgent ?? 0 }}
        </Button>
        <span v-else>0</span>
      </template>
      <template #members="{ row }">
        <Button size="small" type="link" @click="openMemberDetail(row, false)">
          {{ row.Members ?? 0 }}
        </Button>
      </template>
      <template #activeMembers="{ row }">
        <Button size="small" type="link" @click="openMemberDetail(row, true)">
          查看
        </Button>
      </template>
      <template #winLoss="{ row }">
        <span
          :class="
            winLossClass(getWinLossAmount(asAmountInput(row.SumWinGold)))
          "
        >
          {{
            formatAmountFromCent(
              getWinLossAmount(asAmountInput(row.SumWinGold)),
            )
          }}
        </span>
      </template>
      <template #fanDian="{ row }">
        <Button size="small" type="link" @click="openFanDianModal(row)">
          查看
        </Button>
      </template>
      <template #username="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :query="{
            Name: String(row.Name || row.Username || ''),
            CountBeginTime: statisticsRange?.[0]?.startOf('day').unix() || '',
            CountEndTime: statisticsRange?.[1]?.endOf('day').unix() || '',
          }"
          :username="asDisplayText(row.Username)"
        />
      </template>
      <template #mainUsername="{ row }">
        <AgencyAccountLink
          :admin-id="
            resolveAgencyAdminId(row, 'MainAdminId', 'ParentAdminId')
          "
          :username="asDisplayText(row.MainUsername)"
        />
      </template>
      <template #action="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEditModal(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canSwitch"
            size="small"
            type="link"
            @click="handleSwitch(row)"
          >
            {{ row.Status === 1 ? '停用' : '启用' }}
          </Button>
          <Button
            v-if="canAddMember && Number(row.Type) !== 3"
            size="small"
            type="link"
            @click="openMemberModal(row)"
          >
            添加会员
          </Button>
        </Space>
      </template>
    </Grid>

    <AgencyFormModal
      v-model:open="formModalOpen"
      :mode="formModalMode"
      :row="formModalRow"
      @success="gridApi.reload()"
    />
    <AgencyMemberModal
      v-model:open="memberModalOpen"
      :admin-id="resolveRowAdminId(memberRow)"
      :admin-name="
        memberRow?.Username == null || memberRow.Username === ''
          ? undefined
          : String(memberRow.Username)
      "
      @success="gridApi.reload()"
    />
    <AgencyFanDianModal v-model:open="fanDianOpen" :row="fanDianRow" />
    <AgencyMemberDetailModal
      v-model:open="memberDetailOpen"
      :active-only="memberDetailActiveOnly"
      :admin-id="resolveRowAdminId(memberDetailRow)"
      :begin-time="statisticsRange?.[0]?.startOf('day').unix() || ''"
      :end-time="statisticsRange?.[1]?.endOf('day').unix() || ''"
      :username="
        memberDetailRow?.Username == null || memberDetailRow.Username === ''
          ? undefined
          : String(memberDetailRow.Username)
      "
    />
    <Modal
      v-model:open="statusModalOpen"
      :confirm-loading="statusSubmitting"
      title="状态变更"
      @ok="submitStatus"
    >
      <p class="mb-3">
        确认{{ Number(statusRow?.Status) === 1 ? '停用' : '启用' }}代理
        {{ statusRow?.Username || '' }}？
      </p>
      <Input
        v-model:value="statusRemark"
        :maxlength="200"
        placeholder="请输入统计时间"
      />
    </Modal>
  </div>
</template>

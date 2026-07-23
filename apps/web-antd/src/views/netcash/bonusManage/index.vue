<script lang="ts" setup>
import type {
  BonusAdminItem,
  BonusBatchResult,
  BonusManageItem,
} from '#/types/netcash';

import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Radio,
  Result,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

import {
  adjustBonusApi,
  approveBonusApi,
  batchProvideBonusApi,
  fetchBonusApproveListApi,
  fetchBonusHistoryListApi,
  provideBonusApi,
  queryBonusAdminIdApi,
} from '#/api/netcash/bonus-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import { createRequestHash } from '#/utils/crypto';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

defineOptions({ name: 'BonusManage' });

interface BatchPreviewRow extends BonusAdminItem {
  Amount: number;
  AmountYuan: number;
  valid: boolean;
}

type AuditAction = 'adjust' | 'batchApprove' | 'batchReject' | 'singleApprove' | 'singleReject';

const { checkPermission } = useCloudPermission();
const cloudStore = useCloudPlatformStore();

const canProvideTab = computed(() => checkPermission(11_355));
const canAuditTab = computed(() => checkPermission(11_356));
const canHistoryTab = computed(() => checkPermission(11_357));
const canSingleProvide = computed(() => checkPermission(11_358));
const canBatchProvide = computed(() => checkPermission(11_359));
const canAuditList = computed(() => checkPermission(11_360));
const canSingleApprove = computed(() => checkPermission(11_361));
const canBatchApprove = computed(() => checkPermission(11_362));
const canSingleReject = computed(() => checkPermission(11_363));
const canBatchReject = computed(() => checkPermission(11_364));
const canAdjust = computed(() => checkPermission(11_365));
const canExportHistory = computed(() => checkPermission(11_367));

const availableTabs = computed(() =>
  [
    { key: 'provide', permission: canProvideTab.value, title: '红利发放' },
    { key: 'audit', permission: canAuditTab.value, title: '审核列表' },
    { key: 'history', permission: canHistoryTab.value, title: '历史记录' },
  ].filter((item) => item.permission),
);
const canViewPage = computed(() => availableTabs.value.length > 0);
const activeTab = ref(availableTabs.value[0]?.key || 'provide');

const amountPattern = /^-?(?:[1-9]\d*|0\.\d{1,2}|[1-9]\d*\.\d{1,2})$/;

function validAmount(value: number | string | undefined, max = true) {
  if (value === undefined || value === null || value === '') return false;
  const text = String(value);
  return amountPattern.test(text) && (!max || Number(value) <= 100_000);
}

function validRemark(value: string, required: boolean) {
  if (!value) return !required;
  return /^[\s\S]{1,400}$/.test(value);
}

function statusText(value?: number) {
  return ({ 1: '待审核', 2: '已通过', 3: '已拒绝' })[Number(value)] || '-';
}

function statusColor(value?: number) {
  return ({ 1: 'processing', 2: 'success', 3: 'error' })[Number(value)] || 'default';
}

function exportWorkbook(
  rows: Array<Array<number | string>>,
  headers: string[],
  filename: string,
) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Sheet1');
  XLSX.writeFile(book, filename);
}

// 红利发放
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
    if (!parsed.length) {
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
  if (!batchSource.value.length) {
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
  if (!validBatchRows.value.length) {
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
  if (!batchUsed.value || !validBatchRows.value.length) {
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
  if (!failures.length) {
    message.warning('没有失败数据可导出');
    return;
  }
  exportWorkbook(
    failures.map((row) => [
      String(row.Username || ''),
      String(row.AdminId || ''),
      Number(row.Amount || 0) / 100,
      String(row.Msg || ''),
    ]),
    ['代理账号', '代理ID', '申请金额', '失败原因'],
    '红利批量发放失败结果.xlsx',
  );
}

// 审核列表
const todayRange = (): [dayjs.Dayjs, dayjs.Dayjs] => [
  dayjs().startOf('day'),
  dayjs().endOf('day'),
];
const auditFilters = reactive({
  ApplyDesc: '',
  ApplyName: '',
  BonusType: '' as number | string,
  Username: '',
  WalletType: '' as number | string,
});
const auditRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(todayRange());
const auditRows = ref<BonusManageItem[]>([]);
const auditLoading = ref(false);
const auditPage = ref(1);
const auditPageSize = ref(20);
const auditTotal = ref(0);
const auditTotalAmount = ref(0);
const selectedAuditRows = ref<BonusManageItem[]>([]);

function auditQuery() {
  const [begin, end] = auditRange.value || todayRange();
  return {
    ...auditFilters,
    BeginTime: begin.startOf('day').unix(),
    EndTime: end.endOf('day').unix(),
    IsExp: false,
    Page: auditPage.value,
    PageSize: auditPageSize.value,
  };
}

async function loadAudit() {
  if (!canAuditList.value) return;
  auditLoading.value = true;
  try {
    const result = await fetchBonusApproveListApi(auditQuery());
    auditRows.value = result.Items || [];
    auditTotal.value = Number(result.Pagination?.MaxCount || 0);
    auditTotalAmount.value = Number(result.Total?.Total || 0);
    selectedAuditRows.value = [];
  } catch {
    auditRows.value = [];
    auditTotal.value = 0;
    auditTotalAmount.value = 0;
    selectedAuditRows.value = [];
  } finally {
    auditLoading.value = false;
  }
}

function searchAudit() {
  auditPage.value = 1;
  void loadAudit();
}

function resetAudit() {
  Object.assign(auditFilters, {
    ApplyDesc: '',
    ApplyName: '',
    BonusType: '',
    Username: '',
    WalletType: '',
  });
  auditRange.value = todayRange();
  searchAudit();
}

function canOperateAuditRow(row: BonusManageItem) {
  return (
    Number(row.Approve) === 1 &&
    !isSameAcctActionRestricted(47, row.CreateAdminId)
  );
}

const auditRowSelection = computed(() => ({
  getCheckboxProps: (row: BonusManageItem) => ({
    disabled: !canOperateAuditRow(row),
  }),
  onChange: (_keys: Array<number | string>, rows: BonusManageItem[]) => {
    selectedAuditRows.value = rows;
  },
  selectedRowKeys: selectedAuditRows.value
    .map((row) => row.Id)
    .filter((id): id is number | string => id !== undefined),
}));

const auditColumns = [
  { dataIndex: 'Approve', key: 'Approve', title: '状态', width: 100 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单编号', width: 160 },
  { dataIndex: 'Username', key: 'Username', title: '代理账号', width: 130 },
  { dataIndex: 'WalletType', key: 'WalletType', title: '钱包类型', width: 110 },
  { dataIndex: 'BonusType', key: 'BonusType', title: '红利类型', width: 110 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '申请时间', width: 170 },
  { dataIndex: 'ApplyName', key: 'ApplyName', title: '申请账号', width: 120 },
  { dataIndex: 'Amount', key: 'Amount', title: '申请金额', width: 120 },
  { dataIndex: 'ApplyDesc', key: 'ApplyDesc', title: '申请备注', width: 180 },
  { dataIndex: 'ChangeDesc', key: 'ChangeDesc', title: '变更备注', width: 160 },
  { fixed: 'right', key: 'actions', title: '操作', width: 190 },
];

const auditModalOpen = ref(false);
const auditAction = ref<AuditAction>('singleApprove');
const auditCurrentRow = ref<BonusManageItem | null>(null);
const auditForm = reactive({
  Amount: undefined as number | undefined,
  HandleDesc: '',
});
const auditSubmitting = ref(false);

const auditModalTitle = computed(
  () =>
    ({
      adjust: '调整红利申请',
      batchApprove: '批量通过',
      batchReject: '批量拒绝',
      singleApprove: '通过红利申请',
      singleReject: '拒绝红利申请',
    })[auditAction.value],
);
const isSingleAudit = computed(() =>
  ['adjust', 'singleApprove', 'singleReject'].includes(auditAction.value),
);
const needAuditAmount = computed(() =>
  ['adjust', 'singleApprove'].includes(auditAction.value),
);

function openAuditAction(action: AuditAction, row?: BonusManageItem) {
  if (action.startsWith('batch') && !selectedAuditRows.value.length) {
    message.warning('请先勾选待审核记录');
    return;
  }
  auditAction.value = action;
  auditCurrentRow.value = row || null;
  auditForm.Amount =
    action === 'singleApprove' && row
      ? Number(row.Amount || 0) / 100
      : undefined;
  auditForm.HandleDesc = '';
  auditModalOpen.value = true;
}

async function submitAuditAction() {
  if (!validRemark(auditForm.HandleDesc.trim(), true)) {
    message.warning('请输入 1-400 个字符的审核备注');
    return;
  }
  if (needAuditAmount.value && !validAmount(auditForm.Amount, false)) {
    message.warning('金额须为非零且最多两位小数');
    return;
  }
  const ids = auditAction.value.startsWith('batch')
    ? selectedAuditRows.value.map((row) => row.Id).filter(Boolean).join(',')
    : String(auditCurrentRow.value?.Id || '');
  if (!ids) return;

  auditSubmitting.value = true;
  try {
    if (auditAction.value === 'adjust') {
      await adjustBonusApi({
        Amount: Math.round(Number(auditForm.Amount) * 100),
        HandleDesc: auditForm.HandleDesc.trim(),
        Id: ids,
      });
    } else {
      await approveBonusApi({
        Amount:
          auditAction.value === 'singleApprove'
            ? Math.round(Number(auditForm.Amount) * 100)
            : '',
        Approve: auditAction.value.includes('Approve') ? 2 : 3,
        HandleDesc: auditForm.HandleDesc.trim(),
        Ids: ids,
      });
    }
    message.success('操作成功');
    auditModalOpen.value = false;
    await loadAudit();
  } catch {
    // requestClient 已提示业务错误
  } finally {
    auditSubmitting.value = false;
  }
}

// 历史记录
const historyFilters = reactive({
  ApplyDesc: '',
  ApplyName: '',
  Approve: '' as number | string,
  ApproveDesc: '',
  ApproveName: '',
  BonusType: '' as number | string,
  Username: '',
  WalletType: '' as number | string,
});
const historyApplyRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(todayRange());
const historyApproveRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>(todayRange());
const historyRows = ref<BonusManageItem[]>([]);
const historyLoading = ref(false);
const historyExporting = ref(false);
const historyPage = ref(1);
const historyPageSize = ref(20);
const historyTotal = ref(0);
const historyTotalAmount = ref(0);
const historyTotalRealAmount = ref(0);

function historyQuery(isExport = false) {
  const [applyBegin, applyEnd] = historyApplyRange.value || todayRange();
  const [approveBegin, approveEnd] = historyApproveRange.value || todayRange();
  return {
    ...historyFilters,
    ApproveBeginTime: approveBegin.startOf('day').unix(),
    ApproveEndTime: approveEnd.endOf('day').unix(),
    BeginTime: applyBegin.startOf('day').unix(),
    EndTime: applyEnd.endOf('day').unix(),
    IsExp: isExport,
    Page: isExport ? 1 : historyPage.value,
    PageSize: isExport ? 9999 : historyPageSize.value,
  };
}

async function loadHistory() {
  historyLoading.value = true;
  try {
    const result = await fetchBonusHistoryListApi(historyQuery());
    historyRows.value = result.Items || [];
    historyTotal.value = Number(result.Pagination?.MaxCount || 0);
    historyTotalAmount.value = Number(result.Total?.Total || 0);
    historyTotalRealAmount.value = Number(result.Total?.TotalReal || 0);
  } catch {
    historyRows.value = [];
    historyTotal.value = 0;
    historyTotalAmount.value = 0;
    historyTotalRealAmount.value = 0;
  } finally {
    historyLoading.value = false;
  }
}

function searchHistory() {
  historyPage.value = 1;
  void loadHistory();
}

function resetHistory() {
  Object.assign(historyFilters, {
    ApplyDesc: '',
    ApplyName: '',
    Approve: '',
    ApproveDesc: '',
    ApproveName: '',
    BonusType: '',
    Username: '',
    WalletType: '',
  });
  historyApplyRange.value = todayRange();
  historyApproveRange.value = todayRange();
  searchHistory();
}

async function exportHistory() {
  historyExporting.value = true;
  try {
    const result = await fetchBonusHistoryListApi(historyQuery(true));
    const rows = result.Items || [];
    if (!rows.length) {
      message.warning('没有可导出的数据');
      return;
    }
    exportWorkbook(
      rows.map((row) => [
        statusText(row.Approve),
        String(row.OrderId || ''),
        String(row.Username || ''),
        Number(row.WalletType) === 1 ? '佣金钱包' : String(row.WalletType || ''),
        Number(row.BonusType) === 1 ? '代理红利' : String(row.BonusType || ''),
        formatNetcashDateTime(row.CreateTime),
        String(row.ApplyName || ''),
        Number(row.Amount || 0) / 100,
        String(row.ApplyDesc || ''),
        formatNetcashDateTime(row.ApproveTime),
        String(row.ApproveName || ''),
        Number(row.RealAmount || 0) / 100,
        String(row.ApproveDesc || ''),
      ]),
      [
        '状态',
        '订单编号',
        '代理账号',
        '钱包类型',
        '红利类型',
        '申请时间',
        '申请账号',
        '申请金额',
        '申请备注',
        '审核时间',
        '审核账号',
        '支付金额',
        '审核备注',
      ],
      `红利历史记录_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`,
    );
  } catch {
    message.error('导出失败');
  } finally {
    historyExporting.value = false;
  }
}

const historyColumns = [
  {
    customRender: ({ index }: { index: number }) =>
      (historyPage.value - 1) * historyPageSize.value + index + 1,
    key: 'index',
    title: '序号',
    width: 70,
  },
  { dataIndex: 'Approve', key: 'Approve', title: '状态', width: 100 },
  { dataIndex: 'OrderId', key: 'OrderId', title: '订单编号', width: 160 },
  { dataIndex: 'Username', key: 'Username', title: '代理账号', width: 130 },
  { dataIndex: 'WalletType', key: 'WalletType', title: '钱包类型', width: 110 },
  { dataIndex: 'BonusType', key: 'BonusType', title: '红利类型', width: 110 },
  { dataIndex: 'CreateTime', key: 'CreateTime', title: '申请时间', width: 170 },
  { dataIndex: 'ApplyName', key: 'ApplyName', title: '申请账号', width: 120 },
  { dataIndex: 'Amount', key: 'Amount', title: '申请金额', width: 120 },
  { dataIndex: 'ApplyDesc', key: 'ApplyDesc', title: '申请备注', width: 180 },
  { dataIndex: 'ApproveTime', key: 'ApproveTime', title: '审核时间', width: 170 },
  { dataIndex: 'ApproveName', key: 'ApproveName', title: '审核账号', width: 120 },
  { dataIndex: 'RealAmount', key: 'RealAmount', title: '支付金额', width: 120 },
  { dataIndex: 'ApproveDesc', key: 'ApproveDesc', title: '审核备注', width: 180 },
];

const walletOptions = [
  { label: '全部钱包', value: '' },
  { label: '佣金钱包', value: 1 },
];
const bonusOptions = [
  { label: '全部类型', value: '' },
  { label: '代理红利', value: 1 },
];
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已通过', value: 2 },
  { label: '已拒绝', value: 3 },
];

const loadedTabs = new Set<string>();
watch(
  activeTab,
  (tab) => {
    if (loadedTabs.has(tab)) return;
    loadedTabs.add(tab);
    if (tab === 'audit') void loadAudit();
    if (tab === 'history') void loadHistory();
  },
  { immediate: true },
);
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="代理网赚 · 红利管理"
    title="红利管理"
  >
    <Card>
      <Tabs v-model:active-key="activeTab" type="line">
        <Tabs.TabPane
          v-for="tab in availableTabs"
          :key="tab.key"
          :tab="tab.title"
        >
          <div v-if="tab.key === 'provide'" class="space-y-4">
            <Tabs v-model:active-key="provideMode" size="small">
              <Tabs.TabPane
                v-if="canSingleProvide"
                key="single"
                tab="单笔发放"
              />
              <Tabs.TabPane
                v-if="canBatchProvide"
                key="batch"
                tab="批量发放"
              />
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
                  :disabled="!batchSource.length"
                  :loading="provideQuerying"
                  @click="validateBatchFile"
                >
                  重新验证
                </Button>
                <span v-if="batchUsed && validBatchRows.length" class="text-green-600">
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
              <Form.Item
                v-if="provideMode === 'single'"
                label="代理账号"
                required
              >
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
          </div>

          <div v-else-if="tab.key === 'audit'">
            <Result
              v-if="!canAuditList"
              status="403"
              sub-title="无审核列表查看权限(11360)"
              title="403"
            />
            <template v-else>
              <div class="mb-4 flex flex-wrap items-center gap-2">
                <Input
                  v-model:value="auditFilters.Username"
                  allow-clear
                  placeholder="代理账号"
                  class="w-44"
                />
                <Select
                  v-model:value="auditFilters.WalletType"
                  class="w-36"
                  :options="walletOptions"
                />
                <Select
                  v-model:value="auditFilters.BonusType"
                  class="w-36"
                  :options="bonusOptions"
                />
                <Input
                  v-model:value="auditFilters.ApplyName"
                  allow-clear
                  placeholder="申请账号"
                  class="w-40"
                />
                <Input
                  v-model:value="auditFilters.ApplyDesc"
                  allow-clear
                  placeholder="申请备注"
                  class="w-44"
                />
                <DatePicker.RangePicker v-model:value="auditRange" />
                <Button type="primary" @click="searchAudit">查询</Button>
                <Button @click="resetAudit">重置</Button>
              </div>
              <div class="mb-3 flex items-center justify-between">
                <span>
                  申请金额汇总：
                  <b class="text-red-500">{{
                    formatAmountFromCent(auditTotalAmount)
                  }}</b>
                </span>
                <Space>
                  <Button
                    v-if="canBatchApprove"
                    type="primary"
                    :disabled="!selectedAuditRows.length"
                    @click="openAuditAction('batchApprove')"
                  >
                    批量通过
                  </Button>
                  <Button
                    v-if="canBatchReject"
                    danger
                    :disabled="!selectedAuditRows.length"
                    @click="openAuditAction('batchReject')"
                  >
                    批量拒绝
                  </Button>
                </Space>
              </div>
              <Table
                :columns="auditColumns"
                :data-source="auditRows"
                :loading="auditLoading"
                :pagination="false"
                :row-key="(row: BonusManageItem) => String(row.Id)"
                :row-selection="auditRowSelection"
                :scroll="{ x: 1550 }"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <Tag
                    v-if="column.key === 'Approve'"
                    :color="statusColor(record.Approve)"
                  >
                    {{ statusText(record.Approve) }}
                  </Tag>
                  <template v-else-if="column.key === 'WalletType'">
                    {{ Number(record.WalletType) === 1 ? '佣金钱包' : '-' }}
                  </template>
                  <template v-else-if="column.key === 'BonusType'">
                    {{ Number(record.BonusType) === 1 ? '代理红利' : '-' }}
                  </template>
                  <template v-else-if="column.key === 'CreateTime'">
                    {{ formatNetcashDateTime(record.CreateTime) }}
                  </template>
                  <template v-else-if="column.key === 'Amount'">
                    {{ formatAmountFromCent(Number(record.Amount || 0)) }}
                  </template>
                  <Space v-else-if="column.key === 'actions'" :size="0">
                    <Button
                      v-if="canSingleApprove"
                      type="link"
                      size="small"
                      :disabled="!canOperateAuditRow(record)"
                      @click="openAuditAction('singleApprove', record)"
                    >
                      通过
                    </Button>
                    <Button
                      v-if="canAdjust"
                      type="link"
                      size="small"
                      :disabled="!canOperateAuditRow(record)"
                      @click="openAuditAction('adjust', record)"
                    >
                      调整
                    </Button>
                    <Button
                      v-if="canSingleReject"
                      danger
                      type="link"
                      size="small"
                      :disabled="!canOperateAuditRow(record)"
                      @click="openAuditAction('singleReject', record)"
                    >
                      拒绝
                    </Button>
                  </Space>
                </template>
              </Table>
              <div class="mt-4 flex justify-end">
                <Pagination
                  v-model:current="auditPage"
                  v-model:page-size="auditPageSize"
                  :total="auditTotal"
                  show-size-changer
                  show-quick-jumper
                  @change="loadAudit"
                />
              </div>
            </template>
          </div>

          <div v-else>
            <div class="mb-4 flex flex-wrap items-center gap-2">
              <Input
                v-model:value="historyFilters.Username"
                allow-clear
                placeholder="代理账号"
                class="w-40"
              />
              <Select
                v-model:value="historyFilters.WalletType"
                class="w-36"
                :options="walletOptions"
              />
              <Select
                v-model:value="historyFilters.BonusType"
                class="w-36"
                :options="bonusOptions"
              />
              <Input
                v-model:value="historyFilters.ApplyName"
                allow-clear
                placeholder="申请账号"
                class="w-40"
              />
              <Input
                v-model:value="historyFilters.ApplyDesc"
                allow-clear
                placeholder="申请备注"
                class="w-40"
              />
              <Select
                v-model:value="historyFilters.Approve"
                class="w-36"
                :options="statusOptions"
              />
              <Input
                v-model:value="historyFilters.ApproveName"
                allow-clear
                placeholder="审核账号"
                class="w-40"
              />
              <Input
                v-model:value="historyFilters.ApproveDesc"
                allow-clear
                placeholder="审核备注"
                class="w-40"
              />
              <span class="text-gray-500">申请时间</span>
              <DatePicker.RangePicker v-model:value="historyApplyRange" />
              <span class="text-gray-500">审核时间</span>
              <DatePicker.RangePicker v-model:value="historyApproveRange" />
              <Button type="primary" @click="searchHistory">查询</Button>
              <Button @click="resetHistory">重置</Button>
            </div>
            <div class="mb-3 flex items-center justify-between">
              <Space>
                <span>
                  申请金额汇总：
                  <b class="text-red-500">{{
                    formatAmountFromCent(historyTotalAmount)
                  }}</b>
                </span>
                <span>
                  支付金额汇总：
                  <b class="text-red-500">{{
                    formatAmountFromCent(historyTotalRealAmount)
                  }}</b>
                </span>
              </Space>
              <Button
                v-if="canExportHistory"
                type="primary"
                :loading="historyExporting"
                @click="exportHistory"
              >
                导出 Excel
              </Button>
            </div>
            <Table
              :columns="historyColumns"
              :data-source="historyRows"
              :loading="historyLoading"
              :pagination="false"
              :row-key="
                (row: BonusManageItem, index?: number) =>
                  String(row.Id || `${row.OrderId}-${index}`)
              "
              :scroll="{ x: 1900 }"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <Tag
                  v-if="column.key === 'Approve'"
                  :color="statusColor(record.Approve)"
                >
                  {{ statusText(record.Approve) }}
                </Tag>
                <template v-else-if="column.key === 'WalletType'">
                  {{ Number(record.WalletType) === 1 ? '佣金钱包' : '-' }}
                </template>
                <template v-else-if="column.key === 'BonusType'">
                  {{ Number(record.BonusType) === 1 ? '代理红利' : '-' }}
                </template>
                <template
                  v-else-if="
                    column.key === 'CreateTime' || column.key === 'ApproveTime'
                  "
                >
                  {{ formatNetcashDateTime(record[column.key]) }}
                </template>
                <template
                  v-else-if="
                    column.key === 'Amount' || column.key === 'RealAmount'
                  "
                >
                  {{ formatAmountFromCent(Number(record[column.key] || 0)) }}
                </template>
              </template>
            </Table>
            <div class="mt-4 flex justify-end">
              <Pagination
                v-model:current="historyPage"
                v-model:page-size="historyPageSize"
                :total="historyTotal"
                show-size-changer
                show-quick-jumper
                @change="loadHistory"
              />
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="batchPreviewOpen"
      title="Excel 验证结果"
      width="760px"
      :ok-button-props="{ disabled: !validBatchRows.length }"
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
        :row-key="
          (row: BatchPreviewRow, index?: number) =>
            `${row.Username}-${index || 0}`
        "
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
        :row-key="
          (row: Record<string, unknown>, index?: number) =>
            `${row.Username}-${index || 0}`
        "
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
          :disabled="!(batchResult?.FailItems || []).length"
          @click="exportBatchFailures"
        >
          导出失败结果
        </Button>
        <Button type="primary" @click="batchResultOpen = false">关闭</Button>
      </div>
    </Modal>

    <Modal
      v-model:open="auditModalOpen"
      :confirm-loading="auditSubmitting"
      :title="auditModalTitle"
      @ok="submitAuditAction"
    >
      <Form layout="vertical">
        <template v-if="isSingleAudit && auditCurrentRow">
          <Form.Item label="代理账号">
            <Input :value="auditCurrentRow.Username" disabled />
          </Form.Item>
          <Form.Item label="申请金额">
            <Input
              :value="formatAmountFromCent(Number(auditCurrentRow.Amount || 0))"
              disabled
            />
          </Form.Item>
        </template>
        <div v-else class="mb-4 text-center">
          确认处理已勾选的 {{ selectedAuditRows.length }} 条红利申请？
        </div>
        <Form.Item
          v-if="needAuditAmount"
          :label="auditAction === 'adjust' ? '调整金额（元）' : '支付金额（元）'"
          required
        >
          <InputNumber
            v-model:value="auditForm.Amount"
            class="!w-full"
            :precision="2"
          />
        </Form.Item>
        <Form.Item v-if="auditAction !== 'adjust'" label="审核账号">
          <Input
            :value="String(cloudStore.adminInfo?.Admin?.Username || '')"
            disabled
          />
        </Form.Item>
        <Form.Item
          :label="auditAction === 'adjust' ? '变更备注' : '审核备注'"
          required
        >
          <Input.TextArea
            v-model:value="auditForm.HandleDesc"
            :maxlength="400"
            :rows="4"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无红利管理查看权限" title="403" />
</template>

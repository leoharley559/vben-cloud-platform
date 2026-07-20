<script lang="ts" setup>
import type { FormInstance, TableColumnsType } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, h, onMounted, reactive, ref } from 'vue';

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  adjustCommissionApi,
  fetchPersonalCommListApi,
  fetchPersonalDetailApi,
  fetchSendCommListApi,
  fetchTeamDetailApi,
  fetchTeamListApi,
  oneKeySendCommissionApi,
  sendCommissionApi,
} from '#/api/netcash/commission-manage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';

import {
  cent,
  currentMonth,
  dateTime,
  normalizeList,
  normalizeRows,
  safeRateRows,
  settlementDate,
  settlementLabel,
} from '../commission-utils';

type Context = 'grant' | 'record';
type Variant = 'multi-multi' | 'multi-single' | 'personal' | 'team';
const props = defineProps<{ context: Context; variant: Variant }>();
const { checkPermission, projectConfig } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const isTeam = computed(() => props.variant === 'team');
const isMulti = computed(() =>
  props.variant === 'multi-single' ? 1 : (props.variant === 'multi-multi' ? 2 : 0),
);
const isMultiMode = computed(() => isMulti.value > 0);
const isMultiRate = computed(() => isMulti.value === 2);
const viewPermission = computed(() =>
  props.context === 'grant'
    ? checkPermission(isTeam.value ? 10_475 : 10_469)
    : checkPermission(isTeam.value ? 11_482 : 11_481),
);
const canExport = computed(() => checkPermission(isTeam.value ? 10_477 : 10_471));
const canBatch = computed(() =>
  props.context === 'grant' && checkPermission(isTeam.value ? 10_476 : 10_470),
);
const canSend = computed(() =>
  props.context === 'grant' && checkPermission(isTeam.value ? 10_478 : 10_472),
);
const canAdjust = computed(() =>
  props.context === 'grant' && checkPermission(isTeam.value ? 10_482 : 10_473),
);
const canViewDetail = computed(() =>
  props.context === 'grant' && checkPermission(isTeam.value ? 10_485 : 10_474),
);
const packageOptions = computed(() =>
  (projectConfig.value?.RealPackageIdNameMap || []).map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

const query = reactive<Record<string, any>>({
  ActivityUserNumMax: undefined,
  ActivityUserNumMin: undefined,
  AgentAccount: '',
  AgentStatus: undefined,
  AmountMax: undefined,
  AmountMin: undefined,
  BeginTime: undefined,
  CommissionType: undefined,
  DataSearchType: 0,
  Desc: '',
  DeveloperName: '',
  EndTime: undefined,
  IsLastMonthBetWin: 0,
  IsMeetSettlementReq: 0,
  IsMulti: isMulti.value,
  IsSettlement: undefined,
  IsTeam: isTeam.value ? 1 : 2,
  MainUsername: '',
  MaintainerName: '',
  PackageIds: '',
  Page: 1,
  PageSize: 20,
  PayoutBeginTime: undefined,
  PayoutEndTime: undefined,
  ReportMonth: currentMonth(props.context === 'record' ? 1 : 0),
  SettlementBeginTime: undefined,
  SettlementEndTime: undefined,
  SettlementName: '',
  TeamName: '',
  Type: undefined,
});
const month = ref<Dayjs>(
  dayjs().subtract(props.context === 'record' ? 1 : 0, 'month'),
);
const createRange = ref<[Dayjs, Dayjs]>();
const commissionRange = ref<[Dayjs, Dayjs]>();
const payoutRange = ref<[Dayjs, Dayjs]>();
const packageIds = ref<Array<number | string>>([]);
const rows = ref<Record<string, any>[]>([]);
const total = ref<Record<string, any>>({});
const totalCount = ref(0);
const loading = ref(false);
const exporting = ref(false);
const selectedKeys = ref<Array<number | string>>([]);
const selectedRows = ref<Record<string, any>[]>([]);
const adjustOpen = ref(false);
const adjustSaving = ref(false);
const grantSaving = ref(false);
const adjustFormRef = ref<FormInstance>();
const adjustForm = reactive<Record<string, any>>({});
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailRows = ref<Record<string, any>[]>([]);
const detailTitle = ref('场馆明细');
const detailTotal = reactive<Record<string, any>>({});
const rateOpen = ref(false);
const rateRows = ref<Record<string, any>[]>([]);
const teamChildren = reactive<Record<string, Record<string, any>[]>>({});

const allColumns = computed<TableColumnsType>(() => {
  const result: TableColumnsType = [];
  if (isTeam.value) {
    result.push(
      { dataIndex: 'TeamName', fixed: 'left', title: '团队名称', width: 130 },
      { key: 'TeamCount', title: '团队人数', width: 100 },
    );
  }
  result.push(
    { dataIndex: 'ReportMonth', fixed: 'left', title: '佣金月份', width: 105 },
  );
  if (isMultiMode.value) {
    result.push(
      { key: 'SettlementType', title: '佣金周期', width: 95 },
      { key: 'SettlementDate', title: '结算日期', width: 180 },
    );
  }
  result.push(
    { dataIndex: 'Username', fixed: 'left', title: '代理账号', width: 130 },
    { key: 'Type', title: isTeam.value ? '团队类型' : '代理类型', width: 95 },
    { dataIndex: 'MainUsername', title: '上级账号', width: 120 },
  );
  if (props.context === 'record' && !isTeam.value) {
    result.push({ key: 'AgentStatus', title: '是否停用', width: 90 });
  }
  result.push({ dataIndex: 'ActivityUserNum', title: '活跃人数', width: 95 });
  if (isMultiRate.value) {
    result.push({ key: 'ValidWater', title: '总流水', width: 120 });
  }
  result.push(
    { key: 'WinLoss', title: '总输赢', width: 120 },
    { key: 'ApiFeeTotal', title: '场馆费', width: 110 },
    { key: 'WithdrawPayFee', title: '存取款费用', width: 115 },
    { key: 'MoneyChange', title: '账户调整', width: 105 },
    { key: 'BackWaterGold', title: '返水', width: 105 },
    { key: 'RedGold', title: '红利', width: 105 },
  );
  if (isMultiMode.value) {
    result.push(
      { key: 'RedAdminChargeCommissionGold', title: '代存红利', width: 105 },
      { key: 'AdminChargeMoney', title: '代充金额', width: 105 },
      { key: 'AdminChargeMoneyFee', title: '代充回馈', width: 105 },
      { key: 'CommissionChildTotal', title: '下级贡献', width: 105 },
    );
  } else {
    result.push({ key: 'CleanBetWinTotal', title: '净输赢', width: 110 });
  }
  result.push(
    { key: 'LastMonthCleanBetWinTotal', title: '上月结余', width: 110 },
  );
  if (!isMultiMode.value) {
    result.push({ key: 'ReversalWinLoss', title: '冲正后净输赢', width: 130 });
  }
  result.push(
    { key: 'CommissionRate', title: '佣金比例', width: 105 },
    { key: 'CommissionChangeAmount', title: '佣金调整', width: 105 },
    { key: 'CommissionTotal', title: '佣金', width: 125 },
  );
  if (props.context === 'grant') {
    result.push({ key: 'IsSettlement', title: '佣金状态', width: 100 });
  } else {
    result.push(
      { key: 'CreditDue', title: '欠款偿还', width: 105 },
      { dataIndex: 'SettlementName', title: '发放人员', width: 110 },
      { key: 'SettlementTime', title: '发放时间', width: 165 },
    );
  }
  result.push(
    { key: 'CreateTime', title: '成为代理时间', width: 165 },
    { dataIndex: 'DeveloperName', title: '发展人', width: 110 },
    { dataIndex: 'MaintainerName', title: '维护人', width: 110 },
    { dataIndex: 'Desc', title: '备注', width: 160 },
    { dataIndex: 'Remark', title: '调整原因', width: 160 },
  );
  if (isTeam.value) {
    result.splice(- 4, 0, {
      key: 'TeamCreateTime',
      title: '加入团队时间',
      width: 165,
    });
  }
  if (isMultiMode.value && props.context === 'grant') {
    result.push({ key: 'IsMeetSettlementReq', title: '达到派发条件', width: 120 });
  }
  if (props.context === 'grant') {
    result.push({ fixed: 'right', key: 'actions', title: '操作', width: 135 });
  }
  return result;
});

const summaryCards = computed(() => [
  {
    title: '总输赢',
    value: cent(Number(total.value.SumBetGold || 0) - Number(total.value.SumWinGold || 0)),
  },
  { title: '平台费', value: cent(total.value.SumApiFeeTotal) },
  {
    title: props.context === 'grant' ? '发放佣金' : '佣金总额',
    value: cent(
      total.value.SumCommissionChangeAfter ??
        total.value.SumCommissionTotal,
    ),
  },
  { title: '活跃人数', value: Number(total.value.SumActivityUserNum || 0) },
]);

const rowSelection = computed(() =>
  props.context === 'grant'
    ? {
        getCheckboxProps: (row: Record<string, any>) => ({
          disabled: canSelectRow(row),
        }),
        onChange: selectionChange,
        selectedRowKeys: selectedKeys.value,
      }
    : undefined,
);

function columnKey(column: unknown): string {
  const value = column as { dataIndex?: unknown; key?: unknown };
  return String(value.key || value.dataIndex || '');
}

function queryPayload(extra: Record<string, any> = {}) {
  const payload = { ...query, ...extra };
  return {
    ...payload,
    AmountMax: payload.AmountMax === undefined ? '' : Math.round(Number(payload.AmountMax) * 100),
    AmountMin: payload.AmountMin === undefined ? '' : Math.round(Number(payload.AmountMin) * 100),
    BeginTime: createRange.value?.[0]?.startOf('day').unix() || '',
    EndTime: createRange.value?.[1]?.endOf('day').unix() || '',
    PayoutBeginTime: payoutRange.value?.[0]?.startOf('day').unix() || '',
    PayoutEndTime: payoutRange.value?.[1]?.endOf('day').unix() || '',
    PackageIds: packageIds.value.join(','),
    ReportMonth: month.value?.format('YYYY-MM') || '',
    SettlementBeginTime: commissionRange.value?.[0]?.startOf('day').unix() || '',
    SettlementEndTime: commissionRange.value?.[1]?.endOf('day').unix() || '',
  };
}

async function load() {
  if (!viewPermission.value) return;
  loading.value = true;
  try {
    const api = props.context === 'grant' ? fetchSendCommListApi : fetchPersonalCommListApi;
    const result = await api(queryPayload());
    const normalized = normalizeList(result);
    rows.value = normalized.items;
    total.value = normalized.total || {};
    totalCount.value = normalized.totalCount;
    selectedKeys.value = [];
    selectedRows.value = [];
  } finally {
    loading.value = false;
  }
}

function reset() {
  Object.assign(query, {
    ActivityUserNumMax: undefined,
    ActivityUserNumMin: undefined,
    AgentAccount: '',
    AgentStatus: undefined,
    AmountMax: undefined,
    AmountMin: undefined,
    CommissionType: undefined,
    DataSearchType: 0,
    Desc: '',
    DeveloperName: '',
    IsLastMonthBetWin: 0,
    IsMeetSettlementReq: 0,
    IsSettlement: undefined,
    MainUsername: '',
    MaintainerName: '',
    Page: 1,
    SettlementName: '',
    TeamName: '',
    Type: undefined,
  });
  month.value = dayjs().subtract(props.context === 'record' ? 1 : 0, 'month');
  createRange.value = undefined;
  commissionRange.value = undefined;
  payoutRange.value = undefined;
  packageIds.value = [];
  load();
}

function selectionChange(keys: Array<number | string>, selected: Record<string, any>[]) {
  selectedKeys.value = keys;
  selectedRows.value = selected;
}

function canSelectRow(row: Record<string, any>) {
  if (Number(row.IsSettlement) === 1) return true;
  if (!isMultiMode.value) return String(row.ReportMonth) === currentMonth();
  const end = Number(row.ReportDayEndTime || 0);
  return end > 0 && dayjs().isBefore(dayjs.unix(end).subtract(1, 'millisecond'));
}

function openGrant(row?: Record<string, any>) {
  const selected = row ? [row] : selectedRows.value;
  if (selected.length === 0) {
    message.warning('请先勾选可发放记录');
    return;
  }
  const hasDeduction = selected.some((item) => Number(item.Deduction || 0) !== 0);
  let deduct = false;
  Modal.confirm({
    content: () =>
      h('div', [
        h(
          'p',
          row
            ? `确认发放代理「${row.Username || ''}」的佣金？`
            : `确认批量发放 ${selected.length} 条佣金？`,
        ),
        hasDeduction
          ? h(
              Checkbox,
              {
                onChange: (event: { target: { checked: boolean } }) => {
                  deduct = event.target.checked;
                },
              },
              () => `抵扣代充欠款${row ? `：${cent(row.Deduction)}` : ''}`,
            )
          : null,
      ]),
    title: row ? '发放佣金' : '一键发放',
    onOk: async () => {
      if (grantSaving.value) return;
      grantSaving.value = true;
      const common = {
        IsDeduct: deduct ? 1 : 2,
        IsMulti: isMulti.value,
        IsTeam: isTeam.value ? 1 : 2,
      };
      try {
        await (row ? sendCommissionApi({ ...common, Id: row.Id }) : oneKeySendCommissionApi({
            ...common,
            Ids: selected.map((item) => item.Id).join(','),
          }));
        message.success('发放成功');
        await load();
      } finally {
        grantSaving.value = false;
      }
    },
  });
}

function openAdjust(row: Record<string, any>) {
  for (const key of Object.keys(adjustForm)) delete adjustForm[key];
  Object.assign(adjustForm, {
    CommissionChangeAmount: undefined,
    CommissionTotal: cent(
      Number(row.CommissionChangeAfter) > 0 ? row.CommissionChangeAfter : row.CommissionTotal,
    ),
    Desc: '',
    Id: row.Id,
    IsMulti: isMulti.value,
    Remark: '',
    ReportMonth: row.ReportMonth,
    UserName: row.Username,
  });
  adjustOpen.value = true;
}

async function submitAdjust() {
  await adjustFormRef.value?.validate();
  adjustSaving.value = true;
  try {
    await adjustCommissionApi({
      ...adjustForm,
      CommissionChangeAmount: Math.round(Number(adjustForm.CommissionChangeAmount) * 100),
    });
    message.success('佣金调整成功');
    adjustOpen.value = false;
    await load();
  } finally {
    adjustSaving.value = false;
  }
}

async function openDetail(row: Record<string, any>) {
  detailOpen.value = true;
  detailLoading.value = true;
  detailTitle.value = isTeam.value ? '团队成员明细' : '场馆明细';
  for (const key of Object.keys(detailTotal)) delete detailTotal[key];
  try {
    const result = isTeam.value
      ? await fetchTeamDetailApi({ Id: row.Id, IsMulti: isMulti.value })
      : await fetchPersonalDetailApi({ Id: row.Id, IsMulti: isMulti.value });
    detailRows.value = normalizeRows(result).map((item) => ({
      ...item,
      GameName:
        gameConfig.value.platformGameType[String(item.GameType ?? '')] ||
        item.GameType ||
        '-',
    }));
    if (isTeam.value) {
      detailTotal.ActivityUserNum = detailRows.value.reduce((sum, item) => sum + Number(item.ActivityUserNum || 0), 0);
      detailTotal.WinLoss = detailRows.value.reduce((sum, item) => sum + Number(item.BetGold || 0) - Number(item.WinGold || 0), 0);
      detailTotal.RedGold = detailRows.value.reduce((sum, item) => sum + Number(item.RedGold || 0), 0);
      detailTotal.BackWaterGold = detailRows.value.reduce((sum, item) => sum + Number(item.BackWaterGold || 0), 0);
    } else {
      detailTotal.SumBetGold = detailRows.value.reduce((sum, item) => sum + Number(item.SumBetGold || 0), 0);
      detailTotal.SumWinLoseGold = detailRows.value.reduce((sum, item) => sum + Number(item.SumWinLoseGold || 0), 0);
      detailTotal.ApiFeeTotal = detailRows.value.reduce((sum, item) => sum + Number(item.ApiFeeTotal || 0), 0);
    }
  } finally {
    detailLoading.value = false;
  }
}

function openRates(rate: unknown) {
  rateRows.value = safeRateRows(rate);
  rateOpen.value = true;
}

async function loadTeamChildren(row: Record<string, any>) {
  const key = String(row.Id);
  if (teamChildren[key]) return;
  const result = await fetchTeamListApi({
    ReportMonth: row.ReportMonth,
    TeamLeaderId: row.AdminId,
  });
  teamChildren[key] = normalizeList(result).items;
}

async function exportExcel() {
  exporting.value = true;
  try {
    const api = props.context === 'grant' ? fetchSendCommListApi : fetchPersonalCommListApi;
    const result = await api(queryPayload({ IsExp: isTeam.value, Page: 1, PageSize: Math.max(totalCount.value, 1) }));
    const data = normalizeList(result).items;
    if (data.length === 0) {
      message.warning('暂无可导出的数据');
      return;
    }
    const XLSX = await import('xlsx');
    const exportRows = data.map((row, index) => {
      const output: Record<string, any> = { 序号: index + 1 };
      for (const column of allColumns.value) {
        const title = String(column.title || '');
        if (!title || column.key === 'actions') continue;
        const key = columnKey(column);
        output[title] = displayCell(key, row, true);
      }
      return output;
    });
    const sheet = XLSX.utils.json_to_sheet(exportRows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, '佣金数据');
    const name = `${props.context === 'grant' ? '发放佣金' : '佣金记录'}_${variantName.value}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    XLSX.writeFile(book, name);
  } finally {
    exporting.value = false;
  }
}

function displayCell(key: string, row: Record<string, any>, exportingCell = false): any {
  switch (key) {
    case 'AdminChargeMoney':
    case 'AdminChargeMoneyFee':
    case 'ApiFeeTotal':
    case 'BackWaterGold':
    case 'CleanBetWinTotal':
    case 'CommissionChangeAmount':
    case 'CommissionChildTotal':
    case 'CreditDue':
    case 'LastMonthCleanBetWinTotal':
    case 'MoneyChange':
    case 'RedAdminChargeCommissionGold':
    case 'RedGold':
    case 'ValidWater': {
      return cent(row[key]);
    }
    case 'AgentStatus': {
      return Number(row.AgentStatus) === 1 ? '启用' : (Number(row.AgentStatus) === 2 ? '停用' : '-');
    }
    case 'CommissionRate': {
      if (isMultiRate.value) return exportingCell ? '详见系统' : '查看';
      return `${isMultiMode.value ? Number(row.CommissionRate || 0) / 100 : Number(row.CommissionRate || 0)}%`;
    }
    case 'CommissionTotal': {
      const amount = Number(row.CommissionChangeAfter || 0) > 0 ? row.CommissionChangeAfter : row.CommissionTotal;
      let prefix = '';
      if (isMultiRate.value && Number(row.CommissionType) === 1) prefix = '场馆佣金：';
      if (isMultiRate.value && Number(row.CommissionType) === 2) prefix = '流水佣金：';
      return `${prefix}${cent(amount)}`;
    }
    case 'CreateTime':
    case 'SettlementTime': {
      return dateTime(row[key]);
    }
    case 'IsMeetSettlementReq': {
      return Number(row.IsMeetSettlementReq) === 1 ? '是' : (Number(row.IsMeetSettlementReq) === 2 ? '否' : '全部');
    }
    case 'IsSettlement': {
      return Number(row.IsSettlement) === 1 ? '已结算' : '未结算';
    }
    case 'ReversalWinLoss': {
      return cent(Number(row.CleanBetWinTotal || 0) + Number(row.LastMonthCleanBetWinTotal || 0));
    }
    case 'SettlementDate': {
      return settlementDate(row);
    }
    case 'SettlementType': {
      return settlementLabel(row.SettlementType);
    }
    case 'TeamCount': {
      return Number(row.DeputyCount || 0) + Number(row.MainCount || 0);
    }
    case 'TeamCreateTime': {
      return dateTime(row.TeamCreateTime);
    }
    case 'Type': {
      return Number(row.Type) === 1 ? '普通' : (Number(row.Type) === 2 ? '正式' : '-');
    }
    case 'WinLoss': {
      return cent(Number(row.BetGold || 0) - Number(row.WinGold || 0));
    }
    case 'WithdrawPayFee': {
      return cent(Number(row.WithdrawMoneyFee || 0) + Number(row.PayMoneyFee || 0));
    }
    default: {
      return row[key] ?? '-';
    }
  }
}

function displayTotalCell(key: string): number | string {
  const sum = total.value;
  switch (key) {
    case 'ActivityUserNum': { return Number(sum.SumActivityUserNum || 0);
    }
    case 'AdminChargeMoney': { return cent(sum.SumAdminChargeMoney);
    }
    case 'ApiFeeTotal':
    case 'BackWaterGold':
    case 'CleanBetWinTotal':
    case 'CommissionChangeAmount':
    case 'CommissionChildTotal':
    case 'CommissionTotal':
    case 'CreditDue':
    case 'LastMonthCleanBetWinTotal':
    case 'MoneyChange':
    case 'RedAdminChargeCommissionGold':
    case 'RedGold':
    case 'ValidWater': {
      return cent(sum[`Sum${key}`]);
    }
    case 'ReversalWinLoss': {
      return cent(Number(sum.SumCleanBetWinTotal || 0) + Number(sum.SumLastMonthCleanBetWinTotal || 0));
    }
    case 'TeamCount': { return Number(sum.SumDeputyCount || 0) + Number(sum.SumMainCount || 0);
    }
    case 'WinLoss': { return cent(Number(sum.SumBetGold || 0) - Number(sum.SumWinGold || 0));
    }
    case 'WithdrawPayFee': {
      return cent(Number(sum.SumWithdrawMoneyFee || 0) + Number(sum.SumPayMoneyFee || 0));
    }
    default: { return '-';
    }
  }
}

const variantName = computed(() =>
  ({
    'multi-multi': '多层多费率',
    'multi-single': '多层单费率',
    personal: '个人',
    team: '团队',
  })[props.variant],
);

onMounted(async () => {
  await ensureGameConfig().catch(() => undefined);
  await load();
});
</script>

<template>
  <div v-if="viewPermission">
    <Card size="small" class="mb-4">
      <Form layout="vertical">
        <Row :gutter="12">
          <Col v-if="isTeam" :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="团队名称"><Input v-model:value="query.TeamName" allow-clear /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="代理账号"><Input v-model:value="query.AgentAccount" allow-clear /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="佣金月份"><DatePicker v-model:value="month" picker="month" class="w-full" /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item :label="isTeam ? '团队类型' : '代理类型'">
              <Select v-model:value="query.Type" allow-clear :options="[{ label: '普通', value: 1 }, { label: '正式', value: 2 }]" />
            </Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="发展人"><Input v-model:value="query.DeveloperName" allow-clear /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="维护人"><Input v-model:value="query.MaintainerName" allow-clear /></Form.Item>
          </Col>
          <Col v-if="!isTeam" :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="是否停用">
              <Select v-model:value="query.AgentStatus" allow-clear :options="[{ label: '启用', value: 1 }, { label: '停用', value: 2 }]" />
            </Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="上月是否有结余">
              <Select v-model:value="query.IsLastMonthBetWin" :options="[{ label: '全部', value: 0 }, { label: '是', value: 1 }, { label: '否', value: 2 }]" />
            </Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="佣金金额最小"><InputNumber v-model:value="query.AmountMin" :precision="2" class="w-full" /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="佣金金额最大"><InputNumber v-model:value="query.AmountMax" :precision="2" class="w-full" /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="活跃人数最小"><InputNumber v-model:value="query.ActivityUserNumMin" :min="0" class="w-full" /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="活跃人数最大"><InputNumber v-model:value="query.ActivityUserNumMax" :min="0" class="w-full" /></Form.Item>
          </Col>
          <Col v-if="isMultiMode && context === 'grant'" :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="达到派发条件">
              <Select v-model:value="query.IsMeetSettlementReq" :options="[{ label: '全部', value: 0 }, { label: '是', value: 1 }, { label: '否', value: 2 }]" />
            </Form.Item>
          </Col>
          <Col v-if="isMultiRate" :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="佣金类型">
              <Select v-model:value="query.CommissionType" allow-clear :options="[{ label: '场馆佣金', value: 1 }, { label: '流水佣金', value: 2 }]" />
            </Form.Item>
          </Col>
          <Col v-if="context === 'record'" :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="发放人"><Input v-model:value="query.SettlementName" allow-clear /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="上级账号"><Input v-model:value="query.MainUsername" allow-clear /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="备注"><Input v-model:value="query.Desc" allow-clear /></Form.Item>
          </Col>
          <Col :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="数据类型">
              <Select v-model:value="query.DataSearchType" :options="[{ label: '全部', value: 2 }, { label: '正式数据', value: 0 }, { label: '测试数据', value: 1 }]" />
            </Form.Item>
          </Col>
          <Col v-if="packageOptions.length > 0" :lg="8" :md="12" :sm="24" :xs="24">
            <Form.Item label="产品">
              <Select
                v-model:value="packageIds"
                allow-clear
                mode="multiple"
                :options="packageOptions"
                placeholder="请选择产品"
              />
            </Form.Item>
          </Col>
          <Col v-if="context === 'grant'" :lg="4" :md="6" :sm="12" :xs="24">
            <Form.Item label="佣金状态">
              <Select
                v-model:value="query.IsSettlement"
                allow-clear
                :options="[
                  { label: '已结算', value: 1 },
                  { label: '未结算', value: -1 },
                ]"
              />
            </Form.Item>
          </Col>
          <Col :lg="8" :md="12" :sm="24" :xs="24">
            <Form.Item label="成为代理时间"><DatePicker.RangePicker v-model:value="createRange" class="w-full" /></Form.Item>
          </Col>
          <Col :lg="8" :md="12" :sm="24" :xs="24">
            <Form.Item label="佣金日期"><DatePicker.RangePicker v-model:value="commissionRange" class="w-full" /></Form.Item>
          </Col>
          <Col v-if="context === 'record'" :lg="8" :md="12" :sm="24" :xs="24">
            <Form.Item label="发放时间"><DatePicker.RangePicker v-model:value="payoutRange" class="w-full" /></Form.Item>
          </Col>
        </Row>
        <Space>
          <Button type="primary" :loading="loading" @click="query.Page = 1; load()">查询</Button>
          <Button @click="reset">重置</Button>
        </Space>
      </Form>
    </Card>

    <Alert v-if="context === 'grant'" class="mb-4" message="手动发放只允许发放已结束结算周期且未结算的记录。" type="warning" show-icon />

    <Row :gutter="12" class="mb-4">
      <Col v-for="card in summaryCards" :key="card.title" :lg="6" :sm="12" :xs="24">
        <Card size="small"><Statistic :title="card.title" :value="card.value" /></Card>
      </Col>
    </Row>

    <Card size="small">
      <div class="ledger-actions">
        <Space>
          <Button v-if="canBatch" type="primary" @click="openGrant()">一键发放</Button>
          <Button v-if="canExport" :loading="exporting" @click="exportExcel">导出</Button>
        </Space>
        <span>共 {{ totalCount }} 条</span>
      </div>
      <Table
        class="mt-3"
        :columns="allColumns"
        :data-source="rows"
        :loading="loading"
        :pagination="false"
        :row-key="(row, index) => row.Id || `${row.Username}-${index}`"
        :row-selection="rowSelection"
        :scroll="{ x: 'max-content', y: 520 }"
        bordered
        size="small"
        @expand="(expanded, row) => expanded && isTeam && loadTeamChildren(row)"
      >
        <template #emptyText><Empty description="暂无佣金数据" /></template>
        <template #expandedRowRender="{ record }">
          <Table
            v-if="isTeam"
            :columns="allColumns.filter((column) => !['actions', 'TeamName', 'TeamCount'].includes(columnKey(column)))"
            :data-source="teamChildren[String(record.Id)] || []"
            :loading="!teamChildren[String(record.Id)]"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record: child }">
              {{ displayCell(columnKey(column), child) }}
            </template>
          </Table>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'Type'">
            <Tag :color="Number(record.Type) === 2 ? 'red' : 'blue'">{{ displayCell('Type', record) }}</Tag>
          </template>
          <template v-else-if="column.key === 'AgentStatus'">
            <Tag :color="Number(record.AgentStatus) === 1 ? 'green' : 'red'">{{ displayCell('AgentStatus', record) }}</Tag>
          </template>
          <template v-else-if="column.key === 'IsSettlement'">
            <Tag :color="Number(record.IsSettlement) === 1 ? 'green' : 'orange'">{{ displayCell('IsSettlement', record) }}</Tag>
          </template>
          <template v-else-if="column.key === 'ApiFeeTotal' && canViewDetail">
            <Button type="link" size="small" @click="openDetail(record)">{{ displayCell('ApiFeeTotal', record) }}</Button>
          </template>
          <template v-else-if="column.key === 'CommissionRate' && isMultiRate">
            <Button type="link" size="small" @click="openRates(record.CommissionRate)">查看</Button>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button v-if="canSend" type="link" size="small" :disabled="canSelectRow(record)" @click="openGrant(record)">发放</Button>
              <Button v-if="canAdjust" type="link" size="small" :disabled="canSelectRow(record)" @click="openAdjust(record)">调整</Button>
            </Space>
          </template>
          <template v-else>
            <span :class="{ negative: ['WinLoss', 'CleanBetWinTotal', 'LastMonthCleanBetWinTotal', 'ReversalWinLoss'].includes(String(column.key)) && Number(String(displayCell(columnKey(column), record)).replaceAll(',', '')) < 0 }">
              {{ displayCell(columnKey(column), record) }}
            </span>
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell v-if="context === 'grant'" :index="0">
                总计
              </Table.Summary.Cell>
              <Table.Summary.Cell
                v-for="(column, index) in allColumns"
                :key="columnKey(column)"
                :index="index + (context === 'grant' ? 1 : 0)"
              >
                <strong v-if="index === 0 && context !== 'grant'">总计</strong>
                <template v-else>{{ displayTotalCell(columnKey(column)) }}</template>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
      <div class="pagination-wrap">
        <Pagination
          v-model:current="query.Page"
          v-model:page-size="query.PageSize"
          :show-total="(value) => `共 ${value} 条`"
          :total="totalCount"
          show-size-changer
          @change="load"
        />
      </div>
    </Card>

    <Modal v-model:open="adjustOpen" title="调整佣金" :confirm-loading="adjustSaving" @ok="submitAdjust">
      <Form ref="adjustFormRef" :model="adjustForm" :label-col="{ span: 7 }">
        <Form.Item label="代理账号"><Input v-model:value="adjustForm.UserName" disabled /></Form.Item>
        <Form.Item label="发放月份"><Input v-model:value="adjustForm.ReportMonth" disabled /></Form.Item>
        <Form.Item label="佣金余额"><Input v-model:value="adjustForm.CommissionTotal" disabled /></Form.Item>
        <Form.Item label="调整金额" name="CommissionChangeAmount" :rules="[{ required: true, message: '请输入调整金额' }]">
          <InputNumber v-model:value="adjustForm.CommissionChangeAmount" :precision="2" class="w-full" />
        </Form.Item>
        <Form.Item label="调整原因"><Input v-model:value="adjustForm.Remark" :maxlength="200" /></Form.Item>
        <Form.Item label="备注"><Input.TextArea v-model:value="adjustForm.Desc" :maxlength="500" /></Form.Item>
      </Form>
    </Modal>

    <Modal v-model:open="detailOpen" :title="detailTitle" width="900px" :footer="null">
      <Descriptions class="mb-3" bordered size="small">
        <template v-if="isTeam">
          <Descriptions.Item label="下级活跃人数">{{ detailTotal.ActivityUserNum || 0 }}</Descriptions.Item>
          <Descriptions.Item label="总输赢">{{ cent(detailTotal.WinLoss) }}</Descriptions.Item>
          <Descriptions.Item label="红利">{{ cent(detailTotal.RedGold) }}</Descriptions.Item>
          <Descriptions.Item label="返水">{{ cent(detailTotal.BackWaterGold) }}</Descriptions.Item>
        </template>
        <template v-else>
          <Descriptions.Item label="流水">{{ cent(detailTotal.SumBetGold) }}</Descriptions.Item>
          <Descriptions.Item label="总输赢">{{ cent(detailTotal.SumWinLoseGold) }}</Descriptions.Item>
          <Descriptions.Item label="平台费">{{ cent(detailTotal.ApiFeeTotal) }}</Descriptions.Item>
        </template>
      </Descriptions>
      <Table :data-source="detailRows" :loading="detailLoading" :pagination="false" :scroll="{ y: 420 }" size="small" bordered>
        <Table.Column v-if="isTeam" data-index="Account" title="代理账号" />
        <Table.Column v-else data-index="GameName" title="场馆" />
        <Table.Column v-if="isTeam" data-index="ActivityUserNum" title="活跃人数" />
        <Table.Column v-else key="SumBetGold" title="流水">
          <template #default="{ record }">{{ cent(record.SumBetGold) }}</template>
        </Table.Column>
        <Table.Column key="detailWinLoss" title="输赢">
          <template #default="{ record }">{{ cent(isTeam ? Number(record.BetGold || 0) - Number(record.WinGold || 0) : record.SumWinLoseGold) }}</template>
        </Table.Column>
        <Table.Column v-if="!isTeam" key="Fee" title="平台费率">
          <template #default="{ record }">{{ Number(record.Fee || 0) / 100 }}%</template>
        </Table.Column>
        <Table.Column v-if="!isTeam" key="detailFee" title="平台费">
          <template #default="{ record }">{{ cent(record.ApiFeeTotal) }}</template>
        </Table.Column>
      </Table>
    </Modal>

    <Modal v-model:open="rateOpen" title="佣金比例" :footer="null" width="620px">
      <Table :data-source="rateRows" :pagination="false" size="small" bordered>
        <Table.Column data-index="Name" title="场馆类型" />
        <Table.Column key="rateWin" title="输赢分成">
          <template #default="{ record }">{{ Number(record.WinLoseRate || 0) / 100 }}%</template>
        </Table.Column>
        <Table.Column key="rateWater" title="流水分成">
          <template #default="{ record }">{{ Number(record.WaterRate || 0) / 100 }}%</template>
        </Table.Column>
      </Table>
    </Modal>
  </div>
  <Empty v-else description="无此子模块查看权限" />
</template>

<style scoped>
.ledger-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.negative {
  color: #cf1322;
}
</style>

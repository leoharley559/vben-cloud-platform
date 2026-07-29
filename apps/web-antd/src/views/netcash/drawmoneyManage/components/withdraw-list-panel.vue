<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Checkbox,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Result,
  Select,
  Space,
  Switch,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  drawmoneyRequest,
  exportDrawmoneyListApi,
  fetchDrawmoneyListApi,
  orderOperateApi,
} from '#/api/netcash/drawmoney-manage';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

import {
  formatDuration,
  PAY_TYPE_OPTIONS,
  payTypeLabel,
  withdrawStatus,
} from '../shared';

defineOptions({ name: 'DrawmoneyWithdrawListPanel' });

const { checkPermission } = useCloudPermission();
const router = useRouter();
const canView = computed(() => checkPermission(10_158));

const money = (v: unknown) => formatAmountFromCent(Number(v || 0));
const dt = (v: unknown) => formatNetcashDateTime(v as string);

const defaultQuery = () => ({
  AccountType: [] as number[],
  AmountMax: undefined as number | undefined,
  AmountMin: undefined as number | undefined,
  AmountType: 1,
  Applicant: '',
  HandlerName: '',
  OrderId: '',
  PayName: '',
  SelectTimeType: 1,
  ShowName: '',
  WithdrawAccount: '',
  WithdrawStatus: '' as number | string,
});

const withdrawQuery = reactive(defaultQuery());
const withdrawRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(1, 'day').startOf('day'),
  dayjs().endOf('day'),
]);
const withdrawTotal = reactive<Record<string, number>>({});
const selected = ref<Record<string, unknown>[]>([]);
const agreeChannels = ref<Record<string, unknown>[]>([]);
const autoChannels = ref<Record<string, unknown>[]>([]);
const withdrawCount = ref(0);
const exportPass = ref<InstanceType<typeof PassPopup>>();
const autoRefreshStatus = ref(2);
let autoRefreshTimer: ReturnType<typeof setInterval> | undefined;

type ActionKind = 'agree' | 'manual' | 'refuse' | 'remark';
const actionOpen = ref(false);
const actionKind = ref<ActionKind>('manual');
const actionRow = ref<Record<string, unknown>>({});
const actionForm = reactive({
  HandlerInf: '',
  RefundScore: 1,
  RefuseTitle: '',
  Remark: '',
  WithdrawAccountId: '' as number | string,
});

const detailOpen = ref(false);
const detailTitle = ref('');
const detailRows = ref<Record<string, unknown>[]>([]);

const autoOpen = ref(false);
const autoRules = ref<Record<string, any>[]>([]);
const autoSetting = reactive({
  Id: '',
  RealNameBlockStatus: 0,
  Status: 0,
  ValidCode: '',
});
const autoRemoveIds = ref<Array<number | string>>([]);
const autoTotal = ref(0);

function withdrawalParams(
  page: { currentPage: number; pageSize: number },
  exp = false,
) {
  return {
    ...withdrawQuery,
    AccountType: Array.isArray(withdrawQuery.AccountType)
      ? withdrawQuery.AccountType.join(',')
      : '',
    AmountMax: Number(withdrawQuery.AmountMax || 0) * 100,
    AmountMin: Number(withdrawQuery.AmountMin || 0) * 100,
    Auto: autoRefreshStatus.value === 1,
    BeginTime: withdrawRange.value?.[0]?.unix() || '',
    EndTime: withdrawRange.value?.[1]?.unix() || '',
    IsExp: exp,
    Page: exp ? 1 : page.currentPage,
    PageSize: exp ? 99_999 : page.pageSize,
    WithdrawStatus: withdrawQuery.WithdrawStatus ?? '',
  };
}

function assertWithdrawDateSpan() {
  const start = withdrawRange.value?.[0];
  const end = withdrawRange.value?.[1];
  if (!start || !end) {
    message.warning('请选择时间范围');
    return false;
  }
  if (end.diff(start, 'day') > 30) {
    message.warning('查询时间跨度不能超过 30 天');
    return false;
  }
  return true;
}

function canStart(row: Record<string, unknown>) {
  return (
    checkPermission(10_162) &&
    Number(row.Status) === 1 &&
    Number(row.Process) === 1
  );
}

function canManual(row: Record<string, unknown>) {
  if (!checkPermission(12_742)) return false;
  const status = Number(row.Status);
  const process = Number(row.Process);
  if (status === 1 && [2, 3].includes(process)) return true;
  const timeout =
    Date.now() / 1000 > Number(row.sendTime || 0) + 180 &&
    ![2, 3, 4].includes(status);
  return timeout;
}

function canAgreeOrRefuse(row: Record<string, unknown>) {
  return Number(row.Status) === 1 && [2, 3].includes(Number(row.Process));
}

function canCheckOrTransition(row: Record<string, unknown>) {
  return Number(row.Status) === 5 && Number(row.Process) === 9;
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  checkboxConfig: {
    checkMethod: ({ row }) => Number(row.Status) === 1,
  },
  columns: [
    { type: 'checkbox', width: 48 },
    {
      field: 'Status',
      formatter: ({ row }) => withdrawStatus(row),
      minWidth: 110,
      title: '状态',
    },
    {
      field: 'ApplyAccount',
      minWidth: 130,
      slots: { default: 'applyAccount' },
      title: '代理账号',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => dt(cellValue),
      minWidth: 160,
      title: '申请时间',
    },
    {
      field: 'FinanceTime',
      formatter: ({ cellValue }) => dt(cellValue),
      minWidth: 160,
      title: '财务响应时间',
    },
    {
      field: 'FinishTime',
      formatter: ({ cellValue }) => dt(cellValue),
      minWidth: 160,
      title: '结束时间',
    },
    {
      field: 'PayType',
      formatter: ({ cellValue }) => payTypeLabel(cellValue),
      minWidth: 110,
      title: '提款方式',
    },
    { field: 'OrderId', minWidth: 190, title: '订单编号' },
    {
      field: 'PayAccount',
      formatter: ({ row }) =>
        [row.PayName, row.DigitalType, row.PayAccount]
          .filter(Boolean)
          .join(' / ') || '-',
      minWidth: 170,
      title: '出款账号',
    },
    { field: 'PayRealName', minWidth: 120, title: '持卡人' },
    {
      field: 'ApplyAmount',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 110,
      sortable: true,
      title: '申请金额',
    },
    { field: 'ExchangeRate', minWidth: 90, title: '汇率' },
    { field: 'DigitalNum', minWidth: 110, title: '虚拟货币数量' },
    {
      field: 'RateAmount',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 100,
      title: '通道费率',
    },
    {
      field: 'RealAmount',
      formatter: ({ cellValue }) => money(cellValue),
      minWidth: 110,
      title: '实际出款',
    },
    { field: 'ShowName', minWidth: 140, title: '出款通道' },
    { field: 'HandlerInf', minWidth: 160, title: '操作说明' },
    { field: 'HandlerName', minWidth: 110, title: '操作人员' },
    { field: 'Remark', minWidth: 150, title: '备注' },
    {
      field: 'IsFirstWithdraw',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '是' : '否'),
      minWidth: 90,
      title: '是否首提',
    },
    {
      field: 'ProcessingTime',
      formatter: ({ cellValue }) => formatDuration(cellValue),
      minWidth: 110,
      title: '处理时长',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 300,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!assertWithdrawDateSpan()) return { items: [], total: 0 };
        try {
          const result = await fetchDrawmoneyListApi(withdrawalParams(page));
          Object.keys(withdrawTotal).forEach((key) => delete withdrawTotal[key]);
          Object.assign(withdrawTotal, result.Total || {});
          withdrawCount.value = Number(result.Pagination?.MaxCount || 0);
          return { items: result.Items || [], total: withdrawCount.value };
        } catch {
          Object.keys(withdrawTotal).forEach((key) => delete withdrawTotal[key]);
          withdrawCount.value = 0;
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [WithdrawGrid, withdrawGridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: any) => {
      selected.value = records;
    },
    checkboxChange: ({ records }: any) => {
      selected.value = records;
    },
  },
  gridOptions,
});

const withdrawSummaryItems = computed(() => [
  {
    label: '总出款',
    value: money(withdrawTotal.ApplyAmount ?? withdrawTotal.Amount),
  },
  { label: '实际出款', value: money(withdrawTotal.WithdrawAmount) },
  { label: '退款金额', value: money(withdrawTotal.RefundAmount) },
  { label: '待处理', value: withdrawTotal.PendingCountNum || 0 },
  { label: '挂起', value: withdrawTotal.HangupCount || 0 },
  { label: '预约', value: withdrawTotal.ReserveCount || 0 },
]);

function openAction(kind: ActionKind, row: Record<string, unknown>) {
  actionKind.value = kind;
  actionRow.value = row;
  Object.assign(actionForm, {
    HandlerInf: '',
    RefundScore: 1,
    RefuseTitle: '',
    Remark: row.Remark || '',
    WithdrawAccountId: '',
  });
  actionOpen.value = true;
}

async function submitAction() {
  try {
    let data: Record<string, unknown> = { Id: actionRow.value.Id };
    if (actionKind.value === 'manual') {
      await drawmoneyRequest.manualConfirm({ ...data, Handle: 3 });
    } else if (actionKind.value === 'agree') {
      if (!actionForm.WithdrawAccountId) {
        message.warning('请选择出款通道');
        return;
      }
      await drawmoneyRequest.manualAgree({
        ...data,
        WithdrawAccountId: actionForm.WithdrawAccountId,
      });
    } else if (actionKind.value === 'refuse') {
      if (!actionForm.RefuseTitle) {
        message.warning('请选择或输入拒绝原因');
        return;
      }
      data = {
        ...data,
        HandlerInf: actionForm.RefuseTitle,
        RefundScore: actionForm.RefundScore || 1,
        RefuseEmailBody: actionForm.HandlerInf,
        RefuseTitle: actionForm.RefuseTitle,
        Remark: actionForm.Remark,
      };
      await drawmoneyRequest.manualRefuse(data);
    } else {
      await drawmoneyRequest.addRemark({
        Id: actionRow.value.Id,
        Remark: actionForm.Remark,
      });
    }
    actionOpen.value = false;
    message.success('操作成功');
    withdrawGridApi.reload();
  } catch {
    /* 全局拦截已提示 */
  }
}

function start(row: Record<string, unknown>) {
  Modal.confirm({
    content: `确定开始处理「${row.ApplyName || row.ApplyAccount || ''}」的提款申请？`,
    onOk: async () => {
      try {
        await orderOperateApi({
          Desc: '',
          Id: row.Id,
          Money: row.ApplyAmount,
          Status: 2,
        });
        message.success('操作成功');
        withdrawGridApi.reload();
      } catch {
        /* */
      }
    },
    title: '开始处理',
  });
}

async function prepareAgree(row: Record<string, unknown>) {
  try {
    const result = await drawmoneyRequest.withdrawChannels({
      Handle: 1,
      Ids: row.Id,
      Type: row.AccountType,
    });
    agreeChannels.value = result.Items || [];
    openAction('agree', row);
  } catch {
    agreeChannels.value = [];
  }
}

async function viewLogs(row: Record<string, unknown>) {
  try {
    const result = await drawmoneyRequest.withdrawLogs({
      OrderId: row.OrderId,
    });
    detailRows.value = result.Items || [];
    detailTitle.value = '出款记录';
    detailOpen.value = true;
  } catch {
    detailRows.value = [];
  }
}

async function transition(row: Record<string, unknown>) {
  try {
    await drawmoneyRequest.transitionPending({ Id: row.Id });
    message.success('已转待处理');
    withdrawGridApi.reload();
  } catch {
    /* */
  }
}

function checkWithdraw(row: Record<string, unknown>) {
  Modal.confirm({
    content: '确定要发送提现查询吗？',
    onOk: async () => {
      try {
        await drawmoneyRequest.check(row.OrderId as string);
        message.success('查询请求已发送');
      } catch {
        /* */
      }
    },
    title: '提现查询',
  });
}

function batchManual() {
  if (!selected.value.length) return;
  Modal.confirm({
    content: '确认将所选订单批量转为人工出款？',
    onOk: async () => {
      try {
        await drawmoneyRequest.batchManual({
          Ids: selected.value.map((x) => x.Id).join(','),
        });
        message.success('批量操作成功');
        withdrawGridApi.reload();
      } catch {
        /* */
      }
    },
    title: '批量人工出款',
  });
}

function batchRefuse() {
  if (!selected.value.length) return;
  Modal.confirm({
    content: '确认拒绝所选订单并退币？',
    onOk: async () => {
      try {
        await drawmoneyRequest.batchRefuse({
          Ids: selected.value.map((x) => x.Id).join(','),
          RefundScore: 1,
        });
        message.success('批量操作成功');
        withdrawGridApi.reload();
      } catch {
        /* */
      }
    },
    title: '批量拒绝出款',
  });
}

function clearAutoTimer() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = undefined;
  }
}

function resetAutoTimer() {
  clearAutoTimer();
  if (autoRefreshStatus.value !== 1) return;
  autoRefreshTimer = setInterval(() => {
    const start = withdrawRange.value?.[0];
    const end = withdrawRange.value?.[1];
    if (start && end && end.diff(start, 'day') <= 30) {
      withdrawGridApi.reload();
    }
  }, 15_000);
}

async function loadAutoRefresh() {
  try {
    const result = await drawmoneyRequest.autoRefresh({ Key: 'agentwithdraw' });
    autoRefreshStatus.value = result === 'open' ? 1 : 2;
    resetAutoTimer();
  } catch {
    autoRefreshStatus.value = 2;
  }
}

async function toggleAutoRefresh(checked: boolean) {
  try {
    await drawmoneyRequest.saveAutoRefresh({
      Key: 'agentwithdraw',
      Status: checked ? 'open' : 'close',
    });
    autoRefreshStatus.value = checked ? 1 : 2;
    resetAutoTimer();
    message.success('切换成功');
  } catch {
    /* */
  }
}

function resetWithdraw() {
  Object.assign(withdrawQuery, defaultQuery());
  withdrawRange.value = [
    dayjs().subtract(1, 'day').startOf('day'),
    dayjs().endOf('day'),
  ];
  withdrawGridApi.reload();
}

function filterPending() {
  withdrawQuery.WithdrawStatus = '1,5,6';
  withdrawGridApi.reload();
}

function buildWithdrawExportQuery() {
  const { Page: _p, PageSize: _s, IsExp: _e, ...rest } = withdrawalParams({
    currentPage: 1,
    pageSize: 20,
  });
  return rest;
}

function exportWithdraw() {
  if (withdrawCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  if (!assertWithdrawDateSpan()) return;
  exportPass.value?.validate(73);
}

async function submitExport(security: Record<string, unknown>) {
  try {
    const result = await exportDrawmoneyListApi({
      ...buildWithdrawExportQuery(),
      ...security,
    });
    if (result?.Id && Number(result.Status) === 0) {
      Modal.confirm({
        content: '导出任务已建立，是否前往下载管理？',
        onOk: () => router.push('/operationalManage/downloadCsvManage'),
        title: '提示',
      });
    } else {
      message.error(result?.Remark || '建立导出任务失败');
    }
  } catch {
    /* */
  }
}

async function openAuto() {
  try {
    const result: any = await drawmoneyRequest.autoSettings({
      Page: 1,
      PageSize: 999,
    });
    const item = (result.Item || {}) as Record<string, any>;
    Object.assign(autoSetting, {
      Id: item.Id || '',
      RealNameBlockStatus: Number(item.RealNameBlockStatus || 0),
      Status: Number(item.AutoWithdrawStatus || 0),
      ValidCode: '',
    });
    autoTotal.value = Number(
      (result.Total as Record<string, unknown> | undefined)
        ?.TotalAutoWithdrawalAmount || 0,
    );
    const accounts =
      (await drawmoneyRequest.channelAccounts({ Page: 1, PageSize: 999 }))
        .Items || [];
    autoChannels.value = accounts.filter((x) => Number(x.Switch) === 1);
    autoRules.value = (Array.isArray(result.Rules) ? result.Rules : []).map(
      (x: any) => ({
        ...x,
        AgentWithdrawAccount: String(x.AgentWithdrawAccount || ''),
        AutoWithdrawalAmount: Number(x.AutoWithdrawalAmount || 0) / 100,
        AutoWithdrawAmountMax: Number(x.AutoWithdrawAmountMax || 0) / 100,
        AutoWithdrawAmountMin: Number(x.AutoWithdrawAmountMin || 0) / 100,
        PayType: Number(x.PayType || 0),
      }),
    );
    autoRemoveIds.value = [];
    autoOpen.value = true;
  } catch {
    message.warning('加载自动出款设置失败');
  }
}

function addAutoRule() {
  autoRules.value.push({
    AgentWithdrawAccount: '',
    AutoWithdrawalAmount: 0,
    AutoWithdrawAmountMax: 1,
    AutoWithdrawAmountMin: 1,
    PayType: 1,
  });
}

function removeAutoRule(row: Record<string, any>) {
  if (row.Id) autoRemoveIds.value.push(row.Id);
  autoRules.value.splice(autoRules.value.indexOf(row), 1);
}

async function saveAuto() {
  if (!autoSetting.ValidCode) {
    message.warning('请输入谷歌验证码');
    return;
  }
  const duplicate = autoRules.value.some(
    (rule, index, list) =>
      list.findIndex(
        (item) =>
          item.PayType === rule.PayType &&
          item.AutoWithdrawAmountMin === rule.AutoWithdrawAmountMin &&
          item.AutoWithdrawAmountMax === rule.AutoWithdrawAmountMax,
      ) !== index,
  );
  if (duplicate) {
    message.warning('自动出款档位不可重复');
    return;
  }
  const invalid = autoRules.value.some(
    (x) =>
      !x.PayType ||
      Number(x.AutoWithdrawAmountMin) <= 0 ||
      Number(x.AutoWithdrawAmountMax) < Number(x.AutoWithdrawAmountMin),
  );
  if (invalid) {
    message.warning('请正确填写通道类型及金额范围');
    return;
  }
  try {
    const rules = autoRules.value.map((x) => ({
      ...x,
      AgentWithdrawAccount: String(x.AgentWithdrawAccount || ''),
      AutoWithdrawalAmount: Number(x.AutoWithdrawalAmount || 0) * 100,
      AutoWithdrawAmountMax: Number(x.AutoWithdrawAmountMax) * 100,
      AutoWithdrawAmountMin: Number(x.AutoWithdrawAmountMin) * 100,
      PayType: String(x.PayType || ''),
    }));
    await drawmoneyRequest.saveAutoSettings({
      Id: autoSetting.Id,
      RealNameBlockStatus: autoSetting.RealNameBlockStatus,
      RemoveIds: autoRemoveIds.value.join(','),
      Rules: JSON.stringify(rules),
      Status: autoSetting.Status,
      ValidCode: autoSetting.ValidCode,
    });
    autoOpen.value = false;
    message.success('自动出款设置已保存');
  } catch {
    /* */
  }
}

const actionTitleMap: Record<ActionKind, string> = {
  agree: '同意出款',
  manual: '人工出款',
  refuse: '拒绝出款',
  remark: '备注',
};

onMounted(() => {
  if (checkPermission(12_749)) loadAutoRefresh();
});

onUnmounted(() => {
  clearAutoTimer();
});
</script>

<template>
  <Result v-if="!canView" status="403" sub-title="无提款列表查看权限" title="403" />
  <div v-else>
    <div class="mb-3 flex flex-wrap items-end gap-x-3 gap-y-2">
      <Input v-model:value="withdrawQuery.Applicant" placeholder="代理账号" style="width: 220px">
        <template #addonBefore>代理账号</template>
      </Input>
        <Input v-model:value="withdrawQuery.OrderId" placeholder="订单号" style="width: 220px">
          <template #addonBefore>订单号</template>
        </Input>
        <Input v-model:value="withdrawQuery.HandlerName" placeholder="操作人员" style="width: 220px">
          <template #addonBefore>操作人员</template>
        </Input>
        <Input v-model:value="withdrawQuery.ShowName" placeholder="出款通道" style="width: 220px">
          <template #addonBefore>出款通道</template>
        </Input>
        <Input v-model:value="withdrawQuery.WithdrawAccount" placeholder="出款账号" style="width: 220px">
          <template #addonBefore>出款账号</template>
        </Input>
        <Input v-model:value="withdrawQuery.PayName" placeholder="持卡人" style="width: 210px">
          <template #addonBefore>持卡人</template>
        </Input>
        <Select v-model:value="withdrawQuery.AccountType" mode="multiple" :options="PAY_TYPE_OPTIONS" placeholder="提款方式"
          style="min-width: 150px" />
        <Select v-model:value="withdrawQuery.AmountType" :options="[
          { label: '申请金额', value: 1 },
          { label: '实际出款', value: 2 },
        ]" style="width: 120px" />
        <Select v-model:value="withdrawQuery.SelectTimeType" :options="[
          { label: '申请时间', value: 1 },
          { label: '结束时间', value: 2 },
          { label: '财务响应时间', value: 3 },
        ]" />
        <DatePicker.RangePicker v-model:value="withdrawRange" show-time />
        <InputNumber v-model:value="withdrawQuery.AmountMin" placeholder="最小金额" />
        <InputNumber v-model:value="withdrawQuery.AmountMax" placeholder="最大金额" />
        <Select v-model:value="withdrawQuery.WithdrawStatus" allow-clear placeholder="状态" :options="[
          { label: '待处理', value: '1' },
          { label: '已出款', value: '2' },
          { label: '退款驳回', value: '3' },
          { label: '不退款驳回', value: '4' },
          { label: '出款异常', value: '5' },
          { label: '处理中', value: '6' },
        ]" style="width: 130px" />
        <Button type="primary" @click="withdrawGridApi.reload()">查询</Button>
        <Button @click="resetWithdraw">重置</Button>
        <Button @click="exportWithdraw">导出 Excel</Button>
        <Button v-if="checkPermission(12032)" type="primary" ghost @click="openAuto">
          自动出款设置
        </Button>
        <span v-if="checkPermission(12749)">
          自动刷新
          <Switch :checked="autoRefreshStatus === 1" @change="(v) => toggleAutoRefresh(!!v)" />
        </span>
        <Button type="primary" :disabled="selected.length === 0" @click="batchManual">
          批量人工出款
        </Button>
        <Button danger :disabled="selected.length === 0" @click="batchRefuse">
          批量拒绝出款
        </Button>
      </div>

    <SummaryCards :items="withdrawSummaryItems" />
    <Space v-if="Number(withdrawTotal.PendingCountNum) > 0" class="mb-3">
      <Button danger type="link" @click="filterPending">查看未处理订单</Button>
    </Space>

    <WithdrawGrid>
      <template #applyAccount="{ row }">
        <AgencyAccountLink :admin-id="resolveAgencyAdminId(row)" :username="row.ApplyAccount" />
      </template>
      <template #actions="{ row }">
        <Space :size="0" wrap>
          <Button v-if="canStart(row)" type="link" size="small" @click="start(row)">
            开始处理
          </Button>
          <Button v-if="canManual(row)" type="link" size="small" @click="openAction('manual', row)">
            人工出款
          </Button>
          <Button v-if="checkPermission(12743) && canAgreeOrRefuse(row)" type="link" size="small"
            @click="prepareAgree(row)">
            同意出款
          </Button>
          <Button v-if="checkPermission(12745) && canAgreeOrRefuse(row)" danger type="link" size="small"
            @click="openAction('refuse', row)">
            拒绝出款
          </Button>
          <Button v-if="checkPermission(12747) && canCheckOrTransition(row)" type="link" size="small"
            @click="checkWithdraw(row)">
            提现查询
          </Button>
          <Button v-if="checkPermission(12748) && canCheckOrTransition(row)" type="link" size="small"
            @click="transition(row)">
            转待处理
          </Button>
          <Button type="link" size="small" @click="viewLogs(row)">
            出款记录
          </Button>
          <Button v-if="checkPermission(12751)" type="link" size="small" @click="openAction('remark', row)">
            备注
          </Button>
          <Button v-if="checkPermission(12750) && row.CreateAdminId" type="link" size="small" @click="
            router.push(`/netcash/agencyAccountDetails/${row.CreateAdminId}`)
            ">
            代理详情
          </Button>
        </Space>
      </template>
    </WithdrawGrid>

    <Modal v-model:open="actionOpen" :title="actionTitleMap[actionKind]" @ok="submitAction">
      <Form layout="vertical">
        <template v-if="actionKind === 'refuse'">
          <Form.Item label="是否退币">
            <Radio.Group v-model:value="actionForm.RefundScore">
              <Radio :value="1">退款</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="拒绝原因">
            <Select v-model:value="actionForm.RefuseTitle" :options="[
              { label: '提款账号与姓名不符', value: '提款账号与姓名不符' },
              { label: '其他', value: '其他' },
            ]" />
          </Form.Item>
          <Form.Item v-if="actionForm.RefuseTitle === '其他'" label="操作说明">
            <Input.TextArea v-model:value="actionForm.HandlerInf" />
          </Form.Item>
        </template>
        <Form.Item v-if="actionKind === 'agree'" label="出款通道" required>
          <Select v-model:value="actionForm.WithdrawAccountId" :options="agreeChannels.map((x) => ({ label: x.ShowName, value: x.Id }))
            " />
        </Form.Item>
        <Descriptions v-if="actionKind === 'manual' || actionKind === 'agree'" bordered size="small">
          <Descriptions.Item label="真实姓名">
            {{ actionRow.PayRealName }}
          </Descriptions.Item>
          <Descriptions.Item label="申请金额">
            {{ money(actionRow.ApplyAmount) }}
          </Descriptions.Item>
          <Descriptions.Item label="实际出款">
            {{ money(actionRow.RealAmount) }}
          </Descriptions.Item>
        </Descriptions>
        <Form.Item v-if="actionKind === 'refuse' || actionKind === 'remark'" label="备注">
          <Input.TextArea v-model:value="actionForm.Remark" :maxlength="400" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal v-model:open="detailOpen" :footer="null" :title="detailTitle" width="800px">
      <Descriptions v-for="(row, i) in detailRows" :key="i" bordered class="mb-2" size="small">
        <Descriptions.Item v-for="(value, key) in row" :key="key" :label="String(key)">
          {{ value }}
        </Descriptions.Item>
      </Descriptions>
    </Modal>

    <Modal v-model:open="autoOpen" title="自动出款设置" width="900px" @ok="saveAuto">
      <Space class="mb-3">
        <span>功能开关</span>
        <Switch v-model:checked="autoSetting.Status" :checked-value="1" :un-checked-value="0" />
        <Checkbox v-model:checked="autoSetting.RealNameBlockStatus" :disabled="autoSetting.Status === 1"
          :false-value="0" :true-value="1">
          真实姓名超过 5 个字不可自动出款
        </Checkbox>
        <Button :disabled="autoSetting.Status === 1" @click="addAutoRule">
          新增档位
        </Button>
        <span>今日已自动出款总额：{{ money(autoTotal) }}</span>
      </Space>
      <div v-for="(rule, index) in autoRules" :key="rule.Id || index" class="mb-2 flex items-center gap-2">
        <Select v-model:value="rule.PayType" :disabled="autoSetting.Status === 1 || !!rule.Id"
          :options="PAY_TYPE_OPTIONS" style="width: 130px" />
        <InputNumber v-model:value="rule.AutoWithdrawAmountMin" :disabled="autoSetting.Status === 1" :min="1"
          placeholder="最小金额" />
        <span>—</span>
        <InputNumber v-model:value="rule.AutoWithdrawAmountMax" :disabled="autoSetting.Status === 1" :min="1"
          placeholder="最大金额" />
        <Select v-model:value="rule.AgentWithdrawAccount" allow-clear :disabled="autoSetting.Status === 1" :options="autoChannels
            .filter(
              (x) =>
                !rule.PayType ||
                Number(x.AccountType) === Number(rule.PayType),
            )
            .map((x) => ({
              label: `${x.ShowName || x.AccountNum}（${Number(x.ScriptMode) === 1 ? '自动' : '手动'}）`,
              value: String(x.Id),
            }))
          " placeholder="出款通道" style="width: 210px" />
        <span>今日已出 {{ rule.AutoWithdrawalAmount || 0 }}</span>
        <Button danger :disabled="autoSetting.Status === 1" @click="removeAutoRule(rule)">
          删除
        </Button>
      </div>
      <Input.Password v-model:value="autoSetting.ValidCode" class="mt-3" placeholder="谷歌验证码（保存必填）" />
    </Modal>

    <PassPopup ref="exportPass" title="文件密码" type="csv" @confirm="submitExport" />
  </div>
</template>

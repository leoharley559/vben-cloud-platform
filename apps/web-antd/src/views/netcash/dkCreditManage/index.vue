<script lang="ts" setup>
import type { CreditPanelConfig } from '../credit-components/credit-data-panel.vue';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Upload,
} from 'ant-design-vue';

import {
  approveCreditLimitApi,
  getAgentCreditLimitApi,
  rejectCreditLimitApi,
} from '#/api/netcash/credit-limit';
import {
  adjustDkPlayerMoneyApi,
  applyDkCreditApi,
  createDkAccountApi,
  deductDkAccountCreditApi,
  editDkAccountApi,
  fetchDkCreditRecordApi,
  getAgentDkAccountLimitApi,
  getDkAccountLimitListApi,
  getDkCreditLimitApplyRecordListApi,
  getDkNetCashLogListApi,
  getDkPlayerListApi,
  getDkSharedConfigApi,
  getPlayerAvailableDeductCreditApi,
  queryDkPlayersByExcelApi,
} from '#/api/netcash/dk-credit';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { createRequestHash } from '#/utils/crypto';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  CREDIT_APPROVE_STATUS_MAP,
  formatNetcashDateTime,
} from '#/utils/netcash';
import { isSameAcctActionRestricted } from '#/utils/security-restriction';

import CreditDataPanel from '../credit-components/credit-data-panel.vue';
import { unwrapCreditLimitItem } from '../creditLimitManage/components/shared';

defineOptions({ name: 'DkCreditManage' });

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const panelRefs = reactive<
  Record<string, InstanceType<typeof CreditDataPanel>>
>({});
const amount = (value: unknown) => formatAmountFromCent(Number(value || 0));
const date = (value: unknown) => formatNetcashDateTime(value as string);
const canApply = computed(() => checkPermission(11_881));
const canTopup = computed(() => checkPermission(11_882));
const canDeduct = computed(() => checkPermission(11_896));
const canBatch = computed(() => checkPermission(11_897));
const canApprove = computed(() => checkPermission(11_894));
const canReject = computed(() => checkPermission(11_895));
/** 旧站 disableActionButton：getagentdkaccountlimit 返回 10505 时禁用上下分/申请 */
const disableDkActions = ref(false);

const playerStatusMap: Record<number, string> = {
  0: '正常',
  1: '优质',
  2: '关注',
  3: '封号',
  4: '禁提',
  6: '暂时关闭',
  8: '测试',
};
function maskInfo(value: unknown) {
  return value ? String(value).replaceAll(/\w(?=\w{4})/g, '*') : '-';
}
function maskName(value: unknown) {
  const text = String(value || '');
  return text
    ? `${text.slice(0, 1)}${'*'.repeat(Math.min(text.length - 1, 11))}`
    : '-';
}
function changeType(row: Record<string, unknown>) {
  if (Number(row.TransferType) === 3) {
    return Number(row.AdjustAmount) > 0 ? '申请额度' : '扣除额度';
  }
  if (Number(row.TransferType) === 5) {
    return Number(row.AdjustAmount) < 0 ? '上分' : '下分';
  }
  return '未知';
}

const playerConfig: CreditPanelConfig = {
  actionWidth: 120,
  baseQuery: { BindPhone: '-1', PlayerLevelId: -1, VipLevel: '-1' },
  columns: [
    { field: 'LoginAccount', slot: 'loginAccount', title: '会员账号' },
    { field: 'PackageName', title: '产品包' },
    { field: 'Gold', formatter: amount, title: '主钱包（元）' },
    {
      field: 'VipLevel',
      formatter: (value) => `VIP ${value ?? '-'}`,
      title: '会员等级',
    },
    {
      field: 'BindPhone',
      formatter: (_value, row) =>
        `手机：${maskInfo(row.BindPhone)} / 邮箱：${maskInfo(row.Email)}`,
      minWidth: 230,
      title: '联系方式',
    },
    { field: 'RealName', formatter: maskName, title: '真实姓名' },
    { field: 'PromoterUserName', title: '所属代理' },
    {
      field: 'Status',
      formatter: (value) =>
        playerStatusMap[Number(value)] || String(value ?? '-'),
      title: '状态',
    },
  ],
  fetchApi: (query) => {
    if (!String(query.LoginAccount || '').trim()) {
      return Promise.resolve({
        Items: [],
        Pagination: { MaxCount: 0 },
        Total: {},
      });
    }
    return getDkPlayerListApi(query as never);
  },
  filters: [
    {
      field: 'LoginAccount',
      label: '会员账号',
      placeholder: '必须输入会员账号',
    },
    {
      field: 'PackageId',
      label: '产品包',
      options: [
        { label: '全部', value: '' },
        ...(projectConfig.value?.RealPackageIdNameMap || []).map((item) => ({
          label: item.PackageName,
          value: item.PackageId,
        })),
      ],
      type: 'select',
    },
  ],
  // 操作列常驻；按钮权限在模板内判断（避免 setup 时 .value 固化）
  showActions: true,
  summaries: [{ amount: true, field: 'SumGold', label: '主钱包合计' }],
};

const pendingConfig: CreditPanelConfig = {
  actionWidth: 150,
  baseQuery: { AgentType: 3, Status: 1, WalletType: 3 },
  columns: [
    { field: 'AgentAccount', slot: 'agentAccount', title: '系统账号' },
    { field: 'AgentNickName', title: '账号昵称' },
    { field: 'TotalCreditLimit', formatter: amount, title: '总额度（元）' },
    { field: 'AppliableAmount', formatter: amount, title: '剩余可申请（元）' },
    { field: 'AdjustAmount', formatter: amount, title: '本次申请（元）' },
    { field: 'ApplyTime', formatter: date, minWidth: 165, title: '申请时间' },
    { field: 'ApplyNote', minWidth: 180, title: '申请备注' },
  ],
  fetchApi: (query) => getDkCreditLimitApplyRecordListApi(query as never),
  filters: [
    { field: 'AgentAccount', label: '系统账号' },
    { field: 'AgentNickName', label: '账号昵称' },
  ],
  showActions: true,
  summaries: [
    { amount: true, field: 'TotalAdjustAmount', label: '申请额度合计' },
  ],
};

const rechargeConfig: CreditPanelConfig = {
  baseQuery: {
    AgentType: 3,
    IsBO: 1,
    PlayerInfo: 1,
    TransferType: 5,
    WalletType: 3,
  },
  columns: [
    { field: 'OrderId', title: '订单号' },
    { field: 'CreateTime', formatter: date, minWidth: 165, title: '操作时间' },
    {
      field: 'ApplyAmount',
      formatter: (value) => (Number(value) < 0 ? '上分' : '下分'),
      title: '操作类型',
    },
    { field: 'AdminAccount', title: '操作人' },
    { field: 'Remarks', minWidth: 180, title: '备注' },
    { field: 'ReferenceAccount', title: '会员账号' },
    { field: 'PackageName', title: '产品包' },
    { field: 'PromoterName', title: '所属代理' },
    {
      field: 'ApplyAmount',
      formatter: (value) => amount(-Number(value || 0)),
      title: '操作金额（元）',
    },
    {
      field: 'WithdrawWaterMultiply',
      formatter: (value) => Number(value || 0).toFixed(2),
      title: '流水倍数',
    },
    { field: 'PlayerWallet', formatter: () => '主钱包', title: '玩家钱包' },
    {
      field: 'Status',
      formatter: (value) =>
        ({ 0: '-', 2: '成功', 3: '拒绝' })[Number(value)] || '-',
      title: '状态',
    },
  ],
  exportFileName: checkPermission(11_905) ? '充值下分记录' : undefined,
  // 旧站 rangeDate2 传 unix 秒，勿再 *1000
  fetchApi: (query) => fetchDkCreditRecordApi(query as never),
  filters: [
    { field: 'AccountName', label: '操作人' },
    { field: 'PlayerAccount', label: '会员账号' },
    {
      field: 'AdjustType',
      label: '操作类型',
      options: [
        { label: '全部', value: '' },
        { label: '上分', value: 2 },
        { label: '下分', value: 1 },
      ],
      type: 'select',
    },
    { field: 'PromoterName', label: '所属代理' },
    { field: 'Remarks', label: '备注' },
    { fields: ['BeginTime', 'EndTime'], label: '操作时间', type: 'dateRange' },
  ],
  summaries: [{ amount: true, field: 'TotalAmount', label: '操作金额合计' }],
};

const accountConfig: CreditPanelConfig = {
  actionWidth: 200,
  baseQuery: { AgentType: 3, Status: 1, WalletType: 3 },
  columns: [
    { field: 'CreateTime', formatter: date, minWidth: 165, title: '创建时间' },
    { field: 'AgentAccount', slot: 'agentAccount', title: '系统账号' },
    { field: 'AgentNickName', title: '账号昵称' },
    { field: 'TotalCreditLimit', formatter: amount, title: '总额度（元）' },
    {
      field: 'AccumulateCredit',
      formatter: amount,
      title: '累计额度申请（元）',
    },
    { field: 'Credit', formatter: amount, title: '可用额度（元）' },
    { field: 'AccumulateRecharge', formatter: amount, title: '累计充值（元）' },
    { field: 'AccumulateDeduct', formatter: amount, title: '累计下分（元）' },
    {
      field: 'AccumulateCreditDeduct',
      formatter: amount,
      title: '累计额度扣除（元）',
    },
  ],
  fetchApi: (query) => getDkAccountLimitListApi(query as never),
  filters: [
    { field: 'AgentAccount', label: '系统账号' },
    { field: 'AgentNickName', label: '账号昵称' },
  ],
  showActions: true,
  summaries: [
    { amount: true, field: 'TotalCredit', label: '可用额度合计' },
    {
      amount: true,
      field: 'TotalAccumulateRecharge',
      label: '累计充值合计',
    },
  ],
};

const adjustRecordConfig: CreditPanelConfig = {
  // Status 空串=全部；旧站 -1 实测恒空（同平台额度 API-080）
  baseQuery: { AgentType: 3, Status: '', WalletType: 3 },
  columns: [
    {
      field: 'TransferType',
      formatter: (_value, row) => changeType(row),
      title: '变更类型',
    },
    { field: 'AgentAccount', slot: 'agentAccount', title: '系统账号' },
    { field: 'AgentNickName', title: '账号昵称' },
    { field: 'AdjustAmount', formatter: amount, title: '额度变更（元）' },
    { field: 'ApplyTime', formatter: date, minWidth: 165, title: '申请时间' },
    { field: 'ApplyAccount', title: '申请人' },
    { field: 'FinishTime', formatter: date, minWidth: 165, title: '审核时间' },
    { field: 'FinishAccount', title: '审核人' },
    {
      field: 'Status',
      formatter: (value) => CREDIT_APPROVE_STATUS_MAP[Number(value)] || '-',
      title: '审核结果',
    },
  ],
  exportFileName: checkPermission(11_902) ? '代客额度调整记录' : undefined,
  fetchApi: (query) => getDkCreditLimitApplyRecordListApi(query as never),
  filters: [
    { field: 'AgentAccount', label: '系统账号' },
    { field: 'AgentNickName', label: '账号昵称' },
    {
      field: 'AdjustType',
      label: '变更类型',
      options: [
        { label: '全部', value: '' },
        { label: '申请额度', value: 3 },
        { label: '扣除额度', value: 4 },
      ],
      type: 'select',
    },
    {
      defaultValue: '',
      field: 'Status',
      label: '审核结果',
      options: [
        { label: '全部', value: '' },
        { label: '通过', value: 2 },
        { label: '拒绝', value: 3 },
      ],
      type: 'select',
    },
    {
      fields: ['BeginFinishTime', 'EndFinishTime'],
      label: '审核时间',
      type: 'dateRange',
    },
  ],
  summaries: [
    { amount: true, field: 'TotalAdjustAmount', label: '额度变更合计' },
  ],
};

const logConfig: CreditPanelConfig = {
  baseQuery: { AgentType: 3, WalletType: 3 },
  columns: [
    {
      field: 'TransferType',
      formatter: (_value, row) => changeType(row),
      title: '变更类型',
    },
    { field: 'AdminAccount', title: '系统账号' },
    { field: 'AgentNickName', title: '账号昵称' },
    { field: 'AdjustAmount', formatter: amount, title: '额度变更（元）' },
    { field: 'AdjustAmountBef', formatter: amount, title: '变更前额度（元）' },
    { field: 'AdjustAmountAft', formatter: amount, title: '变更后额度（元）' },
    { field: 'UpdateTime', formatter: date, minWidth: 165, title: '帐变时间' },
    { field: 'ReviewNote', minWidth: 180, title: '备注' },
  ],
  exportFileName: checkPermission(11_903) ? '代客额度帐变记录' : undefined,
  fetchApi: (query) => getDkNetCashLogListApi(query as never),
  filters: [
    { field: 'AdminAccount', label: '系统账号' },
    { field: 'AgentNickName', label: '账号昵称' },
    {
      field: 'AdjustType',
      label: '变更类型',
      options: [
        { label: '全部', value: '' },
        { label: '上分', value: 1 },
        { label: '申请额度', value: 3 },
        { label: '扣除额度', value: 4 },
      ],
      type: 'select',
    },
    {
      fields: ['TransferStartTime', 'TransferEndTime'],
      label: '帐变时间',
      type: 'dateRange',
    },
  ],
  summaries: [
    { amount: true, field: 'TotalAdjustAmount', label: '额度变更合计' },
  ],
};

const tabs = computed(() =>
  [
    {
      config: playerConfig,
      inner: 11_906,
      key: 'player',
      outer: 11_880,
      tab: '代客充值',
    },
    {
      config: pendingConfig,
      inner: 11_893,
      key: 'pending',
      outer: 11_883,
      tab: '额度审核',
    },
    {
      config: rechargeConfig,
      inner: 11_904,
      key: 'recharge',
      outer: 11_884,
      tab: '充值/下分记录',
    },
    {
      config: accountConfig,
      inner: 11_889,
      key: 'account',
      outer: 11_885,
      tab: '账号列表',
    },
    {
      config: adjustRecordConfig,
      inner: 11_899,
      key: 'record',
      outer: 11_887,
      tab: '额度调整记录',
    },
    {
      config: logConfig,
      inner: 11_900,
      key: 'log',
      outer: 11_888,
      tab: '额度帐变记录',
    },
  ].filter((tab) => checkPermission(tab.outer)),
);
const activeTab = ref('player');
const canViewPage = computed(() => tabs.value.length > 0);

const creditInfo = reactive({
  AppliableAmount: 0,
  Credit: 0,
  TotalCreditLimit: 0,
});
const platformCredit = ref(0);
async function loadCreditInfo(showDeniedTip = false) {
  try {
    const result = await getAgentDkAccountLimitApi();
    const item = unwrapCreditLimitItem(result);
    creditInfo.Credit = Number(item.Credit || 0);
    creditInfo.AppliableAmount = Number(item.AppliableAmount || 0);
    creditInfo.TotalCreditLimit = Number(item.TotalCreditLimit || 0);
    disableDkActions.value = false;
  } catch (error) {
    creditInfo.Credit = 0;
    creditInfo.AppliableAmount = 0;
    creditInfo.TotalCreditLimit = 0;
    disableDkActions.value = true;
    if (
      showDeniedTip ||
      Number((error as { status?: number })?.status) === 10_505
    ) {
      message.warning('您没有充值权限，请联系管理员');
    }
  }
}
async function loadPlatformCredit() {
  try {
    const result = await getAgentCreditLimitApi({} as never);
    const item = unwrapCreditLimitItem(result);
    platformCredit.value = Number(item.Dkcredit || 0);
  } catch {
    platformCredit.value = 0;
  }
}

const applyOpen = ref(false);
const applySubmitting = ref(false);
const applyForm = reactive({
  AdjustAmount: undefined as number | undefined,
  ApplyNote: '',
});
function openApply() {
  if (disableDkActions.value) {
    message.warning('您没有充值权限，请联系管理员');
    return;
  }
  applyForm.AdjustAmount = undefined;
  applyForm.ApplyNote = '';
  applyOpen.value = true;
  void loadCreditInfo(true);
}
async function submitApply() {
  const max = creditInfo.AppliableAmount / 100;
  if (
    !applyForm.AdjustAmount ||
    applyForm.AdjustAmount <= 0 ||
    applyForm.AdjustAmount > max
  ) {
    message.warning(`申请额度必须大于 0 且不超过 ${max.toFixed(2)} 元`);
    return;
  }
  if (!applyForm.ApplyNote.trim()) {
    message.warning('请输入申请备注');
    return;
  }
  applySubmitting.value = true;
  try {
    await applyDkCreditApi({
      AdjustAmount: Math.round(applyForm.AdjustAmount * 100),
      AgentType: 3,
      ApplyNote: applyForm.ApplyNote,
      Hash: createRequestHash(),
      TransferType: 3,
      WalletType: 3,
    });
    message.success('申请成功');
    applyOpen.value = false;
    await loadCreditInfo();
  } catch {
    // 请求层已提示
  } finally {
    applySubmitting.value = false;
  }
}

const adjustOpen = ref(false);
const adjustSubmitting = ref(false);
const adjustForm = reactive({
  Amount: undefined as number | undefined,
  AvailableDeductAmount: 0,
  Gold: 0,
  PayPassword: '',
  PlayerId: 0,
  PlayerWallet: 0,
  ReferenceAccount: '',
  Remarks: '',
  WithdrawWaterMultiply: undefined as number | undefined,
  mode: 'topup' as 'deduct' | 'topup',
});
function openTopup(row: Record<string, unknown>) {
  if (disableDkActions.value) {
    message.warning('您没有充值权限，请联系管理员');
    return;
  }
  Object.assign(adjustForm, {
    Amount: undefined,
    AvailableDeductAmount: 0,
    Gold: Number(row.Gold || 0) / 100,
    PayPassword: '',
    PlayerId: Number(row.PlayerId),
    PlayerWallet: 0,
    ReferenceAccount: String(row.LoginAccount || ''),
    Remarks: '',
    WithdrawWaterMultiply: undefined,
    mode: 'topup',
  });
  adjustOpen.value = true;
}
async function openDeduct(row: Record<string, unknown>) {
  if (disableDkActions.value) {
    message.warning('您没有充值权限，请联系管理员');
    return;
  }
  try {
    const result = await getPlayerAvailableDeductCreditApi({
      PlayerId: String(row.PlayerId),
    });
    const item = unwrapCreditLimitItem(result);
    const available = Math.min(
      Number(item.AvailableDeductAmount || 0),
      Number(item.Gold || 0),
    );
    if (available <= 0) {
      message.warning('无可下分额度');
      return;
    }
    Object.assign(adjustForm, {
      Amount: undefined,
      AvailableDeductAmount: available / 100,
      Gold: Number(item.Gold || 0) / 100,
      PayPassword: '',
      PlayerId: Number(item.PlayerId || row.PlayerId),
      PlayerWallet: 0,
      ReferenceAccount: String(item.LoginAccount || row.LoginAccount || ''),
      Remarks: '',
      WithdrawWaterMultiply: undefined,
      mode: 'deduct',
    });
    adjustOpen.value = true;
  } catch {
    // 请求层已提示
  }
}
async function submitAdjust() {
  if (!adjustForm.Amount || adjustForm.Amount <= 0) {
    message.warning('请输入正确金额');
    return;
  }
  if (
    adjustForm.mode === 'deduct' &&
    adjustForm.Amount > adjustForm.AvailableDeductAmount
  ) {
    message.warning('超过可下分额度');
    return;
  }
  if (
    adjustForm.mode === 'topup' &&
    (!Number.isInteger(adjustForm.WithdrawWaterMultiply) ||
      Number(adjustForm.WithdrawWaterMultiply) < 1)
  ) {
    message.warning('流水倍数必须为大于 0 的整数');
    return;
  }
  if (!adjustForm.Remarks.trim() || !adjustForm.PayPassword) {
    message.warning('备注和支付密码为必填项');
    return;
  }
  adjustSubmitting.value = true;
  try {
    await adjustDkPlayerMoneyApi({
      Hash: createRequestHash(),
      Items: JSON.stringify([
        {
          Amount: Math.round(
            (adjustForm.mode === 'topup' ? 1 : -1) * adjustForm.Amount * 100,
          ),
          PlayerId: adjustForm.PlayerId,
          PlayerWallet: 0,
          ReferenceAccount: adjustForm.ReferenceAccount,
          Remarks: adjustForm.Remarks,
          WithdrawWaterMultiply: Math.round(
            Number(adjustForm.WithdrawWaterMultiply || 0),
          ),
        },
      ]),
      PayPassword: adjustForm.PayPassword,
    } as never);
    message.success('操作成功');
    adjustOpen.value = false;
    panelRefs.player?.reload();
    await loadCreditInfo();
  } catch {
    // 请求层已提示
  } finally {
    adjustSubmitting.value = false;
  }
}

interface BatchRow {
  Amount: number;
  PackageName: string;
  PlayerId: number;
  PlayerWallet: number;
  ReferenceAccount: string;
  Remarks: string;
  WithdrawWaterMultiply: number;
  _rowKey: number;
}
const batchOpen = ref(false);
const batchSubmitting = ref(false);
const batchRows = ref<BatchRow[]>([]);
const batchPassword = ref('');
const batchSelectedKeys = ref<number[]>([]);
const batchStats = computed(() => {
  const keySet = new Set(batchSelectedKeys.value);
  const selected = batchRows.value.filter((row) => keySet.has(row._rowKey));
  return {
    imported: batchRows.value.length,
    invalid: batchRows.value.filter((row) => !row.PlayerId).length,
    selected: selected.length,
    selectedAmount: selected.reduce((sum, row) => sum + row.Amount, 0),
    valid: batchRows.value.filter((row) => row.PlayerId).length,
  };
});
function openBatch() {
  if (disableDkActions.value) {
    message.warning('您没有充值权限，请联系管理员');
    return;
  }
  batchRows.value = [];
  batchPassword.value = '';
  batchSelectedKeys.value = [];
  batchOpen.value = true;
}
async function downloadBatchTemplate() {
  const { utils, writeFile } = await import('xlsx');
  const sheet = utils.json_to_sheet([
    {
      产品包: '示例产品',
      会员账号: 'member001',
      充值金额: 100,
      流水倍数: 1,
      申请备注: '批量充值',
    },
  ]);
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, '模板');
  writeFile(book, '代客批量充值模板.xlsx');
}
async function beforeBatchUpload(file: File) {
  if (file.size > 1024 * 1024) {
    message.warning('文件不能超过 1MB');
    return false;
  }
  const { read, utils } = await import('xlsx');
  const workbook = read(await file.arrayBuffer());
  const firstSheet = workbook.Sheets[workbook.SheetNames[0] || ''];
  const rows = firstSheet
    ? (utils.sheet_to_json(firstSheet) as Array<Record<string, unknown>>)
    : [];
  const valid = rows.filter(
    (row) =>
      row.会员账号 &&
      row.产品包 &&
      Number(row.充值金额) > 0 &&
      Number.isInteger(Number(row.流水倍数)) &&
      Number(row.流水倍数) >= 1 &&
      row.申请备注,
  );
  if (valid.length !== rows.length || valid.length === 0) {
    message.warning('导入格式错误或存在空行/无效金额');
    return false;
  }
  const accountPackageKeys = valid.map(
    (row) => `${String(row.会员账号).trim()}::${String(row.产品包).trim()}`,
  );
  if (new Set(accountPackageKeys).size !== accountPackageKeys.length) {
    message.warning('同一产品包中存在重复会员账号，请清理后重新导入');
    return false;
  }
  const result = await queryDkPlayersByExcelApi({
    LoginAccount: valid.map((row) => row.会员账号).join(','),
    MultiAmount: valid.map((row) => row.充值金额).join(','),
    PackageName: valid.map((row) => row.产品包).join(','),
  });
  const items = result.Items || [];
  batchRows.value = valid.map((row, index) => {
    const player = items[index] || {};
    return {
      Amount: Number(row.充值金额),
      PackageName: String(row.产品包),
      PlayerId: Number(player.PlayerId || 0),
      PlayerWallet: 0,
      ReferenceAccount: String(player.LoginAccount || row.会员账号),
      Remarks: String(row.申请备注),
      WithdrawWaterMultiply: Number(row.流水倍数),
      _rowKey: index,
    };
  });
  batchSelectedKeys.value = batchRows.value
    .filter((row) => row.PlayerId)
    .map((row) => row._rowKey);
  return false;
}
async function submitBatch() {
  const keySet = new Set(batchSelectedKeys.value);
  const selected = batchRows.value.filter((row) => keySet.has(row._rowKey));
  if (selected.length === 0 || !batchPassword.value) {
    message.warning('请选择有效记录并输入支付密码');
    return;
  }
  batchSubmitting.value = true;
  try {
    await adjustDkPlayerMoneyApi({
      Hash: createRequestHash(),
      Items: JSON.stringify(
        selected.map((row) => ({
          ...row,
          Amount: Math.round(row.Amount * 100),
        })),
      ),
      PayPassword: batchPassword.value,
    } as never);
    message.success('批量充值成功');
    batchOpen.value = false;
    await loadCreditInfo();
  } catch {
    // 请求层已提示
  } finally {
    batchSubmitting.value = false;
  }
}

const reviewOpen = ref(false);
const reviewSubmitting = ref(false);
const reviewApprove = ref(true);
const reviewRow = ref<Record<string, unknown>>();
const reviewNote = ref('');
function openReview(row: Record<string, unknown>, approve: boolean) {
  reviewRow.value = row;
  reviewApprove.value = approve;
  reviewNote.value = '';
  reviewOpen.value = true;
}
function canReviewRow(row: Record<string, unknown>) {
  return !isSameAcctActionRestricted(23, row.CreateAdminId as number | string);
}
async function submitReview() {
  if (!reviewRow.value) return;
  reviewSubmitting.value = true;
  try {
    await (reviewApprove.value ? approveCreditLimitApi : rejectCreditLimitApi)({
      FinishNote: reviewNote.value,
      Hash: createRequestHash(),
      Ids: String(reviewRow.value.Id),
    });
    message.success('审核成功');
    reviewOpen.value = false;
    panelRefs.pending?.reload();
    panelRefs.record?.reload();
    await loadPlatformCredit();
  } catch {
    // 请求层已提示
  } finally {
    reviewSubmitting.value = false;
  }
}

const accountOpen = ref(false);
const accountSubmitting = ref(false);
const accountOptionsLoading = ref(false);
const accountOptions = ref<
  Array<{ label: string; nickname: string; value: string }>
>([]);
const accountForm = reactive({
  AgentAccount: '',
  AgentNickName: '',
  Credit: 0,
  CreditDeduct: undefined as number | undefined,
  Id: '' as number | string,
  TotalCreditLimit: undefined as number | undefined,
  mode: 'add' as 'add' | 'deduct' | 'edit',
});
async function loadAccountOptions() {
  accountOptionsLoading.value = true;
  try {
    const result = await getDkSharedConfigApi();
    accountOptions.value = (result?.BOAdminName || []).map((item) => ({
      label: item.Label,
      nickname: String(item.Value2 || ''),
      value: item.Label,
    }));
  } catch {
    accountOptions.value = [];
  } finally {
    accountOptionsLoading.value = false;
  }
}
function selectAccount(value: unknown) {
  const selected = accountOptions.value.find(
    (item) => item.value === String(value ?? ''),
  );
  accountForm.AgentNickName = selected?.nickname || '';
}
function openAccount(
  mode: typeof accountForm.mode,
  row?: Record<string, unknown>,
) {
  Object.assign(accountForm, {
    AgentAccount: String(row?.AgentAccount || ''),
    AgentNickName: String(row?.AgentNickName || ''),
    Credit: Number(row?.Credit || 0) / 100,
    CreditDeduct: undefined,
    Id: (row?.Id || '') as number | string,
    TotalCreditLimit: row ? Number(row.TotalCreditLimit || 0) / 100 : undefined,
    mode,
  });
  accountOpen.value = true;
  if (mode === 'add' && accountOptions.value.length === 0) {
    void loadAccountOptions();
  }
}
async function submitAccount() {
  if (!accountForm.AgentAccount.trim()) {
    message.warning('请输入系统账号');
    return;
  }
  if (
    accountForm.mode !== 'deduct' &&
    (!accountForm.TotalCreditLimit || accountForm.TotalCreditLimit <= 0)
  ) {
    message.warning('请输入总额度');
    return;
  }
  if (
    accountForm.mode === 'deduct' &&
    (!accountForm.CreditDeduct || accountForm.CreditDeduct <= 0)
  ) {
    message.warning('请输入扣除额度');
    return;
  }
  accountSubmitting.value = true;
  try {
    const common = {
      AgentAccount: accountForm.AgentAccount,
      AgentNickName: accountForm.AgentNickName,
      Hash: createRequestHash(),
      Id: accountForm.Id,
    };
    if (accountForm.mode === 'add') {
      await createDkAccountApi({
        ...common,
        TotalCreditLimit: Math.round(
          Number(accountForm.TotalCreditLimit) * 100,
        ),
      });
    } else if (accountForm.mode === 'edit') {
      await editDkAccountApi({
        ...common,
        TotalCreditLimit: Math.round(
          Number(accountForm.TotalCreditLimit) * 100,
        ),
      });
    } else {
      await deductDkAccountCreditApi({
        ...common,
        CreditDeduct: Math.round(Number(accountForm.CreditDeduct) * 100),
      });
    }
    message.success('操作成功');
    accountOpen.value = false;
    panelRefs.account?.reload();
  } catch {
    // 请求层已提示
  } finally {
    accountSubmitting.value = false;
  }
}

function handleTabChange(key: number | string) {
  const tabKey = String(key);
  if (tabKey === 'player') void loadCreditInfo(true);
  if (tabKey === 'pending') void loadPlatformCredit();
}

onMounted(() => {
  activeTab.value = tabs.value[0]?.key || 'player';
  handleTabChange(activeTab.value);
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="完整迁移会员查询、额度申请审核、单笔/批量上下分、账号与账变记录"
    title="代客额度管理"
  >
    <Card>
      <Tabs
        v-model:active-key="activeTab"
        size="small"
        type="line"
        @change="handleTabChange"
      >
        <Tabs.TabPane v-for="item in tabs" :key="item.key" :tab="item.tab">
          <Result
            v-if="!checkPermission(item.inner)"
            status="403"
            sub-title="无此模块查看权限"
            title="403"
          />
          <CreditDataPanel
            v-else-if="activeTab === item.key"
            :ref="(el) => el && (panelRefs[item.key] = el as never)"
            :config="item.config"
          >
            <template #toolbar>
              <template v-if="item.key === 'player'">
                <Button
                  v-if="canApply"
                  :disabled="disableDkActions"
                  type="primary"
                  @click="openApply"
                >
                  申请额度
                </Button>
                <Button
                  v-if="canBatch"
                  :disabled="disableDkActions"
                  @click="openBatch"
                >
                  批量充值
                </Button>
              </template>
              <Button
                v-else-if="item.key === 'account' && checkPermission(11_890)"
                type="primary"
                @click="openAccount('add')"
              >
                新增账号
              </Button>
            </template>
            <template
              v-if="item.key === 'player' || item.key === 'pending'"
              #summaryExtra
            >
              <div
                class="flex shrink-0 items-center rounded border border-blue-300 bg-blue-50 p-2 text-sm text-blue-600"
              >
                {{
                  item.key === 'player' ? '代客可用额度' : '平台可用额度'
                }}：{{
                  formatAmountFromCent(
                    item.key === 'player' ? creditInfo.Credit : platformCredit,
                  )
                }}
                <button
                  class="ml-1 inline-flex size-4 items-center justify-center text-blue-600 hover:text-blue-700"
                  title="刷新额度"
                  type="button"
                  @click="
                    item.key === 'player'
                      ? loadCreditInfo(true)
                      : loadPlatformCredit()
                  "
                >
                  <RotateCw class="size-3.5" />
                </button>
              </div>
            </template>
            <template #agentAccount="{ row }">
              <AgencyAccountLink
                :admin-id="resolveAgencyAdminId(row)"
                :username="row.AgentAccount"
              />
            </template>
            <template #actions="{ row }">
              <Space v-if="item.key === 'player'" :size="0">
                <Button
                  v-if="canTopup"
                  :disabled="disableDkActions"
                  size="small"
                  type="link"
                  @click="openTopup(row)"
                >
                  上分
                </Button>
                <Button
                  v-if="canDeduct"
                  :disabled="disableDkActions"
                  danger
                  size="small"
                  type="link"
                  @click="openDeduct(row)"
                >
                  下分
                </Button>
              </Space>
              <Space v-else-if="item.key === 'pending'" :size="0">
                <Button
                  v-if="canApprove"
                  :disabled="!canReviewRow(row)"
                  size="small"
                  type="link"
                  @click="openReview(row, true)"
                >
                  通过
                </Button>
                <Button
                  v-if="canReject"
                  :disabled="!canReviewRow(row)"
                  danger
                  size="small"
                  type="link"
                  @click="openReview(row, false)"
                >
                  拒绝
                </Button>
              </Space>
              <Space v-else-if="item.key === 'account'" :size="0">
                <Button
                  v-if="checkPermission(11_891)"
                  size="small"
                  type="link"
                  @click="openAccount('edit', row)"
                >
                  编辑总额度
                </Button>
                <Button
                  v-if="checkPermission(11_898)"
                  danger
                  size="small"
                  type="link"
                  @click="openAccount('deduct', row)"
                >
                  扣除可用额度
                </Button>
              </Space>
            </template>
          </CreditDataPanel>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <Modal
      v-model:open="applyOpen"
      :confirm-loading="applySubmitting"
      title="申请代客额度"
      @ok="submitApply"
    >
      <Form layout="vertical">
        <Form.Item label="当前可用额度（元）">
          <Input :value="formatAmountFromCent(creditInfo.Credit)" disabled />
        </Form.Item>
        <Form.Item label="总额度（元）">
          <Input
            :value="formatAmountFromCent(creditInfo.TotalCreditLimit)"
            disabled
          />
        </Form.Item>
        <Form.Item label="可申请额度（元）">
          <Input
            :value="formatAmountFromCent(creditInfo.AppliableAmount)"
            disabled
          />
        </Form.Item>
        <Form.Item label="本次申请（元）" required>
          <InputNumber
            v-model:value="applyForm.AdjustAmount"
            :max="creditInfo.AppliableAmount / 100"
            :min="0.01"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
        <Form.Item label="申请备注" required>
          <Input.TextArea
            v-model:value="applyForm.ApplyNote"
            :maxlength="100"
            :rows="4"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="adjustOpen"
      :confirm-loading="adjustSubmitting"
      :title="adjustForm.mode === 'topup' ? '会员上分' : '会员下分'"
      @ok="submitAdjust"
    >
      <Form layout="vertical">
        <Form.Item label="会员账号">
          <Input v-model:value="adjustForm.ReferenceAccount" disabled />
        </Form.Item>
        <Form.Item v-if="adjustForm.mode === 'deduct'" label="主钱包（元）">
          <Input :value="adjustForm.Gold.toFixed(2)" disabled />
        </Form.Item>
        <Form.Item
          :label="
            adjustForm.mode === 'topup' ? '充值金额（元）' : '下分金额（元）'
          "
          required
        >
          <InputNumber
            v-model:value="adjustForm.Amount"
            :max="
              adjustForm.mode === 'deduct'
                ? adjustForm.AvailableDeductAmount
                : undefined
            "
            :min="0.01"
            :precision="2"
            class="w-full"
            :placeholder="
              adjustForm.mode === 'deduct'
                ? `可下分 ${adjustForm.AvailableDeductAmount.toFixed(2)} 元`
                : '请输入充值金额'
            "
          />
        </Form.Item>
        <Form.Item v-if="adjustForm.mode === 'topup'" label="流水倍数" required>
          <InputNumber
            v-model:value="adjustForm.WithdrawWaterMultiply"
            :min="1"
            :precision="0"
            class="w-full"
          />
        </Form.Item>
        <Form.Item
          :label="adjustForm.mode === 'topup' ? '申请备注' : '下分备注'"
          required
        >
          <Input.TextArea
            v-model:value="adjustForm.Remarks"
            :maxlength="100"
            :rows="4"
          />
        </Form.Item>
        <Form.Item label="支付密码" required>
          <Input.Password v-model:value="adjustForm.PayPassword" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="batchOpen"
      :confirm-loading="batchSubmitting"
      title="批量充值"
      width="900px"
      @ok="submitBatch"
    >
      <Space class="mb-4">
        <Upload
          :before-upload="beforeBatchUpload"
          :show-upload-list="false"
          accept=".xlsx,.xls"
        >
          <Button>选择 Excel 文件</Button>
        </Upload>
        <Button @click="downloadBatchTemplate">下载模板</Button>
        <span class="text-gray-500">文件不超过 1MB，重复账号请先在表格中清理</span>
      </Space>
      <div v-if="batchRows.length > 0" class="mb-4 flex flex-wrap gap-2">
        <Tag>导入：{{ batchStats.imported }}</Tag>
        <Tag color="green">有效：{{ batchStats.valid }}</Tag>
        <Tag :color="batchStats.invalid ? 'red' : 'default'">
          无效：{{ batchStats.invalid }}
        </Tag>
        <Tag color="blue">已选：{{ batchStats.selected }}</Tag>
        <Tag color="blue">
          已选总金额：{{ batchStats.selectedAmount.toFixed(2) }} 元
        </Tag>
      </div>
      <Table
        :columns="[
          { dataIndex: 'ReferenceAccount', title: '会员账号' },
          { dataIndex: 'PackageName', title: '产品包' },
          { dataIndex: 'Amount', title: '充值金额（元）' },
          { dataIndex: 'WithdrawWaterMultiply', title: '流水倍数' },
          { dataIndex: 'Remarks', title: '申请备注' },
          { key: 'valid', title: '匹配结果' },
        ]"
        :data-source="batchRows"
        :pagination="false"
        :row-key="(row) => String(row._rowKey)"
        :row-selection="{
          selectedRowKeys: batchSelectedKeys,
          getCheckboxProps: (row) => ({ disabled: !row.PlayerId }),
          onChange: (keys) => (batchSelectedKeys = keys.map(Number)),
        }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'valid'">
            <Tag :color="record.PlayerId ? 'green' : 'red'">
              {{ record.PlayerId ? '有效' : '未匹配' }}
            </Tag>
          </template>
        </template>
      </Table>
      <Form class="mt-4" layout="vertical">
        <Form.Item label="支付密码" required>
          <Input.Password v-model:value="batchPassword" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="reviewOpen"
      :confirm-loading="reviewSubmitting"
      :title="reviewApprove ? '通过代客额度申请' : '拒绝代客额度申请'"
      @ok="submitReview"
    >
      <Alert
        class="mb-4"
        :message="
          reviewApprove
            ? '确认通过后将从平台代客可用额度中扣除本次申请额度。'
            : '确认拒绝后，本次额度申请将不会生效。'
        "
        show-icon
        type="warning"
      />
      <Form layout="vertical">
        <Form.Item label="系统账号">
          <Input :value="String(reviewRow?.AgentAccount || '')" disabled />
        </Form.Item>
        <Form.Item label="申请额度（元）">
          <Input
            :value="formatAmountFromCent(Number(reviewRow?.AdjustAmount))"
            disabled
          />
        </Form.Item>
        <Form.Item label="审核备注">
          <Input.TextArea
            v-model:value="reviewNote"
            :maxlength="100"
            :rows="4"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="accountOpen"
      :confirm-loading="accountSubmitting"
      :title="
        accountForm.mode === 'add'
          ? '新增代客账号'
          : accountForm.mode === 'edit'
            ? '编辑总额度'
            : '扣除可用额度'
      "
      @ok="submitAccount"
    >
      <Form layout="vertical">
        <Form.Item label="系统账号" required>
          <Select
            v-if="accountForm.mode === 'add'"
            v-model:value="accountForm.AgentAccount"
            :loading="accountOptionsLoading"
            :options="accountOptions"
            class="w-full"
            placeholder="请选择后台账号"
            show-search
            @change="selectAccount"
          />
          <Input v-else v-model:value="accountForm.AgentAccount" disabled />
        </Form.Item>
        <Form.Item label="账号昵称">
          <Input
            v-model:value="accountForm.AgentNickName"
            :disabled="accountForm.mode !== 'add'"
          />
        </Form.Item>
        <Form.Item label="总额度（元）" required>
          <InputNumber
            v-model:value="accountForm.TotalCreditLimit"
            :disabled="accountForm.mode === 'deduct'"
            :min="0.01"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
        <Form.Item
          v-if="accountForm.mode === 'deduct'"
          label="当前可用额度（元）"
        >
          <Input :value="accountForm.Credit.toFixed(2)" disabled />
        </Form.Item>
        <Form.Item
          v-if="accountForm.mode === 'deduct'"
          label="扣除可用额度（元）"
          required
        >
          <InputNumber
            v-model:value="accountForm.CreditDeduct"
            :max="accountForm.Credit"
            :min="0.01"
            :precision="2"
            class="w-full"
          />
        </Form.Item>
        <Alert
          v-if="accountForm.mode === 'deduct'"
          message="若扣除当前全部可用额度，该账号将无法继续进行代客充值。"
          show-icon
          type="warning"
        />
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无代客充值查看权限" title="403" />
</template>

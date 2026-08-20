<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWithdrawAccountApi,
  fetchWithdrawAccountDetailApi,
  fetchWithdrawAccountListApi,
  fetchWithdrawAccountStatusApi,
  fetchWithdrawPayTypeConfigApi,
  fetchWithdrawPlayerLevelListApi,
  refreshWithdrawAccountBalanceApi,
  shelfThirdWithdrawApi,
  sortWithdrawPayTypeConfigApi,
  switchWithdrawAccountApi,
  updateThirdWithdrawApi,
  updateWithdrawAccountApi,
  updateWithdrawAccountRoundApi,
  updateWithdrawPayTypeConfigApi,
} from '#/api/gameManage';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';

import WithdrawAccountFormModal from './withdraw-account-form-modal.vue';

defineOptions({ name: 'WithdrawAccountPanel' });

interface WithdrawAccountRow {
  Account?: string;
  AccountName?: string;
  AccountNum?: string;
  AccountType?: number;
  AisleBalance?: number;
  DailyAccAmount?: number;
  DailyAccTimes?: number;
  HandleType?: number;
  Id: number | string;
  MaxOrderMoney?: number;
  MinOrderMoney?: number;
  Money?: number;
  PerMulti?: number;
  Rate?: number;
  RateType?: number;
  CustomRate?: number;
  Description?: string;
  SupportBank?: string;
  PayTypeName?: string;
  RealName?: string;
  Round?: number;
  ScriptMode?: number;
  ScriptStatus?: boolean;
  ShowName?: string;
  Status?: number;
  Switch?: number;
  ThirdWithdrawId?: number | string;
}

interface PayTypeRow {
  AllowInput?: number;
  DeviceList?: string;
  GoldList?: string;
  Id: number | string;
  MaxAmount?: number;
  MinAmount?: number;
  PayType: number;
  PerMulti?: number;
  PerMultiVipList?: string;
  PlayerLevelList?: string;
  ServiceRate?: number;
  Status?: number;
  Sort?: number;
  VipList?: string;
}

const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const canViewPayTypes = computed(() => checkPermission(11_014));
const canManagePayTypes = computed(() => checkPermission(11_015));
const canEditPayType = computed(() => checkPermission(11_017));
const canViewStrategy = computed(() => checkPermission(11_018));
const canViewAccounts = computed(() => checkPermission(11_019));
const canSwitch = computed(() => checkPermission(11_020));
const canCreate = computed(() => checkPermission(11_026));
const canEdit = computed(() => checkPermission(11_021));
const canDelete = computed(() => checkPermission(11_022));
const canShelfThird = computed(() => checkPermission(11_023));
const canEditChannel = computed(() => checkPermission(11_024));
const canEditRound = computed(() => checkPermission(11_025));
const canRefreshBalance = computed(() => checkPermission(12_587));

const actionId = ref<number | string>();
const formOpen = ref(false);
const editId = ref<null | number | string>(null);
const createHandleType = ref(1);
const currentPayType = ref<number | string>('');
const payTypes = ref<PayTypeRow[]>([]);
const payTypeBootstrapped = ref(false);
const payTypeOpen = ref(false);
const payTypeSaving = ref(false);
const payTypeForm = reactive({
  AllowInput: 1,
  DeviceList: [] as string[],
  GoldList: '',
  Id: '' as number | string,
  MaxAmount: undefined as number | undefined,
  MinAmount: undefined as number | undefined,
  PayType: 0,
  PerMulti: -1,
  PerMultiVipList: [] as string[],
  PlayerLevelList: [] as string[],
  ServiceRate: undefined as number | undefined,
  VipList: [] as string[],
});
const playerLevelOptions = ref<Array<{ label: string; value: string }>>([]);
const loadedRows = ref<WithdrawAccountRow[]>([]);
let statusTimer: ReturnType<typeof setInterval> | undefined;
let balanceTimer: ReturnType<typeof setInterval> | undefined;
const BALANCE_LOCK_KEY = 'withdrawAccountBalanceUpdateTime';
const balanceLockSeconds = ref(0);
const scriptModeOpen = ref(false);
const scriptModeSaving = ref(false);
const scriptModeForm = reactive({
  Id: '' as number | string,
  ScriptMode: 1,
});
const moneyOpen = ref(false);
const moneySaving = ref(false);
const moneyForm = reactive({
  detail: {} as Record<string, unknown>,
  Money: undefined as number | undefined,
});
const channelOpen = ref(false);
const channelSaving = ref(false);
const channelForm = reactive({
  CustomRate: undefined as number | undefined,
  Description: '',
  Id: '' as number | string,
  MaxOrderMoney: undefined as number | undefined,
  MinOrderMoney: undefined as number | undefined,
  PerMulti: -1,
  Rate: undefined as number | undefined,
  RateType: 0,
  ShowName: '',
  SupportBank: [] as string[],
  WithdrawId: '' as number | string,
});

const vipOptions = computed(() =>
  (
    (projectConfig.value?.VIPLevelMap || []) as Array<{
      VipLevelId?: number | string;
      VipLevelName?: string;
    }>
  ).map((item) => ({
    label: item.VipLevelName || `VIP${item.VipLevelId}`,
    value: String(item.VipLevelId ?? ''),
  })),
);
const bankOptions = computed(() =>
  (
    (projectConfig.value?.BankList || []) as Array<{
      BankCode?: string;
      BankName?: string;
    }>
  ).map((item) => ({
    label: item.BankName || String(item.BankCode || ''),
    value: String(item.BankCode || ''),
  })),
);
const perMultiOptions = [-1, 0, 10, 50, 100, 500, 1000, 5000, 10_000].map(
  (value) => ({
    label: value === -1 ? '使用出款设置' : (value === 0 ? '全部' : `${value} 倍`),
    value,
  }),
);

const payTypeName = (type?: number) =>
  ({
    1: '银行卡',
    2: '支付宝',
    3: 'USDT',
    4: '极速通道',
    5: 'CNYB',
    6: '易币付',
  })[Number(type)] || `类型 ${type}`;

const gridOptions: VxeTableGridOptions<WithdrawAccountRow> = {
  columns: [
    {
      field: 'Switch',
      slots: { default: 'switch' },
      title: '启用',
      width: 90,
    },
    {
      field: 'ScriptStatus',
      formatter: ({ row }) =>
        row.HandleType === 2
          ? row.ScriptStatus === true
            ? '在线'
            : row.ScriptStatus === false
              ? '离线'
              : '-'
          : '-',
      title: '脚本状态',
      width: 100,
    },
    {
      field: 'ScriptMode',
      slots: { default: 'scriptMode' },
      title: '脚本模式',
      width: 100,
    },
    {
      field: 'AccountType',
      formatter: ({ cellValue }) => payTypeName(Number(cellValue)),
      minWidth: 100,
      title: '通道类型',
    },
    {
      field: 'HandleType',
      formatter: ({ row }) =>
        Number(row.ThirdWithdrawId || 0) > 0
          ? '三方账户'
          : (Number(row.HandleType) === 1
            ? '签约账户'
            : '普通账户'),
      minWidth: 100,
      title: '账号类型',
    },
    {
      field: 'AccountNum',
      formatter: ({ row }) =>
        String(row.ShowName || row.Account || row.AccountNum || '-'),
      minWidth: 150,
      title: '账户',
    },
    {
      field: 'AccountName',
      formatter: ({ row }) => String(row.AccountName || row.RealName || '-'),
      minWidth: 120,
      title: '姓名',
    },
    {
      field: 'AisleBalance',
      slots: { default: 'balance' },
      minWidth: 120,
      title: '通道余额',
    },
    {
      field: 'Money',
      slots: { default: 'money' },
      minWidth: 130,
      title: '今日出款上限',
    },
    {
      field: 'channelSetting',
      slots: { default: 'channelSetting' },
      minWidth: 130,
      title: '通道设置',
    },
    {
      field: 'Round',
      minWidth: 90,
      slots: { default: 'round' },
      title: '轮询权重',
    },
    {
      field: 'DailyAccTimes',
      title: '日调用次数',
      width: 110,
    },
    {
      field: 'DailyAccAmount',
      formatter: ({ cellValue }) => (Number(cellValue || 0) / 100).toFixed(2),
      title: '日出款金额',
      width: 120,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 190,
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        if (!canViewAccounts.value) {
          return { items: [], total: 0 };
        }
        const result = await fetchWithdrawAccountListApi({
          AccountType: currentPayType.value,
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        const items = (result.Items || []) as unknown as WithdrawAccountRow[];
        loadedRows.value = items;
        await refreshScriptStatuses();
        startStatusPolling();
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function isOn(row: WithdrawAccountRow) {
  return Number(row.Switch ?? row.Status) === 1;
}

function canMutateRow(row: WithdrawAccountRow) {
  return Number(row.ThirdWithdrawId || 0) === 0 && !isOn(row);
}

function splitList(value: unknown) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function refreshScriptStatuses() {
  const ids = loadedRows.value.map((row) => row.Id).filter(Boolean);
  if (ids.length === 0 || !canViewAccounts.value) return;
  try {
    const statuses = await fetchWithdrawAccountStatusApi(ids.join(','));
    const statusMap = new Map(
      (statuses || []).map((item) => [String(item.Id), item.Status]),
    );
    loadedRows.value.forEach((row) => {
      if (statusMap.has(String(row.Id))) {
        row.ScriptStatus = statusMap.get(String(row.Id));
      }
    });
  } catch {
    // 状态接口异常不应阻断账户列表，下一轮轮询会自动重试。
  }
}

function startStatusPolling() {
  if (statusTimer) clearInterval(statusTimer);
  if (loadedRows.value.length === 0) return;
  statusTimer = setInterval(() => void refreshScriptStatuses(), 60_000);
}

function openCreate(handleType = 1) {
  editId.value = null;
  createHandleType.value = handleType;
  formOpen.value = true;
}

function openEdit(row: WithdrawAccountRow) {
  editId.value = row.Id;
  formOpen.value = true;
}

async function loadPayTypes() {
  if (!canViewPayTypes.value) return;
  const result = await fetchWithdrawPayTypeConfigApi();
  payTypes.value = ((result.Items || []) as unknown as PayTypeRow[]).toSorted(
    (a, b) => Number(a.Sort || 0) - Number(b.Sort || 0),
  );
  // 对齐旧站：优先选中已开启类型（Status=1）；否则取排序首项
  const enabled =
    payTypes.value.find((item) => Number(item.Status) === 1) ||
    payTypes.value[0];
  if (!payTypeBootstrapped.value) {
    payTypeBootstrapped.value = true;
    if (enabled) currentPayType.value = enabled.PayType;
  } else if (
    enabled &&
    !payTypes.value.some((item) => item.PayType === currentPayType.value)
  ) {
    currentPayType.value = enabled.PayType;
  }
}

async function loadPlayerLevels() {
  if (!canEditPayType.value) return;
  const result = await fetchWithdrawPlayerLevelListApi({
    Page: 1,
    PageSize: 999,
  });
  playerLevelOptions.value = (result.Items || []).map((item) => ({
    label: String(item.LevelName || item.Id || ''),
    value: String(item.Id || ''),
  }));
}

async function selectPayType(row: PayTypeRow) {
  currentPayType.value = row.PayType;
  await gridApi.reload();
}

function openPayType(row: PayTypeRow) {
  payTypeForm.Id = row.Id;
  payTypeForm.PayType = row.PayType;
  payTypeForm.MinAmount = Number(row.MinAmount || 0);
  payTypeForm.MaxAmount = Number(row.MaxAmount || 0);
  payTypeForm.ServiceRate = Number(row.ServiceRate || 0);
  payTypeForm.AllowInput = Number(row.AllowInput ?? 1);
  payTypeForm.GoldList = String(row.GoldList || '');
  payTypeForm.DeviceList = String(row.DeviceList || '')
    .split(',')
    .filter(Boolean);
  payTypeForm.PlayerLevelList = splitList(row.PlayerLevelList);
  payTypeForm.VipList = row.VipList
    ? splitList(row.VipList)
    : vipOptions.value.map((item) => item.value);
  payTypeForm.PerMulti = Number(row.PerMulti ?? -1);
  payTypeForm.PerMultiVipList = row.PerMultiVipList
    ? splitList(row.PerMultiVipList)
    : vipOptions.value.map((item) => item.value);
  payTypeOpen.value = true;
}

async function savePayType() {
  if (!payTypeForm.MinAmount || !payTypeForm.MaxAmount) {
    message.warning('请填写提现区间');
    return;
  }
  if (payTypeForm.MaxAmount < payTypeForm.MinAmount) {
    message.warning('最大金额不能小于最小金额');
    return;
  }
  if (
    payTypeForm.MinAmount > 50_000_000 ||
    payTypeForm.MaxAmount > 50_000_000
  ) {
    message.warning('提现金额不能超过 50000000');
    return;
  }
  if (
    payTypeForm.ServiceRate === undefined ||
    !Number.isFinite(payTypeForm.ServiceRate) ||
    payTypeForm.ServiceRate < 0 ||
    payTypeForm.ServiceRate > 100
  ) {
    message.warning('手续费率须在 0 至 100 之间');
    return;
  }
  if (payTypeForm.DeviceList.length === 0) {
    message.warning('请至少选择一个显示设备');
    return;
  }
  if (payTypeForm.AllowInput !== 1 && !payTypeForm.GoldList.trim()) {
    message.warning('不允许玩家输入时必须配置快捷出款金额');
    return;
  }
  const goldList = splitList(payTypeForm.GoldList);
  const goldNumbers = goldList.map(Number);
  if (
    goldList.length > 15 ||
    goldNumbers.some((value) => !Number.isInteger(value) || value <= 0) ||
    new Set(goldNumbers).size !== goldNumbers.length
  ) {
    message.warning('快捷出款金额须为正整数、不可重复，且最多 15 个');
    return;
  }
  if (
    goldNumbers.some(
      (value) =>
        value < Number(payTypeForm.MinAmount) ||
        value > Number(payTypeForm.MaxAmount),
    )
  ) {
    message.warning('快捷出款金额必须位于提现金额区间内');
    return;
  }
  if (payTypeForm.PlayerLevelList.length === 0) {
    message.warning('请至少选择一个玩家层级');
    return;
  }
  if (payTypeForm.VipList.length === 0) {
    message.warning('请至少选择一个开放 VIP');
    return;
  }
  if (payTypeForm.PerMulti > 0 && payTypeForm.PerMultiVipList.length === 0) {
    message.warning('启用提现倍数时请至少选择一个 VIP');
    return;
  }
  payTypeSaving.value = true;
  try {
    await updateWithdrawPayTypeConfigApi(payTypeForm.Id, {
      AllowInput: payTypeForm.AllowInput,
      DeviceList: payTypeForm.DeviceList.join(','),
      GoldList: goldNumbers.toSorted((a, b) => a - b).join(','),
      MaxAmount: payTypeForm.MaxAmount,
      MinAmount: payTypeForm.MinAmount,
      PayType: payTypeForm.PayType,
      PerMulti: payTypeForm.PerMulti,
      PerMultiVipList: payTypeForm.PerMultiVipList.join(','),
      PlayerLevelList: payTypeForm.PlayerLevelList.join(','),
      ServiceRate: payTypeForm.ServiceRate,
      VipList: payTypeForm.VipList.join(','),
    });
    message.success('提现方式配置已保存');
    payTypeOpen.value = false;
    await loadPayTypes();
  } finally {
    payTypeSaving.value = false;
  }
}

async function movePayType(index: number, offset: number) {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= payTypes.value.length) return;
  const previous = [...payTypes.value];
  const next = [...payTypes.value];
  const [moved] = next.splice(index, 1);
  if (!moved) return;
  next.splice(nextIndex, 0, moved);
  payTypes.value = next;
  try {
    await sortWithdrawPayTypeConfigApi({
      Ids: next.map((item) => item.Id).join(','),
    });
    message.success('出款类型顺序已更新');
    await loadPayTypes();
  } catch {
    payTypes.value = previous;
  }
}

function handlePayTypeSwitch(row: PayTypeRow, checked: boolean) {
  Modal.confirm({
    content: `确认${checked ? '开启' : '关闭'}「${payTypeName(row.PayType)}」？`,
    onCancel: () => loadPayTypes(),
    onOk: async () => {
      await updateWithdrawPayTypeConfigApi(row.Id, {
        MaxAmount: row.MaxAmount,
        MinAmount: row.MinAmount,
        ServiceRate: row.ServiceRate,
        Status: checked ? 1 : 2,
      });
      message.success('操作成功');
      await loadPayTypes();
    },
    title: '提现方式开关',
  });
}

async function updateRound(row: WithdrawAccountRow, value: null | number) {
  await updateWithdrawAccountRoundApi({ Id: row.Id, Round: value || 1 });
  message.success('轮询权重已更新');
  await gridApi.reload();
}

function openScriptMode(row: WithdrawAccountRow) {
  if (!canEditRound.value || isOn(row) || Number(row.HandleType) !== 2) return;
  scriptModeForm.Id = row.Id;
  scriptModeForm.ScriptMode = Number(row.ScriptMode || 1);
  scriptModeOpen.value = true;
}

async function saveScriptMode() {
  scriptModeSaving.value = true;
  try {
    await updateWithdrawAccountRoundApi({
      Id: scriptModeForm.Id,
      ScriptMode: scriptModeForm.ScriptMode,
    });
    message.success('脚本模式已更新');
    scriptModeOpen.value = false;
    await gridApi.reload();
  } finally {
    scriptModeSaving.value = false;
  }
}

function formatMoney(value: unknown) {
  return Number(value) === 99_999_999_999
    ? '-'
    : (Number(value || 0) / 100).toFixed(2);
}

async function openMoney(row: WithdrawAccountRow) {
  const detail = await fetchWithdrawAccountDetailApi(row.Id);
  moneyForm.detail = detail;
  moneyForm.Money =
    Number(detail.Money) === 99_999_999_999
      ? undefined
      : Number(detail.Money || 0) / 100;
  moneyOpen.value = true;
}

async function saveMoney() {
  if (
    moneyForm.Money !== undefined &&
    (!Number.isFinite(moneyForm.Money) || moneyForm.Money <= 0)
  ) {
    message.warning('今日出款上限须为大于 0 的金额，留空表示不限');
    return;
  }
  moneySaving.value = true;
  try {
    await updateWithdrawAccountApi({
      ...moneyForm.detail,
      Money:
        moneyForm.Money === undefined
          ? 99_999_999_999
          : Math.round(moneyForm.Money * 100),
    });
    message.success('今日出款上限已更新');
    moneyOpen.value = false;
    await gridApi.reload();
  } finally {
    moneySaving.value = false;
  }
}

function openChannelSetting(row: WithdrawAccountRow) {
  channelForm.Id = row.ThirdWithdrawId as number | string;
  channelForm.WithdrawId = row.Id;
  channelForm.ShowName = String(row.ShowName || '');
  channelForm.RateType = Number(row.RateType || 0);
  channelForm.Rate = Number(row.Rate || 0);
  channelForm.CustomRate = Number(row.CustomRate || 0) / 10_000;
  channelForm.MinOrderMoney = row.MinOrderMoney
    ? Number(row.MinOrderMoney) / 100
    : undefined;
  channelForm.MaxOrderMoney = row.MaxOrderMoney
    ? Number(row.MaxOrderMoney) / 100
    : undefined;
  channelForm.SupportBank = row.SupportBank
    ? splitList(row.SupportBank)
    : bankOptions.value.map((item) => item.value);
  channelForm.PerMulti = Number(row.PerMulti ?? -1);
  channelForm.Description = String(row.Description || '');
  channelOpen.value = true;
}

async function saveChannelSetting() {
  if (
    channelForm.RateType !== 1 &&
    (channelForm.Rate === undefined ||
      channelForm.Rate < 0 ||
      channelForm.Rate > 100)
  ) {
    message.warning('百分比费率须在 0 至 100 之间');
    return;
  }
  if (
    channelForm.RateType !== 0 &&
    (channelForm.CustomRate === undefined || channelForm.CustomRate < 0)
  ) {
    message.warning('请填写正确的固定费率');
    return;
  }
  if (
    (channelForm.MinOrderMoney === undefined) !==
      (channelForm.MaxOrderMoney === undefined) ||
    Number(channelForm.MinOrderMoney || 0) >
      Number(channelForm.MaxOrderMoney || 0)
  ) {
    message.warning('请填写正确的单笔出款区间');
    return;
  }
  channelSaving.value = true;
  try {
    await updateThirdWithdrawApi({
      CustomRate: Number(channelForm.CustomRate || 0) * 10_000,
      Description: channelForm.Description,
      Id: channelForm.Id,
      MaxOrderMoney: Math.round(Number(channelForm.MaxOrderMoney || 0) * 100),
      MinOrderMoney: Math.round(Number(channelForm.MinOrderMoney || 0) * 100),
      PerMulti: channelForm.PerMulti,
      Rate: channelForm.Rate || 0,
      RateType: channelForm.RateType,
      SupportBank: channelForm.SupportBank.join(','),
      WithdrawId: channelForm.WithdrawId,
    });
    await shelfThirdWithdrawApi({ Id: channelForm.Id, OnShelf: 1 });
    message.success('通道设置已保存并重新上架');
    channelOpen.value = false;
    await gridApi.reload();
  } finally {
    channelSaving.value = false;
  }
}

function shelfThirdAccount(row: WithdrawAccountRow) {
  Modal.confirm({
    content: `确认下架三方账户「${row.ShowName || row.AccountNum}」？`,
    onOk: async () => {
      await shelfThirdWithdrawApi({
        Id: row.ThirdWithdrawId as number | string,
        OnShelf: 2,
      });
      message.success('下架成功');
      await gridApi.reload();
    },
    title: '下架三方账户',
  });
}

function syncBalanceLock() {
  const lockTime = Number(localStorage.getItem(BALANCE_LOCK_KEY) || 0);
  const remaining = Math.ceil((lockTime + 60_000 - Date.now()) / 1000);
  balanceLockSeconds.value = Math.max(0, remaining);
  if (balanceLockSeconds.value === 0) {
    localStorage.removeItem(BALANCE_LOCK_KEY);
    if (balanceTimer) clearInterval(balanceTimer);
    balanceTimer = undefined;
  }
}

function lockBalanceRefresh() {
  localStorage.setItem(BALANCE_LOCK_KEY, String(Date.now()));
  syncBalanceLock();
  if (balanceTimer) clearInterval(balanceTimer);
  balanceTimer = setInterval(syncBalanceLock, 1000);
}

function refreshBalance(row: WithdrawAccountRow) {
  Modal.confirm({
    content: `确认刷新「${row.ShowName || row.AccountNum}」的通道余额？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        const result = await refreshWithdrawAccountBalanceApi({ Ids: row.Id });
        lockBalanceRefresh();
        if (
          String(result.Id) === String(row.Id) &&
          result.Balance !== undefined
        ) {
          row.AisleBalance = Number(result.Balance);
        }
        message.success('余额已刷新');
      } catch (error) {
        lockBalanceRefresh();
        throw error;
      } finally {
        actionId.value = undefined;
      }
    },
    title: '刷新余额',
  });
}

onMounted(() => {
  void (async () => {
    await Promise.all([loadPayTypes(), loadPlayerLevels()]);
    if (canViewAccounts.value) await gridApi.reload();
  })();
  syncBalanceLock();
  if (balanceLockSeconds.value > 0) {
    balanceTimer = setInterval(syncBalanceLock, 1000);
  }
});

onUnmounted(() => {
  if (statusTimer) clearInterval(statusTimer);
  if (balanceTimer) clearInterval(balanceTimer);
});

function handleSwitch(row: WithdrawAccountRow, checked: boolean) {
  const next = checked ? 1 : 2;
  const prev = isOn(row) ? 1 : 2;
  Modal.confirm({
    content: `确认${checked ? '启用' : '停用'}账户「${row.AccountName || row.RealName || row.Account || row.AccountNum}」？`,
    onCancel: () => {
      row.Switch = prev;
    },
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await switchWithdrawAccountApi({ Id: row.Id, Switch: next });
        message.success('操作成功');
        await gridApi.reload();
      } catch {
        row.Switch = prev;
      } finally {
        actionId.value = undefined;
      }
    },
    title: '提示',
  });
}

function handleDelete(row: WithdrawAccountRow) {
  Modal.confirm({
    content: `确认删除账户「${row.AccountName || row.RealName || row.Account || row.AccountNum}」？`,
    title: '删除账户',
    onOk: async () => {
      await deleteWithdrawAccountApi(row.Id);
      message.success('删除成功');
      await gridApi.reload();
    },
  });
}
</script>

<template>
  <div>
    <div
      v-if="canViewPayTypes"
      class="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
      <Card
        v-for="(item, index) in payTypes"
        :key="item.Id"
        hoverable
        size="small"
        class="cursor-pointer border transition-all" :class="[
          currentPayType === item.PayType
            ? '!border-primary shadow-sm'
            : 'border-transparent',
        ]"
        @click="selectPayType(item)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-base font-medium">
              {{ payTypeName(item.PayType) }}
            </div>
            <div class="mt-2 text-xs text-gray-500">
              手续费 {{ item.ServiceRate || 0 }}% · 区间
              {{ item.MinAmount || 0 }} - {{ item.MaxAmount || 0 }}
            </div>
          </div>
          <Switch
            v-if="canManagePayTypes"
            :checked="Number(item.Status) === 1"
            checked-children="开"
            un-checked-children="关"
            @click.stop
            @change="(checked) => handlePayTypeSwitch(item, !!checked)"
          />
          <Tag
            v-else
            :color="Number(item.Status) === 1 ? 'success' : 'default'"
          >
            {{ Number(item.Status) === 1 ? '开启' : '关闭' }}
          </Tag>
        </div>
        <div class="mt-3 flex justify-end gap-1">
          <Button
            v-if="canManagePayTypes"
            :disabled="index === 0"
            size="small"
            @click.stop="movePayType(index, -1)"
          >
            上移
          </Button>
          <Button
            v-if="canManagePayTypes"
            :disabled="index === payTypes.length - 1"
            size="small"
            @click.stop="movePayType(index, 1)"
          >
            下移
          </Button>
          <Button
            v-if="canEditPayType"
            size="small"
            type="link"
            @click.stop="openPayType(item)"
          >
            配置
          </Button>
        </div>
      </Card>
    </div>

    <div
      v-if="canViewStrategy"
      class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 p-3"
    >
      <div>
        <div class="font-medium">{{ payTypeName(currentPayType) }}通道策略</div>
        <div class="mt-1 text-xs text-gray-400">
          账户启用后不可编辑或删除；三方账户请在“三方代付通道管理”维护。
        </div>
      </div>
      <Space>
        <Button v-if="canCreate && currentPayType === 2" @click="openCreate(2)">
          新增普通支付宝
        </Button>
        <Button
          v-if="canCreate && currentPayType === 2"
          type="primary"
          @click="openCreate(1)"
        >
          新增签约支付宝
        </Button>
        <Button v-if="canViewAccounts" @click="gridApi.reload()">
刷新列表
</Button>
      </Space>
    </div>
    <Grid v-if="canViewStrategy && canViewAccounts">
      <template #switch="{ row }">
        <Switch
          v-if="canSwitch"
          :checked="isOn(row)"
          :loading="actionId === row.Id"
          checked-children="开"
          un-checked-children="关"
          @change="(checked) => handleSwitch(row, !!checked)"
        />
        <Tag v-else :color="isOn(row) ? 'success' : 'default'">
          {{ isOn(row) ? '启用' : '停用' }}
        </Tag>
      </template>
      <template #scriptMode="{ row }">
        <Button
          v-if="
            canEditRound &&
            !isOn(row) &&
            Number(row.HandleType) === 2 &&
            !Number(row.ThirdWithdrawId || 0)
          "
          size="small"
          type="link"
          @click="openScriptMode(row)"
        >
          {{ Number(row.ScriptMode) === 2 ? '手动' : '自动' }}
        </Button>
        <span v-else>
          {{
            Number(row.ScriptMode) === 1
              ? '自动'
              : Number(row.ScriptMode) === 2
                ? '手动'
                : '-'
          }}
        </span>
      </template>
      <template #balance="{ row }">
        <Space :size="4">
          <span>{{ (Number(row.AisleBalance || 0) / 100).toFixed(2) }}</span>
          <Button
            v-if="canRefreshBalance && Number(row.ThirdWithdrawId || 0) > 0"
            :disabled="balanceLockSeconds > 0"
            :loading="actionId === row.Id"
            size="small"
            type="link"
            @click="refreshBalance(row)"
          >
            {{ balanceLockSeconds > 0 ? `${balanceLockSeconds}s` : '刷新' }}
          </Button>
        </Space>
      </template>
      <template #money="{ row }">
        <Button
          v-if="canEditChannel && !isOn(row)"
          size="small"
          type="link"
          @click="openMoney(row)"
        >
          {{ formatMoney(row.Money) }}
        </Button>
        <span v-else>{{ formatMoney(row.Money) }}</span>
      </template>
      <template #channelSetting="{ row }">
        <Button
          v-if="
            canEditChannel && !isOn(row) && Number(row.ThirdWithdrawId || 0) > 0
          "
          size="small"
          type="link"
          @click="openChannelSetting(row)"
        >
          编辑设置
        </Button>
        <span v-else>-</span>
      </template>
      <template #round="{ row }">
        <InputNumber
          :disabled="!canEditRound || isOn(row)"
          :max="100"
          :min="1"
          :value="Number(row.Round || 1)"
          size="small"
          style="width: 76px"
          @change="(value) => updateRound(row, value as number | null)"
        />
      </template>
      <template #action="{ row }">
        <Space :size="0">
          <Button
            v-if="canEdit && canMutateRow(row)"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete && canMutateRow(row)"
            danger
            size="small"
            type="link"
            @click="handleDelete(row)"
          >
            删除
          </Button>
          <Button
            v-if="canShelfThird && Number(row.ThirdWithdrawId || 0) > 0"
            danger
            size="small"
            type="link"
            @click="shelfThirdAccount(row)"
          >
            下架
          </Button>
          <span
            v-if="
              !(canEdit && canMutateRow(row)) &&
              !(canDelete && canMutateRow(row)) &&
              !(canShelfThird && Number(row.ThirdWithdrawId || 0) > 0)
            "
          >
            -
          </span>
        </Space>
      </template>
    </Grid>

    <WithdrawAccountFormModal
      v-if="canCreate || canEdit"
      v-model:open="formOpen"
      :account-type="currentPayType"
      :handle-type="createHandleType"
      :row-id="editId"
      @success="gridApi.reload()"
    />

    <Modal
      v-model:open="payTypeOpen"
      :confirm-loading="payTypeSaving"
      :title="`配置${payTypeName(payTypeForm.PayType)}`"
      width="620px"
      @ok="savePayType"
    >
      <Form :label-col="{ span: 7 }" class="pt-3">
        <Form.Item label="提现金额区间" required>
          <Space.Compact block>
            <InputNumber
              v-model:value="payTypeForm.MinAmount"
              :min="1"
              class="!w-1/2"
              placeholder="最小金额"
            />
            <InputNumber
              v-model:value="payTypeForm.MaxAmount"
              :min="1"
              class="!w-1/2"
              placeholder="最大金额"
            />
          </Space.Compact>
        </Form.Item>
        <Form.Item label="手续费率" required>
          <InputNumber
            v-model:value="payTypeForm.ServiceRate"
            :max="100"
            :min="0"
            :precision="2"
            addon-after="%"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="允许玩家输入">
          <Switch
            :checked="payTypeForm.AllowInput === 1"
            @change="(value) => (payTypeForm.AllowInput = value ? 1 : 0)"
          />
        </Form.Item>
        <Form.Item label="快捷出款金额">
          <Input
            v-model="payTypeForm.GoldList"
            placeholder="多个金额以英文逗号分隔，最多 15 个"
          />
        </Form.Item>
        <Form.Item label="玩家层级" required>
          <Select
            v-model:value="payTypeForm.PlayerLevelList"
            :options="playerLevelOptions"
            mode="multiple"
            placeholder="请选择玩家层级"
          />
        </Form.Item>
        <Form.Item label="开放 VIP" required>
          <Select
            v-model:value="payTypeForm.VipList"
            :options="vipOptions"
            mode="multiple"
            placeholder="请选择开放 VIP"
          />
        </Form.Item>
        <Form.Item label="单次提现倍数">
          <Select
            v-model:value="payTypeForm.PerMulti"
            :options="perMultiOptions"
          />
        </Form.Item>
        <Form.Item
          v-if="payTypeForm.PerMulti > 0"
          label="倍数适用 VIP"
          required
        >
          <Select
            v-model:value="payTypeForm.PerMultiVipList"
            :options="vipOptions"
            mode="multiple"
            placeholder="请选择适用 VIP"
          />
        </Form.Item>
        <Form.Item label="设备显示" required>
          <Checkbox.Group
            v-model:value="payTypeForm.DeviceList"
            :options="[
              { label: 'Android', value: '1' },
              { label: 'IOS', value: '2' },
              { label: 'H5', value: '3' },
              { label: 'PC', value: '4' },
            ]"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="scriptModeOpen"
      :confirm-loading="scriptModeSaving"
      title="脚本模式"
      @ok="saveScriptMode"
    >
      <Radio.Group v-model:value="scriptModeForm.ScriptMode">
        <Radio :value="1">自动</Radio>
        <Radio :value="2">手动</Radio>
      </Radio.Group>
    </Modal>

    <Modal
      v-model:open="moneyOpen"
      :confirm-loading="moneySaving"
      title="今日出款金额上限"
      @ok="saveMoney"
    >
      <Form layout="vertical">
        <Form.Item label="金额（元，留空表示不限）">
          <InputNumber
            v-model:value="moneyForm.Money"
            :min="0.01"
            :precision="2"
            class="!w-full"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="channelOpen"
      :confirm-loading="channelSaving"
      title="编辑三方通道设置"
      width="640px"
      @ok="saveChannelSetting"
    >
      <Form layout="vertical">
        <Form.Item label="通道名称">
          <Input :value="channelForm.ShowName" disabled />
        </Form.Item>
        <Form.Item label="费率模式">
          <Select
            v-model:value="channelForm.RateType"
            :options="[
              { label: '百分比', value: 0 },
              { label: '固定', value: 1 },
              { label: '百分比 + 固定', value: 2 },
            ]"
          />
        </Form.Item>
        <Form.Item v-if="channelForm.RateType !== 1" label="百分比费率（%）">
          <InputNumber
            v-model:value="channelForm.Rate"
            :max="100"
            :min="0"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item v-if="channelForm.RateType !== 0" label="固定费率">
          <InputNumber
            v-model:value="channelForm.CustomRate"
            :min="0"
            :precision="4"
            class="!w-full"
          />
        </Form.Item>
        <Form.Item label="单笔出款限额（元）">
          <Space.Compact block>
            <InputNumber
              v-model:value="channelForm.MinOrderMoney"
              :min="0"
              class="!w-1/2"
              placeholder="最小"
            />
            <InputNumber
              v-model:value="channelForm.MaxOrderMoney"
              :min="0"
              class="!w-1/2"
              placeholder="最大"
            />
          </Space.Compact>
        </Form.Item>
        <Form.Item label="匹配倍数">
          <Select
            v-model:value="channelForm.PerMulti"
            :options="perMultiOptions"
          />
        </Form.Item>
        <Form.Item label="支持银行">
          <Checkbox.Group
            v-model:value="channelForm.SupportBank"
            :options="bankOptions"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea v-model:value="channelForm.Description" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

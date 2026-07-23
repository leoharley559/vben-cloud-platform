<script lang="ts" setup>
import type { TableColumnType, TableProps } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  DatePicker,
  Input,
  message,
  Modal,
  Pagination,
  Result,
  Select,
  Table,
} from 'ant-design-vue';

import {
  exportPlayerStatisticsCsvApi,
  fetchPlayerStatisticsListApi,
} from '#/api/dataClose/player-report';
import ChannelSelect from '#/components/global/channel-select.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useReportOptions } from '#/composables/use-report-options';
import { formatDevicePlatform } from '#/utils/everyday-report-format';
import {
  formatAmount,
  formatAmountFromCent,
} from '#/utils/format-amount';
import { formatPlayerStatus } from '#/utils/player-status';
import { PLAYER_STATISTICS_EXPORT_PAGE_ID } from '#/utils/security-page-ids';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import {
  arrayToCsvParam,
  copyTableText,
  formatReportDateTime,
  resolveReportRange,
} from '#/views/dataClose/shared/report-utils';

defineOptions({ name: 'PlayerStatistics' });

type Row = Record<string, unknown>;

const COLUMN_STORAGE_KEY = 'playerStatisticsMore';

const COLUMN_OPTIONS = [
  { label: '玩家账号', value: 'LoginAccount' },
  { label: '玩家Id', value: 'PlayerId' },
  { label: '所属产品', value: 'PackageName' },
  { label: '所属渠道', value: 'ChannelId' },
  { label: '注册时间', value: 'CreateTime' },
  { label: '注册域名', value: 'RegisterDomain' },
  { label: '邀请站点', value: 'InviteSite' },
  { label: '账户余额', value: 'AccBalance' },
  { label: '充值数量', value: 'PayNum' },
  { label: '充值金额', value: 'PayMoney' },
  { label: '兑换数量', value: 'WithDrawNum' },
  { label: '兑换金额', value: 'WithDrawMoney' },
  { label: '有效投注额', value: 'BetValidMoney' },
  { label: '投注金额', value: 'BetMoney' },
  { label: '派彩金额', value: 'WinMoney' },
  { label: '输赢', value: 'WinLose' },
  { label: '公司输赢', value: 'CompanyWinLoss' },
  { label: '红利', value: 'RedMoney' },
  { label: '返水', value: 'BackWaterMoney' },
  { label: '账户调整', value: 'ChangeMoney' },
  { label: '推广收入', value: 'PromoteIncome' },
  { label: '所属代理', value: 'PromoterUserName' },
  { label: '注册来源', value: 'DevicePlatform' },
  { label: 'VIP等级', value: 'VipLevel' },
  { label: '会员手机号', value: 'BindPhone' },
  { label: '用户来源', value: 'UserSource' },
  { label: '用户标签', value: 'TagName' },
  { label: '玩家状态', value: 'Status' },
  { label: '首存金额', value: 'FirstPayMoney' },
  { label: '首投金额', value: 'FirstBetGold' },
  { label: '首提金额', value: 'FirstWithDrawMoney' },
  { label: '绑定银行卡时间', value: 'BankCardTime' },
  { label: '首存时间', value: 'FirstPayTime' },
  { label: '首提时间', value: 'FirstWithDrawTime' },
  { label: '最后登录时间', value: 'LastTime' },
  { label: '最后存款时间', value: 'LastPayTime' },
  { label: '最后下注时间', value: 'LastBetTime' },
];

const USER_SOURCE_OPTIONS = [
  { label: '官代下线', value: 1 },
  { label: '普代下线', value: 2 },
  { label: '直客', value: 3 },
  { label: '合作推广', value: 4 },
];

const STATISTIC_TYPE_OPTIONS = [
  { label: '不限', value: 1 },
  { label: '注册用户', value: 5 },
  { label: '登录用户', value: 2 },
  { label: '充值用户', value: 3 },
  { label: '投注用户', value: 4 },
];

const USER_SOURCE_MAP: Record<number, string> = {
  1: '官代下线',
  2: '普代下线',
  3: '直客',
  4: '合作推广',
};

const { checkPermission, projectConfig } = useCloudPermission();
const {
  devicePlatformOptions,
  inviteSiteOptions,
  iosAppStoreOptions,
  packageOptions,
  playerStatusOptions,
  vipOptions,
} = useReportOptions();

const router = useRouter();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const canView = computed(() => checkPermission(10_488));
const canExport = computed(() => checkPermission(10_489));

const loading = ref(false);
const exportLoading = ref(false);
const tableData = ref<Row[]>([]);
const total = ref(0);
const totalData = ref<Row>({});
const sort = ref('');

const defaultStatRange = resolveReportRange('statTodayToNow');

const filters = reactive({
  LoginAccount: '',
  PlayerId: '',
  Status: [] as Array<number | string>,
  Promoter: '',
  ChannelId: [] as Array<number | string>,
  PackageId: -1 as number | string | undefined,
  VipLevel: -1 as number | string | undefined,
  UserSource: [] as Array<number | string>,
  DevicePlatform: [] as Array<number | string>,
  AppUrl: [] as Array<string>,
  StatisticType: 1 as number,
  InviteSite: [] as Array<string>,
  BindPhone: '',
  regRange: null as [Dayjs, Dayjs] | null,
  totalRange: [...defaultStatRange] as [Dayjs, Dayjs],
  firstPayRange: null as [Dayjs, Dayjs] | null,
});

const page = reactive({ current: 1, pageSize: 20 });

const visibleColumns = ref<string[]>(
  COLUMN_OPTIONS.map((item) => item.value),
);

function loadVisibleColumns() {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return;
    // 兼容旧站 comma-string 与新站 JSON 数组
    let keys: string[] = [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        keys = parsed.map(String).filter(Boolean);
      } else if (typeof parsed === 'string') {
        keys = parsed.split(',').map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      keys = raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
    const allowed = new Set(COLUMN_OPTIONS.map((item) => item.value));
    const next = keys.filter((key) => allowed.has(key));
    if (next.length > 0) {
      visibleColumns.value = next;
    }
  } catch {
    /* ignore */
  }
}

function persistVisibleColumns() {
  localStorage.setItem(
    COLUMN_STORAGE_KEY,
    JSON.stringify(visibleColumns.value),
  );
}

const deviceOptions = computed(() => {
  const map =
    (projectConfig.value?.DevicePlatformAll as Record<string, string>) || {};
  const entries = Object.entries(map);
  if (entries.length > 0) {
    return entries.map(([value, label]) => ({ label, value }));
  }
  return devicePlatformOptions.value;
});

const appStoreOptions = computed(() => {
  const list = (projectConfig.value?.IosAppStoreItems ||
    projectConfig.value?.IosAppStoreList ||
    []) as Array<{ AppName?: string; AppUrl?: string; Name?: string }>;
  if (list.length > 0) {
    return list.map((item) => ({
      label: item.AppName || item.Name || item.AppUrl || '-',
      value: item.AppUrl || '',
    }));
  }
  return iosAppStoreOptions.value;
});

const inviteOptions = computed(() => {
  const list = (projectConfig.value?.InviteSites || []) as string[];
  if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'string') {
    return list.map((item) => ({ label: item, value: item }));
  }
  return inviteSiteOptions.value;
});

const packageSelectOptions = computed(() => [
  { label: '全部产品', value: -1 },
  ...packageOptions.value,
]);

const vipSelectOptions = computed(() => [
  { label: '全部VIP', value: -1 },
  ...vipOptions.value,
]);

function num(value: unknown) {
  return Number(value || 0);
}

function accBalance(row: Row) {
  return num(row.WalletBalance) + num(row.Gold);
}

function winLose(row: Row) {
  return num(row.WinMoney) - num(row.BetMoney);
}

function companyWinLoss(row: Row) {
  return num(row.BetMoney) - num(row.WinMoney);
}

function promoteIncome(row: Row) {
  return (
    num(row.BetMoney) -
    num(row.WinMoney) -
    num(row.RedMoney) -
    num(row.BackWaterMoney) -
    num(row.ChangeMoney)
  );
}

function formatUserSource(value: unknown) {
  const key = Number(value);
  return USER_SOURCE_MAP[key] || String(value ?? '-');
}

function rangeUnix(range?: [Dayjs, Dayjs] | null) {
  if (!range?.[0] || !range?.[1]) {
    return { begin: undefined as number | undefined, end: undefined as number | undefined };
  }
  return { begin: range[0].unix(), end: range[1].unix() };
}

function buildQuery(searchType: 'list' | 'total') {
  const reg = rangeUnix(filters.regRange);
  const totalRange = rangeUnix(filters.totalRange);
  const firstPay = rangeUnix(filters.firstPayRange);
  const packageId =
    filters.PackageId === undefined || filters.PackageId === null
      ? -1
      : filters.PackageId;
  const vipLevel =
    filters.VipLevel === undefined || filters.VipLevel === null
      ? -1
      : filters.VipLevel;
  const base: Record<string, unknown> = {
    LoginAccount: filters.LoginAccount.trim().toLowerCase() || undefined,
    PlayerId: filters.PlayerId.trim() || undefined,
    Status: arrayToCsvParam(filters.Status),
    Promoter: filters.Promoter.trim() || undefined,
    ChannelIds: arrayToCsvParam(filters.ChannelId),
    PackageId: packageId,
    VipLevel: vipLevel,
    UserSource: arrayToCsvParam(filters.UserSource),
    DevicePlatform: arrayToCsvParam(filters.DevicePlatform),
    AppUrl: arrayToCsvParam(filters.AppUrl),
    StatisticType: filters.StatisticType,
    InviteSite: arrayToCsvParam(filters.InviteSite),
    BindPhone: filters.BindPhone.trim() || undefined,
    BeginTime: reg.begin,
    EndTime: reg.end,
    TotalBeginTime: totalRange.begin,
    TotalEndTime: totalRange.end,
    FirstPayBeginTime: firstPay.begin,
    FirstPayEndTime: firstPay.end,
    Sort: sort.value || undefined,
    SearchType: searchType,
  };
  if (searchType === 'list') {
    return {
      ...base,
      Page: page.current,
      PageSize: page.pageSize,
    };
  }
  return base;
}

const summaryItems = computed(() => [
  {
    title: '会员总余额',
    value: formatAmountFromCent(
      num(totalData.value.SumGold) + num(totalData.value.SumWalletBalance),
    ),
  },
]);

function cellText(field: string, row: Row): string {
  switch (field) {
    case 'AccBalance': {
      return formatAmountFromCent(accBalance(row));
    }
    case 'BackWaterMoney':
    case 'BetMoney':
    case 'BetValidMoney':
    case 'ChangeMoney':
    case 'FirstBetGold':
    case 'FirstWithDrawMoney':
    case 'PayMoney':
    case 'RedMoney':
    case 'WinMoney':
    case 'WithDrawMoney': {
      return formatAmountFromCent(row[field]);
    }
    case 'BankCardTime':
    case 'CreateTime':
    case 'FirstPayTime':
    case 'FirstWithDrawTime':
    case 'LastBetTime':
    case 'LastPayTime':
    case 'LastTime': {
      return formatReportDateTime(row[field]);
    }
    case 'CompanyWinLoss': {
      return formatAmountFromCent(companyWinLoss(row));
    }
    case 'DevicePlatform': {
      return formatDevicePlatform(row.DevicePlatform);
    }
    case 'FirstPayMoney': {
      return formatAmount(row.FirstPayMoney);
    }
    case 'PromoteIncome': {
      return formatAmountFromCent(promoteIncome(row));
    }
    case 'Status': {
      return formatPlayerStatus(row.Status as number);
    }
    case 'UserSource': {
      return formatUserSource(row.UserSource);
    }
    case 'VipLevel': {
      return `VIP ${row.VipLevel ?? ''}`;
    }
    case 'WinLose': {
      return formatAmountFromCent(winLose(row));
    }
    default: {
      return String(row[field] ?? '');
    }
  }
}

const columns = computed<TableColumnType<Row>[]>(() => {
  const map: Record<string, TableColumnType<Row>> = {
    LoginAccount: {
      align: 'center',
      dataIndex: 'LoginAccount',
      fixed: 'left',
      key: 'LoginAccount',
      title: '玩家账号',
      width: 120,
    },
    PlayerId: {
      align: 'center',
      dataIndex: 'PlayerId',
      fixed: 'left',
      key: 'PlayerId',
      title: '玩家Id',
      width: 120,
    },
    PackageName: {
      align: 'center',
      dataIndex: 'PackageName',
      key: 'PackageName',
      title: '所属产品',
      width: 140,
    },
    ChannelId: {
      align: 'center',
      dataIndex: 'ChannelId',
      key: 'ChannelId',
      title: '所属渠道',
      width: 120,
    },
    CreateTime: {
      align: 'center',
      customRender: ({ record }) => formatReportDateTime(record.CreateTime),
      key: 'CreateTime',
      title: '注册时间',
      width: 160,
    },
    RegisterDomain: {
      align: 'center',
      dataIndex: 'RegisterDomain',
      key: 'RegisterDomain',
      title: '注册域名',
      width: 140,
    },
    InviteSite: {
      align: 'center',
      dataIndex: 'InviteSite',
      key: 'InviteSite',
      title: '邀请站点',
      width: 120,
    },
    AccBalance: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(accBalance(record)),
      key: 'AccBalance',
      title: '账户余额',
      width: 120,
    },
    PayNum: {
      align: 'center',
      dataIndex: 'PayNum',
      key: 'PayNum',
      title: '充值数量',
      width: 100,
    },
    PayMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.PayMoney),
      dataIndex: 'PayMoney',
      key: 'PayMoney',
      sorter: true,
      title: '充值金额',
      width: 110,
    },
    WithDrawNum: {
      align: 'center',
      dataIndex: 'WithDrawNum',
      key: 'WithDrawNum',
      title: '兑换数量',
      width: 100,
    },
    WithDrawMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.WithDrawMoney),
      dataIndex: 'WithDrawMoney',
      key: 'WithDrawMoney',
      sorter: true,
      title: '兑换金额',
      width: 110,
    },
    BetValidMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.BetValidMoney),
      key: 'BetValidMoney',
      title: '有效投注额',
      width: 120,
    },
    BetMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.BetMoney),
      key: 'BetMoney',
      title: '投注金额',
      width: 110,
    },
    WinMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.WinMoney),
      key: 'WinMoney',
      title: '派彩金额',
      width: 110,
    },
    WinLose: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(winLose(record)),
      key: 'WinLose',
      title: '输赢',
      width: 110,
    },
    CompanyWinLoss: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(companyWinLoss(record)),
      key: 'CompanyWinLoss',
      title: '公司输赢',
      width: 110,
    },
    RedMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.RedMoney),
      key: 'RedMoney',
      title: '红利',
      width: 100,
    },
    BackWaterMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.BackWaterMoney),
      key: 'BackWaterMoney',
      title: '返水',
      width: 100,
    },
    ChangeMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.ChangeMoney),
      key: 'ChangeMoney',
      title: '账户调整',
      width: 110,
    },
    PromoteIncome: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(promoteIncome(record)),
      key: 'PromoteIncome',
      title: '推广收入',
      width: 110,
    },
    PromoterUserName: {
      align: 'center',
      dataIndex: 'PromoterUserName',
      key: 'PromoterUserName',
      title: '所属代理',
      width: 120,
    },
    DevicePlatform: {
      align: 'center',
      customRender: ({ record }) => formatDevicePlatform(record.DevicePlatform),
      key: 'DevicePlatform',
      title: '注册来源',
      width: 140,
      ellipsis: true,
    },
    VipLevel: {
      align: 'center',
      customRender: ({ record }) => `VIP ${record.VipLevel ?? ''}`,
      key: 'VipLevel',
      title: 'VIP等级',
      width: 90,
    },
    BindPhone: {
      align: 'center',
      dataIndex: 'BindPhone',
      key: 'BindPhone',
      title: '会员手机号',
      width: 130,
    },
    UserSource: {
      align: 'center',
      customRender: ({ record }) => formatUserSource(record.UserSource),
      key: 'UserSource',
      title: '用户来源',
      width: 110,
    },
    TagName: {
      align: 'center',
      dataIndex: 'TagName',
      key: 'TagName',
      title: '用户标签',
      width: 120,
      ellipsis: true,
    },
    Status: {
      align: 'center',
      customRender: ({ record }) => formatPlayerStatus(record.Status as number),
      key: 'Status',
      title: '玩家状态',
      width: 100,
    },
    FirstPayMoney: {
      align: 'center',
      customRender: ({ record }) => formatAmount(record.FirstPayMoney),
      key: 'FirstPayMoney',
      title: '首存金额',
      width: 110,
    },
    FirstBetGold: {
      align: 'center',
      customRender: ({ record }) => formatAmountFromCent(record.FirstBetGold),
      key: 'FirstBetGold',
      title: '首投金额',
      width: 110,
    },
    FirstWithDrawMoney: {
      align: 'center',
      customRender: ({ record }) =>
        formatAmountFromCent(record.FirstWithDrawMoney),
      key: 'FirstWithDrawMoney',
      title: '首提金额',
      width: 110,
    },
    BankCardTime: {
      align: 'center',
      customRender: ({ record }) => formatReportDateTime(record.BankCardTime),
      key: 'BankCardTime',
      title: '绑定银行卡时间',
      width: 160,
    },
    FirstPayTime: {
      align: 'center',
      customRender: ({ record }) => formatReportDateTime(record.FirstPayTime),
      key: 'FirstPayTime',
      title: '首存时间',
      width: 160,
    },
    FirstWithDrawTime: {
      align: 'center',
      customRender: ({ record }) =>
        formatReportDateTime(record.FirstWithDrawTime),
      key: 'FirstWithDrawTime',
      title: '首提时间',
      width: 160,
    },
    LastTime: {
      align: 'center',
      customRender: ({ record }) => formatReportDateTime(record.LastTime),
      key: 'LastTime',
      title: '最后登录时间',
      width: 160,
    },
    LastPayTime: {
      align: 'center',
      customRender: ({ record }) => formatReportDateTime(record.LastPayTime),
      key: 'LastPayTime',
      title: '最后存款时间',
      width: 160,
    },
    LastBetTime: {
      align: 'center',
      customRender: ({ record }) => formatReportDateTime(record.LastBetTime),
      key: 'LastBetTime',
      title: '最后下注时间',
      width: 160,
    },
  };

  return visibleColumns.value
    .map((key) => map[key])
    .filter(Boolean) as TableColumnType<Row>[];
});

function summaryValue(key: string) {
  const t = totalData.value;
  switch (key) {
    case 'AccBalance': {
      return formatAmountFromCent(num(t.SumWalletBalance) + num(t.SumGold));
    }
    case 'BackWaterMoney': {
      return formatAmountFromCent(t.SumBackWaterMoney);
    }
    case 'BetMoney': {
      return formatAmountFromCent(t.SumBetMoney);
    }
    case 'BetValidMoney': {
      return formatAmountFromCent(t.SumBetValidMoney);
    }
    case 'ChangeMoney': {
      return formatAmountFromCent(t.SumChangeMoney);
    }
    case 'CompanyWinLoss': {
      return formatAmountFromCent(num(t.SumBetMoney) - num(t.SumWinMoney));
    }
    case 'FirstBetGold': {
      return formatAmountFromCent(t.SumFirstBetGold);
    }
    case 'FirstPayMoney': {
      return formatAmount(t.SumFirstPayMoney);
    }
    case 'FirstWithDrawMoney': {
      return formatAmountFromCent(t.SumFirstWithDrawMoney);
    }
    case 'LoginAccount': {
      return '合计';
    }
    case 'PayMoney': {
      return formatAmountFromCent(t.SumPayMoney);
    }
    case 'PayNum': {
      return String(t.SumPayNum ?? '-');
    }
    case 'PromoteIncome': {
      return formatAmountFromCent(
        num(t.SumBetMoney) -
          num(t.SumWinMoney) -
          num(t.SumRedMoney) -
          num(t.SumBackWaterMoney) -
          num(t.SumChangeMoney),
      );
    }
    case 'RedMoney': {
      return formatAmountFromCent(t.SumRedMoney);
    }
    case 'WinLose': {
      return formatAmountFromCent(num(t.SumWinMoney) - num(t.SumBetMoney));
    }
    case 'WinMoney': {
      return formatAmountFromCent(t.SumWinMoney);
    }
    case 'WithDrawMoney': {
      return formatAmountFromCent(t.SumWithDrawMoney);
    }
    case 'WithDrawNum': {
      return String(t.SumWithDrawNum ?? '-');
    }
    default: {
      return '-';
    }
  }
}

function getSummary() {
  const cells = columns.value.map((col, index) => {
    const key = String(col.key || '');
    return {
      index,
      value: index === 0 ? '合计' : summaryValue(key),
    };
  });
  return cells;
}

function validateFilters() {
  if (!filters.totalRange?.[0] || !filters.totalRange?.[1]) {
    message.warning('请选择统计时间');
    return false;
  }
  return true;
}

async function fetchList() {
  if (!canView.value) return;
  if (!validateFilters()) return;
  loading.value = true;
  try {
    const result = await fetchPlayerStatisticsListApi(buildQuery('list'));
    tableData.value = result.Items || [];
    total.value = Number(result.Pagination?.MaxCount || 0);
  } catch {
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function fetchTotal() {
  if (!canView.value) return;
  if (!validateFilters()) return;
  try {
    const result = await fetchPlayerStatisticsListApi(buildQuery('total'));
    totalData.value = result.MoreItems || {};
  } catch {
    totalData.value = {};
  }
}

function handleSearch() {
  if (!validateFilters()) return;
  page.current = 1;
  void fetchList();
  void fetchTotal();
}

function handleReset() {
  filters.LoginAccount = '';
  filters.PlayerId = '';
  filters.Status = [];
  filters.Promoter = '';
  filters.ChannelId = [];
  filters.PackageId = -1;
  filters.VipLevel = -1;
  filters.UserSource = [];
  filters.DevicePlatform = [];
  filters.AppUrl = [];
  filters.StatisticType = 1;
  filters.InviteSite = [];
  filters.BindPhone = '';
  filters.regRange = null;
  filters.totalRange = [...resolveReportRange('statTodayToNow')] as [
    Dayjs,
    Dayjs,
  ];
  filters.firstPayRange = null;
  sort.value = '';
  handleSearch();
}

const handleTableChange: TableProps['onChange'] = (_pag, _filters, sorter) => {
  const s = Array.isArray(sorter) ? sorter[0] : sorter;
  if (s?.order === 'ascend') {
    sort.value = String(s.field || s.columnKey || '');
  } else if (s?.order === 'descend') {
    sort.value = `-${String(s.field || s.columnKey || '')}`;
  } else {
    sort.value = '';
  }
  void fetchList();
};

function handlePageChange(current: number, pageSize: number) {
  page.current = current;
  page.pageSize = pageSize;
  void fetchList();
}

async function handleCopy() {
  if (tableData.value.length === 0) {
    message.warning('暂无数据可复制');
    return;
  }
  const fields = visibleColumns.value;
  const headers = fields.map(
    (field) =>
      COLUMN_OPTIONS.find((item) => item.value === field)?.label || field,
  );
  const rows = tableData.value.map((row) =>
    fields.map((field) => cellText(field, row)),
  );
  try {
    await copyTableText(headers, rows);
    message.success('复制成功');
  } catch {
    message.error('复制失败，请重试');
  }
}

function handleExportClick() {
  if (total.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  const { Page: _p, PageSize: _ps, SearchType: _st, ...params } =
    buildQuery('list');
  passPopupRef.value?.validate(PLAYER_STATISTICS_EXPORT_PAGE_ID, params);
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const { Page: _p, PageSize: _ps, SearchType: _st, ...params } =
      buildQuery('list');
    const result = await exportPlayerStatisticsCsvApi({
      ...params,
      ...payload,
    });
    if (result?.Id && Number(result.Status) === 0) {
      Modal.confirm({
        content: '导出任务已创建，是否前往导出管理下载？',
        okText: '前往',
        title: '导出成功',
        onOk: () => {
          router.push('/operationalManage/downloadCsvManage').catch(() => {});
        },
      });
      return;
    }
    message.error(String(result?.Remark || '导出失败'));
  } catch {
    /* requestClient 已提示 */
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  loadVisibleColumns();
  if (canView.value) {
    void fetchList();
    void fetchTotal();
  }
});
</script>

<template>
  <Page
    v-if="canView"
    auto-content-height
    description="数据闭环 · 玩家统计报表"
    title="玩家统计报表"
  >
    <ReportQueryCard title="查询条件">
      <Input
        v-model:value="filters.LoginAccount"
        allow-clear
        placeholder="玩家账号"
        style="width: 160px"
        @press-enter="handleSearch"
      />
      <Input
        v-model:value="filters.PlayerId"
        allow-clear
        placeholder="玩家Id"
        style="width: 140px"
        @press-enter="handleSearch"
      />
      <Select
        v-model:value="filters.Status"
        allow-clear
        mode="multiple"
        :max-tag-count="1"
        :options="playerStatusOptions"
        placeholder="玩家状态"
        style="min-width: 160px"
      />
      <Input
        v-model:value="filters.Promoter"
        allow-clear
        placeholder="代理账号"
        style="width: 140px"
        @press-enter="handleSearch"
      />
      <ChannelSelect v-model="filters.ChannelId" style="min-width: 180px" />
      <Select
        v-model:value="filters.PackageId"
        allow-clear
        :options="packageSelectOptions"
        placeholder="产品名称"
        style="min-width: 160px"
        show-search
        option-filter-prop="label"
      />
      <Select
        v-model:value="filters.VipLevel"
        allow-clear
        :options="vipSelectOptions"
        placeholder="VIP等级"
        style="min-width: 120px"
      />
      <Select
        v-model:value="filters.UserSource"
        allow-clear
        mode="multiple"
        :max-tag-count="1"
        :options="USER_SOURCE_OPTIONS"
        placeholder="用户来源"
        style="min-width: 160px"
      />
      <Select
        v-model:value="filters.DevicePlatform"
        allow-clear
        mode="multiple"
        :max-tag-count="1"
        :options="deviceOptions"
        placeholder="注册来源"
        style="min-width: 160px"
      />
      <Select
        v-model:value="filters.AppUrl"
        allow-clear
        mode="multiple"
        :max-tag-count="1"
        :options="appStoreOptions"
        placeholder="上架包"
        style="min-width: 160px"
      />
      <Select
        v-model:value="filters.StatisticType"
        :options="STATISTIC_TYPE_OPTIONS"
        placeholder="统计类型"
        style="min-width: 140px"
      />
      <Select
        v-model:value="filters.InviteSite"
        allow-clear
        mode="multiple"
        :max-tag-count="1"
        :options="inviteOptions"
        placeholder="邀请站点"
        style="min-width: 160px"
      />
      <Input
        v-model:value="filters.BindPhone"
        allow-clear
        placeholder="会员手机号"
        style="width: 150px"
        @press-enter="handleSearch"
      />
      <DatePicker.RangePicker
        v-model:value="filters.regRange"
        show-time
        :placeholder="['注册开始', '注册结束']"
        style="width: 340px"
      />
      <DatePicker.RangePicker
        v-model:value="filters.totalRange"
        show-time
        :placeholder="['统计开始', '统计结束']"
        style="width: 340px"
      />
      <DatePicker.RangePicker
        v-model:value="filters.firstPayRange"
        show-time
        :placeholder="['首存开始', '首存结束']"
        style="width: 340px"
      />
      <Select
        v-model:value="visibleColumns"
        mode="multiple"
        :max-tag-count="1"
        :options="COLUMN_OPTIONS"
        placeholder="显示列"
        style="min-width: 180px"
        @change="persistVisibleColumns"
      />
      <template #actions>
        <Button type="primary" :loading="loading" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button @click="handleCopy">复制</Button>
        <Button
          v-if="canExport"
          type="primary"
          ghost
          :loading="exportLoading"
          @click="handleExportClick"
        >
          导出 CSV
        </Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems" />

    <Table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 'max-content' }"
      bordered
      row-key="PlayerId"
      size="small"
      @change="handleTableChange"
    >
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell
              v-for="cell in getSummary()"
              :key="cell.index"
              :index="cell.index"
            >
              <span class="text-red-500">{{ cell.value }}</span>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>

    <div v-if="total > 0" class="mt-4 flex justify-end">
      <Pagination
        :current="page.current"
        :page-size="page.pageSize"
        :total="total"
        show-size-changer
        show-quick-jumper
        @change="handlePageChange"
        @show-size-change="handlePageChange"
      />
    </div>

    <PassPopup ref="passPopupRef" type="csv" @confirm="handleExport" />
  </Page>
  <Result v-else status="403" sub-title="无玩家统计报表查看权限" title="403" />
</template>

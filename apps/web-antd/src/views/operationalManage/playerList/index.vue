<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerListItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Dropdown,
  Input,
  Menu,
  Modal,
  Result,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  exportPlayerListApi,
  fetchPlayerListApi,
  updatePlayerExtApi,
} from '#/api/operationManage/player';
import { fetchPlayerLevelListApi } from '#/api/operationManage/player-level';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import { formatAmount, formatAmountFromCent } from '#/utils/format-amount';
import {
  formatMemberType,
  formatPlayerStatus,
  PLAYER_STATUS_OPTIONS,
} from '#/utils/player-status';
import { PLAYER_LIST_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import PlayerAdvancedSearchModal from './components/player-advanced-search-modal.vue';
import type { AdvancedFilterRow } from './components/player-advanced-search-modal.vue';
import PlayerBatchEditModal from './components/player-batch-edit-modal.vue';
import type { BatchActType } from './components/player-batch-edit-modal.vue';
import PlayerBulkAccountModal from './components/player-bulk-account-modal.vue';
import PlayerKickModal from './components/player-kick-modal.vue';
import PlayerLevelModal from './components/player-level-modal.vue';
import PlayerListRemarkDrawer from './components/player-list-remark-drawer.vue';
import PlayerTagModal from './components/player-tag-modal.vue';

defineOptions({ name: 'OperationalPlayerList' });

const COLUMN_STORAGE_KEY = 'playerListMore';
const DEFAULT_COLUMNS = [
  'LoginAccount',
  'ApiLoginAccount',
  'PlayerId',
  'ChannelId',
  'PromoterUserName',
  'PackageName',
  'FirstPayTime',
  'CreateTime',
  'InviteSite',
  'WalletBalance',
  'DevicePlatform',
  'AccountType',
  'LastIp',
];

const COLUMN_OPTIONS = [
  { label: '游戏账号', value: 'LoginAccount' },
  { label: 'API账号', value: 'ApiLoginAccount' },
  { label: '玩家ID', value: 'PlayerId' },
  { label: '玩家状态', value: 'PlayerStatus' },
  { label: '会员类型', value: 'DataFlag' },
  { label: '上级账号', value: 'InviterLoginAccount' },
  { label: '推广账号', value: 'PromoterUserName' },
  { label: '渠道号', value: 'ChannelId' },
  { label: '渠道名称', value: 'ChannelName' },
  { label: 'VIP等级', value: 'VipLevel' },
  { label: '会员层级', value: 'PlayerLevelName' },
  { label: '包体名称', value: 'PackageName' },
  { label: '注册时间', value: 'CreateTime' },
  { label: '设备号', value: 'DeviceId' },
  { label: '首存时间', value: 'FirstPayTime' },
  { label: '邀请站点', value: 'InviteSite' },
  { label: '真实姓名', value: 'RealName' },
  { label: '手机号', value: 'PhoneNo' },
  { label: '邮箱', value: 'Email' },
  { label: '钱包余额', value: 'WalletBalance' },
  { label: '金币', value: 'Gold' },
  { label: '总充值', value: 'Recharged' },
  { label: '总兑换', value: 'WithdrawGold' },
  { label: '首存金额', value: 'FirstPayMoney' },
  { label: '注册来源', value: 'DevicePlatform' },
  { label: '注册方式', value: 'AccountType' },
  { label: '注册IP', value: 'RegIp' },
  { label: '最后登录IP', value: 'LastIp' },
  { label: '最后登录', value: 'LastTime' },
  { label: '标签', value: 'TagName' },
  { label: '封号原因', value: 'BanRemark' },
];

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { memberTypeOptions, packageOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const canViewPage = computed(() => checkPermission(10012));
const canViewTable = computed(() => checkPermission(10014));
const canRowAction = computed(() => checkPermission(10015));
const canBatchEdit = computed(() => checkPermission(11460));
const canExport = computed(() => checkPermission(10016));
const canFilterStatus = computed(() => checkPermission(11380));
const canFilterLoginAccount = computed(() => checkPermission(11381));
const canFilterPhone = computed(() => checkPermission(11382));
const canFilterEmail = computed(() => checkPermission(11383));
const canFilterPromoter = computed(() => checkPermission(11384));
const canFilterPlayerIds = computed(() => checkPermission(12157));
const canFilterChannel = computed(() => checkPermission(11385));
const canFilterPassword = computed(() => checkPermission(11916));
const canFilterInviter = computed(() => checkPermission(11386));
const canFilterRegIp = computed(() => checkPermission(11387));
const canFilterLastIp = computed(() => checkPermission(11388));
const canFilterDeviceId = computed(() => checkPermission(11389));
const canFilterLastDevice = computed(() => checkPermission(11390));
const canFilterRealName = computed(() => checkPermission(11391));
const canFilterBank = computed(() => checkPermission(11393));
const canFilterPackage = computed(() => checkPermission(11395));
const canFilterVip = computed(() => checkPermission(11396));
const canFilterPlayerLevel = computed(() => checkPermission(12296));
const canFilterBindPhone = computed(() => checkPermission(11397));
const canFilterTag = computed(() => checkPermission(12158));
const canFilterFirstPay = computed(() => checkPermission(13205));
const canFilterMemberType = computed(() => checkPermission(12296));
const canFilterRegDate = computed(() => checkPermission(11399));

const filterStatus = ref<number[]>([]);
const filterLoginAccount = ref('');
const filterPlayerPassword = ref('');
const filterPhoneNo = ref('');
const filterEmail = ref('');
const filterPromoter = ref('');
const filterPlayerIdsStr = ref('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterInviterLoginAccount = ref('');
const filterRegIp = ref('');
const filterLastIp = ref('');
const filterDeviceId = ref('');
const filterLastDevice = ref('');
const filterRealName = ref('');
const filterBank = ref('');
const filterPackageId = ref<number | string>('');
const filterVipLevel = ref<number | string | undefined>(undefined);
const filterPlayerLevelId = ref<number | string>(-1);
const filterDataSearchType = ref(2);
const filterBindPhone = ref<number | string>(-1);
const filterTagName = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const filterFirstPayRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const filterFiltersJson = ref('');

const visibleColumns = ref<string[]>(
  (() => {
    try {
      const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      return parsed.length ? parsed : [...DEFAULT_COLUMNS];
    } catch {
      return [...DEFAULT_COLUMNS];
    }
  })(),
);

const selectedRows = ref<PlayerListItem[]>([]);
const totalData = ref<{
  SumGold?: number | string;
  SumWalletBalance?: number | string;
}>({});
const totalCount = ref(0);
const tableRows = ref<PlayerListItem[]>([]);
const exportLoading = ref(false);

const summaryItems = computed(() => [
  {
    label: '场馆钱包总金额',
    value: formatAmountFromCent(totalData.value.SumWalletBalance),
  },
  { label: '中心钱包总金额', value: formatAmountFromCent(totalData.value.SumGold) },
]);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const levelFilterOptions = ref<
  Array<{ label: string; value: number | string }>
>([
  { label: '全部', value: -1 },
  { label: '未分层', value: 0 },
]);

const batchOpen = ref(false);
const batchActType = ref<BatchActType>(1);
const remarkOpen = ref(false);
const remarkPlayerId = ref<number | string | null>(null);
const remarkLoginAccount = ref('');
const advancedOpen = ref(false);
const bulkOpen = ref(false);
const kickOpen = ref(false);
const kickPlayerId = ref<number | string | null>(null);
const kickLastBlockTime = ref(0);
const tagOpen = ref(false);
const tagPlayerId = ref<number | string | null>(null);
const tagIdCsv = ref('');
const levelOpen = ref(false);
const levelPlayerId = ref<number | string | null>(null);
const levelPlayerLevelId = ref<number | string | null>(null);

const selectedPlayerIds = computed(() =>
  selectedRows.value
    .map((row) => row.PlayerId)
    .filter(Boolean)
    .join(','),
);

const vipOptions = computed(() => {
  const map = (
    projectConfig.value as {
      VIPLevelMap?: Array<{ VipLevelId: number; VipLevelName: string }>;
    }
  )?.VIPLevelMap;
  if (Array.isArray(map) && map.length) {
    return map.map((item) => ({
      label: item.VipLevelName || `VIP${item.VipLevelId}`,
      value: item.VipLevelId,
    }));
  }
  return Array.from({ length: 11 }, (_, i) => ({
    label: `VIP ${i}`,
    value: i,
  }));
});

const devicePlatformMap = computed(() => {
  const map = projectConfig.value?.DevicePlatformAll || {};
  return map as Record<string, string>;
});

function formatDateTime(value?: number | string) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    Number(value) === 0
  ) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

function showColumn(field: string) {
  return visibleColumns.value.includes(field);
}

function persistColumns() {
  localStorage.setItem(
    COLUMN_STORAGE_KEY,
    JSON.stringify(visibleColumns.value),
  );
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  const [firstBegin, firstEnd] = filterFirstPayRange.value || [];
  return {
    Bank: filterBank.value,
    BeginTime: begin ? begin.unix() : '',
    BindPhone: filterBindPhone.value,
    ChannelIds: filterChannelIds.value,
    DataSearchType: filterDataSearchType.value,
    DeviceId: filterDeviceId.value,
    Email: filterEmail.value,
    EndTime: end ? end.unix() : '',
    Filters: filterFiltersJson.value,
    FirstPayBeginTime: firstBegin ? firstBegin.unix() : '',
    FirstPayEndTime: firstEnd ? firstEnd.unix() : '',
    InviterLoginAccount: filterInviterLoginAccount.value,
    LastDevice: filterLastDevice.value,
    LastIp: filterLastIp.value,
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value,
    PhoneNo: filterPhoneNo.value,
    PlayerIdsStr: filterPlayerIdsStr.value,
    PlayerLevelId: filterPlayerLevelId.value,
    PlayerPassword: filterPlayerPassword.value,
    Promoter: filterPromoter.value,
    RealName: filterRealName.value,
    RegIp: filterRegIp.value,
    Sort: '-CreateTime',
    Status: filterStatus.value,
    TagName: filterTagName.value,
    VipLevel: filterVipLevel.value ?? '',
  };
}

function buildDynamicColumns(): VxeTableGridOptions<PlayerListItem>['columns'] {
  const cols: VxeTableGridOptions<PlayerListItem>['columns'] = [
    { type: 'checkbox', width: 48 },
  ];

  const defs: Array<{
    field: string;
    formatter?: VxeTableGridOptions<PlayerListItem>['columns'] extends Array<
      infer C
    >
      ? C extends { formatter?: infer F }
        ? F
        : never
      : never;
    minWidth?: number;
    slots?: Record<string, string>;
    sortable?: boolean;
    title: string;
  }> = [
    {
      field: 'LoginAccount',
      minWidth: 140,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'ApiLoginAccount', minWidth: 120, title: 'API账号' },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    {
      field: 'PlayerStatus',
      minWidth: 90,
      slots: { default: 'status' },
      title: '玩家状态',
    },
    {
      field: 'DataFlag',
      formatter: ({ cellValue }) => formatMemberType(cellValue),
      minWidth: 90,
      title: '会员类型',
    },
    { field: 'InviterLoginAccount', minWidth: 120, title: '上级账号' },
    { field: 'PromoterUserName', minWidth: 120, title: '推广账号' },
    { field: 'ChannelId', minWidth: 90, title: '渠道号' },
    { field: 'ChannelName', minWidth: 120, title: '渠道名称' },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP ${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    {
      field: 'PlayerLevelName',
      formatter: ({ cellValue }) => String(cellValue || '未分层'),
      minWidth: 110,
      title: '会员层级',
    },
    { field: 'PackageName', minWidth: 120, title: '包体名称' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      sortable: true,
      title: '注册时间',
    },
    { field: 'DeviceId', minWidth: 160, title: '设备号' },
    {
      field: 'FirstPayTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '首存时间',
    },
    { field: 'InviteSite', minWidth: 120, title: '邀请站点' },
    { field: 'RealName', minWidth: 100, title: '真实姓名' },
    { field: 'PhoneNo', minWidth: 120, title: '手机号' },
    { field: 'Email', minWidth: 140, title: '邮箱' },
    {
      field: 'WalletBalance',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '钱包余额',
    },
    {
      field: 'Gold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 100,
      title: '金币',
    },
    {
      field: 'Recharged',
      formatter: ({ cellValue }) => formatAmount(cellValue),
      minWidth: 110,
      title: '总充值',
    },
    {
      field: 'WithdrawGold',
      formatter: ({ cellValue }) => formatAmount(cellValue),
      minWidth: 110,
      title: '总兑换',
    },
    {
      field: 'FirstPayMoney',
      formatter: ({ cellValue }) => formatAmount(cellValue),
      minWidth: 110,
      title: '首存金额',
    },
    {
      field: 'DevicePlatform',
      formatter: ({ cellValue }) =>
        devicePlatformMap.value[String(cellValue)] || String(cellValue ?? '-'),
      minWidth: 110,
      title: '注册来源',
    },
    {
      field: 'AccountType',
      formatter: ({ cellValue }) => String(cellValue ?? '-'),
      minWidth: 100,
      title: '注册方式',
    },
    { field: 'RegIp', minWidth: 120, title: '注册IP' },
    { field: 'LastIp', minWidth: 120, title: '最后登录IP' },
    {
      field: 'LastTime',
      formatter: ({ row }) =>
        formatDateTime(
          (row.LastTime as string) || (row.LastLoginTime as string),
        ),
      minWidth: 170,
      title: '最后登录',
    },
    { field: 'TagName', minWidth: 120, title: '标签' },
    { field: 'BanRemark', minWidth: 140, title: '封号原因' },
  ];

  for (const def of defs) {
    const key = def.field === 'PlayerStatus' ? 'PlayerStatus' : def.field;
    const storageKey =
      def.field === 'PlayerStatus' ? 'PlayerStatus' : def.field;
    // Always show status if chosen as PlayerStatus; map LoginAccount etc.
    if (def.field === 'PlayerStatus') {
      if (showColumn('PlayerStatus') || showColumn('Status')) {
        cols.push({
          field: 'Status',
          minWidth: def.minWidth,
          slots: def.slots,
          title: def.title,
        });
      }
      continue;
    }
    if (!showColumn(storageKey) && !showColumn(key)) {
      // Keep LoginAccount always visible for usability
      if (def.field !== 'LoginAccount') {
        continue;
      }
    }
    cols.push({
      field: def.field,
      formatter: def.formatter as never,
      minWidth: def.minWidth,
      showOverflow: 'tooltip',
      slots: def.slots,
      sortable: def.sortable,
      title: def.title,
    });
  }

  if (canRowAction.value) {
    cols.push({
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 100,
    });
  }
  return cols;
}

const gridOptions = computed<VxeTableGridOptions<PlayerListItem>>(() => ({
  columns: buildDynamicColumns(),
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page, sort }) => {
        const query = getQueryParams();
        let sortParam = query.Sort;
        if (sort?.field && sort?.order) {
          sortParam =
            sort.order === 'asc'
              ? String(sort.field)
              : `-${String(sort.field)}`;
        }
        const result = await fetchPlayerListApi({
          ...query,
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });
        totalData.value = (result.Total || {}) as {
          SumGold?: number | string;
          SumWalletBalance?: number | string;
        };
        totalCount.value = Number(result.Pagination?.MaxCount || 0);
        const items = result.Items || [];
        tableRows.value = items;
        return {
          items,
          total: totalCount.value,
        };
      },
    },
  },
  sortConfig: {
    defaultSort: { field: 'CreateTime', order: 'desc' },
  },
}));

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: PlayerListItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: PlayerListItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions: gridOptions.value,
});

function handleSearch() {
  selectedRows.value = [];
  try {
    gridApi.setGridOptions?.({ columns: buildDynamicColumns() });
  } catch {
    // ignore if adapter API differs
  }
  gridApi.reload();
}

function handleReset() {
  filterStatus.value = [];
  filterLoginAccount.value = '';
  filterPlayerPassword.value = '';
  filterPhoneNo.value = '';
  filterEmail.value = '';
  filterPromoter.value = '';
  filterPlayerIdsStr.value = '';
  filterChannelIds.value = [];
  filterInviterLoginAccount.value = '';
  filterRegIp.value = '';
  filterLastIp.value = '';
  filterDeviceId.value = '';
  filterLastDevice.value = '';
  filterRealName.value = '';
  filterBank.value = '';
  filterPackageId.value = '';
  filterVipLevel.value = undefined;
  filterPlayerLevelId.value = -1;
  filterDataSearchType.value = 2;
  filterBindPhone.value = -1;
  filterTagName.value = '';
  filterDateRange.value = undefined;
  filterFirstPayRange.value = undefined;
  filterFiltersJson.value = '';
  selectedRows.value = [];
  handleSearch();
}

function openBatch(actType: BatchActType) {
  if (!selectedPlayerIds.value) {
    message.warning('请先勾选玩家');
    return;
  }
  batchActType.value = actType;
  batchOpen.value = true;
}

function openRemark(row: PlayerListItem) {
  remarkPlayerId.value = row.PlayerId ?? null;
  remarkLoginAccount.value = String(row.LoginAccount || '');
  remarkOpen.value = true;
}

async function switchStatus(row: PlayerListItem, status: number) {
  const name = String(row.LoginAccount || row.PlayerName || row.PlayerId);
  let remark: string | undefined;

  if (status === 3) {
    const input = window.prompt(`确认封号玩家「${name}」，请填写原因：`, '');
    if (input === null) {
      return;
    }
    if (!String(input).trim()) {
      message.warning('封号原因必填');
      return;
    }
    remark = String(input).trim();
  } else {
    const label =
      status === 7
        ? '重置短信次数'
        : formatPlayerStatus(status) || String(status);
    const ok = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        content:
          status === 7
            ? `确认对玩家「${name}」执行「重置短信次数」？`
            : `确认将玩家「${name}」设置为「${label}」？`,
        title: '提示',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!ok) {
      return;
    }
  }

  await updatePlayerExtApi({
    PlayerId: row.PlayerId!,
    Status: status,
    ...(remark ? { Remark: remark } : {}),
  });
  message.success('操作成功');
  handleSearch();
}

async function cancelKick(row: PlayerListItem) {
  const ok = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      content: `确认取消踢下线玩家「${row.LoginAccount}」？`,
      title: '提示',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!ok) return;
  // 对齐旧站：取消踢下线 Status=8
  await updatePlayerExtApi({ PlayerId: row.PlayerId!, Status: 8 });
  message.success('操作成功');
  handleSearch();
}

function openKick(row: PlayerListItem) {
  kickPlayerId.value = row.PlayerId ?? null;
  kickLastBlockTime.value = Number(row.LastBlockTime || 0);
  kickOpen.value = true;
}

function openTag(row: PlayerListItem) {
  tagPlayerId.value = row.PlayerId ?? null;
  tagIdCsv.value = String(row.TagId || '');
  tagOpen.value = true;
}

function openLevel(row: PlayerListItem) {
  levelPlayerId.value = row.PlayerId ?? null;
  levelPlayerLevelId.value =
    row.PlayerLevelId === undefined || row.PlayerLevelId === null
      ? 0
      : row.PlayerLevelId;
  levelOpen.value = true;
}

function handleAdvancedApply(rows: AdvancedFilterRow[]) {
  filterFiltersJson.value = rows?.length ? JSON.stringify(rows) : '';
  handleSearch();
}

function handleBulkConfirm(value: string) {
  filterLoginAccount.value = value;
  handleSearch();
}

function handleExportClick() {
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(PLAYER_LIST_EXPORT_PAGE_ID, {
    ...getQueryParams(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportPlayerListApi({
      ...getQueryParams(),
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
  } finally {
    exportLoading.value = false;
  }
}

async function handleCopy() {
  const rows =
    (gridApi.grid?.getTableData?.().fullData as PlayerListItem[]) || [];
  if (!rows.length) {
    message.warning('暂无数据可复制');
    return;
  }
  const fields = visibleColumns.value.filter((item) => item !== 'PlayerStatus');
  const headers = fields.map(
    (field) =>
      COLUMN_OPTIONS.find((item) => item.value === field)?.label || field,
  );
  const lines = [headers.join('\t')];
  for (const row of rows) {
    lines.push(
      fields
        .map((field) => {
          if (field === 'LastTime') {
            return formatDateTime(
              (row.LastTime as string) || (row.LastLoginTime as string),
            );
          }
          if (field === 'WalletBalance' || field === 'Gold') {
            return formatAmountFromCent(row[field]);
          }
          if (
            field === 'Recharged' ||
            field === 'WithdrawGold' ||
            field === 'FirstPayMoney'
          ) {
            return formatAmount(row[field]);
          }
          if (field === 'CreateTime' || field === 'FirstPayTime') {
            return formatDateTime(row[field] as string);
          }
          if (field === 'DataFlag') {
            return formatMemberType(row.DataFlag);
          }
          return String(row[field] ?? '');
        })
        .join('\t'),
    );
  }
  await navigator.clipboard.writeText(lines.join('\n'));
  message.success('表格数据已复制');
}

onMounted(async () => {
  if (!visibleColumns.value.includes('PlayerStatus')) {
    visibleColumns.value = [...visibleColumns.value, 'PlayerStatus', 'Gold'];
  }
  try {
    const result = await fetchPlayerLevelListApi({ Page: 1, PageSize: 200 });
    levelFilterOptions.value = [
      { label: '全部', value: -1 },
      { label: '未分层', value: 0 },
      ...(
        (result?.Items || []) as Array<{ Id: number; LevelName: string }>
      ).map((item) => ({
        label: item.LevelName || String(item.Id),
        value: item.Id,
      })),
    ];
  } catch {
    // ignore
  }
  if (canViewPage.value && canViewTable.value) {
    handleSearch();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="运营管理 · 会员列表"
    title="会员列表"
  >
    <Card>
      <OpsListPanel>
        <template #filters>
          <div v-if="canFilterStatus" class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">玩家状态</span>
              <Select
                v-model:value="filterStatus"
                mode="multiple"
                allow-clear
                :options="
                  PLAYER_STATUS_OPTIONS.filter((i) =>
                    [0, 1, 2, 3, 4, 6, 8].includes(i.value),
                  )
                "
                :max-tag-count="1"
                placeholder="请选择玩家状态"
              />
            </Space.Compact>
          </div>
          <div v-if="canFilterLoginAccount" class="flex flex-col gap-1">
            <Input
              v-model:value="filterLoginAccount"
              allow-clear
              @press-enter="handleSearch"
              placeholder="请输入游戏账号"
            >
              <template #addonBefore>游戏账号</template>
              <template #suffix>
                <Button
                  type="link"
                  size="small"
                  class="h-auto px-0"
                  @click.stop="bulkOpen = true"
                >
                  批量
                </Button>
              </template>
            </Input>
          </div>
          <div v-if="canFilterPassword" class="flex flex-col gap-1">
            <Input
              v-model:value="filterPlayerPassword"
              allow-clear
              placeholder="请输入同密码查重"
            >
              <template #addonBefore>同密码查重</template>
            </Input>
          </div>
          <div v-if="canFilterPhone" class="flex flex-col gap-1">
            <Input
              v-model:value="filterPhoneNo"
              allow-clear
              placeholder="请输入手机号"
            >
              <template #addonBefore>手机号</template>
            </Input>
          </div>
          <div v-if="canFilterEmail" class="flex flex-col gap-1">
            <Input
              v-model:value="filterEmail"
              allow-clear
              placeholder="请输入邮箱"
            >
              <template #addonBefore>邮箱</template>
            </Input>
          </div>
          <div v-if="canFilterPromoter" class="flex flex-col gap-1">
            <Input
              v-model:value="filterPromoter"
              allow-clear
              placeholder="请输入推广账号"
            >
              <template #addonBefore>推广账号</template>
            </Input>
          </div>
          <div v-if="canFilterPlayerIds" class="flex flex-col gap-1">
            <Input
              v-model:value="filterPlayerIdsStr"
              allow-clear
              placeholder="请输入玩家ID"
            >
              <template #addonBefore>玩家ID</template>
            </Input>
          </div>
          <div v-if="canFilterChannel" class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">渠道</span>
              <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
            </Space.Compact>
          </div>
          <div v-if="canFilterInviter" class="flex flex-col gap-1">
            <Input
              v-model:value="filterInviterLoginAccount"
              allow-clear
              placeholder="请输入上级账号"
            >
              <template #addonBefore>上级账号</template>
            </Input>
          </div>
          <div v-if="canFilterRegIp" class="flex flex-col gap-1">
            <Input
              v-model:value="filterRegIp"
              allow-clear
              placeholder="请输入注册IP"
            >
              <template #addonBefore>注册IP</template>
            </Input>
          </div>
          <div v-if="canFilterLastIp" class="flex flex-col gap-1">
            <Input
              v-model:value="filterLastIp"
              allow-clear
              placeholder="请输入最后登录IP"
            >
              <template #addonBefore>最后登录IP</template>
            </Input>
          </div>
          <div v-if="canFilterDeviceId" class="flex flex-col gap-1">
            <Input
              v-model:value="filterDeviceId"
              allow-clear
              placeholder="请输入设备号"
            >
              <template #addonBefore>设备号</template>
            </Input>
          </div>
          <div v-if="canFilterLastDevice" class="flex flex-col gap-1">
            <Input
              v-model:value="filterLastDevice"
              allow-clear
              placeholder="请输入最后登录设备"
            >
              <template #addonBefore>最后登录设备</template>
            </Input>
          </div>
          <div v-if="canFilterRealName" class="flex flex-col gap-1">
            <Input
              v-model:value="filterRealName"
              allow-clear
              placeholder="请输入真实姓名"
            >
              <template #addonBefore>真实姓名</template>
            </Input>
          </div>
          <div v-if="canFilterBank" class="flex flex-col gap-1">
            <Input
              v-model:value="filterBank"
              allow-clear
              placeholder="请输入银行卡"
            >
              <template #addonBefore>银行卡</template>
            </Input>
          </div>
          <div v-if="canFilterPackage" class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">所属产品</span>
              <Select
                v-model:value="filterPackageId"
                :options="[
                  { label: '全部', value: '' },
                  ...packageOptions.map((item) => ({
                    label: item.PackageName,
                    value: item.PackageId,
                  })),
                ]"
                placeholder="请选择所属产品"
              />
            </Space.Compact>
          </div>
          <div v-if="canFilterVip" class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">VIP等级</span>
              <Select
                v-model:value="filterVipLevel"
                allow-clear
                :options="vipOptions"
                placeholder="请选择VIP等级"
              />
            </Space.Compact>
          </div>
          <div v-if="canFilterPlayerLevel" class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">会员层级</span>
              <Select
                v-model:value="filterPlayerLevelId"
                :options="levelFilterOptions"
                placeholder="请选择会员层级"
              />
            </Space.Compact>
          </div>
          <div v-if="canFilterMemberType" class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">会员类型</span>
              <Select
                v-model:value="filterDataSearchType"
                :options="memberTypeOptions"
                placeholder="请选择会员类型"
              />
            </Space.Compact>
          </div>
          <div v-if="canFilterBindPhone" class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">绑定手机</span>
              <Select
                v-model:value="filterBindPhone"
                :options="[
                  { label: '全部', value: -1 },
                  { label: '已绑定', value: 1 },
                  { label: '未绑定', value: 2 },
                ]"
                placeholder="请选择绑定手机"
              />
            </Space.Compact>
          </div>
          <div v-if="canFilterTag" class="flex flex-col gap-1">
            <Input
              v-model:value="filterTagName"
              allow-clear
              placeholder="请输入标签"
            >
              <template #addonBefore>标签</template>
            </Input>
          </div>
          <div v-if="canFilterRegDate" class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" label="注册时间" />
        </div>
          <div v-if="canFilterFirstPay" class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterFirstPayRange" label="存款时间" />
        </div>
          <div class="query-filter-wide">
            <Space.Compact>
              <span class="query-field-addon">显示列</span>
              <Select
                v-model:value="visibleColumns"
                mode="multiple"
                :max-tag-count="1"
                :options="COLUMN_OPTIONS"
                placeholder="请选择显示列"
                @change="persistColumns"
              />
            </Space.Compact>
          </div>
        <div class="query-filter-actions">
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
          <Button type="default" @click="advancedOpen = true">高级搜索</Button>
          <Button @click="handleCopy">复制</Button>
          <Button
            v-if="canExport"
            :loading="exportLoading"
            @click="handleExportClick"
          >
            导出 CSV
          </Button>
          <Dropdown v-if="canBatchEdit">
            <Button>批量编辑</Button>
            <template #overlay>
              <Menu>
                <Menu.Item key="1" @click="openBatch(1)"
                  >批量修改标签状态</Menu.Item
                >
                <Menu.Item key="2" @click="openBatch(2)"
                  >批量修改备注</Menu.Item
                >
                <Menu.Item key="3" @click="openBatch(3)"
                  >批量重置次数</Menu.Item
                >
                <Menu.Item key="4" @click="openBatch(4)">批量上标签</Menu.Item>
                <Menu.Item key="5" @click="openBatch(5)"
                  >批量修改会员层级</Menu.Item
                >
              </Menu>
            </template>
          </Dropdown>
        </div>
      </template>

        <template #summary>
          <SummaryCards :items="summaryItems" />
          <Tag v-if="filterFiltersJson" color="processing">已启用高级搜索</Tag>
        </template>

        <Grid v-if="canViewTable">
          <template #loginAccount="{ row }">
            <PlayerAccountLink
              v-if="row.LoginAccount"
              :login-account="String(row.LoginAccount)"
              :player-id="row.PlayerId"
            />
            <span v-else>-</span>
          </template>
          <template #status="{ row }">
            <PlayerStatusTag :status="row.Status" />
          </template>
          <template #actions="{ row }">
            <Dropdown>
              <Button size="small" type="link">操作</Button>
              <template #overlay>
                <Menu>
                  <Menu.Item key="remark" @click="openRemark(row)"
                    >备注</Menu.Item
                  >
                  <Menu.Item
                    key="good"
                    @click="switchStatus(row, Number(row.Status) === 1 ? 0 : 1)"
                  >
                    {{ Number(row.Status) === 1 ? '取消优质' : '优质' }}
                  </Menu.Item>
                  <Menu.Item
                    key="watch"
                    @click="switchStatus(row, Number(row.Status) === 2 ? 0 : 2)"
                  >
                    {{ Number(row.Status) === 2 ? '取消关注' : '关注' }}
                  </Menu.Item>
                  <Menu.Item
                    key="ban"
                    @click="switchStatus(row, Number(row.Status) === 3 ? 0 : 3)"
                  >
                    {{ Number(row.Status) === 3 ? '取消封号' : '封号' }}
                  </Menu.Item>
                  <Menu.Item
                    key="withdraw"
                    @click="switchStatus(row, Number(row.Status) === 4 ? 0 : 4)"
                  >
                    {{ Number(row.Status) === 4 ? '取消禁提' : '禁提' }}
                  </Menu.Item>
                  <Menu.Item
                    key="test"
                    @click="switchStatus(row, Number(row.Status) === 8 ? 0 : 8)"
                  >
                    {{ Number(row.Status) === 8 ? '取消测试' : '测试' }}
                  </Menu.Item>
                  <Menu.Item key="level" @click="openLevel(row)">
                    会员层级
                  </Menu.Item>
                  <Menu.Item key="tag" @click="openTag(row)">打标签</Menu.Item>
                  <Menu.Item
                    v-if="Number(row.Status) !== 6"
                    key="kick"
                    @click="openKick(row)"
                  >
                    踢下线
                  </Menu.Item>
                  <Menu.Item v-else key="cancelKick" @click="cancelKick(row)">
                    取消踢下线
                  </Menu.Item>
                  <Menu.Item key="sms" @click="switchStatus(row, 7)">
                    重置短信次数
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </template>
        </Grid>
        <div v-else class="py-10 text-center text-gray-400">无列表查看权限</div>
      </OpsListPanel>
    </Card>

    <PlayerBatchEditModal
      v-model:open="batchOpen"
      :act-type="batchActType"
      :player-ids="selectedPlayerIds"
      @success="handleSearch"
    />
    <PlayerListRemarkDrawer
      v-model:open="remarkOpen"
      :login-account="remarkLoginAccount"
      :player-id="remarkPlayerId"
    />
    <PlayerAdvancedSearchModal
      v-model:open="advancedOpen"
      @apply="handleAdvancedApply"
    />
    <PlayerBulkAccountModal
      v-model:open="bulkOpen"
      :initial-value="filterLoginAccount"
      @confirm="handleBulkConfirm"
    />
    <PlayerKickModal
      v-model:open="kickOpen"
      :player-id="kickPlayerId"
      :last-block-time="kickLastBlockTime"
      @success="handleSearch"
    />
    <PlayerTagModal
      v-model:open="tagOpen"
      :player-id="tagPlayerId"
      :tag-id="tagIdCsv"
      @success="handleSearch"
    />
    <PlayerLevelModal
      v-model:open="levelOpen"
      :player-id="levelPlayerId"
      :player-level-id="levelPlayerLevelId"
      @success="handleSearch"
    />
    <PassPopup
      ref="passPopupRef"
      type="csv"
      @confirm="handleExport"
    />
  </Page>

  <Page v-else auto-content-height title="会员列表">
    <Result status="403" sub-title="需要权限 10012" title="无权限" />
  </Page>
</template>

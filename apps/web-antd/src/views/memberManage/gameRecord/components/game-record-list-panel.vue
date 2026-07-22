<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameRecordListQuery } from '#/types/game-record';
import type { PlayerBetRecordItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  exportGameRecordListApi,
  fetchGameRecordListApi,
  fetchGameRecordSettleLogApi,
} from '#/api/memberManage/game-record';
import { fetchIosAppStoreListApi } from '#/api/operationalData/everyday-data';
import ChannelSelect from '#/components/global/channel-select.vue';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import {
  BET_STATUS_OPTIONS,
  BET_TIME_TYPE_OPTIONS,
  BET_YES_NO_OPTIONS,
  MAX_BET_QUERY_RANGE_SECONDS,
  calcBetWinLoss,
  calcBetWinLossCell,
  formatBetSettleLogType,
  formatBetStatus,
  pickBetAmount,
} from '#/utils/bet-detail';
import {
  getLast7DaysToYesterdayRangeSeconds,
  getYesterdayToTodayRangeSeconds,
} from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatGameName } from '#/utils/game-config';
import {
  PLAYER_STATUS_OPTIONS,
  formatPlayerStatus,
} from '#/utils/player-status';
import { GAME_RECORD_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import PlayerBulkAccountModal from '../../../operationalManage/playerList/components/player-bulk-account-modal.vue';
import GameRecordThirdDetailModal from './game-record-third-detail-modal.vue';

defineOptions({ name: 'GameRecordListPanel' });

const props = withDefaults(
  defineProps<{
    /** 嵌入玩家详情时锁定账号；全局页不传 */
    loginAccount?: string;
    playerId?: number | string;
    /** global=游戏记录；player=玩家详情注单 */
    scope?: 'global' | 'player';
  }>(),
  {
    scope: 'global',
  },
);

const isPlayerScope = computed(() => props.scope === 'player');

const TIMEZONE_OPTIONS = [
  { label: 'Default', value: '' },
  ...Array.from({ length: 27 }, (_, i) => {
    const offset = i - 12;
    const label =
      offset === 0 ? 'UTC±0' : `UTC${offset > 0 ? `+${offset}` : offset}`;
    return { label, value: String(offset) };
  }),
];

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const { packageOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const canExport = computed(() => checkPermission(12206));
const canOpenPlayer = computed(() => checkPermission(12207));

/** 全局：昨天→今天；玩家详情：近 7 天→昨天 */
const defaultRange = isPlayerScope.value
  ? getLast7DaysToYesterdayRangeSeconds()
  : getYesterdayToTodayRangeSeconds();
const defaultBegin = dayjs.unix(defaultRange.BeginTime);
const defaultEnd = dayjs.unix(defaultRange.EndTime);
const exportLoading = ref(false);
const copyLoading = ref(false);
const totalCount = ref(0);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const bulkOpen = ref(false);
const thirdOpen = ref(false);
const thirdRow = ref<PlayerBetRecordItem | null>(null);
const tableRows = ref<PlayerBetRecordItem[]>([]);

const settleLogOpenId = ref('');
const settleLogLoading = ref(false);
const settleLogRows = ref<Record<string, unknown>[]>([]);

const summary = ref({
  SumBetGold: 0,
  SumTotalBetGold: 0,
  SumValidWater: 0,
  SumWinGold: 0,
});

const filterVenuesTemp = ref<string[]>([]);
const filterGameIds = ref<Array<number | string>>([]);
const filterPackageId = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterSubGameId = ref<number | string | undefined>();
const filterLoginAccount = ref(
  isPlayerScope.value ? String(props.loginAccount || '') : '',
);
const filterVenueTypes = ref<Array<string | number>>([]);
const filterUsername = ref('');
const filterTransactionId = ref('');
const filterStatus = ref<string>();
const filterRoundId = ref('');
const filterBeginBetGold = ref<number | null>(null);
const filterEndBetGold = ref<number | null>(null);
const filterIsBetTrade = ref(0);
const filterSettleCount = ref(0);
const filterInviteSite = ref<string[]>([]);
const filterPlayerStatus = ref<number[]>([]);
const filterTagName = ref('');
const filterSiteTypes = ref<string[]>([]);
const filterAppUrl = ref<string[]>([]);
const filterDevicePlatform = ref<string[]>([]);
const filterTimeZone = ref('');
const filterSelectTimeType = ref(1);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);
const sortParam = ref('');

const appUrlOptions = ref<Array<{ label: string; value: string }>>([]);

watch(
  () => props.loginAccount,
  (value) => {
    if (isPlayerScope.value) {
      filterLoginAccount.value = String(value || '');
    }
  },
);

const packageSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
]);

const gameGroupOptions = computed(() => {
  const groups = (projectConfig.value?.GameGroups || []) as Array<{
    AdminIds?: string;
    GroupName?: string;
    Id?: number | string;
  }>;
  return groups.map((item) => ({
    label: item.GroupName || String(item.Id || ''),
    value: String(item.AdminIds || ''),
  }));
});

const platformGameOptions = computed(() =>
  Object.entries(gameConfig.value.platformGameList)
    .filter(
      ([, game]) =>
        Number((game as { IsVirtualGame?: number }).IsVirtualGame) === 0,
    )
    .map(([value, game]) => ({
      label: game.gameName || value,
      value,
    })),
);

const venueTypeOptions = computed(() =>
  Object.entries(gameConfig.value.platformGameType).map(([value, label]) => ({
    label: String(label),
    value,
  })),
);

const subGameOptions = computed(() =>
  Object.entries(gameConfig.value.games).map(([id, game]) => {
    const parentName =
      game.ParentId != null
        ? gameConfig.value.games[String(game.ParentId)]?.gameName
        : '';
    return {
      label: parentName
        ? `${game.gameName}(${parentName})`
        : game.gameName || id,
      value: id,
    };
  }),
);

const inviteSiteOptions = computed(() => {
  const list = (projectConfig.value?.InviteSites || []) as string[];
  return (Array.isArray(list) ? list : []).map((item) => ({
    label: item,
    value: item,
  }));
});

const siteTypeOptions = computed(() => {
  const list = (projectConfig.value?.InviteSiteTypes || []) as string[];
  return (Array.isArray(list) ? list : []).map((item) => ({
    label: item,
    value: item,
  }));
});

const devicePlatformOptions = computed(() => {
  const map = projectConfig.value?.DevicePlatformAll || {};
  return Object.entries(map).map(([value, label]) => ({
    label: String(label),
    value,
  }));
});

const betTotalText = computed(() =>
  formatAmountFromCent(
    summary.value.SumTotalBetGold > 0
      ? summary.value.SumTotalBetGold
      : summary.value.SumBetGold,
  ),
);

const winLossTotalText = computed(() =>
  formatAmountFromCent(summary.value.SumWinGold - summary.value.SumBetGold),
);

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

/** 对齐旧站 convertToUTCTimezone（秒级） */
function convertToUtcTimezone(localTimestamp: number, targetUtcOffset: string) {
  if (!targetUtcOffset && targetUtcOffset !== '0') {
    return localTimestamp;
  }
  const offset = Number(targetUtcOffset);
  if (Number.isNaN(offset)) {
    return localTimestamp;
  }
  const localOffsetMinutes = new Date(
    localTimestamp * 1000,
  ).getTimezoneOffset();
  const utcTimestamp = localTimestamp - localOffsetMinutes * 60;
  return utcTimestamp - offset * 60 * 60;
}

function getTimeRange() {
  const [begin, end] = filterDateRange.value || [];
  let beginTime = begin ? begin.startOf('day').unix() : defaultBegin.unix();
  let endTime = end ? end.endOf('day').unix() : defaultEnd.unix();
  if (filterTimeZone.value !== '') {
    beginTime = convertToUtcTimezone(beginTime, filterTimeZone.value);
    endTime = convertToUtcTimezone(endTime, filterTimeZone.value);
  }
  return { beginTime, endTime };
}

function getQueryParams(extra?: {
  Page?: number;
  PageSize?: number;
  Sort?: string;
  SumAll?: number;
}): GameRecordListQuery {
  const { beginTime, endTime } = getTimeRange();
  let gameIds: Array<number | string> | number | string = [
    ...filterGameIds.value,
  ];
  if (filterVenueTypes.value.length && !filterGameIds.value.length) {
    gameIds = -1;
  }

  return {
    AppUrl: filterAppUrl.value,
    BeginBetGold:
      filterBeginBetGold.value === null ||
      filterBeginBetGold.value === undefined
        ? ''
        : filterBeginBetGold.value,
    BeginTime: beginTime,
    ChannelIds: filterChannelIds.value,
    DevicePlatform: filterDevicePlatform.value,
    EndBetGold:
      filterEndBetGold.value === null || filterEndBetGold.value === undefined
        ? ''
        : filterEndBetGold.value,
    EndTime: endTime,
    GameIds: gameIds,
    InviteSite: filterInviteSite.value,
    IsBetTrade: filterIsBetTrade.value,
    LoginAccount: (isPlayerScope.value
      ? String(props.loginAccount || filterLoginAccount.value)
      : filterLoginAccount.value
    )
      .toLowerCase()
      .replaceAll(/\s/g, '')
      .slice(0, 1600),
    PackageId: filterPackageId.value,
    ...(isPlayerScope.value && props.playerId
      ? {
          DataSearchType: 2,
          PlayerId: String(props.playerId),
        }
      : {}),
    PlayerStatus: filterPlayerStatus.value,
    RoundId: filterRoundId.value.trim(),
    SelectTimeType: filterSelectTimeType.value,
    SettleCount: filterSettleCount.value,
    Sort: sortParam.value,
    Status: filterStatus.value || '',
    SubGameId: filterSubGameId.value || '',
    TagName: filterTagName.value.trim(),
    TimeZone: filterTimeZone.value,
    TransactionId: filterTransactionId.value.trim(),
    Username: filterUsername.value.trim(),
    VenueTypes: filterSiteTypes.value,
    ...extra,
  };
}

function validateDateRange() {
  const { beginTime, endTime } = getTimeRange();
  if (endTime - beginTime > MAX_BET_QUERY_RANGE_SECONDS) {
    message.error('查询时间不能大于一个月！');
    return false;
  }
  return true;
}

async function loadSummary() {
  const result = await fetchGameRecordListApi({
    ...getQueryParams(),
    Page: 1,
    PageSize: 1,
    SumAll: 1,
  });
  summary.value = {
    SumBetGold: Number(result.MoreItems?.SumBetGold || 0),
    SumTotalBetGold: Number(result.MoreItems?.SumTotalBetGold || 0),
    SumValidWater: Number(result.MoreItems?.SumValidWater || 0),
    SumWinGold: Number(result.MoreItems?.SumWinGold || 0),
  };
}

const gridOptions: VxeTableGridOptions<PlayerBetRecordItem> = {
  columns: [
    {
      field: 'TransactionId',
      minWidth: 170,
      showOverflow: 'tooltip',
      title: '注单流水号',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'PlayerStatus',
      formatter: ({ cellValue }) => formatPlayerStatus(cellValue),
      minWidth: 90,
      title: '玩家状态',
    },
    {
      field: 'TagName',
      formatter: ({ cellValue }) => cellValue || '--',
      minWidth: 100,
      showOverflow: 'tooltip',
      title: '玩家标签',
    },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === '' ? '-' : `VIP ${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    { field: 'Username', minWidth: 110, title: '代理账号' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'VendorCode',
      formatter: ({ cellValue, row }) =>
        String(
          cellValue ||
            formatGameName(row.GameId, gameConfig.value.games) ||
            '-',
        ),
      minWidth: 120,
      title: '场馆名称',
    },
    { field: 'GameId', minWidth: 90, title: '场馆编号' },
    {
      field: 'extra',
      minWidth: 110,
      slots: { default: 'extra' },
      title: '更多详情',
    },
    {
      field: 'TotalBetGold',
      minWidth: 110,
      slots: { default: 'betAmount' },
      sortable: true,
      title: '下注金额',
    },
    {
      field: 'ValidWater',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      sortable: true,
      title: '有效投注',
    },
    {
      field: 'WinGold',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      sortable: true,
      title: '返奖金额',
    },
    {
      field: 'WinLoseGold',
      minWidth: 120,
      slots: { default: 'winLoss' },
      sortable: true,
      title: '输赢情况',
    },
    {
      field: 'Status',
      minWidth: 110,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'TransactionTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '投注时间',
    },
    {
      field: 'SettlementTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '结算时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        await loadSummary();
        const result = await fetchGameRecordListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam.value,
        });
        const items = (result.Items || []) as PlayerBetRecordItem[];
        tableRows.value = items;
        totalCount.value = Number(result.Pagination?.MaxCount || items.length);
        return { items, total: totalCount.value };
      },
    },
  },
  sortConfig: { remote: true },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    sortChange: ({
      field,
      order,
    }: {
      field?: string;
      order?: null | string;
    }) => {
      if (field && order) {
        sortParam.value = order === 'asc' ? field : `-${field}`;
      } else {
        sortParam.value = '';
      }
      gridApi.reload();
    },
  },
  gridOptions,
});
const loading = computed(() => gridApi.grid?.loading ?? false);

function handleVenuesTempChange(values: string[]) {
  filterVenuesTemp.value = values;
  const ids = values
    .join(',')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  filterGameIds.value = [...new Set(ids)];
}

function handleVenueTypeChange(values: Array<string | number>) {
  filterVenueTypes.value = values;
  if (!values.length) {
    return;
  }
  const next: string[] = [];
  for (const [key, game] of Object.entries(gameConfig.value.platformGameList)) {
    const classify = (game as { ClientClassify?: number[] }).ClientClassify;
    if (!Array.isArray(classify)) {
      continue;
    }
    if (values.some((v) => classify.includes(Number(v)))) {
      next.push(key);
    }
  }
  filterGameIds.value = next;
}

function handleSearch() {
  if (!validateDateRange()) {
    return;
  }
  gridApi.reload();
}

function handleReset() {
  filterVenuesTemp.value = [];
  filterGameIds.value = [];
  filterPackageId.value = '';
  filterChannelIds.value = [];
  filterSubGameId.value = undefined;
  filterLoginAccount.value = isPlayerScope.value
    ? String(props.loginAccount || '')
    : '';
  filterVenueTypes.value = [];
  filterUsername.value = '';
  filterTransactionId.value = '';
  filterStatus.value = undefined;
  filterRoundId.value = '';
  filterBeginBetGold.value = null;
  filterEndBetGold.value = null;
  filterIsBetTrade.value = 0;
  filterSettleCount.value = 0;
  filterInviteSite.value = [];
  filterPlayerStatus.value = [];
  filterTagName.value = '';
  filterSiteTypes.value = [];
  filterAppUrl.value = [];
  filterDevicePlatform.value = [];
  filterTimeZone.value = '';
  filterSelectTimeType.value = 1;
  filterDateRange.value = [defaultBegin, defaultEnd];
  sortParam.value = '';
  gridApi.reload();
}

function handleExportClick() {
  if (!validateDateRange()) {
    return;
  }
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(GAME_RECORD_EXPORT_PAGE_ID, {
    ...getQueryParams(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportGameRecordListApi({
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

function openThirdDetail(row: PlayerBetRecordItem) {
  thirdRow.value = row;
  thirdOpen.value = true;
}

async function openSettleLog(row: PlayerBetRecordItem) {
  const id = String(row.TransactionId || '');
  settleLogOpenId.value = id;
  settleLogLoading.value = true;
  settleLogRows.value = [];
  try {
    const data = await fetchGameRecordSettleLogApi({ TransactionId: id });
    settleLogRows.value = Array.isArray(data) ? data : [];
  } finally {
    settleLogLoading.value = false;
  }
}

function settleLogDate(row: Record<string, unknown>) {
  const type = Number(row.Type);
  if (type === 1) {
    return formatDateTime(row.TransactionTime as string | number);
  }
  if (type === 11) {
    return formatDateTime(row.SettlementTime as string | number);
  }
  return formatDateTime(row.CreateTime as string | number);
}

async function handleCopy() {
  if (!tableRows.value.length) {
    message.warning('暂无数据可复制');
    return;
  }
  copyLoading.value = true;
  try {
    const header = [
      '流水号',
      '牌局编号',
      '玩家账号',
      '玩家状态',
      '玩家标签',
      'VIP等级',
      '代理账号',
      '产品名称',
      '场馆名称',
      '场馆编号',
      '下注金额',
      '有效投注',
      '返奖金额',
      '输赢情况',
      '状态',
      '下注时间',
      '结算时间',
    ];
    const lines = tableRows.value.map((item) => {
      let winText = '0';
      if (Number(item.Status) === 1) {
        winText = formatAmountFromCent(
          calcBetWinLoss(item.Status, item.WinGold, item.BetGold),
        );
        if (Number(item.SettleCount) > 1) {
          winText += '(二次结算)';
        } else if (Number(item.IsBetTrade) === 1) {
          winText += '(提前结算)';
        }
      }
      const betAmt =
        Number(item.Status) === 1
          ? formatAmountFromCent(item.TotalBetGold)
          : formatAmountFromCent(item.BetGold);
      return [
        item.TransactionId,
        item.RoundId,
        item.LoginAccount,
        formatPlayerStatus(item.PlayerStatus),
        item.TagName || '',
        `VIP ${item.VipLevel ?? ''}`,
        item.Username,
        item.PackageName,
        formatGameName(item.GameId, gameConfig.value.games),
        item.GameId,
        betAmt,
        formatAmountFromCent(item.ValidWater),
        formatAmountFromCent(item.WinGold),
        winText,
        formatBetStatus(item.Status),
        formatDateTime(item.TransactionTime),
        formatDateTime(item.SettlementTime),
      ].join('\t');
    });
    await navigator.clipboard.writeText(
      [header.join('\t'), ...lines].join('\n'),
    );
    message.success('已复制当前页数据');
  } catch {
    message.error('复制失败');
  } finally {
    copyLoading.value = false;
  }
}

function handleBulkConfirm(value: string) {
  filterLoginAccount.value = value.replaceAll(/\s|\n/g, '');
}

async function loadAppUrlOptions() {
  try {
    const data = await fetchIosAppStoreListApi();
    const items =
      (data as { Items?: Array<Record<string, unknown>> })?.Items ||
      (Array.isArray(data) ? data : []);
    appUrlOptions.value = (items as Array<Record<string, unknown>>).map(
      (item) => ({
        label: String(item.AppName || item.AppUrl || item.Id || ''),
        value: String(item.AppUrl || ''),
      }),
    );
  } catch {
    appUrlOptions.value = [];
  }
}

onMounted(async () => {
  await ensureGameConfig();
  void loadAppUrlOptions();
  gridApi.reload();
});
</script>

<template>
  <div>
    <OpsListPanel>
      <template #filters>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">场馆模版</span>
          <Select
            :value="filterVenuesTemp"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            placeholder="请选择"
            style="min-width: 160px"
            :options="gameGroupOptions"
            @change="(v: string[]) => handleVenuesTempChange(v || [])"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">场馆名称</span>
          <Select
            v-model:value="filterGameIds"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            placeholder="请选择"
            style="min-width: 160px"
            :options="platformGameOptions"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">产品</span>
          <Select
            v-model:value="filterPackageId"
            style="width: 150px"
            :options="packageSelectOptions"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">渠道号</span>
          <ChannelSelect v-model="filterChannelIds" style="width: 180px" />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">游戏名称</span>
          <Select
            v-model:value="filterSubGameId"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="请输入"
            style="min-width: 180px"
            :options="subGameOptions"
          />
        </div>
        <div v-if="!isPlayerScope" class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">游戏账号</span>
          <Space.Compact>
            <Input
              v-model:value="filterLoginAccount"
              allow-clear
              placeholder="请输入"
              style="width: 160px"
              @press-enter="handleSearch"
            />
            <Button @click="bulkOpen = true">批量</Button>
          </Space.Compact>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">场馆类型</span>
          <Select
            :value="filterVenueTypes"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            placeholder="请选择"
            style="min-width: 150px"
            :options="venueTypeOptions"
            @change="
              (v: Array<string | number>) => handleVenueTypeChange(v || [])
            "
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">代理账号</span>
          <Input
            v-model:value="filterUsername"
            allow-clear
            style="width: 140px"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">注单流水号</span>
          <Input
            v-model:value="filterTransactionId"
            allow-clear
            style="width: 170px"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">状态</span>
          <Select
            v-model:value="filterStatus"
            allow-clear
            placeholder="全部"
            style="width: 110px"
            :options="BET_STATUS_OPTIONS"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">牌局编号</span>
          <Input
            v-model:value="filterRoundId"
            allow-clear
            style="width: 140px"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">下注金额</span>
          <Space.Compact>
            <InputNumber
              v-model:value="filterBeginBetGold"
              :min="0"
              placeholder="起"
              style="width: 90px"
            />
            <InputNumber
              v-model:value="filterEndBetGold"
              :min="0"
              placeholder="止"
              style="width: 90px"
            />
          </Space.Compact>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">提前结算</span>
          <Select
            v-model:value="filterIsBetTrade"
            style="width: 100px"
            :options="BET_YES_NO_OPTIONS"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">二次结算</span>
          <Select
            v-model:value="filterSettleCount"
            style="width: 100px"
            :options="BET_YES_NO_OPTIONS"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">邀请站点</span>
          <Select
            v-model:value="filterInviteSite"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            style="min-width: 150px"
            :options="inviteSiteOptions"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">玩家状态</span>
          <Select
            v-model:value="filterPlayerStatus"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            style="min-width: 150px"
            :options="PLAYER_STATUS_OPTIONS"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">玩家标签</span>
          <Input
            v-model:value="filterTagName"
            allow-clear
            style="width: 140px"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">站点类型</span>
          <Select
            v-model:value="filterSiteTypes"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            style="min-width: 140px"
            :options="siteTypeOptions"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">上架包</span>
          <Select
            v-model:value="filterAppUrl"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            style="min-width: 150px"
            :options="appUrlOptions"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">设备类型</span>
          <Select
            v-model:value="filterDevicePlatform"
            allow-clear
            mode="multiple"
            :max-tag-count="1"
            style="min-width: 140px"
            :options="devicePlatformOptions"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">时区</span>
          <Select
            v-model:value="filterTimeZone"
            style="width: 120px"
            :options="TIMEZONE_OPTIONS"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">时间类型</span>
          <Select
            v-model:value="filterSelectTimeType"
            style="width: 120px"
            :options="BET_TIME_TYPE_OPTIONS"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs text-gray-500">时间范围</span>
          <DatePicker.RangePicker v-model:value="filterDateRange" />
        </div>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button :loading="copyLoading" @click="handleCopy">复制</Button>
        <Button
          v-if="canExport"
          :loading="exportLoading"
          @click="handleExportClick"
        >
          导出 CSV
        </Button>
      </template>

      <template #summary>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          下注总计：
          <span class="font-medium text-gray-900 dark:text-gray-100">
            {{ betTotalText }}
          </span>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          有效投注：
          <span class="font-medium">
            {{ formatAmountFromCent(summary.SumValidWater) }}
          </span>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          返奖总计：
          <span class="font-medium">
            {{ formatAmountFromCent(summary.SumWinGold) }}
          </span>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          输赢总计：
          <span class="font-medium">{{ winLossTotalText }}</span>
        </div>
      </template>

      <Grid>
        <template #loginAccount="{ row }">
          <PlayerAccountLink
            v-if="
              canOpenPlayer && row.PlayerId && Number(row.PlayerId) !== 99999999
            "
            :login-account="row.LoginAccount"
            :permission-id="12207"
            :player-id="row.PlayerId"
          />
          <span v-else>{{ row.LoginAccount || '-' }}</span>
        </template>
        <template #extra="{ row }">
          <Button size="small" type="primary" @click="openThirdDetail(row)">
            三方详情
          </Button>
        </template>
        <template #betAmount="{ row }">
          {{
            formatAmountFromCent(
              pickBetAmount(row.Status, row.TotalBetGold, row.BetGold),
            )
          }}
        </template>
        <template #winLoss="{ row }">
          <div>
            <span
              :class="
                Number(row.Status) === 1 && Number(row.WinGold) < 0
                  ? 'text-red-500'
                  : 'text-emerald-600'
              "
            >
              {{
                formatAmountFromCent(
                  calcBetWinLossCell(row.Status, row.WinGold),
                )
              }}
            </span>
            <div
              v-if="Number(row.Status) === 1 && Number(row.SettleCount) > 1"
              class="text-xs text-emerald-500"
            >
              (二次结算)
            </div>
            <div
              v-else-if="
                Number(row.Status) === 1 && Number(row.IsBetTrade) === 1
              "
              class="text-xs text-amber-500"
            >
              (提前结算)
            </div>
          </div>
        </template>
        <template #status="{ row }">
          <Popover
            v-if="String(row.Status) === '1'"
            trigger="click"
            placement="left"
            @open-change="(visible: boolean) => visible && openSettleLog(row)"
          >
            <template #content>
              <Table
                size="small"
                bordered
                :loading="
                  settleLogLoading &&
                  settleLogOpenId === String(row.TransactionId)
                "
                :pagination="false"
                :data-source="settleLogRows"
                row-key="Id"
                :columns="[
                  { title: '日期', key: 'date', width: 160 },
                  { title: '状态', key: 'type', width: 100 },
                  { title: '输赢', key: 'gold', width: 100 },
                ]"
                :scroll="{ y: 280 }"
                style="width: 380px"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'date'">
                    {{ settleLogDate(record) }}
                  </template>
                  <template v-else-if="column.key === 'type'">
                    <span
                      :class="{
                        'text-amber-500': Number(record.Type) === 17,
                        'text-emerald-500': Number(record.Type) === 21,
                      }"
                    >
                      {{ formatBetSettleLogType(record.Type) }}
                    </span>
                  </template>
                  <template v-else-if="column.key === 'gold'">
                    {{ formatAmountFromCent(record.AddGold) }}
                  </template>
                </template>
              </Table>
            </template>
            <Button type="link" class="!px-0">
              {{ formatBetStatus(row.Status) }}
            </Button>
          </Popover>
          <Tag v-else>{{ formatBetStatus(row.Status) }}</Tag>
        </template>
      </Grid>
    </OpsListPanel>

    <PlayerBulkAccountModal
      v-model:open="bulkOpen"
      :initial-value="filterLoginAccount"
      @confirm="handleBulkConfirm"
    />
    <GameRecordThirdDetailModal
      v-model:open="thirdOpen"
      :row="thirdRow"
      :games="gameConfig.games"
    />
    <PassPopup ref="passPopupRef" type="csv" @confirm="handleExport" />
  </div>
</template>

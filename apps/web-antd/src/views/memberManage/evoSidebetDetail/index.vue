<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { EvoSideBetListItem } from '#/types/evo-sidebet';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  DatePicker,
  Input,
  Result,
  Select,
  Space,
  Statistic,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchEvoSideBetListApi } from '#/api/memberManage/game-record';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import {
  BET_STATUS_OPTIONS,
  BET_TIME_TYPE_OPTIONS,
  BET_YES_NO_OPTIONS,
  MAX_BET_QUERY_RANGE_SECONDS,
  calcBetWinLoss,
  formatBetStatus,
} from '#/utils/bet-detail';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatGameName } from '#/utils/game-config';
import { formatPlayerStatus } from '#/utils/player-status';
import { EVO_SIDEBET_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

defineOptions({ name: 'EvoSidebetDetail' });

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const { packageOptions, memberTypeOptions } = useOperationOptions();

const canViewPage = computed(() => checkPermission(12205));
const canExport = computed(() => checkPermission(12206));
const canOpenPlayer = computed(() => checkPermission(12207));

const defaultBegin = dayjs().subtract(2, 'day').startOf('day');
const defaultEnd = dayjs().subtract(1, 'day').endOf('day');
const exportLoading = ref(false);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const summary = ref({
  SumBetGold: 0,
  SumTotalBetGold: 0,
  SumValidWater: 0,
  SumWinGold: 0,
});

const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterPackageId = ref<number | string>('');
const filterUsername = ref('');
const filterSubGameId = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterTransactionId = ref('');
const filterRoundId = ref('');
const filterStatus = ref<string>();
const filterIsBetTrade = ref(0);
const filterSettleCount = ref(0);
const filterSelectTimeType = ref(1);
const filterDataSearchType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);

const subGameOptions = computed(() =>
  Object.entries(gameConfig.value.games).map(([gameId, game]) => ({
    label: game.gameName || gameId,
    value: gameId,
  })),
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

function getQueryParams(extra?: {
  Page?: number;
  PageSize?: number;
  Sort?: string;
  SumAll?: number;
}) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultBegin.unix(),
    ChannelIds: filterChannelIds.value,
    DataSearchType: filterDataSearchType.value,
    EndTime: end ? end.endOf('day').unix() : defaultEnd.unix(),
    IsBetTrade: filterIsBetTrade.value,
    LoginAccount: filterLoginAccount.value,
    PackageId: filterPackageId.value,
    PlayerId: filterPlayerId.value,
    RoundId: filterRoundId.value,
    SelectTimeType: filterSelectTimeType.value,
    SettleCount: filterSettleCount.value,
    Status: filterStatus.value || '',
    SubGameId: filterSubGameId.value,
    TransactionId: filterTransactionId.value,
    Username: filterUsername.value,
    ...extra,
  };
}

async function loadSummary() {
  const result = await fetchEvoSideBetListApi({
    ...getQueryParams(),
    Page: 1,
    PageSize: 1,
    SumAll: 1,
  });
  summary.value = {
    SumBetGold: Number(result?.MoreItems?.SumBetGold || 0),
    SumTotalBetGold: Number(result?.MoreItems?.SumTotalBetGold || 0),
    SumValidWater: Number(result?.MoreItems?.SumValidWater || 0),
    SumWinGold: Number(result?.MoreItems?.SumWinGold || 0),
  };
}

const gridOptions: VxeTableGridOptions<EvoSideBetListItem> = {
  columns: [
    {
      field: 'TransactionId',
      minWidth: 180,
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
    { field: 'Username', minWidth: 110, title: '代理账号' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'GameId', minWidth: 90, title: '场馆编号' },
    {
      field: 'SubGameId',
      formatter: ({ cellValue }) =>
        formatGameName(cellValue, gameConfig.value.games),
      minWidth: 140,
      title: '游戏名称',
    },
    { field: 'SiteName', minWidth: 120, title: '邀请站点' },
    { field: 'SiteType', minWidth: 100, title: '站点类型' },
    { field: 'SideBetName', minWidth: 140, title: 'Sidebet 名称' },
    {
      field: 'BetGold',
      formatter: ({ cellValue, row }) =>
        formatAmountFromCent(
          Number(row.TotalBetGold) > 0 ? row.TotalBetGold : cellValue,
        ),
      minWidth: 110,
      sortable: true,
      title: '下注金额',
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
      minWidth: 110,
      slots: { default: 'winLoss' },
      title: '输赢情况',
    },
    {
      field: 'Status',
      minWidth: 100,
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
      query: async ({ page, sort }) => {
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam = `${sortField} ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        }

        await loadSummary();

        const result = await fetchEvoSideBetListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
        });

        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

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

function validateDateRange() {
  const [begin, end] = filterDateRange.value || [];
  const beginTime = begin ? begin.startOf('day').unix() : defaultBegin.unix();
  const endTime = end ? end.endOf('day').unix() : defaultEnd.unix();
  if (endTime - beginTime > MAX_BET_QUERY_RANGE_SECONDS) {
    message.warning('查询时间范围不能超过 31 天');
    return false;
  }
  return true;
}

function handleSearch() {
  if (!validateDateRange()) {
    return;
  }
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterPlayerId.value = '';
  filterPackageId.value = '';
  filterUsername.value = '';
  filterSubGameId.value = '';
  filterChannelIds.value = [];
  filterTransactionId.value = '';
  filterRoundId.value = '';
  filterStatus.value = undefined;
  filterIsBetTrade.value = 0;
  filterSettleCount.value = 0;
  filterSelectTimeType.value = 1;
  filterDataSearchType.value = 0;
  filterDateRange.value = [defaultBegin, defaultEnd];
  gridApi.reload();
}

function handleExportClick() {
  if (!validateDateRange()) {
    return;
  }
  passPopupRef.value?.validate(EVO_SIDEBET_EXPORT_PAGE_ID);
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchEvoSideBetListApi({
      ...getQueryParams(),
      Page: 1,
      PageSize: 10000,
    });
    const rows = result?.Items || [];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        { header: '注单流水号', value: (row) => row.TransactionId || '-' },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        {
          header: '玩家状态',
          value: (row) => formatPlayerStatus(row.PlayerStatus),
        },
        { header: '代理账号', value: (row) => row.Username || '-' },
        { header: '所属产品', value: (row) => row.PackageName || '-' },
        { header: '场馆编号', value: (row) => String(row.GameId || '-') },
        {
          header: '游戏名称',
          value: (row) => formatGameName(row.SubGameId, gameConfig.value.games),
        },
        { header: '邀请站点', value: (row) => row.SiteName || '-' },
        { header: '站点类型', value: (row) => row.SiteType || '-' },
        { header: 'Sidebet 名称', value: (row) => row.SideBetName || '-' },
        {
          header: '下注金额',
          value: (row) =>
            formatAmountFromCent(
              Number(row.TotalBetGold) > 0 ? row.TotalBetGold : row.BetGold,
            ),
        },
        {
          header: '返奖金额',
          value: (row) => formatAmountFromCent(row.WinGold),
        },
        {
          header: '输赢情况',
          value: (row) =>
            formatAmountFromCent(
              calcBetWinLoss(row.Status, row.WinGold, row.BetGold),
            ),
        },
        { header: '状态', value: (row) => formatBetStatus(row.Status) },
        {
          header: '投注时间',
          value: (row) => formatDateTime(row.TransactionTime),
        },
        {
          header: '结算时间',
          value: (row) => formatDateTime(row.SettlementTime),
        },
      ],
      `EVO_Sidebet_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

onMounted(async () => {
  if (!canViewPage.value) {
    return;
  }
  await ensureGameConfig();
  gridApi.reload();
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="会员管理 · EVO 真人 Sidebet 详情"
    title="EVO Sidebet 详情"
  >
    <div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      <Statistic title="下注总额" :value="betTotalText" />
      <Statistic
        title="有效投注总额"
        :value="formatAmountFromCent(summary.SumValidWater)"
      />
      <Statistic
        title="返奖总额"
        :value="formatAmountFromCent(summary.SumWinGold)"
      />
      <Statistic title="输赢总额" :value="winLossTotalText" />
    </div>

    <div class="mb-4 flex flex-wrap items-end gap-2">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">产品</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
          class="w-36"
          :options="
            packageOptions.map((item) => ({
              label: item.PackageName,
              value: item.PackageId,
            }))
          "
          placeholder="全部产品"
        />
      </div>
      <div class="flex w-52 flex-col gap-1">
        <span class="text-sm text-gray-500">渠道号</span>
        <ChannelSelect v-model="filterChannelIds" />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">游戏名称</span>
        <Select
          v-model:value="filterSubGameId"
          allow-clear
          class="w-44"
          :options="subGameOptions"
          placeholder="请选择"
          show-search
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">游戏账号</span>
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          class="w-40"
          placeholder="请输入"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">代理账号</span>
        <Input
          v-model:value="filterUsername"
          allow-clear
          class="w-36"
          placeholder="请输入"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">注单号</span>
        <Input
          v-model:value="filterTransactionId"
          allow-clear
          class="w-44"
          placeholder="请输入"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">牌局编号</span>
        <Input
          v-model:value="filterRoundId"
          allow-clear
          class="w-36"
          placeholder="请输入"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">状态</span>
        <Select
          v-model:value="filterStatus"
          allow-clear
          class="w-28"
          :options="BET_STATUS_OPTIONS"
          placeholder="全部"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">时间类型</span>
        <Select
          v-model:value="filterSelectTimeType"
          class="w-28"
          :options="BET_TIME_TYPE_OPTIONS"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">是否投注</span>
        <Select
          v-model:value="filterIsBetTrade"
          class="w-24"
          :options="BET_YES_NO_OPTIONS"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">结算次数</span>
        <Select
          v-model:value="filterSettleCount"
          class="w-24"
          :options="BET_YES_NO_OPTIONS"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">数据类型</span>
        <Select
          v-model:value="filterDataSearchType"
          class="w-28"
          :options="memberTypeOptions"
        />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">时间范围</span>
        <DatePicker.RangePicker v-model:value="filterDateRange" />
      </div>
      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button
          v-if="canExport"
          :loading="exportLoading"
          @click="handleExportClick"
        >
          导出 CSV
        </Button>
      </Space>
    </div>

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
      <template #winLoss="{ row }">
        {{
          formatAmountFromCent(
            calcBetWinLoss(row.Status, row.WinGold, row.BetGold),
          )
        }}
      </template>
      <template #status="{ row }">
        <Tag>{{ formatBetStatus(row.Status) }}</Tag>
      </template>
    </Grid>
    <PassPopup ref="passPopupRef" @confirm="handleExport" />
  </Page>
  <Result v-else status="403" sub-title="无 EVO Sidebet 查看权限" title="403" />
</template>

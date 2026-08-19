<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { GameStatementRow } from '../utils';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
} from 'ant-design-vue';

import {
  fetchSubGamePlayersApi,
  fetchSubGameReportListApi,
} from '#/api/dataClose/game-statement';
import AccountSelect from '#/components/global/account-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatGameName, formatVenueName } from '#/utils/game-config';
import { buildPlayerDetailPath } from '#/utils/player-detail-route';
import { exportReportXlsx } from '#/views/dataClose/shared/report-export';
import ReportQueryCard from '#/views/dataClose/shared/report-query-card.vue';
import ReportSummaryCards from '#/views/dataClose/shared/report-summary-cards.vue';
import { arrayToCsvParam, cents } from '#/views/dataClose/shared/report-utils';

import {
  buildCommonQuery,
  defaultTodayRange,
  disabledDateBeyond90,
  parseMyPlatformGameTypes,
  profitClass,
  profitRateText,
  profitText,
} from '../utils';
import DetailView from './detail-view.vue';
import UpdateReportBtn from './update-report-btn.vue';

defineOptions({ name: 'SubGameReportPanel' });

const router = useRouter();
const { projectConfig } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const { packageOptions } = useOperationOptions();

const loading = ref(false);
const subGameLoading = ref(false);
const showDetails = ref(false);
const currentParam = ref<Record<string, unknown>>({});
const currentSubGame = ref<number | string>('');
const tableData = ref<GameStatementRow[]>([]);
const total = ref<GameStatementRow>({});
const subGameOptions = ref<
  Array<{ label: string; value: number | string }>
>([]);
const playerDialogOpen = ref(false);
const playerTable = ref<Record<string, unknown>[]>([]);

const adminSearchType = ref(0);
const channelSearchType = ref(0);
const adminSearch = ref<Array<number | string> | number | string>([]);
const channelSearch = ref<Array<number | string> | number | string>([]);
const packageId = ref<number | string>('');
const adminGroupIds = ref<Array<number | string>>([]);
const gameType = ref<Array<number | string>>([]);
const subGameId = ref<number | string | undefined>(undefined);
const appUrl = ref<Array<number | string>>([]);
const dateRange = ref<[Dayjs, Dayjs]>(defaultTodayRange());

const adminGroupOptions = computed(() =>
  (
    (projectConfig.value?.AdminGroups || []) as Array<{
      GroupName?: string;
      Id?: number | string;
    }>
  ).map((item) => ({
    label: item.GroupName || String(item.Id),
    value: item.Id!,
  })),
);

const venueOptions = computed(() => {
  const keys = parseMyPlatformGameTypes(
    projectConfig.value?.MyPlatformGameType,
  );
  return keys.map((value) => ({
    label: formatVenueName(value, gameConfig.value),
    value,
  }));
});

const appUrlOptions = computed(() =>
  (
    (projectConfig.value?.IosAppStoreItems || []) as Array<{
      AppName?: string;
      AppUrl?: string;
      Id?: number | string;
    }>
  ).map((item) => ({
    label: item.AppName || item.AppUrl || String(item.Id),
    value: item.AppUrl || '',
  })),
);

const summaryItems = computed(() => [
  { title: '投注总额', value: cents(total.value.SumBet) },
  { title: '派送总额', value: cents(total.value.SumWin) },
  { title: '系统盈利', value: profitText(total.value) },
]);

const columns = [
  { key: 'SubGameId', title: '子游戏', width: 140 },
  { key: 'GameType', title: '场馆' },
  { key: 'CountBetNum', title: '投注人数' },
  { dataIndex: 'CountNum', key: 'CountNum', title: '投注次数' },
  { key: 'SumBet', title: '投注金币' },
  { key: 'SumWin', title: '实际派送' },
  { key: 'SumValidBet', title: '有效投注' },
  { key: 'Profit', title: '盈利金额' },
  { key: 'ProfitRate', title: '盈余比例' },
  { dataIndex: 'Rtp', key: 'Rtp', title: 'RTP' },
  { dataIndex: 'GameHotRank', key: 'GameHotRank', title: '热度排序' },
  { dataIndex: 'GameRank', key: 'GameRank', title: '场馆排序' },
];

function buildQuery(extra?: Record<string, unknown>) {
  return {
    ...buildCommonQuery({
      adminGroupIds: adminGroupIds.value,
      adminSearch: adminSearch.value,
      adminSearchType: adminSearchType.value,
      appUrl: appUrl.value,
      channelSearch: channelSearch.value,
      channelSearchType: channelSearchType.value,
      dateRange: dateRange.value,
      packageId: packageId.value,
    }),
    GameType: arrayToCsvParam(gameType.value) || '',
    SubGameId: subGameId.value || '',
    ...extra,
  };
}

function remoteSearchSubGame(keyword: string) {
  if (!keyword) {
    subGameOptions.value = [];
    return;
  }
  subGameLoading.value = true;
  window.setTimeout(() => {
    const games = gameConfig.value.games;
    subGameOptions.value = Object.entries(games)
      .filter(([, item]) => Number(item.ParentId || 0) !== 0)
      .filter(([, item]) => String(item.gameName || '').includes(keyword))
      .slice(0, 50)
      .map(([id, item]) => {
        const parent = games[String(item.ParentId)];
        return {
          label: `${item.gameName || id}(${parent?.gameName || item.ParentId})`,
          value: id,
        };
      });
    subGameLoading.value = false;
  }, 200);
}

async function loadList() {
  loading.value = true;
  try {
    const query = buildQuery();
    currentParam.value = query;
    const data = await fetchSubGameReportListApi(query);
    total.value = (data.Total || {}) as GameStatementRow;
    tableData.value = (data.Items || []) as GameStatementRow[];
  } catch {
    tableData.value = [];
    total.value = {};
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  adminSearchType.value = 0;
  channelSearchType.value = 0;
  adminSearch.value = [];
  channelSearch.value = [];
  packageId.value = '';
  adminGroupIds.value = [];
  gameType.value = [];
  subGameId.value = undefined;
  appUrl.value = [];
  dateRange.value = defaultTodayRange();
  void loadList();
}

async function handleExport() {
  await fetchSubGameReportListApi(buildQuery({ IsExp: true }));
  await exportReportXlsx(
    tableData.value,
    [
      '子游戏名称',
      '场馆名称',
      '投注人数',
      '投注次数',
      '投注金币',
      '实际派送金币',
      '有效投注',
      '盈利金额',
      '盈余比例',
      'RTP',
      '热度排序',
      '场馆排序',
    ],
    '子游戏报表',
    (row) => [
      formatGameName(row.SubGameId, gameConfig.value.games),
      formatVenueName(row.GameType, gameConfig.value),
      row.CountBetNum,
      row.CountNum,
      cents(row.SumBet),
      cents(row.SumWin),
      cents(row.SumValidBet),
      profitText(row),
      profitRateText(row),
      row.Rtp,
      row.GameHotRank,
      row.GameRank,
    ],
  );
}

function openDetail(row: GameStatementRow) {
  currentSubGame.value = row.SubGameId || '';
  showDetails.value = true;
}

async function openPlayers(row: GameStatementRow) {
  const data = await fetchSubGamePlayersApi({
    ...currentParam.value,
    SubGameId: row.SubGameId,
  });
  playerTable.value = data.Items || [];
  playerDialogOpen.value = true;
}

function goPlayer(row: Record<string, unknown>) {
  router.push({
    path: buildPlayerDetailPath(
      String(row.PlayerId || ''),
      String(row.LoginAccount || ''),
    ),
    query: { DataSearchType: 2 },
  });
}

watch(adminSearchType, (type) => {
  adminSearch.value = type === 0 ? [] : '';
});
watch(channelSearchType, (type) => {
  channelSearch.value = type === 0 ? [] : '';
});

onMounted(async () => {
  await ensureGameConfig(true);
  await loadList();
});
</script>

<template>
  <DetailView
    v-if="showDetails"
    report-type="subGameStatement"
    :param="currentParam"
    :dim-value="currentSubGame"
    @back="showDetails = false"
  />
  <div v-else>
    <ReportQueryCard actions-single>
      <Space.Compact>
        <Select
          class="query-auto-select"
          :popup-match-select-width="false"
          v-model:value="adminSearchType"
          :options="[
            { label: '代理模糊', value: 0 },
            { label: '代理精准', value: 1 },
          ]"
        />
        <AccountSelect
          v-if="adminSearchType === 0"
          v-model="adminSearch"
          style="width: 180px"
        />
        <Input
          v-else
          v-model:value="adminSearch"
          style="width: 180px"
          allow-clear
          placeholder="请输入代理账号"
          />
      </Space.Compact>
      <Space.Compact>
        <Select
          class="query-auto-select"
          :popup-match-select-width="false"
          v-model:value="channelSearchType"
          :options="[
            { label: '渠道模糊', value: 0 },
            { label: '渠道精准', value: 1 },
          ]"
        />
        <ChannelSelect
          v-if="channelSearchType === 0"
          v-model="channelSearch"
          style="width: 180px"
          placeholder="请输入渠道号"
        />
        <Input
          v-else
          v-model:value="channelSearch"
          style="width: 180px"
          allow-clear
          placeholder="请输入渠道"
          />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">产品</span>
        <Select
          v-model:value="packageId"
          :options="
            packageOptions.map((item) => ({
              label: item.PackageName,
              value: item.PackageId,
            }))
          "
          style="width: 160px"
          show-search
          allow-clear
          placeholder="请选择产品"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">代理模板</span>
        <Select
          v-model:value="adminGroupIds"
          :options="adminGroupOptions"
          mode="multiple"
          style="width: 180px"
          allow-clear
          :max-tag-count="1"
          placeholder="请选择代理模板"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">场馆</span>
        <Select
          v-model:value="gameType"
          :options="venueOptions"
          mode="multiple"
          style="width: 160px"
          allow-clear
          :max-tag-count="1"
          placeholder="请选择场馆"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">子游戏</span>
        <Select
          v-model:value="subGameId"
          :options="subGameOptions"
          :filter-option="false"
          :loading="subGameLoading"
          show-search
          allow-clear
          style="width: 220px"
          @search="remoteSearchSubGame"
          placeholder="请输入子游戏"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">上架包</span>
        <Select
          v-model:value="appUrl"
          :options="appUrlOptions"
          mode="multiple"
          style="width: 160px"
          allow-clear
          :max-tag-count="1"
          placeholder="请选择上架包"
        />
      </Space.Compact>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" precision="date" :disabled-date="(current) => disabledDateBeyond90(current, dateRange, 'end')" />
        </div>
      <template #actions>
        <Button type="primary" :loading="loading" @click="loadList">查询</Button>
        <Button @click="handleReset">重置</Button>
      </template>
    </ReportQueryCard>

    <ReportSummaryCards :items="summaryItems">
      <template #extra>
        <UpdateReportBtn />
        <Button @click="handleExport">导出 Excel</Button>
      </template>
    </ReportSummaryCards>

    <Table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="SubGameId"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'SubGameId'">
          <a @click="openDetail(record)">
            {{ formatGameName(record.SubGameId, gameConfig.games) }}
          </a>
        </template>
        <template v-else-if="column.key === 'GameType'">
          {{
            formatVenueName(
              record.GameType as number | string,
              gameConfig,
            )
          }}
        </template>
        <template v-else-if="column.key === 'CountBetNum'">
          <a
            v-if="Number(record.CountBetNum) > 0"
            @click="openPlayers(record)"
          >
            {{ record.CountBetNum }}
          </a>
          <span v-else>{{ record.CountBetNum }}</span>
        </template>
        <template v-else-if="column.key === 'SumBet'">
          {{ cents(record.SumBet) }}
        </template>
        <template v-else-if="column.key === 'SumWin'">
          {{ cents(record.SumWin) }}
        </template>
        <template v-else-if="column.key === 'SumValidBet'">
          {{ cents(record.SumValidBet) }}
        </template>
        <template v-else-if="column.key === 'Profit'">
          <span :class="profitClass(record)">{{ profitText(record) }}</span>
        </template>
        <template v-else-if="column.key === 'ProfitRate'">
          {{ profitRateText(record) }}
        </template>
      </template>
      <template #summary>
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell :index="0">合计</Table.Summary.Cell>
            <Table.Summary.Cell :index="1">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="2">
              {{ total.CountBetNum ?? '-' }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="3">
              {{ total.CountNum ?? '-' }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ cents(total.SumBet) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              {{ cents(total.SumWin) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{ cents(total.SumValidBet) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              {{ profitText(total) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="8">
              {{ profitRateText(total) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="9">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="10">-</Table.Summary.Cell>
            <Table.Summary.Cell :index="11">-</Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>

    <Modal
      v-model:open="playerDialogOpen"
      title="游戏账号"
      :footer="null"
      destroy-on-close
    >
      <Table
        :columns="[{ key: 'LoginAccount', title: '游戏账号' }]"
        :data-source="playerTable"
        :pagination="false"
        bordered
        row-key="PlayerId"
        size="small"
      >
        <template #bodyCell="{ record }">
          <a @click="goPlayer(record)">{{ record.LoginAccount }}</a>
        </template>
      </Table>
    </Modal>
  </div>
</template>

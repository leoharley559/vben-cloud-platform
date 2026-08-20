<script lang="ts" setup>
import type { GameStatementRow } from '../utils';

import { computed, onMounted, ref } from 'vue';

import { Breadcrumb, Button, Table, Tooltip } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchClassifiedDetailReportApi,
  fetchGameDetailReportApi,
  fetchSubGameDetailReportApi,
} from '#/api/dataClose/game-statement';
import { useGameConfig } from '#/composables/use-game-config';
import { formatGameName, formatVenueName } from '#/utils/game-config';
import { cents } from '#/views/dataClose/shared/report-utils';

import {
  getGameCategoryName,
  profitClass,
  profitRateText,
  profitText,
} from '../utils';
import LineChartModal from './line-chart-modal.vue';
import PlayersModal from './players-modal.vue';

defineOptions({ name: 'GameStatementDetailView' });

const props = defineProps<{
  dimValue: number | string;
  param: Record<string, unknown>;
  reportType: 'classifiedStatement' | 'gameStatement' | 'subGameStatement';
}>();

const emit = defineEmits<{
  back: [];
}>();

const { ensureGameConfig, gameConfig } = useGameConfig();
const loading = ref(false);
const tableData = ref<GameStatementRow[]>([]);
const totalData = ref<GameStatementRow>({});
const listQuery = ref<Record<string, unknown>>({});

const chartOpen = ref(false);
const chartField = ref('betPeople');
const chartTitle = ref('投注人数');
const playersOpen = ref(false);
const playersParam = ref<Record<string, unknown>>({});

const dimLabel = computed(() => {
  if (props.reportType === 'classifiedStatement') {
    return getGameCategoryName(
      props.dimValue,
      gameConfig.value.GameTypeLangGroup,
    );
  }
  if (props.reportType === 'gameStatement') {
    return formatVenueName(props.dimValue, gameConfig.value);
  }
  return formatGameName(props.dimValue, gameConfig.value.games);
});

const reportLabel = computed(() => {
  if (props.reportType === 'classifiedStatement') return '分类报表';
  if (props.reportType === 'subGameStatement') return '子游戏报表';
  return '游戏报表';
});

const dateLabel = computed(() => {
  const begin = Number(props.param.BeginTime);
  const end = Number(props.param.EndTime);
  if (!begin || !end) return '';
  const fmt = (ts: number) => dayjs.unix(ts).format('YYYY-MM-DD');
  return `${fmt(begin)} ~ ${fmt(end)}`;
});

const columns = computed(() => [
  { dataIndex: 'ReportDay', key: 'ReportDay', title: '日期', width: 120 },
  {
    dataIndex: 'CountBetNum',
    key: 'CountBetNum',
    title: '投注人数',
    customRender: ({ record }: { record: GameStatementRow }) => record,
  },
  { dataIndex: 'CountNum', key: 'CountNum', title: '投注次数' },
  {
    dataIndex: 'SumBet',
    key: 'SumBet',
    title: '投注金币',
    customRender: ({ text }: { text: number }) => cents(text),
  },
  {
    dataIndex: 'SumWin',
    key: 'SumWin',
    title: '实际派送',
    customRender: ({ text }: { text: number }) => cents(text),
  },
  {
    dataIndex: 'SumValidBet',
    key: 'SumValidBet',
    title: '有效投注',
    customRender: ({ text }: { text: number }) => cents(text),
  },
  {
    dataIndex: 'Profit',
    key: 'Profit',
    title: '盈利金额',
  },
  {
    dataIndex: 'ProfitRate',
    key: 'ProfitRate',
    title: '盈余比例',
  },
]);

function openChart(field: string, title: string) {
  chartField.value = field;
  chartTitle.value = title;
  chartOpen.value = true;
}

function openPlayers(reportDay: string) {
  const begin = dayjs(reportDay).startOf('day').unix();
  const end = dayjs(reportDay).endOf('day').unix();
  playersParam.value = {
    ...listQuery.value,
    BeginTime: begin,
    EndTime: end,
  };
  playersOpen.value = true;
}

async function loadList() {
  loading.value = true;
  try {
    const query = { ...props.param };
    if (props.reportType === 'gameStatement') {
      query.GameType = props.dimValue;
    } else if (props.reportType === 'classifiedStatement') {
      query.GamePlatformType = props.dimValue;
    } else {
      query.SubGameId = props.dimValue;
    }
    listQuery.value = query;
    const fetcher =
      props.reportType === 'gameStatement'
        ? fetchGameDetailReportApi
        : (props.reportType === 'classifiedStatement'
          ? fetchClassifiedDetailReportApi
          : fetchSubGameDetailReportApi);
    const data = await fetcher(query);
    tableData.value = (data.Items || []) as GameStatementRow[];
    totalData.value = (data.Total || {}) as GameStatementRow;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await ensureGameConfig();
  await loadList();
});
</script>

<template>
  <div>
    <div class="mb-4">
      <Button type="primary" size="small" @click="emit('back')">返回</Button>
    </div>
    <Breadcrumb class="mb-4 text-base">
      <Breadcrumb.Item>{{ reportLabel }}</Breadcrumb.Item>
      <Breadcrumb.Item>
        <span class="text-blue-500">{{ dimLabel }}</span>
      </Breadcrumb.Item>
      <Breadcrumb.Item>{{ dateLabel }}</Breadcrumb.Item>
    </Breadcrumb>

    <Table
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="ReportDay"
      size="small"
    >
      <template #headerCell="{ column }">
        <span
          v-if="column.key === 'CountBetNum'"
          class="inline-flex items-center gap-1"
        >
          投注人数
          <a class="text-xs" @click="openChart('betPeople', '投注人数')">📈</a>
        </span>
        <span
          v-else-if="column.key === 'CountNum'"
          class="inline-flex items-center gap-1"
        >
          投注次数
          <a
            class="text-xs"
            @click="openChart('gameDetailsBetCount', '投注次数')"
            >📈</a>
        </span>
        <span
          v-else-if="column.key === 'SumBet'"
          class="inline-flex items-center gap-1"
        >
          <Tooltip title="投注金币">
            <span>投注金币</span>
          </Tooltip>
          <a
            class="text-xs"
            @click="openChart('gameDetailsBetMoney', '投注金币')"
            >📈</a>
        </span>
        <span
          v-else-if="column.key === 'SumWin'"
          class="inline-flex items-center gap-1"
        >
          实际派送
          <a class="text-xs" @click="openChart('giftMoney', '实际派送')">📈</a>
        </span>
        <span
          v-else-if="column.key === 'SumValidBet'"
          class="inline-flex items-center gap-1"
        >
          有效投注
          <a class="text-xs" @click="openChart('validBetAmount', '有效投注')">📈</a>
        </span>
        <span
          v-else-if="column.key === 'Profit'"
          class="inline-flex items-center gap-1"
        >
          盈利金额
          <a class="text-xs" @click="openChart('profitAmt', '盈利金额')">📈</a>
        </span>
        <span
          v-else-if="column.key === 'ProfitRate'"
          class="inline-flex items-center gap-1"
        >
          盈余比例
          <a class="text-xs" @click="openChart('profitCompare', '盈余比例')">📈</a>
        </span>
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'CountBetNum'">
          <a
            v-if="
              Number(record.CountBetNum) > 0 && reportType === 'gameStatement'
            "
            @click="openPlayers(String(record.ReportDay))"
          >
            {{ record.CountBetNum }}
          </a>
          <span v-else>{{ record.CountBetNum }}</span>
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
            <Table.Summary.Cell :index="1">
              {{ totalData.CountBetNum ?? '-' }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="2">
              {{ totalData.CountNum ?? '-' }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="3">
              {{ cents(totalData.SumBet) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ cents(totalData.SumWin) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              {{ cents(totalData.SumValidBet) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{ profitText(totalData) }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              {{ profitRateText(totalData) }}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      </template>
    </Table>

    <LineChartModal
      v-model:open="chartOpen"
      :field-key="chartField"
      :param="listQuery"
      :report-type="reportType"
      :title="chartTitle"
    />
    <PlayersModal
      v-model:open="playersOpen"
      :param="playersParam"
      source="game"
    />
  </div>
</template>

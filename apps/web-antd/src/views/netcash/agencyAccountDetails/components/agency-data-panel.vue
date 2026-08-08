<script lang="ts" setup>
import type { AgencyListItem, AgentFanDianLine } from '#/types/netcash';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Button, DatePicker, Space, Table } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import * as XLSX from 'xlsx';

import {
  fetchAgentDirectAdminStatsApi,
  fetchAgentDirectMemberStatsApi,
  fetchAgentPersonalStatsApi,
} from '#/api/netcash/agency-account-details';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import venueConfig from '#/config/venue-config.json';
import { formatAmount, formatAmountFromCent } from '#/utils/format-amount';
import {
  formatAgentFanDianRebate,
  getAgentFanDianLines,
  parseAgentFanDianConfig,
} from '#/utils/netcash';

import AgencyFanDianModal from '../../agency/components/agency-fandian-modal.vue';

const props = defineProps<{ adminId: string }>();
const route = useRoute();
const router = useRouter();

type Row = Record<string, unknown>;
type Kind = 'agent' | 'member';

const GRADE_ORDER = ['grade_S', 'grade_A', 'grade_B', 'grade_C'];

const venueByGameId = new Map(
  venueConfig.venues.map((item) => [Number(item.GameId), item]),
);

const venueByCode = new Map(
  venueConfig.venues.flatMap((item) => {
    const entries: Array<[string, (typeof venueConfig.venues)[number]]> = [];
    if (item.VenueCode) {
      entries.push([String(item.VenueCode).toLowerCase(), item]);
    }
    if (item.VenueName) {
      entries.push([String(item.VenueName).toLowerCase(), item]);
    }
    return entries;
  }),
);

const loading = ref(false);
const personal = ref<Row[]>([]);
const members = ref<Row[]>([]);
const agents = ref<Row[]>([]);
const memberTotal = ref<Row>({});
const agentTotal = ref<Row>({});
const memberPager = reactive({ current: 1, pageSize: 20, total: 0 });
const agentPager = reactive({ current: 1, pageSize: 20, total: 0 });
const fanDianOpen = ref(false);

const fanDianRow = computed(
  () => (personal.value[0] as AgencyListItem | undefined) || null,
);

function openFanDianModal() {
  fanDianOpen.value = true;
}

function shortGradeLabel(gradeKey: string) {
  const matched = /^grade_(.+)$/i.exec(gradeKey);
  const code = matched?.[1];
  return `${code ? code.toUpperCase() : gradeKey}级`;
}

/** 按 SumValidBetMoney（分→元）匹配最高可达等级 */
function resolveCurrentGrade(
  fanDianConfig: ReturnType<typeof parseAgentFanDianConfig>,
  validBetCents: number,
) {
  if (!fanDianConfig) return null;
  const validBetYuan = validBetCents / 100;
  const grades = Object.keys(fanDianConfig)
    .toSorted((a, b) => {
      const ia = GRADE_ORDER.indexOf(a);
      const ib = GRADE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map((key) => ({
      flow: Number(fanDianConfig[key]?.effectiveFlow || 0),
      key,
      label: shortGradeLabel(key),
      lines: getAgentFanDianLines(fanDianConfig[key]),
    }))
    // 流水门槛从高到低，取第一个满足 ≥ 的等级
    .toSorted((a, b) => b.flow - a.flow);

  return grades.find((grade) => validBetYuan >= grade.flow) || null;
}

function matchFanDianLine(
  lines: AgentFanDianLine[],
  gameId: number,
  typeCode: string,
) {
  const normalizedType = String(typeCode || '').trim().toLowerCase();
  return (
    lines.find((line) => {
      const id = Number(line.id);
      const type = String(line.type || '').trim().toLowerCase();
      return (
        (!Number.isNaN(id) && id > 0 && id === gameId) ||
        (normalizedType && type === normalizedType) ||
        (type && type === String(gameId))
      );
    }) || null
  );
}

/**
 * 解析场馆元信息：
 * GameTypeStats 可能给数字 GameId，也可能给 VenueCode（如 by_qp / db_qp）。
 * 返水配置按 fanDianCategories.type（棋牌=qp）匹配，需把 VenueCode 归到对应类型。
 */
function resolveVenueMeta(rawGameId: number | string, rawTypeCode: string) {
  const numericId = Number(rawGameId);
  const codeHint = String(rawTypeCode || '').trim();
  const codeFromId =
    typeof rawGameId === 'string' && Number.isNaN(Number(rawGameId))
      ? rawGameId.trim()
      : '';

  let venue =
    Number.isFinite(numericId) && numericId > 0
      ? venueByGameId.get(numericId)
      : undefined;

  if (!venue) {
    const code = (codeHint || codeFromId).toLowerCase();
    if (code) {
      venue = venueByCode.get(code);
    }
  }

  let gameId = 0;
  if (venue) {
    gameId = Number(venue.GameId);
  } else if (Number.isFinite(numericId) && numericId > 0) {
    gameId = numericId;
  }

  const category =
    venueConfig.fanDianCategories.find((cat) => {
      if (gameId > 0 && cat.gameIdList.map(Number).includes(gameId)) {
        return true;
      }
      const type = String(cat.type || '').toLowerCase();
      const name = String(cat.name || '').toLowerCase();
      const hint = (codeHint || codeFromId).toLowerCase();
      return (
        (hint && (type === hint || name === hint)) ||
        // by_qp / db_qp 等 VenueCode 后缀归到类型（如 *_qp → qp）
        (hint && hint.endsWith(`_${type}`)) ||
        (hint && hint === type)
      );
    }) || undefined;

  const typeCode = String(category?.type || codeHint || codeFromId || '').trim();
  const venueLabel =
    venue?.Description || category?.name || (gameId > 0 ? String(gameId) : '') ||
    codeHint ||
    codeFromId ||
    '-';

  return {
    gameId,
    typeCode,
    venueLabel,
  };
}

/** 兼容数组 / 对象两种 GameTypeStats */
function normalizeGameTypeStats(raw: unknown) {
  if (!raw) return [];

  let list: Array<Record<string, unknown>> = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'object') {
    list = Object.entries(raw as Record<string, unknown>).map(
      ([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return { GameId: key, ...(value as Record<string, unknown>) };
        }
        return { GameId: key };
      },
    );
  }

  return list
    .map((item) => {
      const rawGameId = item.GameId ?? item.Id ?? item.gameId ?? item.ApiId ?? '';
      const rawTypeCode = String(
        item.Type ??
          item.GameType ??
          item.VenueCode ??
          item.ApiType ??
          '',
      ).trim();
      // 对象键为 by_qp 这类 VenueCode 时，补进 typeCode
      const typeCode =
        rawTypeCode ||
        (typeof rawGameId === 'string' && Number.isNaN(Number(rawGameId))
          ? String(rawGameId).trim()
          : '');
      const bet = Number(
        item.SumBetGameMoney ??
          item.BetGold ??
          item.BetAmount ??
          item.Bet ??
          item.SumBetGold ??
          0,
      );
      const validBet = Number(
        item.SumValidBetMoney ??
          item.ValidBetGold ??
          item.ValidBet ??
          item.ValidWater ??
          item.SumValidWater ??
          0,
      );
      const winGold = Number(
        item.SumWinGold ?? item.WinGold ?? item.SumWinMoney ?? 0,
      );
      const meta = resolveVenueMeta(rawGameId as number | string, typeCode);
      return {
        bet,
        gameId: meta.gameId,
        typeCode: meta.typeCode,
        venueLabel: meta.venueLabel,
        validBet,
        winGold,
      };
    })
    .filter((item) => item.gameId > 0 || item.typeCode);
}

function resolveVenueLabel(gameId: number, typeCode: string, fallback = '') {
  if (fallback) return fallback;
  return resolveVenueMeta(gameId, typeCode).venueLabel;
}

const venueDetailRows = computed(() => {
  const self = personal.value[0];
  if (!self) return [];

  const fanDianConfig = parseAgentFanDianConfig(self.AgentFanDianConfig);
  const grade = resolveCurrentGrade(
    fanDianConfig,
    Number(self.SumValidBetMoney || 0),
  );
  const stats = normalizeGameTypeStats(self.GameTypeStats);

  return stats
    .filter(
      (item) => item.bet !== 0 || item.validBet !== 0 || item.winGold !== 0,
    )
    .map((item, index) => {
      const line = grade
        ? matchFanDianLine(grade.lines, item.gameId, item.typeCode)
        : null;
      const rebateRatio = Number(line?.rebate);
      const rebateAmount =
        line && !Number.isNaN(rebateRatio)
          ? (item.validBet / 100) * rebateRatio
          : 0;
      /** 平台盈亏：SumWinGold 的相反数（避免 -0） */
      const platformPnL = item.winGold === 0 ? 0 : -item.winGold;

      return {
        bet: item.bet,
        key: `${item.gameId || item.typeCode}-${index}`,
        levelRate: grade
          ? `${grade.label}/${formatAgentFanDianRebate(line?.rebate)}`
          : '-',
        platformPnL,
        rebateAmount,
        validBet: item.validBet,
        venue: resolveVenueLabel(item.gameId, item.typeCode, item.venueLabel),
      };
    });
});

const venueDetailTotal = computed(() => {
  let bet = 0;
  let validBet = 0;
  let platformPnL = 0;
  let rebateAmount = 0;
  for (const row of venueDetailRows.value) {
    bet += row.bet;
    validBet += row.validBet;
    platformPnL += row.platformPnL;
    rebateAmount += row.rebateAmount;
  }
  return { bet, platformPnL, rebateAmount, validBet };
});

/** 盈亏着色：盈利绿、亏损红 */
function pnlClass(amount: number) {
  if (amount > 0) return 'text-emerald-500';
  return amount < 0 ? 'text-red-500' : '';
}

const venueDetailColumns = [
  { dataIndex: 'venue', key: 'venue', title: '场馆', width: 160 },
  {
    dataIndex: 'levelRate',
    key: 'levelRate',
    title: '代理等级/返点比例',
    width: 160,
  },
  {
    align: 'right' as const,
    dataIndex: 'bet',
    key: 'bet',
    title: '投注金额',
    width: 140,
  },
  {
    align: 'right' as const,
    dataIndex: 'validBet',
    key: 'validBet',
    title: '有效投注',
    width: 140,
  },
  {
    align: 'right' as const,
    dataIndex: 'rebateAmount',
    key: 'rebateAmount',
    title: '返点金额',
    width: 140,
  },
  {
    align: 'right' as const,
    dataIndex: 'platformPnL',
    key: 'platformPnL',
    title: '平台盈亏',
    width: 140,
  },
];

function routeTime(value: unknown, fallback: Dayjs) {
  const number = Number(value);
  if (!number) return fallback;
  return dayjs(String(Math.trunc(number)).length <= 10 ? number * 1000 : number);
}

const dateRange = ref<[Dayjs, Dayjs]>([
  routeTime(route.query.CountBeginTime, dayjs().startOf('day')),
  routeTime(route.query.CountEndTime, dayjs().endOf('day')),
]);

const amountFields = [
  { dataIndex: 'SumPayMoney', title: '存款金额' },
  { dataIndex: 'SumWithdrawMoney', title: '提款金额' },
  { dataIndex: 'SumBetGameMoney', title: '投注金额' },
  { dataIndex: 'SumValidBetMoney', title: '有效投注额' },
  { dataIndex: 'SumWinMoney', title: '派奖金额' },
  { dataIndex: 'SumRedGold', title: '红利' },
  { dataIndex: 'SumBackWaterMoney', title: '返水' },
  /** 平台盈亏：SumWinMoney 的相反数 */
  { dataIndex: 'SumProfit', title: '平台盈亏' },
];

/** 金额列取值；平台盈亏取派奖金额相反数（避免 -0） */
function amountValue(row: Row, dataIndex: string) {
  if (dataIndex === 'SumProfit') {
    const win = Number(row.SumWinMoney || 0);
    return win === 0 ? 0 : -win;
  }
  return Number(row[dataIndex] || 0);
}

/** 金额列 class：平台盈亏按正负着色 */
function amountCellClass(dataIndex: string, value: number) {
  return dataIndex === 'SumProfit' ? pnlClass(value) : '';
}

function columns(kind: 'agent' | 'member' | 'personal') {
  return [
    {
      dataIndex: kind === 'member' ? 'LoginAccount' : 'Username',
      key: 'account',
      title: kind === 'member' ? '游戏账号' : '代理账号',
      width: 150,
    },
    ...amountFields.map((item) => ({
      ...item,
      key: item.dataIndex,
      width: 130,
    })),
  ];
}

function query(page: number, pageSize: number) {
  return {
    AdminId: props.adminId,
    BeginTime: dateRange.value[0].startOf('day').unix(),
    EndTime: dateRange.value[1].endOf('day').unix(),
    Page: page,
    PageSize: pageSize,
  };
}

async function load() {
  loading.value = true;
  try {
    const [self, memberResult, agentResult] = await Promise.all([
      fetchAgentPersonalStatsApi(query(1, 1)),
      fetchAgentDirectMemberStatsApi(
        query(memberPager.current, memberPager.pageSize),
      ),
      fetchAgentDirectAdminStatsApi(query(agentPager.current, agentPager.pageSize)),
    ]);
    personal.value = Object.keys(self).length > 0 ? [self] : [];
    members.value = memberResult.Items || [];
    agents.value = agentResult.Items || [];
    memberTotal.value = memberResult.Total || {};
    agentTotal.value = agentResult.Total || {};
    memberPager.total = Number(
      memberResult.Pagination?.MaxCount ?? members.value.length,
    );
    agentPager.total = Number(
      agentResult.Pagination?.MaxCount ?? agents.value.length,
    );
  } catch {
    personal.value = [];
    members.value = [];
    agents.value = [];
    memberTotal.value = {};
    agentTotal.value = {};
    memberPager.total = 0;
    agentPager.total = 0;
  } finally {
    loading.value = false;
  }
}

function changePage(kind: Kind, page: number, pageSize: number) {
  const pager = kind === 'member' ? memberPager : agentPager;
  pager.current = page;
  pager.pageSize = pageSize;
  void load();
}

function drillPlayer(row: Row) {
  const playerId = row.PlayerId;
  if (playerId === undefined || playerId === null) return;
  void router.push({
    path: `/operationalManage/playerDetails/${playerId}:${String(
      row.LoginAccount || '',
    )}`,
    query: { DataSearchType: 2 },
  });
}

const combinedRows = computed<Row[]>(() => {
  const username = String(personal.value[0]?.Username || '');
  return [
    { ...memberTotal.value, Username: `${username}(直属会员)` },
    { ...agentTotal.value, Username: `${username}(直属代理)` },
  ];
});

const combinedTotal = computed(() => {
  const result: Row = {};
  for (const { dataIndex } of amountFields) {
    let total = 0;
    for (const row of combinedRows.value) {
      total += amountValue(row, dataIndex);
    }
    result[dataIndex] = total;
  }
  return result;
});

function exportData() {
  const rows = [
    ...personal.value.map((item) => ({ 类型: '代理自身', ...item })),
    ...members.value.map((item) => ({ 类型: '直属会员', ...item })),
    ...agents.value.map((item) => ({ 类型: '直属代理', ...item })),
  ];
  if (rows.length === 0) return;
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, '代理数据');
  XLSX.writeFile(
    book,
    `代理数据_${props.adminId}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`,
  );
}

onMounted(load);
watch(
  () => [
    props.adminId,
    route.query.CountBeginTime,
    route.query.CountEndTime,
  ],
  () => {
    dateRange.value = [
      routeTime(
        route.query.CountBeginTime,
        dayjs().startOf('day'),
      ),
      routeTime(route.query.CountEndTime, dayjs().endOf('day')),
    ];
    memberPager.current = 1;
    agentPager.current = 1;
    void load();
  },
);
</script>

<template>
  <div class="space-y-5">
    <div>
      <Space wrap>
        <DatePicker.RangePicker v-model:value="dateRange" />
        <Button type="primary" @click="load">查询</Button>
        <Button @click="
          dateRange = [
            dayjs().startOf('day'),
            dayjs().endOf('day'),
          ];
        load();
        ">
          重置
        </Button>
        <Button @click="exportData">导出当前数据</Button>
        <Button type="primary" @click="openFanDianModal">查看返水配置</Button>
      </Space>
    </div>
    <AgencyFanDianModal v-model:open="fanDianOpen" :row="fanDianRow" />
    
    <section>
      <Table bordered :columns="columns('personal')" :data-source="personal" :loading="loading" :pagination="false"
        row-key="AdminId" :scroll="{ x: 1200 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="amountFields.some((item) => item.dataIndex === column.key)">
            <span
              :class="
                amountCellClass(
                  String(column.key),
                  amountValue(record, String(column.key)),
                )
              "
            >
              {{
                formatAmountFromCent(
                  amountValue(record, String(column.key)),
                )
              }}
            </span>
          </template>
        </template>
      </Table>
    </section>
    <!-- 场馆明细 -->
    <section v-if="venueDetailRows.length > 0">
      <h3 class="mb-2 font-medium">场馆明细</h3>
      <Table
        bordered
        class="venue-detail-table"
        :columns="venueDetailColumns"
        :data-source="venueDetailRows"
        :loading="loading"
        :pagination="false"
        row-key="key"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'bet'">
            {{ formatAmountFromCent(record.bet) }}
          </template>
          <template v-else-if="column.key === 'validBet'">
            {{ formatAmountFromCent(record.validBet) }}
          </template>
          <template v-else-if="column.key === 'platformPnL'">
            <span :class="pnlClass(record.platformPnL)">
              {{ formatAmountFromCent(record.platformPnL) }}
            </span>
          </template>
          <template v-else-if="column.key === 'rebateAmount'">
            {{ formatAmount(record.rebateAmount) }}
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">合计</Table.Summary.Cell>
              <Table.Summary.Cell :index="1" />
              <Table.Summary.Cell :index="2" align="right">
                {{ formatAmountFromCent(venueDetailTotal.bet) }}
              </Table.Summary.Cell>
              <Table.Summary.Cell :index="3" align="right">
                {{ formatAmountFromCent(venueDetailTotal.validBet) }}
              </Table.Summary.Cell>
              <Table.Summary.Cell :index="4" align="right">
                {{ formatAmount(venueDetailTotal.rebateAmount) }}
              </Table.Summary.Cell>
              <Table.Summary.Cell :index="5" align="right">
                <span :class="pnlClass(venueDetailTotal.platformPnL)">
                  {{ formatAmountFromCent(venueDetailTotal.platformPnL) }}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </section>
     
    <!-- 直属会员 -->
    <section>
      <h3 class="mb-2 font-medium">直属会员</h3>
      <Table bordered :columns="columns('member')" :data-source="members" :loading="loading" :pagination="{
        current: memberPager.current,
        pageSize: memberPager.pageSize,
        total: memberPager.total,
        showSizeChanger: true,
      }" :row-key="(row) => String(row.PlayerId || row.LoginAccount)" :scroll="{ x: 1200 }" size="small"
        @change="(page) => changePage('member', page.current || 1, page.pageSize || 20)">
        <template #bodyCell="{ column, record }">
          <Button v-if="column.key === 'account'" type="link" @click="drillPlayer(record)">
            {{ record.LoginAccount || '-' }}
          </Button>
          <template v-else-if="amountFields.some((item) => item.dataIndex === column.key)">
            <span
              :class="
                amountCellClass(
                  String(column.key),
                  amountValue(record, String(column.key)),
                )
              "
            >
              {{
                formatAmountFromCent(amountValue(record, String(column.key)))
              }}
            </span>
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">总计</Table.Summary.Cell>
              <Table.Summary.Cell v-for="(item, index) in amountFields" :key="item.dataIndex" :index="index + 1">
                <span
                  :class="
                    amountCellClass(
                      item.dataIndex,
                      amountValue(memberTotal, item.dataIndex),
                    )
                  "
                >
                  {{
                    formatAmountFromCent(
                      amountValue(memberTotal, item.dataIndex),
                    )
                  }}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </section>
    <section>
      <h3 class="mb-2 font-medium">团队合计</h3>
      <Table bordered :columns="columns('agent')" :data-source="combinedRows" :pagination="false" row-key="Username"
        :scroll="{ x: 1200 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="amountFields.some((item) => item.dataIndex === column.key)">
            <span
              :class="
                amountCellClass(
                  String(column.key),
                  amountValue(record, String(column.key)),
                )
              "
            >
              {{
                formatAmountFromCent(amountValue(record, String(column.key)))
              }}
            </span>
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">总计</Table.Summary.Cell>
              <Table.Summary.Cell v-for="(item, index) in amountFields" :key="item.dataIndex" :index="index + 1">
                <span
                  :class="
                    amountCellClass(
                      item.dataIndex,
                      Number(combinedTotal[item.dataIndex] || 0),
                    )
                  "
                >
                  {{
                    formatAmountFromCent(
                      Number(combinedTotal[item.dataIndex] || 0),
                    )
                  }}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </section>

    <section>
      <h3 class="mb-2 font-medium">直属代理</h3>
      <Table bordered :columns="columns('agent')" :data-source="agents" :loading="loading" :pagination="{
        current: agentPager.current,
        pageSize: agentPager.pageSize,
        total: agentPager.total,
        showSizeChanger: true,
      }" :row-key="(row) => String(row.AdminId || row.Username)" :scroll="{ x: 1200 }" size="small"
        @change="(page) => changePage('agent', page.current || 1, page.pageSize || 20)">
        <template #bodyCell="{ column, record }">
          <AgencyAccountLink v-if="column.key === 'account'" :admin-id="record.AdminId as number | string | undefined"
            :query="{
              Name: String(record.Username || ''),
              CountBeginTime: dateRange[0].startOf('day').unix(),
              CountEndTime: dateRange[1].endOf('day').unix(),
            }" :username="record.Username" />
          <template v-else-if="amountFields.some((item) => item.dataIndex === column.key)">
            <span
              :class="
                amountCellClass(
                  String(column.key),
                  amountValue(record, String(column.key)),
                )
              "
            >
              {{
                formatAmountFromCent(amountValue(record, String(column.key)))
              }}
            </span>
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">总计</Table.Summary.Cell>
              <Table.Summary.Cell v-for="(item, index) in amountFields" :key="item.dataIndex" :index="index + 1">
                <span
                  :class="
                    amountCellClass(
                      item.dataIndex,
                      amountValue(agentTotal, item.dataIndex),
                    )
                  "
                >
                  {{
                    formatAmountFromCent(
                      amountValue(agentTotal, item.dataIndex),
                    )
                  }}
                </span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </section>
  </div>
</template>

<style scoped>
.venue-detail-table :deep(.ant-table-thead > tr > th),
.venue-detail-table :deep(.ant-table-tbody > tr > td),
.venue-detail-table :deep(.ant-table-summary > tr > td) {
  padding-top: 8px;
  padding-bottom: 8px;
}
</style>

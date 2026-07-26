<script lang="ts" setup>
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
import { formatAmountFromCent } from '#/utils/format-amount';

const props = defineProps<{ adminId: string }>();
const route = useRoute();
const router = useRouter();

type Row = Record<string, unknown>;
type Kind = 'agent' | 'member';

const loading = ref(false);
const personal = ref<Row[]>([]);
const members = ref<Row[]>([]);
const agents = ref<Row[]>([]);
const memberTotal = ref<Row>({});
const agentTotal = ref<Row>({});
const memberPager = reactive({ current: 1, pageSize: 20, total: 0 });
const agentPager = reactive({ current: 1, pageSize: 20, total: 0 });

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
  /** 盈亏：SumWinMoney 的相反数 */
  { dataIndex: 'SumProfit', title: '盈亏' },
];

/** 金额列取值；盈亏取派奖金额相反数 */
function amountValue(row: Row, dataIndex: string) {
  if (dataIndex === 'SumProfit') {
    return -Number(row.SumWinMoney || 0);
  }
  return Number(row[dataIndex] || 0);
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

function drillAgent(row: Row) {
  if (!row.AdminId) return;
  void router.push({
    path: `/netcash/agencyAccountDetails/${row.AdminId}`,
    query: {
      CountBeginTime: dateRange.value[0].unix(),
      CountEndTime: dateRange.value[1].unix(),
      Name: String(row.Username || ''),
    },
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
      </Space>
    </div>
    <section>
      <Table bordered :columns="columns('personal')" :data-source="personal" :loading="loading" :pagination="false"
        row-key="AdminId" :scroll="{ x: 1200 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="amountFields.some((item) => item.dataIndex === column.key)">
            <span
              :class="
                column.key === 'SumProfit' &&
                amountValue(record, String(column.key)) < 0
                  ? 'text-red-500'
                  : ''
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

    <section>
      <h3 class="mb-2 font-medium">团队合计</h3>
      <Table bordered :columns="columns('agent')" :data-source="combinedRows" :pagination="false" row-key="Username"
        :scroll="{ x: 1200 }" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="amountFields.some((item) => item.dataIndex === column.key)">
            {{
              formatAmountFromCent(amountValue(record, String(column.key)))
            }}
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">总计</Table.Summary.Cell>
              <Table.Summary.Cell v-for="(item, index) in amountFields" :key="item.dataIndex" :index="index + 1">
                {{ formatAmountFromCent(Number(combinedTotal[item.dataIndex] || 0)) }}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </section>

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
            {{
              formatAmountFromCent(amountValue(record, String(column.key)))
            }}
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">总计</Table.Summary.Cell>
              <Table.Summary.Cell v-for="(item, index) in amountFields" :key="item.dataIndex" :index="index + 1">
                {{
                  formatAmountFromCent(
                    amountValue(memberTotal, item.dataIndex),
                  )
                }}
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
            {{
              formatAmountFromCent(amountValue(record, String(column.key)))
            }}
          </template>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">总计</Table.Summary.Cell>
              <Table.Summary.Cell v-for="(item, index) in amountFields" :key="item.dataIndex" :index="index + 1">
                {{
                  formatAmountFromCent(
                    amountValue(agentTotal, item.dataIndex),
                  )
                }}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </section>
  </div>
</template>

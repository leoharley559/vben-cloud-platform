<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Input,
  message,
  Popover,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

import { fetchVipRecordListApi } from '#/api/gameManage/vip-setting';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getTodayRangeSeconds } from '#/utils/date-range';

defineOptions({ name: 'VipRecordPanel' });

interface VipRecordRow extends Record<string, unknown> {
  BeforeTotalCharge?: number;
  BeforeTotalWater?: number;
  BeforeVipLevel?: number;
  CreateTime?: number | string;
  HandlerUsername?: string;
  IsSendGift?: number;
  IsSendLevelGift?: number;
  LoginAccount?: string;
  PackageName?: string;
  Status?: number;
  TotalCharge?: number;
  TotalWater?: number;
  VipLevel?: number;
}

/** 对齐旧站 getBeforeDateTimestamp(1,false)～今天结束 */
function defaultDateRange(): [Dayjs, Dayjs] {
  const { BeginTime, EndTime } = getTodayRangeSeconds();
  return [dayjs.unix(BeginTime), dayjs.unix(EndTime)];
}

function toUnix(value: Dayjs | string | undefined, bound?: 'end' | 'start') {
  if (!value) return undefined;
  const parsed = dayjs.isDayjs(value) ? value : dayjs(value);
  if (!parsed.isValid()) return undefined;
  if (bound === 'start') return parsed.startOf('day').unix();
  if (bound === 'end') return parsed.endOf('day').unix();
  return parsed.unix();
}

const { checkPermission } = useCloudPermission();
const loading = ref(false);
const exporting = ref(false);
const rows = ref<VipRecordRow[]>([]);
const total = ref(0);
const aggregate = ref<Record<string, number>>({});
const dateRange = ref<[Dayjs, Dayjs]>(defaultDateRange());
const filters = reactive({
  LoginAccount: '',
  PackageName: '',
  PlayerId: '',
  Status: '' as number | string,
  VipLevel: '',
});
const pager = reactive({ Page: 1, PageSize: 10 });

const statusMap: Record<number, { color: string; text: string }> = {
  0: { color: 'default', text: '保级' },
  1: { color: 'green', text: '升级' },
  2: { color: 'red', text: '降级' },
  3: { color: 'blue', text: '后台修改' },
};
const giftMap: Record<number, string> = {
  0: '',
  1: '允许赠送',
  2: '拒绝赠送',
};
const columns = [
  { key: 'CreateTime', title: '时间', width: 170 },
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号', width: 130 },
  { dataIndex: 'PackageName', key: 'PackageName', title: '所属产品', width: 130 },
  { dataIndex: 'BeforeVipLevel', key: 'BeforeVipLevel', title: '修改前 VIP 等级', width: 140 },
  { dataIndex: 'VipLevel', key: 'VipLevel', title: 'VIP 等级', width: 100 },
  { key: 'BeforeTotalCharge', title: '修改前总存款', width: 140 },
  { key: 'TotalCharge', title: '总存款', width: 120 },
  { key: 'BeforeTotalWater', title: '修改前总流水', width: 140 },
  { key: 'TotalWater', title: '总流水', width: 120 },
  { key: 'HandlerUsername', title: '修改人', width: 130 },
  { key: 'Status', title: '状态', width: 100 },
];
const moneyKeys = new Set([
  'BeforeTotalCharge',
  'BeforeTotalWater',
  'TotalCharge',
  'TotalWater',
]);

function queryParams(isExport = false) {
  const begin = toUnix(dateRange.value?.[0], 'start');
  const end = toUnix(dateRange.value?.[1], 'end');
  return {
    BeginTime: begin,
    EndTime: end,
    IsExp: isExport || undefined,
    LoginAccount: filters.LoginAccount,
    PackageName: filters.PackageName,
    Page: pager.Page,
    PageSize: pager.PageSize,
    PlayerId: filters.PlayerId,
    Status: filters.Status === undefined || filters.Status === null ? '' : filters.Status,
    VipLevel: filters.VipLevel,
  };
}

function normalizeResult(data: unknown) {
  const result = (data || {}) as {
    Items?: null | VipRecordRow[];
    Pagination?: { MaxCount?: number };
    Total?: Record<string, number>;
  };
  return result;
}

async function loadData() {
  loading.value = true;
  try {
    const data = normalizeResult(await fetchVipRecordListApi(queryParams()));
    rows.value = Array.isArray(data.Items) ? data.Items : [];
    total.value = Number(data.Pagination?.MaxCount || 0);
    aggregate.value = data.Total || {};
  } finally {
    loading.value = false;
  }
}

function search() {
  pager.Page = 1;
  filters.LoginAccount = filters.LoginAccount.trim().toLowerCase();
  if (
    filters.LoginAccount &&
    !/^[a-z0-9]{4,20}$/.test(filters.LoginAccount)
  ) {
    message.warning('游戏账号必须为 4～20 位字母或数字');
    return;
  }
  if (toUnix(dateRange.value?.[0]) === undefined || toUnix(dateRange.value?.[1]) === undefined) {
    message.warning('请选择有效的时间范围');
    return;
  }
  loadData();
}

function reset() {
  filters.LoginAccount = '';
  filters.PackageName = '';
  filters.PlayerId = '';
  filters.Status = '';
  filters.VipLevel = '';
  dateRange.value = defaultDateRange();
  search();
}

function formatTime(value: unknown) {
  if (!value) return '-';
  const numeric = Number(value);
  const parsed =
    Number.isFinite(numeric) && String(value).length <= 10
      ? dayjs.unix(numeric)
      : dayjs(value as string);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : String(value);
}

function displayMoney(value: unknown) {
  return (Number(value || 0) / 100).toFixed(2);
}

function csvValue(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

async function exportCsv() {
  exporting.value = true;
  try {
    const data = normalizeResult(
      await fetchVipRecordListApi(queryParams(true)),
    );
    const list = Array.isArray(data.Items) ? data.Items : [];
    if (list.length === 0) {
      message.info('暂无可导出的数据');
      return;
    }
    const headers = [
      '时间',
      '游戏账号',
      '所属产品',
      '修改前VIP等级',
      'VIP等级',
      '修改前总存款',
      '总存款',
      '修改前总流水',
      '总流水',
      '修改人',
      '状态',
      '升级红利',
      '等级礼金',
    ];
    const lines = list.map((row) =>
      [
        formatTime(row.CreateTime),
        row.LoginAccount,
        row.PackageName,
        row.BeforeVipLevel,
        row.VipLevel,
        displayMoney(row.BeforeTotalCharge),
        displayMoney(row.TotalCharge),
        displayMoney(row.BeforeTotalWater),
        displayMoney(row.TotalWater),
        row.HandlerUsername || '系统',
        statusMap[Number(row.Status)]?.text || row.Status,
        giftMap[Number(row.IsSendLevelGift)] || '',
        giftMap[Number(row.IsSendGift)] || '',
      ]
        .map((value) => csvValue(value))
        .join(','),
    );
    const summary = [
      '合计',
      '-',
      '-',
      '-',
      '-',
      displayMoney(data.Total?.SumBeforeTotalCharge),
      displayMoney(data.Total?.SumTotalCharge),
      displayMoney(data.Total?.SumBeforeTotalWater),
      displayMoney(data.Total?.SumTotalWater),
      '-',
      '-',
      '-',
      '-',
    ]
      .map((value) => csvValue(value))
      .join(',');
    const blob = new Blob(
      [
        `\uFEFF${headers.map((value) => csvValue(value)).join(',')}\n${lines.join('\n')}\n${summary}`,
      ],
      { type: 'text/csv;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `VIP等级记录_${dayjs().format('YYYYMMDDHHmmss')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  } finally {
    exporting.value = false;
  }
}

onMounted(() => {
  if (checkPermission(11_003)) loadData();
});
</script>

<template>
  <div>
    <Card class="query-card" size="small">
      <div class="query-grid">
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filters.LoginAccount"
            allow-clear
            style="width: 220px"
            @press-enter="search"
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filters.PackageName"
            allow-clear
            style="width: 220px"
            @press-enter="search"
            placeholder="请输入包体名称"
          >
            <template #addonBefore>包体名称</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filters.VipLevel"
            allow-clear
            style="width: 220px"
            @press-enter="search"
            placeholder="请输入VIP 等级"
          >
            <template #addonBefore>VIP 等级</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">状态</span>
          <Select
            v-model:value="filters.Status"
            allow-clear
            :options="Object.entries(statusMap).map(([value, item]) => ({
              label: item.text,
              value: Number(value),
            }))"
            @clear="filters.Status = ''"
            placeholder="请选择状态"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="dateRange" />
        </div>
        <Space>
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
          <Button
            v-if="checkPermission(12_040)"
            :loading="exporting"
            @click="exportCsv"
          >
            导出 Excel
          </Button>
        </Space>
      </div>
    </Card>

    <Card class="table-card" :bordered="false">
      <Table
        v-if="checkPermission(11_003)"
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="{
          current: pager.Page,
          pageSize: pager.PageSize,
          showSizeChanger: true,
          total,
        }"
        :row-key="(row) => `${row.CreateTime}-${row.LoginAccount}-${row.VipLevel ?? row.Id ?? ''}`"
        :scroll="{ x: 1400 }"
        size="small"
        @change="
          (pagination) => {
            pager.Page = pagination.current || 1;
            pager.PageSize = pagination.pageSize || 10;
            loadData();
          }
        "
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'LoginAccount'">
            <PlayerAccountLink
              :login-account="String(record.LoginAccount || '')"
              :player-id="record.PlayerId as number | string | undefined"
            />
          </template>
          <span v-else-if="column.key === 'CreateTime'">
            {{ formatTime(record.CreateTime) }}
          </span>
          <span v-else-if="moneyKeys.has(String(column.key))">
            {{ displayMoney(record[String(column.key)]) }}
          </span>
          <span v-else-if="column.key === 'HandlerUsername'">
            {{ record.HandlerUsername || '系统' }}
            <Popover
              v-if="record.IsSendLevelGift > 0 || record.IsSendGift > 0"
              placement="right"
              title="操作记录"
            >
              <template #content>
                <div>升级红利：{{ giftMap[record.IsSendLevelGift] }}</div>
                <div>等级礼金：{{ giftMap[record.IsSendGift] }}</div>
              </template>
              <span class="info-dot">i</span>
            </Popover>
          </span>
          <Tag
            v-else-if="column.key === 'Status'"
            :color="statusMap[record.Status]?.color"
          >
            {{ statusMap[record.Status]?.text || record.Status }}
          </Tag>
        </template>
        <template #summary>
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell :index="0">合计：</Table.Summary.Cell>
              <Table.Summary.Cell
                v-for="index in 4"
                :key="`empty-${index}`"
                :index="index"
              >
                -
              </Table.Summary.Cell>
              <Table.Summary.Cell :index="5">
                {{ displayMoney(aggregate.SumBeforeTotalCharge) }}
              </Table.Summary.Cell>
              <Table.Summary.Cell :index="6">
                {{ displayMoney(aggregate.SumTotalCharge) }}
              </Table.Summary.Cell>
              <Table.Summary.Cell :index="7">
                {{ displayMoney(aggregate.SumBeforeTotalWater) }}
              </Table.Summary.Cell>
              <Table.Summary.Cell :index="8">
                {{ displayMoney(aggregate.SumTotalWater) }}
              </Table.Summary.Cell>
              <Table.Summary.Cell :index="9">-</Table.Summary.Cell>
              <Table.Summary.Cell :index="10">-</Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        </template>
      </Table>
    </Card>
  </div>
</template>

<style scoped>
.query-card,
.table-card {
  margin-bottom: 14px;
  border-radius: 10px;
}

.query-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(190px, 1fr));
  gap: 12px;
}

.info-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 5px;
  font-size: 11px;
  color: white;
  cursor: help;
  background: hsl(var(--primary));
  border-radius: 50%;
}

@media (max-width: 1200px) {
  .query-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}
</style>

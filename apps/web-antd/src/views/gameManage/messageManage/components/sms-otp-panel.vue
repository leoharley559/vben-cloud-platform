<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, reactive, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Radio,
  Select,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchRegisterOtpDailyApi,
  fetchRegisterOtpDetailApi,
} from '#/api/gameManage/message-manage';
import SummaryCards from '#/components/global/summary-cards.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'SmsOtpPanel' });

interface OtpRow {
  ChannelId?: number | string;
  Day?: string;
  IsRegistered?: number;
  PackageName?: string;
  Phone?: string;
  PhoneNum?: string;
  RegisterTime?: number | string;
  RegisterType?: string;
  SumRegisterDistinct?: number;
  SumRegisterError?: number;
  SumRegisterErrorSuccess?: number;
  SumRegisterErrorTotal?: number;
  SumRegisterSuccess?: number;
  SumRegisterTimeout?: number;
  SumRegisterTimeoutSuccess?: number;
  SumRegisterTimeoutTotal?: number;
  SumRegisterTotal?: number;
}

const { projectConfig } = useCloudPermission();
const activeType = ref<1 | 2>(1);
const reportLoading = ref(false);
const reportRange = ref<[Dayjs, Dayjs]>([
  dayjs().subtract(7, 'day').startOf('day'),
  dayjs().endOf('day'),
]);
const reportFilters = reactive({
  ChannelIds: '',
  PackageIds: '' as number | string,
});
const reportRows = ref<OtpRow[]>([]);
const detailRange = ref<[Dayjs, Dayjs]>([
  dayjs().subtract(7, 'day').startOf('day'),
  dayjs().endOf('day'),
]);
const detailFilters = reactive({
  ChannelIds: '',
  IsRegistered: '' as number | string,
  PackageIds: '' as number | string,
  PhoneNum: '',
  RegisterType: [] as string[],
});
const detailTotalData = reactive<Record<string, unknown>>({});

const detailSummaryItems = computed(() => [
  {
    label: 'OTP 申请总次数',
    value: Number(detailTotalData.SumRegisterTotal || 0),
  },
  {
    label: 'OTP 报错总次数',
    value: Number(detailTotalData.SumRegisterErrorTotal || 0),
  },
  {
    label: '超时总次数',
    value: Number(detailTotalData.SumRegisterTimeoutTotal || 0),
  },
]);

const packageOptions = computed(() => [
  { label: '全部产品', value: '' },
  ...(projectConfig.value?.RealPackageIdNameMap || []).map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
]);
const deviceOptions = computed(() => {
  const config = projectConfig.value as
    | null
    | { DevicePlatformMy?: Record<string, string> };
  return Object.entries(config?.DevicePlatformMy || {}).map(
    ([value, label]) => ({ label, value }),
  );
});
const deviceNameMap = computed(
  () =>
    new Map(
      deviceOptions.value.map((item) => [String(item.value), item.label]),
    ),
);
const todayRows = computed(() => {
  const today = dayjs().format('YYYY-MM-DD');
  return reportRows.value.filter((row) =>
    String(row.Day || '').startsWith(today),
  );
});
const historyRows = computed(() => {
  const today = dayjs().format('YYYY-MM-DD');
  return reportRows.value.filter(
    (row) => !String(row.Day || '').startsWith(today),
  );
});

const reportColumns = [
  { dataIndex: 'Day', key: 'Day', title: '日期', width: 120 },
  {
    dataIndex: 'SumRegisterDistinct',
    key: 'SumRegisterDistinct',
    title: '手机总计',
  },
  { dataIndex: 'registration', key: 'registration', title: '注册数（比例）' },
  {
    dataIndex: 'SumRegisterError',
    key: 'SumRegisterError',
    title: '报错手机数',
  },
  {
    dataIndex: 'errorRegistration',
    key: 'errorRegistration',
    title: '报错手机注册数（比例）',
  },
  {
    dataIndex: 'SumRegisterTimeout',
    key: 'SumRegisterTimeout',
    title: '超时手机数',
  },
  {
    dataIndex: 'timeoutRegistration',
    key: 'timeoutRegistration',
    title: '超时手机注册数（比例）',
  },
  {
    dataIndex: 'SumRegisterTotal',
    key: 'SumRegisterTotal',
    title: 'OTP 申请次数',
  },
  {
    dataIndex: 'SumRegisterErrorTotal',
    key: 'SumRegisterErrorTotal',
    title: 'OTP 报错次数',
  },
  {
    dataIndex: 'SumRegisterTimeoutTotal',
    key: 'SumRegisterTimeoutTotal',
    title: '超时总次数',
  },
];

function percentage(total?: number, value?: number) {
  if (!Number(total)) return '0.00%';
  return `${((Number(value || 0) / Number(total)) * 100).toFixed(2)}%`;
}

function deviceTypeText(value?: string) {
  return deviceNameMap.value.get(String(value || '')) || value || '-';
}

function historySum(field: keyof OtpRow) {
  return historyRows.value.reduce(
    (total, row) => total + Number(row[field] || 0),
    0,
  );
}

async function loadReport() {
  reportLoading.value = true;
  try {
    const result = await fetchRegisterOtpDailyApi({
      BeginTime: reportRange.value?.[0]?.unix() || '',
      ChannelIds: reportFilters.ChannelIds,
      EndTime: reportRange.value?.[1]?.unix() || '',
      PackageIds: reportFilters.PackageIds,
      Page: 1,
      PageSize: 9999,
      Sort: '',
    });
    reportRows.value = (result.Items || []) as OtpRow[];
  } finally {
    reportLoading.value = false;
  }
}

const detailGridOptions: VxeTableGridOptions<OtpRow> = {
  columns: [
    {
      field: 'Phone',
      formatter: ({ row }) => row.Phone || row.PhoneNum || '-',
      minWidth: 140,
      title: '手机号',
    },
    { field: 'PackageName', minWidth: 140, title: '产品名称' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    { field: 'SumRegisterTotal', minWidth: 130, title: 'OTP 申请次数' },
    { field: 'SumRegisterErrorTotal', minWidth: 130, title: 'OTP 报错次数' },
    { field: 'SumRegisterTimeoutTotal', minWidth: 120, title: '超时次数' },
    {
      field: 'RegisterTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as number | string),
      minWidth: 170,
      title: '注册时间',
    },
    {
      field: 'IsRegistered',
      formatter: ({ cellValue }) => (Number(cellValue) === 1 ? '是' : '否'),
      minWidth: 100,
      title: '注册状态',
    },
    {
      field: 'RegisterType',
      formatter: ({ cellValue }) => deviceTypeText(String(cellValue || '')),
      minWidth: 120,
      title: '注册来源',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRegisterOtpDetailApi({
          BeginTime: detailRange.value?.[0]?.unix() || '',
          ChannelIds: detailFilters.ChannelIds,
          EndTime: detailRange.value?.[1]?.unix() || '',
          IsRegistered: detailFilters.IsRegistered,
          PackageIds: detailFilters.PackageIds,
          Page: page.currentPage,
          PageSize: page.pageSize,
          PhoneNum: detailFilters.PhoneNum,
          RegisterType: detailFilters.RegisterType.join(','),
          Sort: '',
        });
        Object.assign(detailTotalData, result.Total || {});
        const items = (result.Items || []) as OtpRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount ?? items.length),
        };
      },
    },
  },
};

const [DetailGrid, detailGridApi] = useVbenVxeGrid({
  gridOptions: detailGridOptions,
});

async function reloadDetail() {
  await detailGridApi.grid?.setCurrentPage?.(1);
  await detailGridApi.query();
}

function resetReport() {
  reportFilters.ChannelIds = '';
  reportFilters.PackageIds = '';
  reportRange.value = [
    dayjs().subtract(7, 'day').startOf('day'),
    dayjs().endOf('day'),
  ];
  void loadReport();
}

function resetDetail() {
  Object.assign(detailFilters, {
    ChannelIds: '',
    IsRegistered: '',
    PackageIds: '',
    PhoneNum: '',
    RegisterType: [],
  });
  detailRange.value = [
    dayjs().subtract(7, 'day').startOf('day'),
    dayjs().endOf('day'),
  ];
  void reloadDetail();
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const content = [
    headers.map((item) => csvCell(item)).join(','),
    ...rows.map((row) => row.map((item) => csvCell(item)).join(',')),
  ].join('\n');
  const blob = new Blob([`\uFEFF${content}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportReport() {
  if (historyRows.value.length === 0) {
    message.warning('暂无可导出的历史数据');
    return;
  }
  downloadCsv(
    '注册OTP日报.csv',
    [
      '日期',
      '手机总计',
      '注册数',
      '报错手机数',
      '报错手机注册数',
      '超时手机数',
      '超时手机注册数',
      'OTP申请次数',
      'OTP报错次数',
      '超时总次数',
    ],
    historyRows.value.map((row) => [
      row.Day,
      row.SumRegisterDistinct,
      row.SumRegisterSuccess,
      row.SumRegisterError,
      row.SumRegisterErrorSuccess,
      row.SumRegisterTimeout,
      row.SumRegisterTimeoutSuccess,
      row.SumRegisterTotal,
      row.SumRegisterErrorTotal,
      row.SumRegisterTimeoutTotal,
    ]),
  );
}

async function exportDetail() {
  const result = await fetchRegisterOtpDetailApi({
    BeginTime: detailRange.value?.[0]?.unix() || '',
    ChannelIds: detailFilters.ChannelIds,
    EndTime: detailRange.value?.[1]?.unix() || '',
    IsRegistered: detailFilters.IsRegistered,
    PackageIds: detailFilters.PackageIds,
    Page: 1,
    PageSize: 100_000,
    PhoneNum: detailFilters.PhoneNum,
    RegisterType: detailFilters.RegisterType.join(','),
  });
  const items = (result.Items || []) as OtpRow[];
  if (items.length === 0) {
    message.warning('暂无可导出的明细');
    return;
  }
  downloadCsv(
    '注册OTP明细.csv',
    [
      '手机号',
      '产品名称',
      '渠道号',
      'OTP申请次数',
      'OTP报错次数',
      '超时次数',
      '注册时间',
      '注册状态',
      '注册来源',
    ],
    items.map((row) => [
      row.Phone || row.PhoneNum,
      row.PackageName,
      row.ChannelId,
      row.SumRegisterTotal,
      row.SumRegisterErrorTotal,
      row.SumRegisterTimeoutTotal,
      formatOperationDateTime(row.RegisterTime),
      Number(row.IsRegistered) === 1 ? '是' : '否',
      deviceTypeText(row.RegisterType),
    ]),
  );
}

void loadReport();
</script>

<template>
  <div>
    <Radio.Group v-model:value="activeType" button-style="solid" class="mb-4">
      <Radio.Button :value="1">日报</Radio.Button>
      <Radio.Button :value="2">明细</Radio.Button>
    </Radio.Group>

    <template v-if="activeType === 1">
      <div class="query-panel">
        <div class="query-fields">
          <Space.Compact>
            <span class="query-field-addon">选择产品</span>
            <Select
              v-model:value="reportFilters.PackageIds"
              :options="packageOptions"
              show-search
              placeholder="请选择选择产品"
            />
          </Space.Compact>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="reportFilters.ChannelIds"
              allow-clear
              style="width: 220px"
              placeholder="请输入渠道号"
            >
              <template #addonBefore>渠道号</template>
            </Input>
          </div>
          <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="reportRange" />
        </div>
        </div>
        <Space>
          <Button type="primary" :loading="reportLoading" @click="loadReport">
            查询
          </Button>
          <Button @click="resetReport">重置</Button>
        </Space>
      </div>
      <div class="section-title">实时数据</div>
      <Table
        :columns="reportColumns"
        :data-source="todayRows"
        :loading="reportLoading"
        :pagination="false"
        row-key="Day"
        :scroll="{ x: 1300 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'registration'">
            {{ record.SumRegisterSuccess }}
            ({{
              percentage(record.SumRegisterDistinct, record.SumRegisterSuccess)
            }})
          </template>
          <template v-else-if="column.key === 'errorRegistration'">
            {{ record.SumRegisterErrorSuccess }}
            ({{
              percentage(
                record.SumRegisterError,
                record.SumRegisterErrorSuccess,
              )
            }})
          </template>
          <template v-else-if="column.key === 'timeoutRegistration'">
            {{ record.SumRegisterTimeoutSuccess }}
            ({{
              percentage(
                record.SumRegisterTimeout,
                record.SumRegisterTimeoutSuccess,
              )
            }})
          </template>
        </template>
      </Table>
      <div class="section-header">
        <div class="section-title">历史数据</div>
        <Button type="primary" @click="exportReport">导出 CSV</Button>
      </div>
      <Table
        :columns="reportColumns"
        :data-source="historyRows"
        :loading="reportLoading"
        :pagination="false"
        row-key="Day"
        :scroll="{ x: 1300 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'registration'">
            {{ record.SumRegisterSuccess }}
            ({{
              percentage(record.SumRegisterDistinct, record.SumRegisterSuccess)
            }})
          </template>
          <template v-else-if="column.key === 'errorRegistration'">
            {{ record.SumRegisterErrorSuccess }}
            ({{
              percentage(
                record.SumRegisterError,
                record.SumRegisterErrorSuccess,
              )
            }})
          </template>
          <template v-else-if="column.key === 'timeoutRegistration'">
            {{ record.SumRegisterTimeoutSuccess }}
            ({{
              percentage(
                record.SumRegisterTimeout,
                record.SumRegisterTimeoutSuccess,
              )
            }})
          </template>
        </template>
        <template #summary>
          <Table.Summary.Row>
            <Table.Summary.Cell :index="0">合计</Table.Summary.Cell>
            <Table.Summary.Cell :index="1">
              {{ historySum('SumRegisterDistinct') }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="2">
              {{ historySum('SumRegisterSuccess') }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="3">
              {{ historySum('SumRegisterError') }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="4">
              {{ historySum('SumRegisterErrorSuccess') }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="5">
              {{ historySum('SumRegisterTimeout') }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="6">
              {{ historySum('SumRegisterTimeoutSuccess') }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="7">
              {{ historySum('SumRegisterTotal') }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="8">
              {{ historySum('SumRegisterErrorTotal') }}
            </Table.Summary.Cell>
            <Table.Summary.Cell :index="9">
              {{ historySum('SumRegisterTimeoutTotal') }}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </template>
      </Table>
    </template>

    <template v-else>
      <div class="query-panel">
        <div class="detail-query-fields">
          <Space.Compact>
            <span class="query-field-addon">选择产品</span>
            <Select
              v-model:value="detailFilters.PackageIds"
              :options="packageOptions"
              show-search
              placeholder="请选择选择产品"
            />
          </Space.Compact>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="detailFilters.ChannelIds"
              allow-clear
              style="width: 220px"
              placeholder="请输入渠道号"
            >
              <template #addonBefore>渠道号</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="detailFilters.PhoneNum"
              allow-clear
              style="width: 210px"
              placeholder="请输入手机号"
            >
              <template #addonBefore>手机号</template>
            </Input>
          </div>
          <Space.Compact>
            <span class="query-field-addon">注册来源</span>
            <Select
              v-model:value="detailFilters.RegisterType"
              mode="multiple"
              :options="deviceOptions"
              placeholder="请选择注册来源"
            />
          </Space.Compact>
          <Select
            v-model:value="detailFilters.IsRegistered"
            :options="[
              { label: '全部注册状态', value: '' },
              { label: '是', value: 1 },
              { label: '否', value: 2 },
            ]"
          />
          <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="detailRange" />
        </div>
        </div>
        <Space>
          <Button type="primary" @click="reloadDetail">查询</Button>
          <Button @click="resetDetail">重置</Button>
          <Button @click="exportDetail">导出 CSV</Button>
        </Space>
      </div>
      <SummaryCards :items="detailSummaryItems" />
      <div class="data-grid">
        <DetailGrid />
      </div>
    </template>
  </div>
</template>

<style scoped>
.query-panel {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  margin-bottom: 16px;
  background: hsl(var(--muted) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.query-fields {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px;
}

.detail-query-fields {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 12px;
}

.section-title {
  margin: 16px 0 10px;
  font-size: 16px;
  font-weight: 600;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
}

.data-grid {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

@media (max-width: 900px) {
  .query-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .query-fields,
  .detail-query-fields {
    grid-template-columns: 1fr;
  }
}
</style>

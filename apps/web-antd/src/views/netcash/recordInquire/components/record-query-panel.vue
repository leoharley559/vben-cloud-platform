<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { RecordQueryBaseQuery, RecordQueryListResult } from '#/types/netcash';

import { computed, onMounted, reactive, ref } from 'vue';

import { Button, DatePicker, Input, message, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useProjectConfig } from '#/composables/use-project-config';

type QueryKind = 'bonus' | 'standard' | 'transaction';
type SelectOption = { label: string; value: number | string };

export interface RecordColumn {
  field: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => unknown;
  minWidth?: number;
  /** vxe 列 slot 名，由父组件提供单元格内容 */
  slot?: string;
  title: string;
}

export interface RecordQueryPanelConfig {
  columns: RecordColumn[];
  exportPermission?: boolean;
  fetchApi: (
    query: RecordQueryBaseQuery,
  ) => Promise<RecordQueryListResult<any>>;
  kind?: QueryKind;
  showDataType?: boolean;
  summaryItems?: Array<{ columnField?: string; field: string; title: string }>;
  title: string;
  transferTypeOptions?: SelectOption[];
}

const props = defineProps<{ config: RecordQueryPanelConfig }>();
const { projectConfig } = useProjectConfig();

const query = reactive<RecordQueryBaseQuery>({
  AdminAccount: '',
  AgentAccount: '',
  BonusTitle: '',
  BonusType: [],
  DataSearchType: 0,
  IsWater: -1,
  LoginAccount: '',
  OperatorAccount: '',
  OperatorAccountType: 1,
  OperatorRemark: '',
  OperatorRemarkType: 1,
  OrderId: '',
  PackageId: '',
  Page: 1,
  PageSize: 20,
  Status: -1,
  TransferType: '',
  Username: '',
  VipLevel: -1,
  WalletType: '',
});

const kind = computed<QueryKind>(() => props.config.kind || 'standard');
/** 与旧站 listQuery 对齐：标准 Tab 近 7 日～今日；红利/账变 昨日～今日 */
const defaultRange = (): [dayjs.Dayjs, dayjs.Dayjs] => {
  const end = dayjs().endOf('day');
  if (kind.value === 'standard') {
    return [dayjs().subtract(7, 'day').startOf('day'), end];
  }
  return [dayjs().subtract(1, 'day').startOf('day'), end];
};
const primaryRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(
  defaultRange(),
);
const finishRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const summaries = reactive<Record<string, number>>({});
const total = ref(0);
const rows = ref<Record<string, unknown>[]>([]);
const exporting = ref(false);
const packages = computed(() =>
  (projectConfig.value?.RealPackageIdNameMap || []).map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);
const dataTypes = [
  { label: '全部', value: 2 },
  { label: '正式数据', value: 0 },
  { label: '测试数据', value: 1 },
];
const bonusTypes = [
  [3, '平台红利'],
  [4, '升级红利'],
  [5, '每月红包'],
  [6, '生日礼金'],
  [7, '代理红利'],
  [8, '推广红利'],
  [9, '存款优惠'],
  [10, '活动红利'],
  [11, '负数归零'],
  [12, '推荐红利'],
  [13, '预约提款'],
  [119, '确认到账'],
  [123, '代理存款红利'],
  [125, '首存优惠'],
  [130, '优惠券'],
].map(([value, label]) => ({ label, value })) as SelectOption[];
const vipLevels = computed(() => {
  const levels = (projectConfig.value?.VIPLevelMap || []) as Array<{
    VipLevelId: number;
    VipLevelName: string;
  }>;
  return [
    { label: '全部会员等级', value: -1 },
    ...levels.map((item) => ({
      label: item.VipLevelName,
      value: item.VipLevelId,
    })),
  ];
});
const waterOptions = [
  { label: '全部', value: -1 },
  { label: '是', value: 1 },
  { label: '否', value: 0 },
];
const statusOptions = [
  { label: '全部', value: -1 },
  { label: '未申请', value: 0 },
  { label: '审核中', value: 1 },
  { label: '成功', value: 2 },
  { label: '已失效', value: 3 },
  { label: '拒绝', value: 4 },
];
const walletOptions = [
  { label: '全部', value: '' },
  { label: '佣金钱包', value: 1 },
  { label: '信用钱包', value: 2 },
  { label: '代客钱包', value: 3 },
];
const money = (v: unknown) => (Number(v || 0) / 100).toFixed(2);

const summaryCards = computed(() =>
  (props.config.summaryItems || []).map((item) => ({
    label: item.title,
    value: money(summaries[item.field]),
  })),
);

function cleanLoginAccount() {
  query.LoginAccount = String(query.LoginAccount || '')
    .toLowerCase()
    .replaceAll(/\s/g, '');
}

function build(
  page: { currentPage: number; pageSize: number },
  exp = false,
): RecordQueryBaseQuery {
  cleanLoginAccount();
  const begin = primaryRange.value?.[0];
  const end = primaryRange.value?.[1];
  const base: RecordQueryBaseQuery = {
    ...query,
    IsExp: exp,
    Page: exp ? 1 : page.currentPage,
    PageSize: exp ? 99_999 : page.pageSize,
  };

  if (kind.value === 'transaction') {
    return {
      AdminAccount: base.AdminAccount,
      IsExp: exp,
      Page: base.Page,
      PageSize: base.PageSize,
      TransferEndTime: end?.endOf('day').unix() || '',
      TransferStartTime: begin?.startOf('day').unix() || '',
      TransferType: base.TransferType,
      WalletType: base.WalletType,
    };
  }
  if (kind.value === 'bonus') {
    return {
      ...base,
      ApplyBeginTime: begin?.startOf('day').unix() || '',
      ApplyEndTime: end?.endOf('day').unix() || '',
      BonusType: Array.isArray(base.BonusType)
        ? base.BonusType.join(',')
        : base.BonusType,
      FinishBeginTime: finishRange.value?.[0]?.startOf('day').unix() || '',
      FinishEndTime: finishRange.value?.[1]?.endOf('day').unix() || '',
    };
  }
  return {
    AgentAccount: base.AgentAccount,
    BeginTime: begin?.startOf('day').unix() || '',
    DataSearchType: props.config.showDataType
      ? base.DataSearchType
      : undefined,
    EndTime: end?.endOf('day').unix() || '',
    IsExp: exp,
    LoginAccount: base.LoginAccount,
    PackageId: base.PackageId,
    Page: base.Page,
    PageSize: base.PageSize,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { type: 'seq', title: '序号', width: 60 },
    ...props.config.columns.map((c) => ({
      field: c.field,
      formatter: c.slot
        ? undefined
        : c.formatter
          ? ({ cellValue, row }: any) => c.formatter!(cellValue, row)
          : undefined,
      minWidth: c.minWidth || 130,
      slots: c.slot ? { default: c.slot } : undefined,
      title: c.title,
    })),
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        try {
          const result = await props.config.fetchApi(build(page));
          rows.value = result.Items;
          total.value = Number(
            result.Pagination.MaxCount || rows.value.length || 0,
          );
          for (const item of props.config.summaryItems || []) {
            summaries[item.field] = Number(result.Total?.[item.field] || 0);
          }
          return { items: rows.value, total: total.value };
        } catch {
          rows.value = [];
          total.value = 0;
          for (const item of props.config.summaryItems || []) {
            summaries[item.field] = 0;
          }
          return { items: [], total: 0 };
        }
      },
    },
  },
};
const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function validateRange() {
  const begin = primaryRange.value?.[0];
  const end = primaryRange.value?.[1];
  if (!begin || !end) {
    message.warning('请选择日期范围');
    return false;
  }
  if (end.isBefore(begin)) {
    message.warning('结束时间不能早于开始时间');
    return false;
  }
  // 标准 Tab：对齐旧站 SearchTypeTwo limit-number=7；允许查到今日（对齐 listQuery EndTime）
  if (kind.value === 'standard') {
    if (begin.isAfter(dayjs(), 'day') || end.isAfter(dayjs(), 'day')) {
      message.warning('不能查询未来日期');
      return false;
    }
    if (end.startOf('day').diff(begin.startOf('day'), 'day') > 7) {
      message.warning('查询日期范围不能超过 7 天');
      return false;
    }
  }
  return true;
}

function disableStandardDate(date: dayjs.Dayjs) {
  // 标准 Tab 禁止选未来；红利/账变不限制（旧站红利 SearchTypeTwo 亦无 beforeToday）
  return kind.value === 'standard' && date.isAfter(dayjs(), 'day');
}

function search() {
  if (validateRange()) void gridApi.query();
}

function reset() {
  Object.assign(query, {
    AdminAccount: '',
    AgentAccount: '',
    BonusTitle: '',
    BonusType: [],
    DataSearchType: 0,
    IsWater: -1,
    LoginAccount: '',
    OperatorAccount: '',
    OperatorAccountType: 1,
    OperatorRemark: '',
    OperatorRemarkType: 1,
    OrderId: '',
    PackageId: '',
    Status: -1,
    TransferType: '',
    Username: '',
    VipLevel: -1,
    WalletType: '',
  });
  primaryRange.value = defaultRange();
  finishRange.value = undefined;
  search();
}

async function exportExcel() {
  if (!validateRange()) return;
  if (rows.value.length === 0) {
    message.info('暂无可导出的数据');
    return;
  }
  exporting.value = true;
  try {
    const result = await props.config.fetchApi(
      build({ currentPage: 1, pageSize: 99_999 }, true),
    );
    const list = result.Items;
    if (list.length === 0) {
      message.info('暂无可导出的数据');
      return;
    }
    const XLSX = await import('xlsx');
    const data = list.map((row) =>
      Object.fromEntries(
        props.config.columns.map((column) => [
          column.title,
          column.formatter
            ? column.formatter(row[column.field], row)
            : (row[column.field] ?? ''),
        ]),
      ),
    );
    if (props.config.summaryItems?.length) {
      const summaryRow: Record<string, unknown> = {
        [props.config.columns[0]?.title || '合计']: '合计',
      };
      for (const item of props.config.summaryItems) {
        const column = props.config.columns.find(
          ({ field }) =>
            field === (item.columnField || item.field.replace(/^Total/, '')),
        );
        summaryRow[column?.title || item.title] = money(
          result.Total?.[item.field],
        );
      }
      data.push(summaryRow);
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, props.config.title.slice(0, 31));
    XLSX.writeFile(wb, `${props.config.title}.xlsx`);
  } catch {
    message.error('导出失败，请稍后重试');
  } finally {
    exporting.value = false;
  }
}

onMounted(() => {
  if (validateRange()) void gridApi.reload();
});
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-x-3 gap-y-2">
      <template v-if="kind === 'standard'">
        <Input v-model:value="query.AgentAccount" allow-clear placeholder="代理账号" style="width: 220px" @press-enter="search">
          <template #addonBefore>代理账号</template>
        </Input>
        <Input v-model:value="query.LoginAccount" allow-clear placeholder="游戏账号" style="width: 220px" @blur="cleanLoginAccount" @press-enter="search">
          <template #addonBefore>游戏账号</template>
        </Input>
        <Select v-model:value="query.PackageId" allow-clear :options="packages" placeholder="所属产品" style="width: 160px" />
        <Select v-if="config.showDataType" v-model:value="query.DataSearchType" :options="dataTypes" placeholder="数据类型" style="width: 130px" />
      </template>

      <template v-else-if="kind === 'bonus'">
        <Input v-model:value="query.LoginAccount" allow-clear placeholder="游戏账号" style="width: 220px" @blur="cleanLoginAccount" @press-enter="search">
          <template #addonBefore>游戏账号</template>
        </Input>
        <Input v-model:value="query.OrderId" allow-clear placeholder="订单号" style="width: 220px" @press-enter="search">
          <template #addonBefore>订单号</template>
        </Input>
        <Input v-model:value="query.Username" allow-clear placeholder="代理账号" style="width: 220px" @press-enter="search">
          <template #addonBefore>代理账号</template>
        </Input>
        <Input v-model:value="query.BonusTitle" allow-clear placeholder="红利标题" style="width: 220px" @press-enter="search">
          <template #addonBefore>红利标题</template>
        </Input>
        <Input v-model:value="query.OperatorAccount" allow-clear placeholder="申请人/审核人" style="width: 180px">
          <template #addonBefore>
            <Select v-model:value="query.OperatorAccountType" :options="[{ label: '申请人', value: 1 }, { label: '审核人', value: 2 }]" style="width: 100px" />
          </template>
        </Input>
        <Input v-model:value="query.OperatorRemark" allow-clear placeholder="申请/审核备注" style="width: 200px">
          <template #addonBefore>
            <Select v-model:value="query.OperatorRemarkType" :options="[{ label: '申请备注', value: 1 }, { label: '审核备注', value: 2 }]" style="width: 100px" />
          </template>
        </Input>
        <Select v-model:value="query.PackageId" allow-clear :options="packages" placeholder="所属产品" style="width: 160px" />
        <Select v-model:value="query.BonusType" mode="multiple" :max-tag-count="1" :options="bonusTypes" placeholder="红利类型" style="width: 180px" />
        <Select v-model:value="query.VipLevel" :options="vipLevels" placeholder="会员等级" style="width: 150px" />
        <Select v-model:value="query.DataSearchType" :options="dataTypes.slice(0, 2)" placeholder="数据类型" style="width: 130px" />
        <Select v-model:value="query.IsWater" :options="waterOptions" placeholder="是否需要流水" style="width: 150px" />
        <Select v-model:value="query.Status" :options="statusOptions" placeholder="状态" style="width: 130px" />
      </template>

      <template v-else>
        <Input v-model:value="query.AdminAccount" allow-clear placeholder="代理账号" style="width: 220px" @press-enter="search">
          <template #addonBefore>代理账号</template>
        </Input>
        <Select v-model:value="query.WalletType" :options="walletOptions" placeholder="钱包类型" style="width: 140px" />
        <Select v-model:value="query.TransferType" :options="config.transferTypeOptions" placeholder="账变类型" style="width: 170px" />
      </template>

      <span>{{ kind === 'bonus' ? '申请时间' : kind === 'transaction' ? '账变时间' : '日期' }}</span>
      <DatePicker.RangePicker v-model:value="primaryRange" :disabled-date="disableStandardDate" />
      <template v-if="kind === 'bonus'">
        <span>审核时间</span>
        <DatePicker.RangePicker v-model:value="finishRange" />
      </template>
      <Button type="primary" @click="search">查询</Button>
      <Button @click="reset">重置</Button>
      <Button v-if="config.exportPermission" :loading="exporting" type="primary" ghost @click="exportExcel">导出 Excel</Button>
    </div>
    <SummaryCards :items="summaryCards" />
    <Grid>
      <template
        v-for="column in config.columns.filter((item) => item.slot)"
        :key="column.slot"
        #[column.slot!]="{ row }"
      >
        <slot :name="column.slot" :row="row" />
      </template>
    </Grid>
  </div>
</template>

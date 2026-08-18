<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerGoldHandleListApi } from '#/api/operationManage/player-gold-handle';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { exportRowsToCsv } from '#/utils/export-csv';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'GoldRecordPanel' });

const props = withDefaults(
  defineProps<{
    /** 1=发放记录（旧 saveRecord） 2=扣减记录（旧 takeRecord） */
    handleType?: 1 | 2;
  }>(),
  { handleType: 1 },
);

interface RecordRow {
  Amount?: number;
  ApproveName?: string;
  ChannelId?: string;
  ChannelName?: string;
  CreateTime?: number | string;
  Done?: number;
  HandleDesc?: string;
  HandlerName?: string;
  LoginAccount?: string;
  OrderId?: string;
  PackageId?: number | string;
  PackageName?: string;
  PlayerId?: number | string;
  PlayerName?: string;
  RealAmount?: number;
  RealApplyAmount?: number;
  Reason?: number;
  Title?: string;
  Water?: number;
  WaterAmount?: number;
  WaterType?: number;
}

const isTake = computed(() => props.handleType === 2);

const GRANT_DONE_MAP: Record<number, { color: string; text: string }> = {
  1: { color: 'default', text: '已发送' },
  2: { color: 'success', text: '已完成' },
  3: { color: 'error', text: '失败' },
  4: { color: 'error', text: '红利发送失败' },
};

const TAKE_DONE_MAP: Record<number, { color: string; text: string }> = {
  1: { color: 'default', text: '已发送' },
  2: { color: 'success', text: '已完成' },
  3: { color: 'error', text: '已失败' },
  4: { color: 'error', text: '发送失败' },
};

const GRANT_REASON_MAP: Record<number, string> = {
  1: '活动赠送',
  2: '异常补发',
  3: '平台红利',
  4: 'VIP升级红利',
  5: '每月红包',
  6: '生日礼金',
  7: '代理红利',
  8: '推广红利',
  9: '存款优惠',
  10: '活动红利',
  11: '负值清零',
  12: '推荐红利',
};

const TAKE_REASON_MAP: Record<number, string> = {
  1: '异常获取',
  2: '人工提现',
};

const doneMap = computed(() =>
  isTake.value ? TAKE_DONE_MAP : GRANT_DONE_MAP,
);
const reasonMap = computed(() =>
  isTake.value ? TAKE_REASON_MAP : GRANT_REASON_MAP,
);

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() =>
  checkPermission(isTake.value ? 10_092 : 10_090),
);
const canExport = computed(() =>
  checkPermission(isTake.value ? 10_093 : 10_091),
);

const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterPlayerName = ref('');
const filterPackageId = ref<number | string>();
const filterChannelIds = ref<Array<number | string> | number | string>();
const filterOrderId = ref('');
const filterWaterType = ref<number>(0);
const filterDone = ref<Array<number | string>>([]);
const filterReason = ref<Array<number | string>>([]);
const filterDataSearchType = ref(0);

function createDefaultDateRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  const range = getCurrentMonthRangeSeconds();
  return [dayjs.unix(range.BeginTime), dayjs.unix(range.EndTime)];
}

const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(
  createDefaultDateRange(),
);

const totalAmount = ref(0);
const totalRealAmount = ref(0);
const exportLoading = ref(false);

const summaryItems = computed(() => [
  {
    label: '申请金额总计',
    value: formatAmountFromCent(totalAmount.value),
    valueClass: 'font-medium text-gray-900',
  },
  {
    label: isTake.value ? '实际扣除金额总计' : '实际金额总计',
    value: formatAmountFromCent(totalRealAmount.value),
    valueClass: 'font-medium text-gray-900',
  },
]);

const packageSelectOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

const waterTypeOptions = [
  { label: '全部', value: 0 },
  { label: '倍数', value: 1 },
  { label: '金额', value: 2 },
];

const dataSearchTypeOptions = [
  { label: '正式', value: 0 },
  { label: '测试', value: 1 },
  { label: '全部', value: 2 },
];

const doneOptions = computed(() =>
  Object.entries(doneMap.value).map(([value, item]) => ({
    label: item.text,
    value: Number(value),
  })),
);

const reasonOptions = computed(() => {
  const entries = Object.entries(reasonMap.value);
  const filtered = isTake.value
    ? entries
    : entries.filter(([value]) => Number(value) >= 3);
  return filtered.map(([value, label]) => ({
    label,
    value: Number(value),
  }));
});

function channelIdsParam() {
  const value = filterChannelIds.value;
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(',');
  }
  return value || '';
}

function multiFilterParam(values: Array<number | string>) {
  if (!values?.length) {
    return '';
  }
  return values.join(',');
}

function normalizeLoginAccount() {
  filterLoginAccount.value = filterLoginAccount.value
    .toLowerCase()
    .replace(/\s/g, '');
}

function buildListQuery(page?: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  const query: Record<string, unknown> = {
    BeginTime: begin ? begin.unix() : '',
    ChannelIds: channelIdsParam(),
    Done: multiFilterParam(filterDone.value),
    EndTime: end ? end.unix() : '',
    HandleType: props.handleType,
    LoginAccount: filterLoginAccount.value.trim(),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value || '',
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
    PlayerId: filterPlayerId.value.trim(),
    PlayerName: filterPlayerName.value.trim(),
    Reason: multiFilterParam(filterReason.value),
    Sort: '',
  };

  if (!isTake.value) {
    query.DataSearchType = filterDataSearchType.value;
    query.WaterType = filterWaterType.value;
  }

  return query;
}

function formatWater(row: RecordRow) {
  if (Number(row.WaterType) === 2) {
    return formatAmountFromCent(Number(row.WaterAmount || 0));
  }
  return (Number(row.Water || 0) / 100).toFixed(2);
}

function realAmountOf(row: RecordRow) {
  if (isTake.value) {
    return Number(row.RealAmount ?? 0);
  }
  return Number(row.RealApplyAmount ?? row.RealAmount ?? 0);
}

const grantColumns: VxeTableGridOptions<RecordRow>['columns'] = [
  {
    field: 'Done',
    minWidth: 110,
    slots: { default: 'done' },
    title: '状态',
  },
  {
    field: 'CreateTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as string),
    minWidth: 160,
    title: '时间',
  },
  {
    field: 'Title',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 120,
    title: '红利标题',
  },
  {
    field: 'Reason',
    formatter: ({ cellValue }) =>
      reasonMap.value[Number(cellValue)] || String(cellValue ?? '-'),
    minWidth: 110,
    title: '类型',
  },
  { field: 'OrderId', minWidth: 180, title: '订单编号' },
  {
    field: 'LoginAccount',
    minWidth: 120,
    slots: { default: 'loginAccount' },
    title: '游戏账号',
  },
  {
    field: 'PlayerId',
    minWidth: 100,
    title: '玩家ID',
  },
  {
    field: 'PlayerName',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 100,
    title: '玩家昵称',
  },
  { field: 'PackageName', minWidth: 100, title: '产品名称' },
  {
    field: 'ChannelName',
    formatter: ({ row }) =>
      row.ChannelName
        ? `${row.ChannelName}${row.ChannelId ? `(${row.ChannelId})` : ''}`
        : String(row.ChannelId || '-'),
    minWidth: 140,
    showOverflow: 'tooltip',
    title: '渠道',
  },
  {
    field: 'Amount',
    formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue)),
    minWidth: 110,
    title: '申请金额',
  },
  {
    field: 'RealApplyAmount',
    formatter: ({ row }) => formatAmountFromCent(realAmountOf(row)),
    minWidth: 110,
    title: '实际金额',
  },
  {
    field: 'WaterType',
    formatter: ({ cellValue }) =>
      Number(cellValue) === 2
        ? '金额'
        : Number(cellValue) === 1
          ? '倍数'
          : String(cellValue ?? '-'),
    minWidth: 90,
    title: '流水类型',
  },
  {
    field: 'Water',
    formatter: ({ row }) => formatWater(row),
    minWidth: 100,
    title: '流水要求',
  },
  {
    field: 'HandleDesc',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 120,
    showOverflow: 'tooltip',
    title: '备注',
  },
  {
    field: 'HandlerName',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 100,
    title: '申请人',
  },
  {
    field: 'ApproveName',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 100,
    title: '审核人',
  },
];

const takeColumns: VxeTableGridOptions<RecordRow>['columns'] = [
  {
    field: 'Done',
    minWidth: 110,
    slots: { default: 'done' },
    title: '状态',
  },
  {
    field: 'CreateTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as string),
    minWidth: 160,
    title: '时间',
  },
  {
    field: 'Reason',
    formatter: ({ cellValue }) =>
      reasonMap.value[Number(cellValue)] || String(cellValue ?? '-'),
    minWidth: 110,
    title: '类型',
  },
  { field: 'OrderId', minWidth: 180, title: '订单编号' },
  {
    field: 'LoginAccount',
    minWidth: 120,
    slots: { default: 'loginAccount' },
    title: '游戏账号',
  },
  {
    field: 'PlayerId',
    minWidth: 100,
    title: '玩家ID',
  },
  {
    field: 'PlayerName',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 100,
    title: '玩家昵称',
  },
  { field: 'PackageName', minWidth: 100, title: '产品名称' },
  {
    field: 'ChannelName',
    formatter: ({ row }) =>
      row.ChannelName
        ? `${row.ChannelName}${row.ChannelId ? `(${row.ChannelId})` : ''}`
        : String(row.ChannelId || '-'),
    minWidth: 140,
    showOverflow: 'tooltip',
    title: '所属渠道',
  },
  {
    field: 'Amount',
    formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue)),
    minWidth: 110,
    title: '申请金额',
  },
  {
    field: 'RealAmount',
    formatter: ({ row }) => formatAmountFromCent(realAmountOf(row)),
    minWidth: 120,
    title: '实际扣除金额',
  },
  {
    field: 'HandleDesc',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 120,
    showOverflow: 'tooltip',
    title: '备注',
  },
  {
    field: 'HandlerName',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 100,
    title: '申请账号',
  },
  {
    field: 'ApproveName',
    formatter: ({ cellValue }) => String(cellValue || '-'),
    minWidth: 100,
    title: '审核账号',
  },
];

const gridOptions: VxeTableGridOptions<RecordRow> = {
  columns: isTake.value ? takeColumns : grantColumns,
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!canViewTable.value) {
          return { items: [], total: 0 };
        }
        const result = await fetchPlayerGoldHandleListApi(buildListQuery(page));
        const items = (result.Items || []) as unknown as RecordRow[];
        totalAmount.value = Number(result.Total?.Total || 0);
        totalRealAmount.value = Number(
          (result.Total as { TotalReal?: number } | undefined)?.TotalReal || 0,
        );
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function resetFilters() {
  filterLoginAccount.value = '';
  filterPlayerId.value = '';
  filterPlayerName.value = '';
  filterPackageId.value = undefined;
  filterChannelIds.value = undefined;
  filterOrderId.value = '';
  filterWaterType.value = 0;
  filterDone.value = [];
  filterReason.value = [];
  filterDataSearchType.value = 0;
  filterDateRange.value = createDefaultDateRange();
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchPlayerGoldHandleListApi({
      ...buildListQuery({ currentPage: 1, pageSize: 10_000 }),
      IsExp: true,
    });
    const rows = (result.Items || []) as unknown as RecordRow[];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }

    const commonStart = [
      {
        header: '状态',
        value: (row: RecordRow) =>
          doneMap.value[Number(row.Done)]?.text || String(row.Done),
      },
      {
        header: '时间',
        value: (row: RecordRow) =>
          formatOperationDateTime(row.CreateTime as string),
      },
    ];

    const columns = isTake.value
      ? [
          ...commonStart,
          {
            header: '类型',
            value: (row: RecordRow) =>
              reasonMap.value[Number(row.Reason)] || String(row.Reason),
          },
          { header: '订单编号', value: (row: RecordRow) => row.OrderId || '-' },
          {
            header: '游戏账号',
            value: (row: RecordRow) => row.LoginAccount || '-',
          },
          {
            header: '玩家ID',
            value: (row: RecordRow) => String(row.PlayerId ?? '-'),
          },
          {
            header: '玩家昵称',
            value: (row: RecordRow) => row.PlayerName || '-',
          },
          {
            header: '产品名称',
            value: (row: RecordRow) => row.PackageName || '-',
          },
          {
            header: '所属渠道',
            value: (row: RecordRow) =>
              row.ChannelName
                ? `${row.ChannelName}(${row.ChannelId || ''})`
                : String(row.ChannelId || '-'),
          },
          {
            header: '申请金额',
            value: (row: RecordRow) => formatAmountFromCent(Number(row.Amount)),
          },
          {
            header: '实际扣除金额',
            value: (row: RecordRow) => formatAmountFromCent(realAmountOf(row)),
          },
          { header: '备注', value: (row: RecordRow) => row.HandleDesc || '-' },
          {
            header: '申请账号',
            value: (row: RecordRow) => row.HandlerName || '-',
          },
          {
            header: '审核账号',
            value: (row: RecordRow) => row.ApproveName || '-',
          },
        ]
      : [
          ...commonStart,
          { header: '红利标题', value: (row: RecordRow) => row.Title || '-' },
          {
            header: '类型',
            value: (row: RecordRow) =>
              reasonMap.value[Number(row.Reason)] || String(row.Reason),
          },
          { header: '订单编号', value: (row: RecordRow) => row.OrderId || '-' },
          {
            header: '游戏账号',
            value: (row: RecordRow) => row.LoginAccount || '-',
          },
          {
            header: '玩家ID',
            value: (row: RecordRow) => String(row.PlayerId ?? '-'),
          },
          {
            header: '玩家昵称',
            value: (row: RecordRow) => row.PlayerName || '-',
          },
          {
            header: '产品名称',
            value: (row: RecordRow) => row.PackageName || '-',
          },
          {
            header: '渠道',
            value: (row: RecordRow) =>
              row.ChannelName
                ? `${row.ChannelName}(${row.ChannelId || ''})`
                : String(row.ChannelId || '-'),
          },
          {
            header: '申请金额',
            value: (row: RecordRow) => formatAmountFromCent(Number(row.Amount)),
          },
          {
            header: '实际金额',
            value: (row: RecordRow) => formatAmountFromCent(realAmountOf(row)),
          },
          {
            header: '流水类型',
            value: (row: RecordRow) =>
              Number(row.WaterType) === 2
                ? '金额'
                : Number(row.WaterType) === 1
                  ? '倍数'
                  : '-',
          },
          { header: '流水要求', value: (row: RecordRow) => formatWater(row) },
          { header: '备注', value: (row: RecordRow) => row.HandleDesc || '-' },
          {
            header: '申请人',
            value: (row: RecordRow) => row.HandlerName || '-',
          },
          {
            header: '审核人',
            value: (row: RecordRow) => row.ApproveName || '-',
          },
        ];

    exportRowsToCsv(
      rows,
      columns,
      `${isTake.value ? '扣减记录' : '发放记录'}_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          @change="normalizeLoginAccount"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerId"
          allow-clear
          placeholder="请输入玩家ID"
        >
          <template #addonBefore>玩家ID</template>
        </Input>
      </div>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerName"
          allow-clear
          placeholder="请输入玩家昵称"
        >
          <template #addonBefore>玩家昵称</template>
        </Input>
      </div>

      <Space.Compact>
        <span class="query-field-addon">所属产品</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
         
          :options="packageSelectOptions"
          show-search
          :filter-option="
            (input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
          "
          placeholder="请选择所属产品"
        />
      </Space.Compact>

      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
      </Space.Compact>

      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>

      <Space.Compact v-if="!isTake">
        <span class="query-field-addon">流水类型</span>
        <Select
          v-model:value="filterWaterType"
         
          :options="waterTypeOptions"
          placeholder="请选择流水类型"
        />
      </Space.Compact>

      <Space.Compact>
        <span class="query-field-addon">状态</span>
        <Select
          v-model:value="filterDone"
          allow-clear
         
          :max-tag-count="1"
          mode="multiple"
          :options="doneOptions"
          placeholder="请选择状态"
        />
      </Space.Compact>

      <Space.Compact>
        <span class="query-field-addon">类型</span>
        <Select
          v-model:value="filterReason"
          allow-clear
         
          :max-tag-count="1"
          mode="multiple"
          :options="reasonOptions"
          placeholder="请选择类型"
        />
      </Space.Compact>

      <Space.Compact v-if="!isTake">
        <span class="query-field-addon">数据类型</span>
        <Select
          v-model:value="filterDataSearchType"
         
          :options="dataSearchTypeOptions"
          placeholder="请选择数据类型"
        />
      </Space.Compact>

      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
      <Button
        v-if="canExport"
        :loading="exportLoading"
        type="primary"
        @click="handleExport"
      >
        导出Excel
      </Button>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
      <template #done="{ row }">
        <Tag :color="doneMap[Number(row.Done)]?.color || 'default'">
          {{ doneMap[Number(row.Done)]?.text || String(row.Done ?? '-') }}
        </Tag>
      </template>
    </Grid>
  </div>
  <div v-else class="py-8 text-center text-gray-400">
    {{ isTake ? '无扣减记录查看权限' : '无发放记录查看权限' }}
  </div>
</template>

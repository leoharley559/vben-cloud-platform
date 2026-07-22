<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Select,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerGoldHandleListApi } from '#/api/operationManage/player-gold-handle';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ChannelSelect from '#/components/global/channel-select.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'GoldRecordPanel' });

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
  PackageName?: string;
  RealApplyAmount?: number;
  Reason?: number;
  Title?: string;
  Water?: number;
  WaterAmount?: number;
  WaterType?: number;
}

const DONE_MAP: Record<number, { color: string; text: string }> = {
  1: { color: 'default', text: '已发送' },
  2: { color: 'success', text: '已完成' },
  3: { color: 'error', text: '失败' },
  4: { color: 'error', text: '红利发送失败' },
};

const REASON_MAP: Record<number, string> = {
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

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10090));
const canExport = computed(() => checkPermission(10091));

/** 与旧站 listQuery 对齐，默认昨日；Done/Reason 支持多选 join(',') */
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const filterChannelIds = ref<Array<number | string> | number | string>();
const filterOrderId = ref('');
const filterWaterType = ref<number>(0);
const filterDone = ref<Array<number | string>>([]);
const filterReason = ref<Array<number | string>>([]);
const filterDataSearchType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(1, 'day').startOf('day'),
  dayjs().subtract(1, 'day').endOf('day'),
]);

const totalAmount = ref(0);
const totalRealAmount = ref(0);
const exportLoading = ref(false);

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

const doneOptions = [
  { label: '已发送', value: 1 },
  { label: '已完成', value: 2 },
  { label: '失败', value: 3 },
  { label: '红利发送失败', value: 4 },
];

const reasonOptions = Object.entries(REASON_MAP)
  .filter(([value]) => Number(value) >= 3)
  .map(([value, label]) => ({
    label,
    value: Number(value),
  }));

function channelIdsParam() {
  const value = filterChannelIds.value;
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(',');
  }
  return value || '';
}

/** 旧站 filter-change：多选 → join(',')；空=全部 */
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
  const [begin, end] = filterDateRange.value;
  return {
    BeginTime: begin.startOf('day').unix(),
    ChannelIds: channelIdsParam(),
    DataSearchType: filterDataSearchType.value,
    Done: multiFilterParam(filterDone.value),
    EndTime: end.endOf('day').unix(),
    HandleType: 1,
    LoginAccount: filterLoginAccount.value.trim(),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value || '',
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
    Reason: multiFilterParam(filterReason.value),
    Sort: '',
    WaterType: filterWaterType.value,
  };
}

function formatWater(row: RecordRow) {
  if (Number(row.WaterType) === 2) {
    return formatAmountFromCent(Number(row.WaterAmount || 0));
  }
  return String(Number(row.Water || 0) / 100);
}

const gridOptions: VxeTableGridOptions<RecordRow> = {
  columns: [
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
        REASON_MAP[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 110,
      title: '类型',
    },
    { field: 'OrderId', minWidth: 180, title: '订单编号' },
    { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
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
      formatter: ({ cellValue }) => formatAmountFromCent(Number(cellValue)),
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
  ],
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
  filterPackageId.value = undefined;
  filterChannelIds.value = undefined;
  filterOrderId.value = '';
  filterWaterType.value = 0;
  filterDone.value = [];
  filterReason.value = [];
  filterDataSearchType.value = 0;
  filterDateRange.value = [
    dayjs().subtract(1, 'day').startOf('day'),
    dayjs().subtract(1, 'day').endOf('day'),
  ];
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
    exportRowsToCsv(
      rows,
      [
        {
          header: '状态',
          value: (row) => DONE_MAP[Number(row.Done)]?.text || String(row.Done),
        },
        {
          header: '时间',
          value: (row) => formatOperationDateTime(row.CreateTime as string),
        },
        { header: '红利标题', value: (row) => row.Title || '-' },
        {
          header: '类型',
          value: (row) => REASON_MAP[Number(row.Reason)] || String(row.Reason),
        },
        { header: '订单编号', value: (row) => row.OrderId || '-' },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: '产品名称', value: (row) => row.PackageName || '-' },
        {
          header: '渠道',
          value: (row) =>
            row.ChannelName
              ? `${row.ChannelName}(${row.ChannelId || ''})`
              : String(row.ChannelId || '-'),
        },
        {
          header: '申请金额',
          value: (row) => formatAmountFromCent(Number(row.Amount)),
        },
        {
          header: '实际金额',
          value: (row) => formatAmountFromCent(Number(row.RealApplyAmount)),
        },
        {
          header: '流水类型',
          value: (row) =>
            Number(row.WaterType) === 2
              ? '金额'
              : Number(row.WaterType) === 1
                ? '倍数'
                : '-',
        },
        { header: '流水要求', value: (row) => formatWater(row) },
        { header: '备注', value: (row) => row.HandleDesc || '-' },
        { header: '申请人', value: (row) => row.HandlerName || '-' },
        { header: '审核人', value: (row) => row.ApproveName || '-' },
      ],
      `发放记录_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <div v-if="canViewTable">
    <!-- 查询区与旧站 saveRecord.vue 对齐 -->
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="请输入"
        style="width: 220px"
        @change="normalizeLoginAccount"
      >
        <template #addonBefore>游戏账号</template>
      </Input>

      <Select
        v-model:value="filterPackageId"
        allow-clear
        class="w-44"
        :options="packageSelectOptions"
        placeholder="所属产品"
        show-search
        :filter-option="
          (input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
        "
      />

      <ChannelSelect v-model="filterChannelIds" style="width: 240px" />

      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="请输入"
        style="width: 240px"
      >
        <template #addonBefore>订单编号</template>
      </Input>

      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">流水类型</span>
        <Select
          v-model:value="filterWaterType"
          class="w-32"
          :options="waterTypeOptions"
        />
      </div>

      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">状态</span>
        <Select
          v-model:value="filterDone"
          allow-clear
          class="w-44"
          :max-tag-count="1"
          mode="multiple"
          :options="doneOptions"
          placeholder="全部"
        />
      </div>

      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">类型</span>
        <Select
          v-model:value="filterReason"
          allow-clear
          class="w-44"
          :max-tag-count="1"
          mode="multiple"
          :options="reasonOptions"
          placeholder="全部"
        />
      </div>

      <div class="flex items-center gap-1">
        <span class="whitespace-nowrap text-sm text-gray-500">数据类型</span>
        <Select
          v-model:value="filterDataSearchType"
          class="w-28"
          :options="dataSearchTypeOptions"
        />
      </div>

      <DatePicker.RangePicker v-model:value="filterDateRange" />
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

    <div class="mb-3 flex flex-wrap gap-4 text-sm text-gray-600">
      <span>
        申请金额总计：
        <span class="font-medium text-gray-900">
          {{ formatAmountFromCent(totalAmount) }}
        </span>
      </span>
      <span>
        实际金额总计：
        <span class="font-medium text-gray-900">
          {{ formatAmountFromCent(totalRealAmount) }}
        </span>
      </span>
    </div>

    <Grid>
      <template #done="{ row }">
        <Tag :color="DONE_MAP[Number(row.Done)]?.color || 'default'">
          {{ DONE_MAP[Number(row.Done)]?.text || String(row.Done ?? '-') }}
        </Tag>
      </template>
    </Grid>
  </div>
  <div v-else class="py-8 text-center text-gray-400">无发放记录查看权限</div>
</template>

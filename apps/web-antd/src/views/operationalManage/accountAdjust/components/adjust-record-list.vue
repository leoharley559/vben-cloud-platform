<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerAdjustListItem } from '#/types/player-detail';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  message,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerAdjustListApi } from '#/api/operationManage/account-adjust';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import {
  ADJUST_APPROVE_RECORD_OPTIONS,
  ADJUST_DATA_SEARCH_TYPE_OPTIONS,
  ADJUST_DONE_OPTIONS,
  ADJUST_HANDLE_TYPE_OPTIONS,
  ADJUST_REASON_OPTIONS,
  ADJUST_WATER_TYPE_INC_DEC_OPTIONS,
  formatAdjustApprove,
  formatAdjustDone,
  formatAdjustHandleType,
  formatAdjustReason,
  formatAdjustWater,
  formatAdjustWaterType,
  getAdjustApproveColor,
  getAdjustDoneColor,
  getAdjustHandleTypeColor,
  normalizeMultiFilterParam,
} from '#/utils/account-adjust';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'AdjustRecordList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10097));
const canExport = computed(() => checkPermission(10098));

const defaultRange = getYesterdayRangeSeconds();
const totalAmount = ref(0);
const exportLoading = ref(false);

const summaryItems = computed(() => [
  {
    label: '调整合计',
    value: formatAmountFromCent(totalAmount.value),
  },
]);

const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterPlayerName = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterAdminUserName = ref('');
const filterDone = ref<Array<number | string>>(['0,1,2,3,4']);
const filterHandleType = ref<number>(-1);
const filterReason = ref<number>(-1);
const filterApprove = ref<number | string>('2,3,4');
const filterHandlerName = ref('');
const filterApproveName = ref('');
const filterWaterTypeIncDec = ref<Array<number | string>>(['1,2,3,4']);
const filterDataSearchType = ref(0);
const filterCreateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const filterApproveRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

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

const packageSelectOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

function channelIdsParam() {
  return filterChannelIds.value.filter(Boolean).join(',');
}

function normalizeLoginAccount() {
  filterLoginAccount.value = filterLoginAccount.value
    .toLowerCase()
    .replaceAll(/\s/g, '');
}

function getQueryParams(page?: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterCreateRange.value || [];
  const [approveBegin, approveEnd] = filterApproveRange.value || [];
  // 置空时传空串（对齐老站 search-type-two），勿回退默认近 N 天，否则会与另一时间条件叠加成空结果
  return {
    AdminUserName: filterAdminUserName.value.trim(),
    Approve: filterApprove.value,
    ApproveBeginTime: approveBegin ? approveBegin.unix() : '',
    ApproveEndTime: approveEnd ? approveEnd.unix() : '',
    ApproveName: filterApproveName.value.trim(),
    BeginTime: begin ? begin.unix() : '',
    ChannelIds: channelIdsParam(),
    DataSearchType: filterDataSearchType.value,
    Done: normalizeMultiFilterParam(filterDone.value, '0,1,2,3,4'),
    EndTime: end ? end.unix() : '',
    HandleType: filterHandleType.value,
    HandlerName: filterHandlerName.value.trim(),
    IsApprove: 1,
    LoginAccount: filterLoginAccount.value
      .trim()
      .toLowerCase()
      .replaceAll(/\s/g, ''),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value || '',
    Page: page?.currentPage ?? 1,
    PageSize: page?.pageSize ?? 20,
    PlayerId: filterPlayerId.value.trim(),
    PlayerName: filterPlayerName.value.trim(),
    Reason: filterReason.value,
    WaterTypeIncDec: normalizeMultiFilterParam(
      filterWaterTypeIncDec.value,
      '1,2,3,4',
    ),
  };
}

function formatChannel(row: PlayerAdjustListItem) {
  if (row.ChannelName || row.ChannelId) {
    return `${row.ChannelName || '-'}${row.ChannelId ? `(${row.ChannelId})` : ''}`;
  }
  return '-';
}

const gridOptions: VxeTableGridOptions<PlayerAdjustListItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'Done',
      minWidth: 100,
      slots: { default: 'done' },
      title: '游戏状态',
    },
    {
      field: 'Reason',
      formatter: ({ cellValue }) => formatAdjustReason(cellValue),
      minWidth: 110,
      title: '类型',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'HandleType',
      minWidth: 90,
      slots: { default: 'handleType' },
      title: '调整方式',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
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
    {
      field: 'AdminUserName',
      minWidth: 110,
      slots: { default: 'adminUserName' },
      title: '代理账号',
    },
    {
      field: 'PackageName',
      formatter: ({ cellValue }) => String(cellValue || '-'),
      minWidth: 100,
      title: '所属产品',
    },
    {
      field: 'ChannelName',
      formatter: ({ row }) => formatChannel(row),
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '所属渠道',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '调整金额',
    },
    {
      field: 'HandleDesc',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '申请备注',
    },
    {
      field: 'WaterType',
      formatter: ({ row }) =>
        formatAdjustWaterType(row.HandleType, row.WaterType),
      minWidth: 120,
      title: '流水类型',
    },
    {
      field: 'Water',
      formatter: ({ row }) => formatAdjustWater(row),
      minWidth: 100,
      title: '调整流水',
    },
    { field: 'HandlerName', minWidth: 110, title: '申请账号' },
    {
      field: 'Approve',
      minWidth: 100,
      slots: { default: 'approve' },
      title: '审核状态',
    },
    { field: 'ApproveName', minWidth: 110, title: '审核账号' },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
    {
      field: 'ApproveRemark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '审核备注',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerAdjustListApi(getQueryParams(page));
        totalAmount.value = Number(result?.Total?.Total || 0);
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
  showFooter: true,
  footerMethod: () => [
    [
      '合计',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      formatAmountFromCent(totalAmount.value),
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
      '-',
    ],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function resetFilters() {
  filterOrderId.value = '';
  filterLoginAccount.value = '';
  filterPlayerId.value = '';
  filterPlayerName.value = '';
  filterPackageId.value = '';
  filterChannelIds.value = [];
  filterAdminUserName.value = '';
  filterDone.value = ['0,1,2,3,4'];
  filterHandleType.value = -1;
  filterReason.value = -1;
  filterApprove.value = '2,3,4';
  filterHandlerName.value = '';
  filterApproveName.value = '';
  filterWaterTypeIncDec.value = ['1,2,3,4'];
  filterDataSearchType.value = 0;
  filterCreateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  filterApproveRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchPlayerAdjustListApi({
      ...getQueryParams({ currentPage: 1, pageSize: 10_000 }),
      IsExp: true,
    });
    const rows = result?.Items || [];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        {
          header: '创建时间',
          value: (row) => formatDateTime(row.CreateTime),
        },
        {
          header: '游戏状态',
          value: (row) => formatAdjustDone(row.Done),
        },
        {
          header: '类型',
          value: (row) => formatAdjustReason(row.Reason),
        },
        { header: '订单编号', value: (row) => row.OrderId || '-' },
        {
          header: '调整方式',
          value: (row) => formatAdjustHandleType(row.HandleType),
        },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        {
          header: '玩家ID',
          value: (row) => String(row.PlayerId ?? '-'),
        },
        {
          header: '玩家昵称',
          value: (row) => row.PlayerName || '-',
        },
        { header: '代理账号', value: (row) => row.AdminUserName || '-' },
        { header: '所属产品', value: (row) => row.PackageName || '-' },
        { header: '所属渠道', value: (row) => formatChannel(row) },
        {
          header: '调整金额',
          value: (row) => formatAmountFromCent(row.Amount),
        },
        { header: '申请备注', value: (row) => row.HandleDesc || '-' },
        {
          header: '流水类型',
          value: (row) => formatAdjustWaterType(row.HandleType, row.WaterType),
        },
        {
          header: '调整流水',
          value: (row) => formatAdjustWater(row),
        },
        { header: '申请账号', value: (row) => row.HandlerName || '-' },
        {
          header: '审核状态',
          value: (row) => formatAdjustApprove(row.Approve),
        },
        { header: '审核账号', value: (row) => row.ApproveName || '-' },
        {
          header: '审核时间',
          value: (row) => formatDateTime(row.ApproveTime),
        },
        { header: '审核备注', value: (row) => row.ApproveRemark || '-' },
      ],
      `调整记录_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          placeholder="请输入订单编号"
        >
          <template #addonBefore>订单编号</template>
        </Input>
      </div>
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
        <span class="query-field-addon">产品名称</span>
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
          placeholder="请选择产品名称"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterAdminUserName"
          allow-clear
          placeholder="请输入代理账号"
        >
          <template #addonBefore>代理账号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">游戏状态</span>
        <Select
          v-model:value="filterDone"
          allow-clear
          mode="multiple"
          :max-tag-count="1"
          :options="ADJUST_DONE_OPTIONS"
          placeholder="请选择游戏状态"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">调整方式</span>
        <Select
          v-model:value="filterHandleType"
          :options="ADJUST_HANDLE_TYPE_OPTIONS"
          placeholder="请选择调整方式"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">调整类型</span>
        <Select
          v-model:value="filterReason"
          :options="ADJUST_REASON_OPTIONS"
          placeholder="请选择调整类型"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">审核状态</span>
        <Select
          v-model:value="filterApprove"
          :options="ADJUST_APPROVE_RECORD_OPTIONS"
          placeholder="请选择审核状态"
        />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterHandlerName"
          allow-clear
          placeholder="请输入申请账号"
        >
          <template #addonBefore>申请账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterApproveName"
          allow-clear
          placeholder="请输入审核账号"
        >
          <template #addonBefore>审核账号</template>
        </Input>
      </div>
      <Space.Compact>
        <span class="query-field-addon">流水类型</span>
        <Select
          v-model:value="filterWaterTypeIncDec"
          allow-clear
          mode="multiple"
          :max-tag-count="1"
          :options="ADJUST_WATER_TYPE_INC_DEC_OPTIONS"
          placeholder="请选择流水类型"
        />
      </Space.Compact>
      <Select
        v-model:value="filterDataSearchType"
        :options="ADJUST_DATA_SEARCH_TYPE_OPTIONS"
      />
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterCreateRange" label="创建时间" />
        </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterApproveRange" label="审核时间" />
        </div>
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
      <Button @click="resetFilters">重置</Button>
      <Button
        v-if="canExport"
        :loading="exportLoading"
        type="primary"
        @click="handleExport"
      >
        导出
      </Button>
        </div>
    </div>
  </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #adminUserName="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :username="row.AdminUserName"
        />
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #handleType="{ row }">
        <span :style="{ color: getAdjustHandleTypeColor(row.HandleType) }">
          {{ formatAdjustHandleType(row.HandleType) }}
        </span>
      </template>
      <template #done="{ row }">
        <Tag :color="getAdjustDoneColor(row.Done)">
          {{ formatAdjustDone(row.Done) }}
        </Tag>
      </template>
      <template #approve="{ row }">
        <Tag :color="getAdjustApproveColor(row.Approve)">
          {{ formatAdjustApprove(row.Approve) }}
        </Tag>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10097 才能查看调整记录"
    title="无权限"
  />
</template>

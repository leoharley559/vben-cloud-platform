<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BonusRecordListItem } from '#/types/bonus-audit';

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

import { fetchBonusRecordListApi } from '#/api/operationManage/bonus-audit';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import {
  ACTIVITY_TYPE_OPTIONS,
  BONUS_ORDER_STATUS_OPTIONS,
  BONUS_TYPE_OPTIONS,
  IS_WATER_OPTIONS,
  OPERATOR_ACCOUNT_TYPE_OPTIONS,
  OPERATOR_REMARK_TYPE_OPTIONS,
  PAGE_TYPE_OPTIONS,
  SEND_TYPE_OPTIONS,
  VIP_LEVEL_OPTIONS,
  WATER_TYPE_FILTER_OPTIONS,
  formatActivityType,
  formatBonusAccount,
  formatBonusAmount,
  formatBonusNote,
  formatBonusSendType,
  formatBonusStatus,
  formatBonusType,
  formatBonusWaterType,
  formatBaseTurnover,
  formatIsWater,
  getBonusStatusColor,
} from '#/utils/bonus-reward';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  PLAYER_STATUS_OPTIONS,
  formatPlayerStatus,
} from '#/utils/player-status';

defineOptions({ name: 'BonusRecordList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10127));
const canExport = computed(() => checkPermission(11967));

const defaultRange = getYesterdayRangeSeconds();
const exportLoading = ref(false);
const sumBonus = ref(0);

const summaryItems = computed(() => [
  {
    label: '红利总计',
    value: formatAmountFromCent(sumBonus.value),
    valueClass: 'text-red-500',
  },
]);

const filterLoginAccount = ref('');
const filterPlayerStatus = ref(-1);
const filterOrderId = ref('');
const filterOperatorAccountType = ref(1);
const filterOperatorAccount = ref('');
const filterOperatorRemarkType = ref(1);
const filterOperatorRemark = ref('');
const filterBonusTitle = ref('');
const filterUsername = ref('');
const filterIsWater = ref(-1);
const filterStatus = ref(-1);
const filterChannelIds = ref<Array<number | string>>([]);
const filterWaterType = ref(0);
const filterPageTitle = ref('');
const filterActivityType = ref(-1);
const filterPageType = ref(-1);
const filterSendType = ref(-1);
const filterVipLevel = ref(-1);
const filterBonusTypes = ref<Array<number | string>>([]);
const filterPackageId = ref<number | string>('');
const filterApplyDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const filterFinishDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

const playerStatusOptions = [
  { label: '全部', value: -1 },
  ...PLAYER_STATUS_OPTIONS,
];

const packageSelectOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);

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

function normalizeLoginAccount() {
  filterLoginAccount.value = filterLoginAccount.value
    .toLowerCase()
    .replaceAll(/\s/g, '');
}

function getQueryParams() {
  const [applyBegin, applyEnd] = filterApplyDateRange.value || [];
  const finishRange = filterFinishDateRange.value || [];
  const [finishBegin, finishEnd] = finishRange;
  return {
    ActivityType: filterActivityType.value,
    ApplyBeginTime: applyBegin ? applyBegin.unix() : '',
    ApplyEndTime: applyEnd ? applyEnd.unix() : '',
    BonusTitle: filterBonusTitle.value.trim(),
    BonusType: filterBonusTypes.value,
    ChannelIds: filterChannelIds.value,
    FinishBeginTime: finishBegin ? finishBegin.unix() : '',
    FinishEndTime: finishEnd ? finishEnd.unix() : '',
    IsExp: false,
    IsWater: filterIsWater.value,
    LoginAccount: filterLoginAccount.value
      .trim()
      .toLowerCase()
      .replaceAll(/\s/g, ''),
    OperatorAccount: filterOperatorAccount.value.trim(),
    OperatorAccountType: filterOperatorAccountType.value,
    OperatorRemark: filterOperatorRemark.value.trim(),
    OperatorRemarkType: filterOperatorRemarkType.value,
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value || '',
    PageTitle: filterPageTitle.value.trim(),
    PageType: filterPageType.value,
    PlayerStatus: filterPlayerStatus.value,
    SendType: filterSendType.value,
    Status: filterStatus.value,
    Username: filterUsername.value.trim(),
    VipLevel: filterVipLevel.value,
    WaterType: filterWaterType.value,
  };
}

const exportColumns = [
  { header: '订单号', value: (row: BonusRecordListItem) => row.OrderId || '-' },
  {
    header: '游戏账号',
    value: (row: BonusRecordListItem) =>
      String(row.Account || row.LoginAccount || '-'),
  },
  {
    header: '玩家状态',
    value: (row: BonusRecordListItem) => formatPlayerStatus(row.PlayerStatus),
  },
  {
    header: '所属产品',
    value: (row: BonusRecordListItem) => row.PackageName || '-',
  },
  {
    header: '注册时间',
    value: (row: BonusRecordListItem) => formatDateTime(row.RegisterTime),
  },
  {
    header: '首存时间',
    value: (row: BonusRecordListItem) => formatDateTime(row.FirstPayTime),
  },
  {
    header: '代理账号',
    value: (row: BonusRecordListItem) => row.Username || '-',
  },
  {
    header: '会员等级',
    value: (row: BonusRecordListItem) =>
      row.VipLevel === undefined || row.VipLevel === null || row.VipLevel === ''
        ? '-'
        : `VIP${row.VipLevel}`,
  },
  {
    header: '红利类型',
    value: (row: BonusRecordListItem) =>
      formatBonusType(row.BonusType ?? row.Reason),
  },
  {
    header: '红利标题',
    value: (row: BonusRecordListItem) => row.BonusTitle || row.Title || '-',
  },
  {
    header: '活动类型',
    value: (row: BonusRecordListItem) => formatActivityType(row.ActivityType),
  },
  {
    header: '活动分页',
    value: (row: BonusRecordListItem) => row.PageTitle || '-',
  },
  {
    header: '发放方式',
    value: (row: BonusRecordListItem) => formatBonusSendType(row.SendType),
  },
  {
    header: '是否需要流水',
    value: (row: BonusRecordListItem) => formatIsWater(row.IsWater),
  },
  {
    header: '流水类型',
    value: (row: BonusRecordListItem) => formatBonusWaterType(row.WaterType),
  },
  {
    header: '彩金流水',
    value: (row: BonusRecordListItem) => String(row.WaterReward ?? '-'),
  },
  {
    header: '本金流水',
    value: (row: BonusRecordListItem) => String(formatBaseTurnover(row)),
  },
  {
    header: '红利金额',
    value: (row: BonusRecordListItem) => formatBonusAmount(row),
  },
  {
    header: '申请时间',
    value: (row: BonusRecordListItem) =>
      formatDateTime(row.CreateTime ?? row.ApplyTime),
  },
  {
    header: '审核时间',
    value: (row: BonusRecordListItem) => formatDateTime(row.FinishTime),
  },
  {
    header: '申请人',
    value: (row: BonusRecordListItem) => formatBonusAccount(row.ApplyAccount),
  },
  {
    header: '审核人',
    value: (row: BonusRecordListItem) => formatBonusAccount(row.Operator),
  },
  {
    header: '申请备注',
    value: (row: BonusRecordListItem) =>
      formatBonusNote(row.ApplyNote, row.Operator),
  },
  {
    header: '审核备注',
    value: (row: BonusRecordListItem) =>
      formatBonusNote(row.ReviewNote, row.Operator),
  },
  {
    header: '状态',
    value: (row: BonusRecordListItem) => formatBonusStatus(row.Status),
  },
];

const gridOptions: VxeTableGridOptions<BonusRecordListItem> = {
  columns: [
    {
      field: 'OrderId',
      minWidth: 170,
      showOverflow: 'tooltip',
      title: '订单号',
    },
    {
      field: 'Account',
      minWidth: 150,
      slots: { default: 'loginAccount' },
      title: '游戏账号(状态)',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'RegisterTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '注册时间',
    },
    {
      field: 'FirstPayTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '首存时间',
    },
    { field: 'Username', minWidth: 120, slots: { default: 'username' }, title: '代理账号' },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP${cellValue}`,
      minWidth: 90,
      title: '会员等级',
    },
    {
      field: 'BonusType',
      formatter: ({ cellValue, row }) =>
        formatBonusType(cellValue ?? row.Reason),
      minWidth: 110,
      title: '红利类型',
    },
    {
      field: 'BonusTitle',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '红利标题',
    },
    {
      field: 'ActivityType',
      formatter: ({ cellValue }) => formatActivityType(cellValue),
      minWidth: 110,
      title: '活动类型',
    },
    {
      field: 'PageTitle',
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '活动分页',
    },
    {
      field: 'SendType',
      formatter: ({ cellValue }) => formatBonusSendType(cellValue),
      minWidth: 100,
      title: '发放方式',
    },
    {
      field: 'IsWater',
      formatter: ({ cellValue }) => formatIsWater(cellValue),
      minWidth: 100,
      title: '是否需要流水',
    },
    {
      field: 'WaterType',
      formatter: ({ cellValue }) => formatBonusWaterType(cellValue),
      minWidth: 100,
      title: '流水类型',
    },
    { field: 'WaterReward', minWidth: 100, title: '彩金流水' },
    {
      field: 'Draw',
      formatter: ({ row }) => String(formatBaseTurnover(row)),
      minWidth: 100,
      title: '本金流水',
    },
    {
      field: 'Bonus',
      formatter: ({ row }) => formatBonusAmount(row),
      minWidth: 110,
      title: '红利金额',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue, row }) =>
        formatDateTime(cellValue ?? row.ApplyTime),
      minWidth: 170,
      title: '申请时间',
    },
    {
      field: 'FinishTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
    {
      field: 'Operator',
      formatter: ({ row }) => formatBonusAccount(row.Operator),
      minWidth: 100,
      title: '审核人',
    },
    {
      field: 'ApplyNote',
      formatter: ({ row }) => formatBonusNote(row.ApplyNote, row.Operator),
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '申请备注',
    },
    {
      field: 'ReviewNote',
      formatter: ({ row }) => formatBonusNote(row.ReviewNote, row.Operator),
      minWidth: 120,
      showOverflow: 'tooltip',
      title: '审核备注',
    },
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchBonusRecordListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        sumBonus.value = Number(result?.Total?.SumBonus || 0);
        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function resetFilters() {
  filterLoginAccount.value = '';
  filterPlayerStatus.value = -1;
  filterOrderId.value = '';
  filterOperatorAccountType.value = 1;
  filterOperatorAccount.value = '';
  filterOperatorRemarkType.value = 1;
  filterOperatorRemark.value = '';
  filterBonusTitle.value = '';
  filterUsername.value = '';
  filterIsWater.value = -1;
  filterStatus.value = -1;
  filterChannelIds.value = [];
  filterWaterType.value = 0;
  filterPageTitle.value = '';
  filterActivityType.value = -1;
  filterPageType.value = -1;
  filterSendType.value = -1;
  filterVipLevel.value = -1;
  filterBonusTypes.value = [];
  filterPackageId.value = '';
  filterApplyDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  filterFinishDateRange.value = null;
  gridApi.reload();
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchBonusRecordListApi({
      ...getQueryParams(),
      IsExp: true,
      Page: 1,
      PageSize: 10000,
    });
    const rows = result?.Items || [];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      exportColumns,
      `红利记录_${dayjs().format('YYYYMMDDHHmmss')}`,
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          style="width: 200px"
          @change="normalizeLoginAccount"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <Select
        v-model:value="filterPlayerStatus"
        :options="playerStatusOptions"
        style="width: 120px"
      />
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          style="width: 200px"
          placeholder="请输入订单号"
        >
          <template #addonBefore>订单号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOperatorAccount"
          allow-clear
          style="width: 280px"
          placeholder="请输入账号"
        >
          <template #addonBefore>
            <Select
              v-model:value="filterOperatorAccountType"
              :bordered="false"
              :options="OPERATOR_ACCOUNT_TYPE_OPTIONS"
              style="width: 90px"
            />
          </template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterOperatorRemark"
          allow-clear
          style="width: 300px"
          placeholder="请输入备注"
        >
          <template #addonBefore>
            <Select
              v-model:value="filterOperatorRemarkType"
              :bordered="false"
              :options="OPERATOR_REMARK_TYPE_OPTIONS"
              style="width: 90px"
            />
          </template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterBonusTitle"
          allow-clear
          style="width: 180px"
          placeholder="请输入红利标题"
        >
          <template #addonBefore>红利标题</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterUsername"
          allow-clear
          style="width: 180px"
          placeholder="请输入代理账号"
        >
          <template #addonBefore>代理账号</template>
        </Input>
      </div>
      <Select
        v-model:value="filterIsWater"
        :options="IS_WATER_OPTIONS"
        style="width: 120px"
      />
      <Select
        v-model:value="filterStatus"
        :options="BONUS_ORDER_STATUS_OPTIONS"
        style="width: 120px"
      />
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model="filterChannelIds" style="width: 220px" placeholder="请输入渠道号" />
      </Space.Compact>
      <Select
        v-model:value="filterWaterType"
        :options="WATER_TYPE_FILTER_OPTIONS"
        style="width: 120px"
      />
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPageTitle"
          allow-clear
          style="width: 180px"
          placeholder="请输入活动分页"
        >
          <template #addonBefore>活动分页</template>
        </Input>
      </div>
      <Select
        v-model:value="filterActivityType"
        :options="ACTIVITY_TYPE_OPTIONS"
        style="width: 140px"
      />
      <Select
        v-model:value="filterPageType"
        :options="PAGE_TYPE_OPTIONS"
        style="width: 120px"
      />
      <Select
        v-model:value="filterSendType"
        :options="SEND_TYPE_OPTIONS"
        style="width: 120px"
      />
      <Space.Compact>
        <span class="query-field-addon">产品名称</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
          :options="packageSelectOptions"
          style="width: 160px"
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
      <Select
        v-model:value="filterVipLevel"
        :options="VIP_LEVEL_OPTIONS"
        style="width: 100px"
      />
      <Space.Compact>
        <span class="query-field-addon">红利类型</span>
        <Select
          v-model:value="filterBonusTypes"
          allow-clear
          mode="multiple"
          :max-tag-count="1"
          :options="BONUS_TYPE_OPTIONS"
          style="width: 180px"
          placeholder="请选择红利类型"
        />
      </Space.Compact>
      <QueryDatetimeRangePicker v-model="filterApplyDateRange" label="申请时间" />
      <QueryDatetimeRangePicker v-model="filterFinishDateRange" label="审核时间" />
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
      <Button @click="resetFilters">重置</Button>
      <Button v-if="canExport" :loading="exportLoading" @click="handleExport">
        导出 CSV
      </Button>
    </div>

    <SummaryCards :items="summaryItems" />

    <Grid>
      <template #username="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :username="row.Username"
        />
      </template>
      <template #loginAccount="{ row }">
        <div>
          <PlayerAccountLink
            :login-account="String(row.Account || row.LoginAccount || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
          <div class="mt-1">
            <PlayerStatusTag :status="row.PlayerStatus" hide-normal />
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <Tag :color="getBonusStatusColor(row.Status)">
          {{ formatBonusStatus(row.Status) }}
        </Tag>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10127 才能查看红利记录"
    title="无权限"
  />
</template>

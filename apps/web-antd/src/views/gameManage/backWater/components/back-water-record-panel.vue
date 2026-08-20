<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportBackWaterRecordApi,
  fetchBackWaterOrderDetailsApi,
  fetchBackWaterRecordApi,
  fetchBackWaterRecordDetailApi,
  fetchBackWaterSchemesApi,
} from '#/api/gameManage/back-water';
import { fetchPlayerLevelListApi } from '#/api/operationManage/player-level';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import SummaryCards from '#/components/global/summary-cards.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { useOperationOptions } from '#/composables/use-operation-options';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  formatGameName,
  formatPercentFromStorage,
  formatVenueName,
} from '#/utils/game-config';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'BackWaterRecordPanel' });

const props = defineProps<{ playerId?: string }>();

type RecordType = 'detail' | 'summary';
interface BackWaterRow {
  AdminName?: string;
  AwardDesc?: string;
  AwardStatus?: number;
  AwardTime?: number | string;
  AwardType?: number;
  BackWater?: number;
  ChannelId?: number | string;
  ChannelName?: string;
  ConfigName?: string;
  CreateTime?: number | string;
  DataFlag?: number | string;
  DataType?: number | string;
  Date?: number | string;
  DaysDelay?: number;
  DaysOfCycle?: number;
  DayOfWeeks?: string;
  GameType?: number | string;
  LevelName?: string;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  Rate?: number;
  RebateMode?: number;
  Reject?: number;
  ReviewAdminName?: string;
  ReviewDesc?: string;
  ReviewStatus?: number;
  ReviewTime?: number | string;
  SubGameId?: number | string;
  VipLevel?: number;
  Water?: number;
}

const { checkPermission } = useCloudPermission();
const { memberTypeOptions, packageOptions } = useOperationOptions();
const { ensureGameConfig, gameConfig } = useGameConfig();
const activeType = ref<RecordType>(
  checkPermission(11_077) ? 'summary' : 'detail',
);
const schemes = ref<Array<Record<string, unknown>>>([]);
const levels = ref<Array<Record<string, unknown>>>([]);
const totals = reactive({ backWater: 0, sent: 0, turnover: 0, unsent: 0 });
const generationRange = ref<[Dayjs, Dayjs]>();
const awardRange = ref<[Dayjs, Dayjs]>([
  dayjs().startOf('day'),
  dayjs().endOf('day'),
]);
const filters = reactive({
  AdminName: '',
  AwardStatus: -1,
  AwardType: -1,
  ChannelIds: [] as Array<number | string>,
  ConfigId: -1 as number | string,
  DataSearchType: 0,
  GameType: [] as Array<number | string>,
  LevelId: -1 as number | string,
  LoginAccount: '',
  OrderId: '',
  PackId: '' as number | string,
  RebateMode: -1,
  VipLevel: -1,
});
const detailsVisible = ref(false);
const detailsLoading = ref(false);
const orderDetails = ref<BackWaterRow[]>([]);
const detailAccount = ref('');
const detailSum = ref(0);
const exportVisible = ref(false);
const exportLoading = ref(false);
const exportCode = ref('');

const canSummary = computed(() => checkPermission(11_077));
const canDetail = computed(() => checkPermission(11_078));
const canSummaryList = computed(() => checkPermission(11_079));
const canSummaryExport = computed(() => checkPermission(11_080));
const canOrderDetail = computed(() => checkPermission(11_081));
const canDetailList = computed(() => checkPermission(11_082));
const canDetailExport = computed(() => checkPermission(11_083));
const canExport = computed(() =>
  activeType.value === 'summary'
    ? canSummaryExport.value
    : canDetailExport.value,
);

const summaryItems = computed(() => {
  const items: Array<{
    label: string;
    value: number | string;
    valueClass?: string;
  }> = [];
  if (activeType.value === 'summary') {
    items.push(
      {
        label: '已发返水总计',
        value: formatAmountFromCent(totals.sent),
      },
      {
        label: '待发返水总计',
        value: formatAmountFromCent(totals.unsent),
      },
    );
  }
  if (activeType.value === 'detail') {
    items.push({
      label: '流水总计',
      value: formatAmountFromCent(totals.turnover),
    });
  }
  items.push({
    label: '返水金额总计',
    value: formatAmountFromCent(totals.backWater),
  });
  return items;
});

const detailSummaryItems = computed(() => [
  { label: '游戏账号', value: detailAccount.value },
  {
    label: '返水总计',
    value: formatAmountFromCent(detailSum.value),
  },
]);

const packageSelectOptions = computed(() =>
  packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
);
const schemeOptions = computed(() => [
  { label: '全部方案', value: -1 },
  ...schemes.value.map((item) => ({
    label: String(item.Name || item.Id),
    value: item.Id as number | string,
  })),
]);
const levelOptions = computed(() => [
  { label: '全部层级', value: -1 },
  ...levels.value.map((item) => ({
    label: String(item.LevelName || item.Name || item.Id),
    value: item.Id as number | string,
  })),
]);
const vipOptions = computed(() => [
  { label: '全部 VIP', value: -1 },
  ...Array.from({ length: 11 }, (_, index) => ({
    label: `VIP${index}`,
    value: index,
  })),
]);
const venueOptions = computed(() =>
  Object.entries(gameConfig.value.platformGameType).map(([value]) => ({
    label: formatVenueName(value, gameConfig.value),
    value,
  })),
);

function cycleText(row: BackWaterRow) {
  if (Number(row.RebateMode) === 1) {
    return `按天：${row.DaysOfCycle || 0}+${row.DaysDelay || 0}`;
  }
  if (Number(row.RebateMode) === 2) {
    return `周结：星期${row.DayOfWeeks || '-'}`;
  }
  return '日结';
}

function awardStatusText(row: BackWaterRow) {
  if (Number(row.Reject) === 1) return '成功';
  if (Number(row.Reject) === 3) return '失败';
  if (Number(row.ReviewStatus) === 2) return '失败';
  if (String(row.ReviewAdminName || '')) return '成功';
  if (Number(row.AwardStatus) === 0) return '待发放';
  if (Number(row.AwardStatus) === 1) return '成功';
  if (Number(row.AwardStatus) === 2) return '失败';
  return String(row.AwardStatus ?? '-');
}

function awardTypeText(row: BackWaterRow) {
  const reject = Number(row.Reject);
  if (reject === 1 || reject === 2 || reject === 3) return '手动';
  if (Number(row.AwardType) === 0) return '自动';
  if (Number(row.AwardType) === 1) return '手动';
  if (Number(row.AwardType) === -1) return '全部';
  return String(row.AwardType ?? '-');
}

function queryParams(page: { currentPage: number; pageSize: number }) {
  const common = {
    ChannelIds: filters.ChannelIds.join(','),
    ConfigId: filters.ConfigId,
    DataSearchType: filters.DataSearchType,
    LevelId: filters.LevelId,
    LoginAccount: filters.LoginAccount.trim().toLowerCase(),
    PackId: filters.PackId,
    Page: page.currentPage,
    PageSize: page.pageSize,
    PlayerId: props.playerId || '',
    RebateMode: filters.RebateMode,
    VipLevel: filters.VipLevel,
  };
  return activeType.value === 'summary'
    ? {
        ...common,
        AdminName: filters.AdminName.trim(),
        AwardStatus: filters.AwardStatus,
        AwardTimeBegin: awardRange.value?.[0].startOf('day').unix() || '',
        AwardTimeEnd: awardRange.value?.[1].endOf('day').unix() || '',
        AwardType: filters.AwardType,
        BeginTime: generationRange.value?.[0].startOf('day').unix() || '',
        EndTime: generationRange.value?.[1].endOf('day').unix() || '',
        OrderId: filters.OrderId.trim(),
        Reject: -1,
      }
    : {
        ...common,
        BeginTime: awardRange.value?.[0].startOf('day').unix() || '',
        EndTime: awardRange.value?.[1].endOf('day').unix() || '',
        GameType: filters.GameType.join(','),
      };
}

const summaryColumns: VxeTableGridOptions<BackWaterRow>['columns'] = [
  { field: 'OrderId', minWidth: 190, title: '订单号' },
  {
    field: 'LoginAccount',
    minWidth: 120,
    slots: { default: 'loginAccount' },
    title: '游戏账号',
  },
  {
    field: 'VipLevel',
    formatter: ({ cellValue }) => `VIP${cellValue ?? '-'}`,
    width: 90,
    title: 'VIP 等级',
  },
  { field: 'LevelName', minWidth: 110, title: '玩家层级' },
  {
    field: 'AdminName',
    minWidth: 110,
    slots: { default: 'adminName' },
    title: '代理账号',
  },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  {
    field: 'ChannelName',
    formatter: ({ row }) =>
      `${row.ChannelName || '-'}(${row.ChannelId || '-'})`,
    minWidth: 140,
    title: '所属渠道',
  },
  { field: 'ConfigName', minWidth: 120, title: '返水方案' },
  {
    field: 'RebateMode',
    formatter: ({ row }) => cycleText(row),
    minWidth: 130,
    title: '结算周期',
  },
  {
    field: 'BackWater',
    slots: { default: 'backWater' },
    minWidth: 110,
    title: '返水金额',
  },
  {
    field: 'CreateTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string),
    minWidth: 170,
    title: '生成时间',
  },
  {
    field: 'AwardTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string),
    minWidth: 170,
    title: '发放时间',
  },
  {
    field: 'AwardType',
    formatter: ({ row }) => awardTypeText(row),
    width: 90,
    title: '发放类型',
  },
  {
    field: 'AwardStatus',
    slots: { default: 'awardStatus' },
    width: 100,
    title: '返水状态',
  },
  { field: 'ReviewAdminName', minWidth: 110, title: '审核账号' },
  {
    field: 'ReviewTime',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string),
    minWidth: 170,
    title: '审核时间',
  },
  { field: 'AwardDesc', minWidth: 160, title: '审核备注' },
  {
    field: 'ReviewStatus',
    formatter: ({ cellValue }) =>
      Number(cellValue) === 0 ? '待审核' : '已审核',
    width: 100,
    title: '审核状态',
  },
];

const detailColumns: VxeTableGridOptions<BackWaterRow>['columns'] = [
  {
    field: 'Date',
    formatter: ({ cellValue }) =>
      formatOperationDateTime(cellValue as number | string).split(' ')[0] ||
      '-',
    minWidth: 130,
    title: '游戏时间',
  },
  {
    field: 'LoginAccount',
    minWidth: 120,
    slots: { default: 'loginAccount' },
    title: '游戏账号',
  },
  {
    field: 'VipLevel',
    formatter: ({ cellValue }) => `VIP${cellValue ?? '-'}`,
    width: 90,
    title: 'VIP 等级',
  },
  { field: 'LevelName', minWidth: 110, title: '玩家层级' },
  { field: 'PackageName', minWidth: 120, title: '所属产品' },
  {
    field: 'ChannelName',
    formatter: ({ row }) =>
      `${row.ChannelName || '-'}(${row.ChannelId || '-'})`,
    minWidth: 140,
    title: '所属渠道',
  },
  {
    field: 'GameType',
    formatter: ({ cellValue }) =>
      formatVenueName(cellValue as number | string, gameConfig.value),
    minWidth: 120,
    title: '场馆',
  },
  {
    field: 'SubGameId',
    formatter: ({ cellValue }) =>
      formatGameName(cellValue as number | string, gameConfig.value.games),
    minWidth: 130,
    title: '游戏',
  },
  { field: 'ConfigName', minWidth: 120, title: '返水方案' },
  {
    field: 'RebateMode',
    formatter: ({ row }) => cycleText(row),
    minWidth: 130,
    title: '结算周期',
  },
  {
    field: 'Water',
    formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
    minWidth: 110,
    title: '流水',
  },
  {
    field: 'Rate',
    formatter: ({ cellValue }) => `${formatPercentFromStorage(cellValue)}%`,
    width: 100,
    title: '返水比例',
  },
  {
    field: 'BackWater',
    formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
    minWidth: 110,
    title: '返水金额',
  },
];

const gridOptions: VxeTableGridOptions<BackWaterRow> = {
  columns: summaryColumns,
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const allowed =
          activeType.value === 'summary'
            ? canSummaryList.value
            : canDetailList.value;
        if (!allowed) return { items: [], total: 0 };
        const params = queryParams(page);
        const result =
          activeType.value === 'summary'
            ? await fetchBackWaterRecordApi(params)
            : await fetchBackWaterRecordDetailApi(params);
        totals.sent = Number(result.Sum || 0);
        totals.unsent = Number(result.UnSum || 0);
        totals.backWater = Number(
          result.SumBackWater ?? result.Sum ?? result.Total ?? 0,
        );
        totals.turnover = Number(result.SumValidWater || 0);
        const items = (result.Items || []) as BackWaterRow[];
        return {
          items,
          total: Number(
            result.Pagination?.MaxCount ?? result.Total ?? items.length,
          ),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function switchType(type: RecordType) {
  activeType.value = type;
  gridApi.setGridOptions({
    columns: type === 'summary' ? summaryColumns : detailColumns,
  });
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

async function search() {
  await gridApi.grid?.setCurrentPage?.(1);
  await gridApi.query();
}

function reset() {
  Object.assign(filters, {
    AdminName: '',
    AwardStatus: -1,
    AwardType: -1,
    ChannelIds: [],
    ConfigId: -1,
    DataSearchType: 0,
    GameType: [],
    LevelId: -1,
    LoginAccount: '',
    OrderId: '',
    PackId: '',
    RebateMode: -1,
    VipLevel: -1,
  });
  generationRange.value = undefined;
  awardRange.value = [dayjs().startOf('day'), dayjs().endOf('day')];
  void search();
}

async function openOrderDetails(row: BackWaterRow) {
  detailsVisible.value = true;
  detailsLoading.value = true;
  detailAccount.value = String(row.LoginAccount || '');
  try {
    const result = await fetchBackWaterOrderDetailsApi({
      DataFlag: row.DataFlag,
      DataType: row.DataType,
      PlayerId: row.PlayerId,
      Time: row.Date,
    });
    orderDetails.value = (result || []) as BackWaterRow[];
    detailSum.value = orderDetails.value.reduce(
      (sum, item) => sum + Number(item.BackWater || 0),
      0,
    );
  } finally {
    detailsLoading.value = false;
  }
}

function buildExportQuery() {
  const {
    Page: _page,
    PageSize: _size,
    ...rest
  } = queryParams({
    currentPage: 1,
    pageSize: 20,
  });
  return rest;
}

function requestExport() {
  const rows =
    (gridApi.grid?.getTableData?.()?.fullData as BackWaterRow[] | undefined) ||
    [];
  if (rows.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  exportCode.value = '';
  exportVisible.value = true;
}

async function submitExport() {
  if (!/^\d{6}$/.test(exportCode.value)) {
    message.warning('请输入 6 位 Google 验证码');
    return;
  }
  exportLoading.value = true;
  try {
    const result = await exportBackWaterRecordApi(activeType.value, {
      ...buildExportQuery(),
      GoogleCode: exportCode.value,
    });
    exportVisible.value = false;
    if (result.Id && Number(result.Status) === 0) {
      message.success('导出任务已创建，请到导出管理查看');
    } else {
      message.warning(String(result.Remark || '导出任务创建失败'));
    }
  } finally {
    exportLoading.value = false;
  }
}

onMounted(async () => {
  await ensureGameConfig();
  const [schemeResult, levelResult] = await Promise.all([
    fetchBackWaterSchemesApi(),
    fetchPlayerLevelListApi({ Page: 1, PageSize: 999 }),
  ]);
  schemes.value = schemeResult || [];
  levels.value = levelResult.Items || [];
});
</script>

<template>
  <div>
    <div class="mb-3">
      <Radio.Group
        :value="activeType"
        button-style="solid"
        @change="(event) => switchType(event.target.value)"
      >
        <Radio.Button v-if="canSummary" value="summary">统计数据</Radio.Button>
        <Radio.Button v-if="canDetail" value="detail">明细数据</Radio.Button>
      </Radio.Group>
    </div>

    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <Space.Compact v-if="activeType === 'summary'">
          <span class="query-field-addon">订单号</span>
          <Input
            v-model:value="filters.OrderId"
            allow-clear
            placeholder="请输入订单号"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">游戏账号</span>
          <Input
            v-model:value="filters.LoginAccount"
            allow-clear
            placeholder="请输入游戏账号"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">VIP</span>
          <Select v-model:value="filters.VipLevel" :options="vipOptions" />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">层级</span>
          <Select
            v-model:value="filters.LevelId"
            :options="levelOptions"
            show-search
          />
        </Space.Compact>
        <Space.Compact v-if="activeType === 'summary'">
          <span class="query-field-addon">代理账号</span>
          <Input
            v-model:value="filters.AdminName"
            allow-clear
            placeholder="请输入代理账号"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">产品</span>
          <Select
            v-model:value="filters.PackId"
            :options="packageSelectOptions"
            placeholder="请选择产品"
            show-search
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">渠道号</span>
          <ChannelSelect
            v-model="filters.ChannelIds"
            placeholder="请输入渠道号"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">会员类型</span>
          <Select
            v-model:value="filters.DataSearchType"
            :options="memberTypeOptions"
          />
        </Space.Compact>
        <Space.Compact v-if="activeType === 'detail'">
          <span class="query-field-addon">场馆</span>
          <Select
            v-model:value="filters.GameType"
            mode="multiple"
            :options="venueOptions"
            placeholder="请选择场馆"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">方案</span>
          <Select v-model:value="filters.ConfigId" :options="schemeOptions" />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">周期</span>
          <Select
            v-model:value="filters.RebateMode"
            :options="[
              { label: '全部周期', value: -1 },
              { label: '日结', value: 0 },
              { label: '按天', value: 1 },
              { label: '周结', value: 2 },
            ]"
          />
        </Space.Compact>
        <Space.Compact v-if="activeType === 'summary'">
          <span class="query-field-addon">返水状态</span>
          <Select
            v-model:value="filters.AwardStatus"
            :options="[
              { label: '全部返水状态', value: -1 },
              { label: '待发放', value: 0 },
              { label: '成功', value: 1 },
              { label: '失败', value: 2 },
            ]"
          />
        </Space.Compact>
        <Space.Compact v-if="activeType === 'summary'">
          <span class="query-field-addon">发放类型</span>
          <Select
            v-model:value="filters.AwardType"
            :options="[
              { label: '全部发放类型', value: -1 },
              { label: '自动', value: 0 },
              { label: '手动', value: 1 },
            ]"
          />
        </Space.Compact>
        <div v-if="activeType === 'summary'" class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="generationRange"
            label="返水生成时间"
          />
        </div>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="awardRange"
            :label="activeType === 'summary' ? '发放时间' : '游戏时间'"
          />
        </div>
        <div
          class="query-filter-actions"
          :class="{ 'query-filter-actions-single': !canExport }"
        >
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
          <Button v-if="canExport" @click="requestExport">导出 Excel</Button>
        </div>
      </div>
    </div>

    <SummaryCards :items="summaryItems" />

    <div class="data-grid">
      <Grid>
        <template #adminName="{ row }">
          <AgencyAccountLink
            :admin-id="resolveAgencyAdminId(row)"
            :username="row.AdminName"
          />
        </template>
        <template #loginAccount="{ row }">
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
        </template>
        <template #backWater="{ row }">
          <Button
            v-if="canOrderDetail"
            type="link"
            @click="openOrderDetails(row)"
          >
            {{ formatAmountFromCent(row.BackWater) }}
          </Button>
          <span v-else>{{ formatAmountFromCent(row.BackWater) }}</span>
        </template>
        <template #awardStatus="{ row }">
          <Tag
            :color="
              awardStatusText(row) === '成功'
                ? 'green'
                : awardStatusText(row) === '失败'
                  ? 'red'
                  : 'orange'
            "
          >
            {{ awardStatusText(row) }}
          </Tag>
        </template>
      </Grid>
    </div>

    <Modal
      v-model:open="detailsVisible"
      :footer="null"
      title="返水明细"
      width="950px"
    >
      <SummaryCards :items="detailSummaryItems" />
      <Table
        :data-source="orderDetails"
        :loading="detailsLoading"
        :pagination="false"
        :scroll="{ x: 900, y: 450 }"
        :columns="[
          {
            title: '场馆',
            key: 'venue',
            customRender: ({ record }) =>
              formatVenueName(record.GameType, gameConfig),
          },
          {
            title: '游戏',
            key: 'game',
            customRender: ({ record }) =>
              formatGameName(record.SubGameId, gameConfig.games),
          },
          {
            title: '流水',
            key: 'Water',
            customRender: ({ record }) => formatAmountFromCent(record.Water),
          },
          {
            title: '比例',
            key: 'Rate',
            customRender: ({ record }) =>
              `${formatPercentFromStorage(record.Rate)}%`,
          },
          {
            title: '应发返水',
            key: 'BackWater',
            customRender: ({ record }) =>
              formatAmountFromCent(record.BackWater),
          },
          {
            title: '时间',
            key: 'Date',
            customRender: ({ record }) => formatOperationDateTime(record.Date),
          },
        ]"
        :row-key="
          (row) =>
            `detail-${row.Id ?? row.PlayerId ?? row.LoginAccount ?? JSON.stringify(row)}`
        "
      />
    </Modal>

    <Modal
      v-model:open="exportVisible"
      :confirm-loading="exportLoading"
      title="后台导出验证"
      @ok="submitExport"
    >
      <Form layout="vertical" class="pt-3">
        <Form.Item label="Google 验证码" required>
          <Input
            v-model:value="exportCode"
            :maxlength="6"
            placeholder="请输入 6 位验证码"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.data-grid {
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}
</style>

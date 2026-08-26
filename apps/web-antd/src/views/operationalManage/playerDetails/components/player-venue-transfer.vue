<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerVenueTransferItem } from '#/types/player-detail';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  editPlatformTransferStateApi,
  manualPlatformTransferApi,
} from '#/api/operationManage/platform-transfer';
import { fetchPlayerVenueTransferListApi } from '#/api/operationManage/player-detail-extra';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { getCurrentMonthRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatVenueName } from '#/utils/game-config';
import {
  formatTransferAccount,
  formatVenueTransferState,
} from '#/utils/player-detail-maps';

defineOptions({ name: 'PlayerVenueTransferPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const canViewTable = computed(() => checkPermission(12_092));
const canExport = computed(() => checkPermission(12_094));
const canManual = computed(() => checkPermission(12_095));
const canChangeState = computed(() => checkPermission(12_096));

const defaultRange = getCurrentMonthRangeSeconds();
const totalAmount = ref(0);
const exportLoading = ref(false);
const stateSaving = ref(false);
const stateOpen = ref(false);

const filterOrderId = ref('');
const filterType = ref<string>('');
const filterState = ref(-2);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const stateForm = reactive({
  Id: '' as number | string,
  OrderId: '',
  State: 0 as number,
});

const TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '转入', value: '1' },
  { label: '转出', value: '2' },
];

const STATE_OPTIONS = [
  { label: '全部', value: -2 },
  { label: '处理中', value: -1 },
  { label: '成功', value: 0 },
  { label: '转人工处理', value: 5 },
  { label: '失败', value: 18 },
];

const CHANGE_STATE_OPTIONS = [
  { label: '成功', value: 0 },
  { label: '失败', value: 1 },
];

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

function formatTransferType(type?: number | string) {
  if (Number(type) === 1) {
    return '转入';
  }
  if (Number(type) === 2) {
    return '转出';
  }
  return String(type ?? '-');
}

function formatOutAccount(row: PlayerVenueTransferItem) {
  if (Number(row.Type) === 1) {
    return formatTransferAccount(1);
  }
  return formatVenueName(row.GameId, gameConfig.value);
}

function formatInAccount(row: PlayerVenueTransferItem) {
  if (Number(row.Type) !== 1) {
    return formatTransferAccount(1);
  }
  return formatVenueName(row.GameId, gameConfig.value);
}

function getStateColor(state?: number | string) {
  const num = Number(state);
  if (num === 0) {
    return 'success';
  }
  if (num === 5 || num === 17) {
    return 'processing';
  }
  if (num === -1) {
    return 'warning';
  }
  return 'error';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    DataSearchType: 2,
    EndTime: end ? end.unix() : '',
    OrderId: filterOrderId.value,
    PlayerId: String(props.playerId),
    State: filterState.value,
    Type: filterType.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerVenueTransferItem> = {
  columns: [
    {
      field: 'Type',
      formatter: ({ cellValue }) => formatTransferType(cellValue),
      minWidth: 90,
      title: '转账类型',
    },
    {
      field: 'OutGameId',
      formatter: ({ row }) => formatOutAccount(row),
      minWidth: 120,
      title: '转出账户',
    },
    {
      field: 'InGameId',
      formatter: ({ row }) => formatInAccount(row),
      minWidth: 120,
      title: '转入账户',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '转账金额',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '转账时间',
    },
    {
      field: 'State',
      minWidth: 90,
      slots: { default: 'state' },
      title: '状态',
    },
    {
      field: 'action',
      minWidth: 180,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerVenueTransferListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });

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
      formatAmountFromCent(totalAmount.value),
      '-',
      '-',
      '-',
      '-',
    ],
  ],
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterOrderId.value = '';
  filterType.value = '';
  filterState.value = -2;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

function handleManual(row: PlayerVenueTransferItem) {
  const id = row.Id;
  if (id === undefined || id === null || id === '') {
    message.warning('订单缺少 Id，无法操作');
    return;
  }
  Modal.confirm({
    content: `确认将订单「${row.OrderId || id}」转为人工处理？`,
    onOk: async () => {
      await manualPlatformTransferApi({ Id: id });
      message.success('已转人工处理');
      gridApi.reload();
    },
    title: '转人工处理',
  });
}

function openChangeState(row: PlayerVenueTransferItem) {
  const id = row.Id;
  if (id === undefined || id === null || id === '') {
    message.warning('订单缺少 Id，无法操作');
    return;
  }
  stateForm.Id = id as number | string;
  stateForm.OrderId = String(row.OrderId || '');
  stateForm.State = 0;
  stateOpen.value = true;
}

async function submitChangeState() {
  if (stateForm.Id === '' || stateForm.Id === undefined) {
    return;
  }
  stateSaving.value = true;
  try {
    await editPlatformTransferStateApi({
      Id: stateForm.Id,
      State: stateForm.State,
    });
    message.success('状态已变更');
    stateOpen.value = false;
    gridApi.reload();
  } finally {
    stateSaving.value = false;
  }
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchPlayerVenueTransferListApi({
      ...getQueryParams(),
      IsExp: true,
      Page: 1,
      PageSize: 10_000,
    });
    const items = result?.Items || [];
    if (items.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }

    const rows = items;

    exportRowsToCsv(
      rows,
      [
        { header: '序号', value: (_row, index) => index + 1 },
        {
          header: '转账类型',
          value: (row) => formatTransferType(row.Type),
        },
        {
          header: '转出账户',
          value: (row) => formatOutAccount(row),
        },
        {
          header: '转入账户',
          value: (row) => formatInAccount(row),
        },
        {
          header: '转账金额',
          value: (row) => (Number(row.Amount || 0) / 100).toFixed(2),
        },
        {
          header: '订单编号',
          value: (row) => String(row.OrderId || '-'),
        },
        {
          header: '转账时间',
          value: (row) => formatDateTime(row.CreateTime),
        },
        {
          header: '状态',
          value: (row) => formatVenueTransferState(row.State),
        },
      ],
      `场馆转账_${props.playerId}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

watch(
  () => props.playerId,
  () => {
    if (props.playerId && canViewTable.value) {
      gridApi.reload();
    }
  },
);

onMounted(async () => {
  await ensureGameConfig();
  if (props.playerId && canViewTable.value) {
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
            @press-enter="handleSearch"
            placeholder="请输入订单编号"
          >
            <template #addonBefore>订单编号</template>
          </Input>
        </div>

        <div class="flex flex-col gap-1">
          <Space.Compact>
            <span class="query-field-addon">转账类型</span>
            <Select
              v-model:value="filterType"
              :options="TYPE_OPTIONS"
              placeholder="请选择转账类型"
            />
          </Space.Compact>
        </div>

        <div class="flex flex-col gap-1">
          <Space.Compact>
            <span class="query-field-addon">状态</span>
            <Select
              v-model:value="filterState"
              :options="STATE_OPTIONS"
              placeholder="请选择状态"
            />
          </Space.Compact>
        </div>

        <div class="query-filter-wide">
          <QueryDatetimeRangePicker
            v-model="filterDateRange"
            label="转账时间"
          />
        </div>
        <div class="query-filter-actions">
          <Space>
            <Button :loading="loading" type="primary" @click="handleSearch">
              查询
            </Button>
            <Button @click="handleReset">重置</Button>
            <Button
              v-if="canExport"
              :loading="exportLoading"
              @click="handleExport"
            >
              导出 Excel
            </Button>
          </Space>
        </div>
      </div>
    </div>

    <Grid>
      <template #state="{ row }">
        <Tag :color="getStateColor(row.State)">
          {{ formatVenueTransferState(row.State) }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <Space :size="0" wrap>
          <Button
            v-if="canManual && Number(row.State) === -1"
            size="small"
            type="link"
            @click="handleManual(row)"
          >
            转人工处理
          </Button>
          <Button
            v-if="
              canChangeState &&
              (Number(row.State) === 5 || Number(row.State) === 17)
            "
            size="small"
            type="link"
            @click="openChangeState(row)"
          >
            变更状态
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="stateOpen"
      :confirm-loading="stateSaving"
      destroy-on-close
      title="变更状态"
      @ok="submitChangeState"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="订单编号">
          <span>{{ stateForm.OrderId || stateForm.Id }}</span>
        </Form.Item>
        <Form.Item label="目标状态" required>
          <Select
            v-model:value="stateForm.State"
            :options="CHANGE_STATE_OPTIONS"
            class="!w-full"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12092 才能查看场馆转账"
    title="无权限"
  />
</template>

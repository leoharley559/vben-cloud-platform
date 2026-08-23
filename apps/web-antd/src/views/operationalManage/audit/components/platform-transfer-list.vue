<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlatformTransferItem } from '#/types/platform-transfer';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
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
  fetchPlatformTransferListApi,
  manualPlatformTransferApi,
} from '#/api/operationManage/platform-transfer';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatVenueName } from '#/utils/game-config';
import {
  formatPlatformTransferState,
  getPlatformTransferStateColor,
} from '#/utils/platform-transfer';

defineOptions({ name: 'PlatformTransferList' });

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const canViewTable = computed(() => checkPermission(10_131));
const canExport = computed(() => checkPermission(10_133));
const canManual = computed(() => checkPermission(10_137));
const canChangeState = computed(() => checkPermission(10_138));

const defaultRange = getYesterdayRangeSeconds();
const exportLoading = ref(false);

const filterLoginAccount = ref('');
const filterOrderId = ref('');
const filterType = ref<number | string>('');
const filterOutGameId = ref<number | string>('');
const filterInGameId = ref<number | string>('');
const filterState = ref(-2);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | null>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const gameOptions = computed(() => {
  const options = [{ label: '全部', value: '' }];
  for (const [gameId] of Object.entries(gameConfig.value.platformGameList)) {
    options.push({
      label: formatVenueName(gameId, gameConfig.value),
      value: gameId,
    });
  }
  return options;
});

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
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    InGameId: filterInGameId.value,
    LoginAccount: filterLoginAccount.value
      .trim()
      .toLowerCase()
      .replaceAll(/\s/g, ''),
    OrderId: filterOrderId.value.trim(),
    OutGameId: filterOutGameId.value,
    State: filterState.value,
    Type: filterType.value,
  };
}

function formatTransferType(type?: number | string) {
  return Number(type) === 1 ? '转入' : '转出';
}

function formatGameAccount(
  type?: number | string,
  gameId?: number | string,
  isOut = false,
) {
  const transferType = Number(type);
  if (isOut) {
    if (transferType === 1) {
      return '中心钱包';
    }
    return formatVenueName(gameId, gameConfig.value);
  }
  if (transferType !== 1) {
    return '中心钱包';
  }
  return formatVenueName(gameId, gameConfig.value);
}

const gridOptions: VxeTableGridOptions<PlatformTransferItem> = {
  columns: [
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'Type',
      formatter: ({ cellValue }) => formatTransferType(cellValue),
      minWidth: 90,
      title: '转账类型',
    },
    {
      field: 'OutGameId',
      formatter: ({ row }) => formatGameAccount(row.Type, row.GameId, true),
      minWidth: 120,
      title: '转出账户',
    },
    {
      field: 'InGameId',
      formatter: ({ row }) => formatGameAccount(row.Type, row.GameId, false),
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
      title: '第三方流水号',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '转账时间',
    },
    {
      field: 'State',
      minWidth: 110,
      slots: { default: 'state' },
      title: '状态',
    },
    { field: 'ApproveName', minWidth: 110, title: '操作人' },
    {
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '操作时间',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlatformTransferListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
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
  filterOrderId.value = '';
  filterType.value = '';
  filterOutGameId.value = '';
  filterInGameId.value = '';
  filterState.value = -2;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

function handleManual(row: PlatformTransferItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '确定将该订单转为人工处理吗？',
    title: '转人工处理',
    onOk: async () => {
      await manualPlatformTransferApi({ Id: row.Id });
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

function handleChangeState(row: PlatformTransferItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: '确定变更该订单状态为成功吗？',
    title: '变更状态',
    onOk: async () => {
      await editPlatformTransferStateApi({
        Id: row.Id,
        State: 0,
      });
      message.success('操作成功');
      gridApi.reload();
    },
  });
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchPlatformTransferListApi({
      ...getQueryParams(),
      IsExp: true,
      Page: 1,
      PageSize: 10_000,
    });
    const rows = result?.Items || [];
    if (rows.length === 0) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        {
          header: '转账类型',
          value: (row) => formatTransferType(row.Type),
        },
        {
          header: '转出账户',
          value: (row) => formatGameAccount(row.Type, row.GameId, true),
        },
        {
          header: '转入账户',
          value: (row) => formatGameAccount(row.Type, row.GameId, false),
        },
        {
          header: '转账金额',
          value: (row) => formatAmountFromCent(row.Amount),
        },
        { header: '第三方流水号', value: (row) => row.OrderId || '-' },
        {
          header: '转账时间',
          value: (row) => formatDateTime(row.CreateTime),
        },
        {
          header: '状态',
          value: (row) => formatPlatformTransferState(row.State),
        },
        { header: '操作人', value: (row) => row.ApproveName || '-' },
        {
          header: '操作时间',
          value: (row) => formatDateTime(row.ApproveTime),
        },
      ],
      `平台转账_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

onMounted(async () => {
  await ensureGameConfig();
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
            v-model:value="filterOrderId"
            allow-clear
            placeholder="请输入流水号"
          >
            <template #addonBefore>流水号</template>
          </Input>
        </div>
        <Select
          v-model:value="filterType"
          :options="[
            { label: '全部', value: '' },
            { label: '转入', value: 1 },
            { label: '转出', value: 2 },
          ]"
        />
        <Space.Compact>
          <span class="query-field-addon">转出账户</span>
          <Select
            v-model:value="filterOutGameId"
            allow-clear
            show-search
            :options="gameOptions"
            :filter-option="
              (input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
            "
            placeholder="请选择转出账户"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">转入账户</span>
          <Select
            v-model:value="filterInGameId"
            allow-clear
            show-search
            :options="gameOptions"
            :filter-option="
              (input, option) =>
                String(option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
            "
            placeholder="请选择转入账户"
          />
        </Space.Compact>
        <Select
          v-model:value="filterState"
          :options="[
            { label: '全部', value: -2 },
            { label: '处理中', value: -1 },
            { label: '成功', value: 0 },
            { label: '转人工处理', value: 5 },
            { label: '失败', value: 18 },
          ]"
        />
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
            查询
          </Button>
          <Button @click="resetFilters">重置</Button>
          <Button
            v-if="canExport"
            :loading="exportLoading"
            @click="handleExport"
          >
            导出 Excel
          </Button>
        </div>
      </div>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
      <template #state="{ row }">
        <Tag :color="getPlatformTransferStateColor(row.State)">
          {{ formatPlatformTransferState(row.State) }}
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
            @click="handleChangeState(row)"
          >
            变更状态
          </Button>
        </Space>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10131 才能查看平台转账"
    title="无权限"
  />
</template>

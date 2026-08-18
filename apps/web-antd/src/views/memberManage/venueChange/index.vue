<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlatformTransferItem } from '#/types/platform-transfer';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
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

import {
  editPlatformTransferStateApi,
  fetchPlatformTransferListApi,
  manualPlatformTransferApi,
} from '#/api/operationManage/platform-transfer';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { exportRowsToCsv } from '#/utils/export-csv';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatVenueName } from '#/utils/game-config';
import {
  formatPlatformTransferState,
  getPlatformTransferStateColor,
} from '#/utils/platform-transfer';

defineOptions({ name: 'VenueChangeManage' });

const LOGIN_ACCOUNT_RE = /^[a-zA-Z0-9]{4,20}$/;

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const canViewPage = computed(() => checkPermission(12210));
const canExport = computed(() => checkPermission(12211));
const canManual = computed(() => checkPermission(12212));
const canChangeState = computed(() => checkPermission(12213));

const defaultRange = getTodayRangeSeconds();
const exportLoading = ref(false);
const submitting = ref(false);

const filterLoginAccount = ref('');
const filterOrderId = ref('');
/** 对齐旧站：'' | '1' | '2' */
const filterType = ref<string>('');
const filterOutGameId = ref<number | string>('');
const filterInGameId = ref<number | string>('');
const filterState = ref(-2);
/** 对齐旧站 SearchTypeTwo：仅 全部/正式（测试项已注释） */
const filterDataSearchType = ref(0);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const manualOpen = ref(false);
const manualId = ref<number | string>();
const stateOpen = ref(false);
const stateForm = reactive({
  Id: '' as number | string,
  OrderId: '',
  State: undefined as number | undefined,
});

/** 对齐旧站：ParentId == 0 的顶层场馆 */
const gameOptions = computed(() => {
  const options: Array<{ label: string; value: number | string }> = [
    { label: '全部', value: '' },
  ];
  for (const [gameId, game] of Object.entries(gameConfig.value.games)) {
    if (Number(game.ParentId) === 0) {
      options.push({
        label: formatVenueName(gameId, gameConfig.value),
        value: gameId,
      });
    }
  }
  return options;
});

const transferTypeOptions = [
  { label: '全部', value: '' },
  { label: '转入', value: '1' },
  { label: '转出', value: '2' },
];

const stateFilterOptions = [
  { label: '全部', value: -2 },
  { label: '处理中', value: -1 },
  { label: '成功', value: 0 },
  { label: '转人工处理', value: 5 },
  { label: '失败', value: 18 },
];

/** 对齐旧站：全部=2 / 正式=0（测试项旧站已注释） */
const dataSearchTypeOptions = [
  { label: '全部', value: 2 },
  { label: '正式', value: 0 },
];

/** 变更状态弹窗：对齐旧站 success=1 / fail=2 */
const stateEditOptions = [
  { label: '成功', value: 1 },
  { label: '失败', value: 2 },
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

function normalizeLoginAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
}

function getQueryParams(extra?: Record<string, unknown>) {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    DataSearchType: filterDataSearchType.value,
    EndTime: end ? end.unix() : '',
    InGameId: filterInGameId.value,
    LoginAccount: normalizeLoginAccount(filterLoginAccount.value),
    OrderId: filterOrderId.value.trim(),
    OutGameId: filterOutGameId.value,
    State: filterState.value,
    Type: filterType.value,
    ...extra,
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
    return transferType === 1
      ? '中心钱包'
      : formatVenueName(gameId, gameConfig.value);
  }
  return transferType !== 1
    ? '中心钱包'
    : formatVenueName(gameId, gameConfig.value);
}

function validateBeforeQuery() {
  const account = normalizeLoginAccount(filterLoginAccount.value);
  if (account && !LOGIN_ACCOUNT_RE.test(account)) {
    message.warning('请输入正确的游戏账号');
    return false;
  }
  return true;
}

const gridOptions: VxeTableGridOptions<PlatformTransferItem> = {
  columns: [
    { type: 'seq', title: '序号', width: 60 },
    { field: 'LoginAccount', minWidth: 130, slots: { default: 'loginAccount' }, title: '游戏账号' },
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
      minWidth: 180,
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
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  if (!validateBeforeQuery()) {
    return;
  }
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterOrderId.value = '';
  filterType.value = '';
  filterOutGameId.value = '';
  filterInGameId.value = '';
  filterState.value = -2;
  filterDataSearchType.value = 0;
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

function openManual(row: PlatformTransferItem) {
  if (!row.Id) {
    return;
  }
  manualId.value = row.Id;
  manualOpen.value = true;
}

async function confirmManual() {
  if (!manualId.value) {
    return;
  }
  submitting.value = true;
  try {
    await manualPlatformTransferApi({ Id: manualId.value });
    message.success('操作成功');
    manualOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

function openChangeState(row: PlatformTransferItem) {
  if (!row.Id) {
    return;
  }
  stateForm.Id = row.Id;
  stateForm.OrderId = String(row.OrderId || '');
  stateForm.State = undefined;
  stateOpen.value = true;
}

async function confirmChangeState() {
  if (stateForm.State === undefined || stateForm.State === null) {
    message.warning('请选择状态');
    return;
  }
  submitting.value = true;
  try {
    await editPlatformTransferStateApi({
      Id: stateForm.Id,
      State: stateForm.State,
    });
    message.success('操作成功');
    stateOpen.value = false;
    await gridApi.reload();
  } finally {
    submitting.value = false;
  }
}

async function handleExport() {
  if (!validateBeforeQuery()) {
    return;
  }
  exportLoading.value = true;
  try {
    const result = await fetchPlatformTransferListApi({
      ...getQueryParams(),
      CurrPage: 1,
      IsExp: true,
      Page: 1,
      PageSize: 99999,
    });
    const rows = result.Items || [];
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows.map((row, index) => ({ ...row, _index: index + 1 })),
      [
        { header: '序号', value: (row) => (row as { _index: number })._index },
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
    message.success('导出成功');
  } finally {
    exportLoading.value = false;
  }
}

onMounted(async () => {
  await ensureGameConfig();
  if (canViewPage.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="会员管理 · 场馆账变"
    title="场馆账变"
  >
    <Card>
      <OpsListPanel>
        <template #filters>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterLoginAccount"
              allow-clear
              style="width: 260px"
              @press-enter="handleSearch"
              placeholder="请输入游戏账号"
            >
              <template #addonBefore>游戏账号</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Input
              v-model:value="filterOrderId"
              allow-clear
              style="width: 250px"
              @press-enter="handleSearch"
              placeholder="请输入流水号"
            >
              <template #addonBefore>流水号</template>
            </Input>
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">转账类型</span>
              <Select
                v-model:value="filterType"
                style="width: 120px"
                :options="transferTypeOptions"
                placeholder="请选择转账类型"
              />
            </Space.Compact>
          
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">转出账户</span>
              <Select
                v-model:value="filterOutGameId"
                show-search
                option-filter-prop="label"
                style="width: 160px"
                :options="gameOptions"
                placeholder="请选择转出账户"
              />
            </Space.Compact>
          
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">转入账户</span>
              <Select
                v-model:value="filterInGameId"
                show-search
                option-filter-prop="label"
                style="width: 160px"
                :options="gameOptions"
                placeholder="请选择转入账户"
              />
            </Space.Compact>
          
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">状态</span>
              <Select
                v-model:value="filterState"
                style="width: 140px"
                :options="stateFilterOptions"
                placeholder="请选择状态"
              />
            </Space.Compact>
          
          </div>
          <div class="flex flex-col gap-1">
            <Space.Compact>
              <span class="query-field-addon">数据类型</span>
              <Select
                v-model:value="filterDataSearchType"
                style="width: 120px"
                :options="dataSearchTypeOptions"
                placeholder="请选择数据类型"
              />
            </Space.Compact>
          
          </div>
          <div class="flex flex-col gap-1">
            <QueryDatetimeRangePicker v-model="filterDateRange" />
          
          </div>
          <Button :loading="loading" type="primary" @click="handleSearch">
            查询
          </Button>
          <Button @click="handleReset">重置</Button>
          <Button
            v-if="canExport"
            :loading="exportLoading"
            @click="handleExport"
          >
            导出
          </Button>
        </template>

        <Grid>
          <template #loginAccount="{ row }">
            <PlayerAccountLink
              :login-account="String(row.LoginAccount || '')"
              :player-id="row.PlayerId as number | string | undefined"
            />
          </template>
          <template #state="{ row }">
            <Tag :color="getPlatformTransferStateColor(row.State)">
              {{ formatPlatformTransferState(row.State) }}
            </Tag>
          </template>
          <template #actions="{ row }">
            <div class="flex flex-wrap gap-1">
              <Button
                v-if="canManual && Number(row.State) === -1"
                size="small"
                type="primary"
                @click="openManual(row)"
              >
                转人工处理
              </Button>
              <Button
                v-if="
                  canChangeState &&
                  (Number(row.State) === 5 || Number(row.State) === 17)
                "
                size="small"
                type="primary"
                @click="openChangeState(row)"
              >
                变更状态
              </Button>
            </div>
          </template>
        </Grid>
      </OpsListPanel>
    </Card>

    <Modal
      v-model:open="manualOpen"
      title="转人工处理"
      :confirm-loading="submitting"
      destroy-on-close
      @ok="confirmManual"
    >
      <p class="py-4 text-center">确定将该订单转为人工处理吗？</p>
    </Modal>

    <Modal
      v-model:open="stateOpen"
      title="变更状态"
      :confirm-loading="submitting"
      destroy-on-close
      @ok="confirmChangeState"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="第三方流水号">
          <Input :value="stateForm.OrderId" disabled />
        </Form.Item>
        <Form.Item label="状态" required>
          <Select
            v-model:value="stateForm.State"
            class="w-full"
            placeholder="请选择"
            :options="stateEditOptions"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
  <Result v-else status="403" sub-title="无场馆账变查看权限" title="403" />
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type {
  WithdrawWaterItem,
  WithdrawWaterStatusLogItem,
} from '#/types/withdraw-extra';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  Form,
  Input,
  Modal,
  Popover,
  Result,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  fetchWithdrawWaterListApi,
  fetchWithdrawWaterStatusLogApi,
  updateWithdrawWaterStatusApi,
} from '#/api/operationManage/withdraw-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import { buildPlayerDetailPath } from '#/utils/player-detail-route';

import WithdrawWaterSettingModal from './withdraw-water-setting-modal.vue';

defineOptions({ name: 'WithdrawWaterList' });

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(
  () => checkPermission(13230) || checkPermission(13232),
);
const canEditStatus = computed(() => checkPermission(13232));
const canSettings = computed(() => checkPermission(13233));
const canGotoProcess = computed(() => checkPermission(13234));

const defaultRange = getYesterdayRangeSeconds();
const filterLoginAccount = ref('');
const filterChannelId = ref('');
const filterHandlerName = ref('');
const filterStatus = ref<number | string>('');
const filterPackageId = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const selectedRows = ref<WithdrawWaterItem[]>([]);
const statusOpen = ref(false);
const statusSaving = ref(false);
const editStatus = ref<number>(2);
const editRemark = ref('');
const settingOpen = ref(false);

const logLoading = ref(false);
const logMap = ref<Record<string, WithdrawWaterStatusLogItem[]>>({});

const statusOptions = [
  { label: '全部', value: '' },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
];

const hasSelection = computed(() => selectedRows.value.length > 0);

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

function formatWaterStatus(status?: number) {
  if (Number(status) === 2) {
    return '已完成';
  }
  if (Number(status) === 1) {
    return '进行中';
  }
  return '-';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.unix() : '',
    ChannelId: filterChannelId.value,
    EndTime: end ? end.unix() : '',
    HandlerName: filterHandlerName.value,
    LoginAccount: filterLoginAccount.value,
    PackageIds: filterPackageId.value,
    Status: filterStatus.value,
  };
}

async function loadStatusLog(id?: number | string) {
  if (!id) {
    return;
  }
  const key = String(id);
  if (logMap.value[key]) {
    return;
  }
  logLoading.value = true;
  try {
    const result = await fetchWithdrawWaterStatusLogApi(id);
    logMap.value[key] = (result?.Items || []) as WithdrawWaterStatusLogItem[];
  } finally {
    logLoading.value = false;
  }
}

function openStatusEdit() {
  if (!hasSelection.value) {
    message.warning('请先选择进行中的记录');
    return;
  }
  editStatus.value = 2;
  editRemark.value = '';
  statusOpen.value = true;
}

async function saveStatus() {
  statusSaving.value = true;
  try {
    await updateWithdrawWaterStatusApi({
      Ids: selectedRows.value.map((item) => item.Id).join(','),
      Remark: editRemark.value,
      Status: editStatus.value,
    });
    message.success('状态已更新');
    statusOpen.value = false;
    selectedRows.value = [];
    logMap.value = {};
    gridApi.reload();
  } finally {
    statusSaving.value = false;
  }
}

function gotoProcess(row: WithdrawWaterItem) {
  if (!row.PlayerId) {
    return;
  }
  router.push(buildPlayerDetailPath(row.PlayerId, row.LoginAccount));
}

function handleReset() {
  filterLoginAccount.value = '';
  filterChannelId.value = '';
  filterHandlerName.value = '';
  filterStatus.value = '';
  filterPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

const gridOptions: VxeTableGridOptions<WithdrawWaterItem> = {
  checkboxConfig: {
    checkMethod: ({ row }) => Number(row.Status) === 1,
  },
  columns: [
    { type: 'checkbox', width: 48 },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '时间',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    { field: 'VipLevel', minWidth: 90, title: 'VIP等级' },
    {
      field: 'TotalFlow',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '总流水',
    },
    {
      field: 'TotalWinloss',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 120,
      title: '总输赢',
    },
    {
      field: 'Status',
      minWidth: 120,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'HandlerName',
      minWidth: 110,
      title: '操作人',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 100,
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
        const result = await fetchWithdrawWaterListApi({
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

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: WithdrawWaterItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: WithdrawWaterItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});
const loading = computed(() => gridApi.grid?.loading ?? false);

const logColumns = [
  {
    customRender: ({ record }: { record: WithdrawWaterStatusLogItem }) =>
      formatWaterStatus(record.Status),
    key: 'Status',
    title: '状态',
    width: 90,
  },
  {
    customRender: ({ record }: { record: WithdrawWaterStatusLogItem }) =>
      formatDateTime(record.CreateTime),
    key: 'CreateTime',
    title: '时间',
    width: 160,
  },
  {
    dataIndex: 'HandlerInf',
    key: 'HandlerInf',
    title: '备注',
  },
  {
    dataIndex: 'HandlerName',
    key: 'HandlerName',
    title: '操作人',
    width: 100,
  },
];

onMounted(() => {
  filterPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
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
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <Select
        v-model:value="filterPackageId"
        :options="
          packageOptions
            .filter((item) => item.PackageId !== '')
            .map((item) => ({
              label: item.PackageName,
              value: item.PackageId,
            }))
        "
        style="width: 160px"
      />
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterChannelId"
          allow-clear
          style="width: 160px"
          placeholder="请输入渠道号"
        >
          <template #addonBefore>渠道号</template>
        </Input>
      </div>
      <Select
        v-model:value="filterStatus"
        :options="statusOptions"
        style="width: 140px"
      />
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterHandlerName"
          allow-clear
          style="width: 160px"
          placeholder="请输入操作人"
        >
          <template #addonBefore>操作人</template>
        </Input>
      </div>
      <QueryDatetimeRangePicker v-model="filterDateRange" />
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
      <Button @click="handleReset">重置</Button>
    </div>

    <div class="mb-3 flex flex-wrap gap-2">
      <Button
        v-if="canEditStatus"
        :disabled="!hasSelection"
        type="primary"
        @click="openStatusEdit"
      >
        编辑状态
      </Button>
      <Button v-if="canSettings" @click="settingOpen = true">
        提现流水设置
      </Button>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="row.LoginAccount"
          :player-id="row.PlayerId"
        />
      </template>
      <template #status="{ row }">
        <Space>
          <Tag :color="Number(row.Status) === 2 ? 'success' : 'processing'">
            {{ formatWaterStatus(row.Status) }}
          </Tag>
          <Popover
            trigger="click"
            @open-change="(open) => open && loadStatusLog(row.Id)"
          >
            <template #content>
              <Table
                :columns="logColumns"
                :data-source="logMap[String(row.Id)] || []"
                :loading="logLoading"
                :pagination="false"
                row-key="CreateTime"
                size="small"
                style="width: 480px"
              />
            </template>
            <Button size="small" type="link">日志</Button>
          </Popover>
        </Space>
      </template>
      <template #actions="{ row }">
        <Button
          v-if="canGotoProcess"
          size="small"
          type="link"
          @click="gotoProcess(row)"
        >
          去处理
        </Button>
      </template>
    </Grid>

    <Modal
      v-model:open="statusOpen"
      :confirm-loading="statusSaving"
      title="编辑状态"
      @ok="saveStatus"
    >
      <Form layout="vertical">
        <Form.Item label="状态" required>
          <Select
            v-model:value="editStatus"
            :options="[
              { label: '进行中', value: 1 },
              { label: '已完成', value: 2 },
            ]"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea
            v-model:value="editRemark"
            :maxlength="500"
            :rows="4"
            allow-clear
            placeholder="请输入备注"
            show-count
          />
        </Form.Item>
      </Form>
    </Modal>

    <WithdrawWaterSettingModal v-model:open="settingOpen" />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 13230/13232 才能查看提款流水"
    title="无权限"
  />
</template>

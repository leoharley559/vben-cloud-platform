<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerAuthListItem } from '#/types/player-authentication';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Input,
  Popover,
  Select,
  Space,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerAuthListApi } from '#/api/memberManage/player-authentication';
import AccountSelect from '#/components/global/account-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import {
  AUTH_SCENARIO_OPTIONS,
  formatAuthScenario,
  formatRiskInfoType,
  parseRiskInfo,
} from '#/utils/player-authentication';
import { exportRowsToCsv } from '#/utils/export-csv';
import { getServiceImageUrl } from '#/utils/media';

import AuthAuditActionModal from './auth-audit-action-modal.vue';

defineOptions({ name: 'AuthAuditList' });

const { packageOptions } = useOperationOptions();

const exportLoading = ref(false);
const listLoading = ref(false);

const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelId = ref<number | string>();
const filterAgentId = ref<number | string>();
const filterAuthScenario = ref(-1);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

const selectedRows = ref<PlayerAuthListItem[]>([]);
const actionModalOpen = ref(false);
const actionType = ref<'approve' | 'reject'>('approve');
const actionRow = ref<PlayerAuthListItem | null>(null);
const actionOrderIds = ref('');

const packageSelectOptions = computed(() => [
  { label: '全部', value: '' as number | string },
  ...packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
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

function formatCommSoftware(row: PlayerAuthListItem) {
  const parts = [row.CommSoftware, row.CommSoftwareAccount].filter(Boolean);
  return parts.length ? parts.join('｜') : '-';
}

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AgentId: filterAgentId.value || undefined,
    // 对齐旧站：全部时传 AuthScenario=-1
    AuthScenario: filterAuthScenario.value,
    BeginTime: begin ? begin.unix() : undefined,
    ChannelId: filterChannelId.value
      ? String(filterChannelId.value)
      : undefined,
    EndTime: end ? end.unix() : undefined,
    LoginAccount: filterLoginAccount.value.trim() || undefined,
    PackageId:
      filterPackageId.value === '' || filterPackageId.value === undefined
        ? undefined
        : filterPackageId.value,
    PlayerId: filterPlayerId.value.trim() || undefined,
  };
}

function normalizeList(items: PlayerAuthListItem[]) {
  return items.map((item) => ({
    ...item,
    RiskInfo: parseRiskInfo(item.RiskInfo),
  }));
}

const gridOptions: VxeTableGridOptions<PlayerAuthListItem> = {
  checkboxConfig: {
    highlight: true,
    range: true,
  },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'ApproveStatus',
      minWidth: 90,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'RiskStatus',
      minWidth: 110,
      slots: { default: 'risk' },
      title: '风控分析',
    },
    {
      field: 'LoginAccount',
      minWidth: 120,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    { field: 'PackageName', minWidth: 120, title: '产品名称' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    { field: 'Username', minWidth: 110, slots: { default: 'username' }, title: '代理账号' },
    {
      field: 'AuthScenario',
      formatter: ({ cellValue }) => formatAuthScenario(cellValue),
      minWidth: 100,
      title: '验证场景',
    },
    {
      field: 'AuthImage',
      minWidth: 100,
      slots: { default: 'authImage' },
      title: '身份照片',
    },
    {
      field: 'AuthImage2',
      minWidth: 100,
      slots: { default: 'authImage2' },
      title: '验证照片',
    },
    { field: 'AuthId', minWidth: 100, title: '证件ID' },
    { field: 'PlayerName', minWidth: 100, title: '姓名' },
    { field: 'DateOfBirth', minWidth: 110, title: '出生日期' },
    {
      field: 'CommSoftware',
      formatter: ({ row }) => formatCommSoftware(row),
      minWidth: 140,
      title: '通讯软件',
    },
    { field: 'PlaceOfBirth', minWidth: 110, title: '出生地点' },
    { field: 'Gender', minWidth: 80, title: '性别' },
    { field: 'CurrentAddress', minWidth: 120, title: '现居地址' },
    { field: 'PermanentAddress', minWidth: 120, title: '永久地址' },
    { field: 'Nationality', minWidth: 100, title: '国籍' },
    {
      field: 'PhoneNumber',
      formatter: ({ cellValue }) => cellValue || '-',
      minWidth: 120,
      title: '手机号码',
    },
    { field: 'NatureOfWork', minWidth: 110, title: '工作性质' },
    { field: 'SourceOfIncome', minWidth: 110, title: '收入来源' },
    {
      field: 'UploadTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '上传时间',
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
  pagerConfig: { enabled: false },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async () => {
        listLoading.value = true;
        try {
          const result = await fetchPlayerAuthListApi(getQueryParams());
          const items = normalizeList(result?.Items || []);
          return {
            items,
            total: items.length,
          };
        } finally {
          listLoading.value = false;
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: PlayerAuthListItem[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: PlayerAuthListItem[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

const loading = computed(
  () => listLoading.value || (gridApi.grid?.loading ?? false),
);
const canBatchAction = computed(() => selectedRows.value.length >= 2);

function handleSearch() {
  selectedRows.value = [];
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterPlayerId.value = '';
  filterPackageId.value = '';
  filterChannelId.value = undefined;
  filterAgentId.value = undefined;
  filterAuthScenario.value = -1;
  filterDateRange.value = undefined;
  selectedRows.value = [];
  gridApi.reload();
}

function openActionModal(
  action: 'approve' | 'reject',
  row?: PlayerAuthListItem,
) {
  if (row) {
    actionRow.value = row;
    actionOrderIds.value = row.OrderId || '';
  } else {
    actionRow.value = null;
    actionOrderIds.value = selectedRows.value
      .map((item) => item.OrderId)
      .filter(Boolean)
      .join(',');
  }
  actionType.value = action;
  actionModalOpen.value = true;
}

function previewImage(path?: string) {
  const url = getServiceImageUrl(path);
  if (url) {
    window.open(url, '_blank');
  }
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const result = await fetchPlayerAuthListApi(getQueryParams());
    const rows = normalizeList(result?.Items || []);
    if (!rows.length) {
      message.warning('暂无数据可导出');
      return;
    }
    exportRowsToCsv(
      rows,
      [
        { header: '状态', value: () => '待审核' },
        { header: '游戏账号', value: (row) => row.LoginAccount || '-' },
        { header: '玩家ID', value: (row) => row.PlayerId || '-' },
        { header: '产品名称', value: (row) => row.PackageName || '-' },
        { header: '渠道号', value: (row) => row.ChannelId || '-' },
        { header: '代理账号', value: (row) => row.Username || '-' },
        {
          header: '验证场景',
          value: (row) => formatAuthScenario(row.AuthScenario),
        },
        { header: '证件ID', value: (row) => row.AuthId || '-' },
        { header: '姓名', value: (row) => row.PlayerName || '-' },
        { header: '出生日期', value: (row) => row.DateOfBirth || '-' },
        {
          header: '通讯软件',
          value: (row) => formatCommSoftware(row),
        },
        { header: '出生地点', value: (row) => row.PlaceOfBirth || '-' },
        { header: '性别', value: (row) => row.Gender || '-' },
        { header: '现居地址', value: (row) => row.CurrentAddress || '-' },
        { header: '永久地址', value: (row) => row.PermanentAddress || '-' },
        { header: '国籍', value: (row) => row.Nationality || '-' },
        { header: '手机号码', value: (row) => row.PhoneNumber || '-' },
        { header: '工作性质', value: (row) => row.NatureOfWork || '-' },
        { header: '收入来源', value: (row) => row.SourceOfIncome || '-' },
        {
          header: '上传时间',
          value: (row) => formatDateTime(row.UploadTime),
        },
      ],
      `身份验证审核列表_${dayjs().format('YYYYMMDDHHmmss')}`,
    );
  } finally {
    exportLoading.value = false;
  }
}

function handleActionSuccess() {
  selectedRows.value = [];
  message.success('操作成功');
  gridApi.reload();
}

onMounted(() => {
  gridApi.reload();
});
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerId"
          allow-clear
          @press-enter="handleSearch"
          placeholder="请输入玩家ID"
        >
          <template #addonBefore>玩家ID</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">产品</span>
          <Select
            v-model:value="filterPackageId"
            allow-clear
            :options="packageSelectOptions"
            placeholder="请选择产品"
          />
        </Space.Compact>
      </div>
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">渠道号</span>
          <ChannelSelect
            v-model="filterChannelId"
            :multiple="false"
            placeholder="请输入渠道号"
          />
        </Space.Compact>
      </div>
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">代理账号</span>
          <AccountSelect
            v-model="filterAgentId"
            :multiple="false"
          />
        </Space.Compact>
      </div>
      <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">验证场景</span>
          <Select
            v-model:value="filterAuthScenario"
            :options="AUTH_SCENARIO_OPTIONS"
            placeholder="请选择验证场景"
          />
        </Space.Compact>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" label="上传时间" />
        </div>
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="handleSearch">
        查询
      </Button>
      <Button @click="handleReset">重置</Button>
      <Button :loading="exportLoading" @click="handleExport"> 导出 CSV </Button>
      <Button
        :disabled="!canBatchAction"
        type="primary"
        @click="openActionModal('approve')"
      >
        批量通过
      </Button>
      <Button
        :disabled="!canBatchAction"
        danger
        @click="openActionModal('reject')"
      >
        批量拒绝
      </Button>
        </div>
      </template>

    <Grid>
      <template #username="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :username="row.Username"
        />
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #status>
        <Tag color="warning">待审核</Tag>
      </template>
      <template #risk="{ row }">
        <Popover
          v-if="
            Number(row.RiskStatus) !== 1 && parseRiskInfo(row.RiskInfo).length
          "
          placement="right"
        >
          <template #content>
            <div class="flex max-w-xs flex-wrap gap-2">
              <Tag
                v-for="(item, index) in parseRiskInfo(row.RiskInfo)"
                :key="index"
                color="error"
              >
                {{ formatRiskInfoType(item.Type) }}：{{ item.Remarks || '-' }}
              </Tag>
            </div>
          </template>
          <Tag color="error" class="cursor-pointer">挂起</Tag>
        </Popover>
        <Tag v-else color="success">通过</Tag>
      </template>
      <template #authImage="{ row }">
        <Button
          v-if="row.AuthImage"
          size="small"
          type="link"
          @click="previewImage(row.AuthImage)"
        >
          查看
        </Button>
        <span v-else>-</span>
      </template>
      <template #authImage2="{ row }">
        <Button
          v-if="row.AuthImage2"
          size="small"
          type="link"
          @click="previewImage(row.AuthImage2)"
        >
          查看
        </Button>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <Space>
          <Button
            size="small"
            type="primary"
            @click="openActionModal('approve', row)"
          >
            通过
          </Button>
          <Button danger size="small" @click="openActionModal('reject', row)">
            拒绝
          </Button>
        </Space>
      </template>
    </Grid>

    <AuthAuditActionModal
      v-model:open="actionModalOpen"
      :action="actionType"
      :order-ids="actionOrderIds"
      :row="actionRow"
      @success="handleActionSuccess"
    />
  </OpsListPanel>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerAuthRecordItem } from '#/types/player-authentication';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Tag,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  exportPlayerAuthRecordApi,
  fetchPlayerAuthRecordApi,
} from '#/api/memberManage/player-authentication';
import AccountSelect from '#/components/global/account-select.vue';
import ChannelSelect from '#/components/global/channel-select.vue';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import {
  AUTH_SCENARIO_OPTIONS,
  AUTH_STATUS_OPTIONS,
  formatAuthScenario,
  formatAuthStatus,
  getAuthStatusColor,
} from '#/utils/player-authentication';
import { getServiceImageUrl } from '#/utils/media';
import { AUTH_RECORD_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

defineOptions({ name: 'AuthRecordList' });

const router = useRouter();
const { packageOptions } = useOperationOptions();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const exportLoading = ref(false);
const totalCount = ref(0);

const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelId = ref<number | string>();
const filterAgentId = ref<number | string>();
const filterAuthScenario = ref(-1);
const filterStatus = ref<number | string>('');
const filterUploadDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();
const filterVerifyDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

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

function formatCommSoftware(row: PlayerAuthRecordItem) {
  const parts = [row.CommSoftware, row.CommSoftwareAccount].filter(Boolean);
  return parts.length ? parts.join('｜') : '-';
}

function getQueryParams(extra?: { Page?: number; PageSize?: number }) {
  const [uploadBegin, uploadEnd] = filterUploadDateRange.value || [];
  const [verifyBegin, verifyEnd] = filterVerifyDateRange.value || [];
  return {
    AgentId: filterAgentId.value || undefined,
    AuthBeginTime: verifyBegin ? verifyBegin.startOf('day').unix() : undefined,
    AuthEndTime: verifyEnd ? verifyEnd.endOf('day').unix() : undefined,
    AuthScenario:
      filterAuthScenario.value === -1 ? undefined : filterAuthScenario.value,
    BeginTime: uploadBegin ? uploadBegin.startOf('day').unix() : undefined,
    ChannelId: filterChannelId.value
      ? String(filterChannelId.value)
      : undefined,
    EndTime: uploadEnd ? uploadEnd.endOf('day').unix() : undefined,
    LoginAccount: filterLoginAccount.value || undefined,
    PackageId: filterPackageId.value || undefined,
    PlayerId: filterPlayerId.value || undefined,
    Status: filterStatus.value === '' ? undefined : filterStatus.value,
    ...extra,
  };
}

const gridOptions: VxeTableGridOptions<PlayerAuthRecordItem> = {
  columns: [
    {
      field: 'ApproveStatus',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'LoginAccount', minWidth: 120, title: '游戏账号' },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    { field: 'PackageName', minWidth: 120, title: '产品名称' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    { field: 'Username', minWidth: 110, title: '代理账号' },
    {
      field: 'AuthScenario',
      formatter: ({ cellValue }) => formatAuthScenario(cellValue),
      minWidth: 100,
      title: '验证场景',
    },
    {
      field: 'AuthImage',
      minWidth: 90,
      slots: { default: 'authImage' },
      title: '身份照片',
    },
    {
      field: 'AuthImage2',
      minWidth: 90,
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
      field: 'ApproveTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
    { field: 'ApproveName', minWidth: 100, title: '审核人' },
    {
      field: 'ApproveRemark',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '备注',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerAuthRecordApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        const items = result?.Items || [];
        totalCount.value = Number(result?.Pagination?.MaxCount || items.length);
        return {
          items,
          total: totalCount.value,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterPlayerId.value = '';
  filterPackageId.value = '';
  filterChannelId.value = undefined;
  filterAgentId.value = undefined;
  filterAuthScenario.value = -1;
  filterStatus.value = '';
  filterUploadDateRange.value = undefined;
  filterVerifyDateRange.value = undefined;
  gridApi.reload();
}

function previewImage(path?: string) {
  const url = getServiceImageUrl(path);
  if (url) {
    window.open(url, '_blank');
  }
}

function handleExportClick() {
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(AUTH_RECORD_EXPORT_PAGE_ID, {
    ...getQueryParams(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportPlayerAuthRecordApi({
      ...getQueryParams(),
      ...payload,
    });
    if (result?.Id && Number(result.Status) === 0) {
      Modal.confirm({
        content: '导出任务已创建，是否前往导出管理下载？',
        okText: '前往',
        title: '导出成功',
        onOk: () => {
          router.push('/operationalManage/downloadCsvManage').catch(() => {});
        },
      });
      return;
    }
    message.error(String(result?.Remark || '导出失败'));
  } finally {
    exportLoading.value = false;
  }
}

onMounted(() => {
  gridApi.reload();
});
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">游戏账号</span>
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="请输入"
          style="width: 160px"
          @press-enter="handleSearch"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">玩家ID</span>
        <Input
          v-model:value="filterPlayerId"
          allow-clear
          placeholder="请输入"
          style="width: 140px"
          @press-enter="handleSearch"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">产品</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
          placeholder="全部"
          style="width: 160px"
          :options="packageSelectOptions"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">渠道号</span>
        <ChannelSelect
          v-model="filterChannelId"
          :multiple="false"
          style="width: 180px"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">代理账号</span>
        <AccountSelect
          v-model="filterAgentId"
          :multiple="false"
          style="width: 190px"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">验证场景</span>
        <Select
          v-model:value="filterAuthScenario"
          style="width: 140px"
          :options="AUTH_SCENARIO_OPTIONS"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">状态</span>
        <Select
          v-model:value="filterStatus"
          style="width: 120px"
          :options="AUTH_STATUS_OPTIONS"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">上传时间</span>
        <DatePicker.RangePicker v-model:value="filterUploadDateRange" />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">审核时间</span>
        <DatePicker.RangePicker v-model:value="filterVerifyDateRange" />
      </div>
      <Button :loading="loading" type="primary" @click="handleSearch">
        查询
      </Button>
      <Button @click="handleReset">重置</Button>
      <Button :loading="exportLoading" @click="handleExportClick">
        导出 CSV
      </Button>
    </template>

    <Grid>
      <template #status="{ row }">
        <Tag :color="getAuthStatusColor(row.ApproveStatus)">
          {{ formatAuthStatus(row.ApproveStatus) }}
        </Tag>
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
    </Grid>
    <PassPopup ref="passPopupRef" type="csv" @confirm="handleExport" />
  </OpsListPanel>
</template>

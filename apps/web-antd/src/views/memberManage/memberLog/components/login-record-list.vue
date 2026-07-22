<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { LoginLogListItem } from '#/types/member-logs';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  exportLoginLogListApi,
  fetchLoginLogListApi,
} from '#/api/memberManage/member-logs';
import ChannelSelect from '#/components/global/channel-select.vue';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useProjectConfig } from '#/composables/use-project-config';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { formatMemberType } from '#/utils/player-status';
import { MEMBER_LOGIN_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

defineOptions({ name: 'LoginRecordList' });

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const { projectConfig } = useProjectConfig();

const canViewTable = computed(() => checkPermission(12221));
const canExport = computed(() => checkPermission(12246));

const defaultRange = getTodayRangeSeconds();
const exportLoading = ref(false);
const totalCount = ref(0);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterPlayerId = ref('');
const filterChannelId = ref<number | string>();
const filterLoginPlatform = ref('');
const filterIp = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

const packageSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
]);

const devicePlatformOptions = computed(() => {
  const map = projectConfig.value?.DevicePlatformAll || {};
  return [
    { label: '全部设备', value: '' },
    ...Object.entries(map).map(([value, label]) => ({
      label: String(label),
      value,
    })),
  ];
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

function formatDevicePlatform(value?: string) {
  if (!value) {
    return '-';
  }
  const map = projectConfig.value?.DevicePlatformAll || {};
  return map[value] || value;
}

/** 明细查询：对齐旧站 SearchTypeTwo（未开数据类型时不传 DataSearchType） */
function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    ChannelId: filterChannelId.value || '',
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    Ip: filterIp.value.trim(),
    LoginAccount: filterLoginAccount.value
      .trim()
      .toLowerCase()
      .replaceAll(/\s/g, ''),
    LoginPlatform: filterLoginPlatform.value,
    PackageId: filterPackageId.value,
    PlayerId: filterPlayerId.value.trim(),
  };
}

const gridOptions: VxeTableGridOptions<LoginLogListItem> = {
  columns: [
    { type: 'seq', title: '序号', width: 60 },
    { field: 'LoginAccount', minWidth: 130, title: '游戏账号' },
    {
      field: 'DataFlag',
      formatter: ({ cellValue }) => formatMemberType(cellValue),
      minWidth: 90,
      title: '会员类型',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    {
      field: 'LoginPlatform',
      formatter: ({ cellValue }) => formatDevicePlatform(cellValue),
      minWidth: 110,
      title: '设备类型',
    },
    { field: 'Ip', minWidth: 130, title: '登录IP' },
    {
      field: 'FromDomain',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '来源域名',
    },
    {
      field: 'IpDetailName',
      minWidth: 140,
      showOverflow: 'tooltip',
      title: 'IP归属地',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '登录时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchLoginLogListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
        });
        const items = result.Items || [];
        totalCount.value = Number(result.Pagination?.MaxCount || items.length);
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
  filterPackageId.value = '';
  filterPlayerId.value = '';
  filterChannelId.value = undefined;
  filterLoginPlatform.value = '';
  filterIp.value = '';
  filterDateRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  gridApi.reload();
}

function handleExportClick() {
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(MEMBER_LOGIN_EXPORT_PAGE_ID, {
    ...getQueryParams(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportLoginLogListApi({
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
  if (canViewTable.value) {
    gridApi.reload();
  }
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
          style="width: 180px"
          @press-enter="handleSearch"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">产品名称</span>
        <Select
          v-model:value="filterPackageId"
          style="width: 160px"
          :options="packageSelectOptions"
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
        <span class="text-xs text-gray-500">渠道号</span>
        <ChannelSelect
          v-model="filterChannelId"
          :multiple="false"
          style="width: 180px"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">设备类型</span>
        <Select
          v-model:value="filterLoginPlatform"
          allow-clear
          style="width: 140px"
          :options="devicePlatformOptions"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">登录IP</span>
        <Input
          v-model:value="filterIp"
          allow-clear
          placeholder="请输入"
          style="width: 160px"
          @press-enter="handleSearch"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">登录时间</span>
        <DatePicker.RangePicker v-model:value="filterDateRange" />
      </div>
      <Button :loading="loading" type="primary" @click="handleSearch">
        查询
      </Button>
      <Button @click="handleReset">重置</Button>
      <Button
        v-if="canExport"
        :loading="exportLoading"
        @click="handleExportClick"
      >
        导出 CSV
      </Button>
    </template>

    <Grid />
    <PassPopup ref="passPopupRef" type="csv" @confirm="handleExport" />
  </OpsListPanel>
</template>

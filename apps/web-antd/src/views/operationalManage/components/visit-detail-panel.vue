<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  TimePicker,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  exportVisitStatisticApi,
  fetchNoticeDetailDataApi,
} from '#/api/operationManage/game-notice';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import PassPopup from '#/components/security/pass-popup.vue';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useProjectConfig } from '#/composables/use-project-config';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { formatOperationDateTime } from '#/utils/operation-status';
import { VISIT_STATISTIC_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import {
  formatVisitDurationSeconds,
  formatVisitSource,
  parseProjectConfigOptions,
  resolveAppTypeLabel,
} from './visit-statistic-shared';

defineOptions({ name: 'VisitDetailPanel' });

const props = defineProps<{
  canExport?: boolean;
  canLoad?: boolean;
  dropdownKey: 'DialogDropDownList' | 'MailDropDownList';
  group: 'Dialog' | 'Mail';
  titleId: number | string;
}>();

interface VisitDetailRow {
  AppType?: number | string;
  BeginTime?: number | string;
  EndTime?: number | string;
  LoginAccount?: string;
  Source?: unknown;
  Vip?: number | string;
  VisitDuration?: number | string;
  [key: string]: unknown;
}

const router = useRouter();
const { projectConfig } = useProjectConfig();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const exportLoading = ref(false);
const totalCount = ref(0);
const tableRows = ref<VisitDetailRow[]>([]);

/**
 * 对齐旧站 noticeDetail/emailDetail：
 * getBeforeDateStr(1)～getBeforeDateStr(1,false)（GLOBAL days-1 → 今天）
 */
const defaultRange = getTodayRangeSeconds();
const filterPlayerId = ref('');
const filterSubGroup = ref<number | string>('');
const filterAppType = ref<number | string>('');
const filterVisitRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const filterLeaveRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const filterDurationRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const pageOptions = computed(() =>
  parseProjectConfigOptions(projectConfig.value, props.dropdownKey),
);
const deviceOptions = computed(() =>
  parseProjectConfigOptions(projectConfig.value, 'VisitDeviceModel'),
);

const pageSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...pageOptions.value.map((item) => ({
    label: item.Name,
    value: item.Value,
  })),
]);

const deviceSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...deviceOptions.value.map((item) => ({
    label: item.Name,
    value: item.Value,
  })),
]);

function buildQuery(page?: { currentPage: number; pageSize: number }) {
  const fallback = getTodayRangeSeconds();
  const [visitBegin, visitEnd] = filterVisitRange.value || [];
  const leave = filterLeaveRange.value;
  const duration = filterDurationRange.value;
  const query: Record<string, unknown> = {
    AppType: filterAppType.value,
    DurationMax: duration?.[1] ? duration[1].format('HH:mm:ss') : '',
    DurationMin: duration?.[0] ? duration[0].format('HH:mm:ss') : '',
    Group: props.group,
    Key: props.titleId,
    // 对齐旧站 SearchTypeTwo/monthRangeDate：保留 RangePicker 时分秒
    LeaveBeginTime: leave?.[0] ? leave[0].unix() : '',
    LeaveEndTime: leave?.[1] ? leave[1].unix() : '',
    PlayerId:
      filterPlayerId.value.trim() === '' ? '-1' : filterPlayerId.value.trim(),
    SubGroup: filterSubGroup.value,
    VisitBeginTime: visitBegin ? visitBegin.unix() : fallback.BeginTime,
    VisitEndTime: visitEnd ? visitEnd.unix() : fallback.EndTime,
  };
  if (page) {
    query.Page = page.currentPage;
    query.PageSize = page.pageSize;
  }
  return query;
}

const gridOptions: VxeTableGridOptions<VisitDetailRow> = {
  columns: [
    { type: 'seq', title: '序号', width: 70 },
    {
      field: 'BeginTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '访问时间',
    },
    {
      field: 'Source',
      formatter: ({ cellValue }) => formatVisitSource(cellValue),
      minWidth: 140,
      title: '访问页面',
    },
    {
      field: 'EndTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '离开时间',
    },
    {
      field: 'VisitDuration',
      formatter: ({ cellValue }) => formatVisitDurationSeconds(cellValue),
      minWidth: 110,
      title: '访问时长',
    },
    {
      field: 'AppType',
      formatter: ({ cellValue }) =>
        resolveAppTypeLabel(cellValue, deviceOptions.value),
      minWidth: 110,
      title: '访问设备',
    },
    {
      field: 'LoginAccount',
      minWidth: 120,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'Vip',
      minWidth: 90,
      title: 'VIP等级',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: props.canLoad !== false,
    ajax: {
      query: async ({ page }) => {
        if (props.canLoad === false) {
          totalCount.value = 0;
          tableRows.value = [];
          return { items: [], total: 0 };
        }
        const result = await fetchNoticeDetailDataApi(buildQuery(page));
        const items = (result.Items || []) as VisitDetailRow[];
        tableRows.value = items;
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

function handleSearch() {
  if (props.canLoad === false) {
    message.warning('无明细数据查询权限');
    return;
  }
  gridApi.reload();
}

function handleReset() {
  filterPlayerId.value = '';
  filterSubGroup.value = '';
  filterAppType.value = '';
  filterLeaveRange.value = undefined;
  filterDurationRange.value = undefined;
  const range = getTodayRangeSeconds();
  filterVisitRange.value = [
    dayjs.unix(range.BeginTime),
    dayjs.unix(range.EndTime),
  ];
  handleSearch();
}

function handleExportClick() {
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(VISIT_STATISTIC_EXPORT_PAGE_ID, {
    ...buildQuery(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportVisitStatisticApi({
      ...buildQuery(),
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
</script>

<template>
  <OpsListPanel>
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerId"
          allow-clear
          placeholder="请输入"
          style="width: 260px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">访问页面</span>
        <Select
          v-model:value="filterSubGroup"
          style="width: 160px"
          :options="pageSelectOptions"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">访问时间</span>
        <DatePicker.RangePicker
          v-model:value="filterVisitRange"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">离开时间</span>
        <DatePicker.RangePicker
          v-model:value="filterLeaveRange"
          show-time
          allow-clear
          format="YYYY-MM-DD HH:mm:ss"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">访问时长</span>
        <TimePicker.RangePicker
          v-model:value="filterDurationRange"
          format="HH:mm:ss"
          allow-clear
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">访问设备</span>
        <Select
          v-model:value="filterAppType"
          style="width: 140px"
          :options="deviceSelectOptions"
        />
      </div>
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
      <Button
        v-if="canExport"
        :loading="exportLoading"
        @click="handleExportClick"
      >
        导出 CSV
      </Button>
    </template>

    <div v-if="canLoad === false" class="py-10 text-center text-gray-400">
      无明细数据查询权限
    </div>
    <Grid v-else>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
    </Grid>

    <PassPopup
      ref="passPopupRef"
      type="csv"
      @confirm="handleExport"
    />
  </OpsListPanel>
</template>

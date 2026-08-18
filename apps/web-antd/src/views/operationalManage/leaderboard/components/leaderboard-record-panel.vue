<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref, watch } from 'vue';

import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';

import {
  exportLeaderboardRecordApi,
  fetchLeaderboardRecordApi,
} from '#/api/operationManage/leaderboard';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { VOUCHER_TYPE_MAP } from '#/utils/operation-status';
import { LEADERBOARD_RECORD_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import {
  LEADERBOARD_TYPE_OPTIONS,
  formatLeaderboardAmount,
  formatLeaderboardClaimStatus,
  formatLeaderboardDateTime,
  formatLeaderboardScore,
  formatLeaderboardType,
  resolveLeaderboardTitle,
  resolveVoucherName,
} from './leaderboard-shared';

defineOptions({ name: 'LeaderboardRecordPanel' });

const props = defineProps<{
  initialActivityId?: string;
}>();

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const canExport = checkPermission(13436);
const exportLoading = ref(false);
const totalCount = ref(0);

const filterActivityId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const filterChannelIds = ref<Array<number | string>>([]);
const filterStatus = ref<number>(-1);
const filterActivityType = ref<number | string>('');
const filterVipLevel = ref<number | string>(-1);
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
/** 对齐旧站：Ranking / -Ranking */
const sortField = ref('');

const typeFilterOptions = LEADERBOARD_TYPE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value === '' ? '' : item.value,
}));

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  const channelIds = filterChannelIds.value.filter(Boolean).join(',');
  return {
    ActivityId: filterActivityId.value.trim(),
    ActivityType:
      filterActivityType.value === '' ? '' : filterActivityType.value,
    ChannelId: channelIds,
    // record 接口要求 YYYY-MM-DD；传 unix 会 status=10037
    EndTime: end ? end.format('YYYY-MM-DD') : '',
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    PackageId: filterPackageId.value ?? '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    Sort: sortField.value,
    StartTime: begin ? begin.format('YYYY-MM-DD') : '',
    Status: filterStatus.value,
    VipLevel:
      filterVipLevel.value === -1 || filterVipLevel.value === ''
        ? ''
        : filterVipLevel.value,
  };
}

function buildExportQuery() {
  const { Page: _page, PageSize: _size, ...rest } = buildQuery({
    currentPage: 1,
    pageSize: 20,
  });
  return rest;
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'ActivityId', minWidth: 90, title: '活动ID' },
    {
      field: 'ReceiveTime',
      formatter: ({ cellValue }) =>
        formatLeaderboardDateTime(cellValue as string),
      minWidth: 160,
      title: '领取时间',
    },
    {
      field: 'Status',
      formatter: ({ cellValue }) => formatLeaderboardClaimStatus(cellValue),
      minWidth: 100,
      title: '领取状态',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    { field: 'LoginAccount', minWidth: 120, slots: { default: 'loginAccount' }, title: '游戏账号' },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP ${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    { field: 'Ranking', minWidth: 80, title: '排名', sortable: true },
    {
      field: 'LangText',
      formatter: ({ cellValue }) => resolveLeaderboardTitle(cellValue),
      minWidth: 140,
      title: '活动标题',
    },
    {
      field: 'ActivityType',
      formatter: ({ cellValue }) => formatLeaderboardType(cellValue),
      minWidth: 110,
      title: '活动类型',
    },
    {
      field: 'Score',
      formatter: ({ row, cellValue }) =>
        formatLeaderboardScore(
          row.ActivityType as number | string | undefined,
          cellValue as number | string | undefined,
        ),
      minWidth: 110,
      title: '排行成绩',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatLeaderboardAmount(cellValue),
      minWidth: 100,
      title: '彩金奖励',
    },
    {
      field: 'Draw',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : String(cellValue),
      minWidth: 100,
      title: '流水倍数',
    },
    {
      field: 'Integral',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : String(cellValue),
      minWidth: 90,
      title: '积分',
    },
    {
      field: 'VoucherLangText',
      formatter: ({ cellValue }) => resolveVoucherName(cellValue),
      minWidth: 120,
      title: '票券名称',
    },
    {
      field: 'VoucherType',
      formatter: ({ cellValue }) =>
        VOUCHER_TYPE_MAP[Number(cellValue)] || String(cellValue ?? '-'),
      minWidth: 110,
      title: '票券类型',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page, sorts }) => {
        const sort = Array.isArray(sorts) ? sorts[0] : undefined;
        if (sort?.field && sort.order === 'asc') {
          sortField.value = String(sort.field);
        } else if (sort?.field && sort.order === 'desc') {
          sortField.value = `-${sort.field}`;
        } else {
          sortField.value = '';
        }
        const result = await fetchLeaderboardRecordApi(buildQuery(page));
        const items = result.Items || [];
        totalCount.value = Number(result.Pagination?.MaxCount || items.length);
        return {
          items,
          total: totalCount.value,
        };
      },
    },
    sort: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterActivityId.value = props.initialActivityId || '';
  filterLoginAccount.value = '';
  filterPackageId.value = undefined;
  filterChannelIds.value = [];
  filterStatus.value = -1;
  filterActivityType.value = '';
  filterVipLevel.value = -1;
  filterDateRange.value = undefined;
  sortField.value = '';
  gridApi.reload();
}

function handleExportClick() {
  if (!canExport) {
    return;
  }
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(LEADERBOARD_RECORD_EXPORT_PAGE_ID, {
    ...buildExportQuery(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportLeaderboardRecordApi({
      ...buildExportQuery(),
      ...payload,
    });
    if (result?.Id && Number(result.Status) === 0) {
      Modal.confirm({
        content: '导出任务已创建，是否前往导出管理下载？',
        okText: '前往',
        title: '导出成功',
        onOk: () => {
          router.push('/operationalManage/downloadCsvManage').catch(() => {
            // route may differ by menu config
          });
        },
      });
      return;
    }
    message.error(String(result?.Remark || '导出失败'));
  } finally {
    exportLoading.value = false;
  }
}

watch(
  () => props.initialActivityId,
  (value) => {
    if (value) {
      filterActivityId.value = value;
      gridApi.reload();
    }
  },
);

onMounted(() => {
  if (props.initialActivityId) {
    filterActivityId.value = props.initialActivityId;
  }
  gridApi.reload();
});
</script>

<template>
  <div>
    <div class="ops-query-scope mb-4">
    <div class="ops-query-filters">
            <Space.Compact>
        <span class="query-field-addon">产品包</span>
        <Select
          v-model:value="filterPackageId"
          allow-clear
         
          :field-names="{ label: 'PackageName', value: 'PackageId' }"
          :options="packageOptions"
          placeholder="请选择产品包"
        />
      </Space.Compact>
      <Space.Compact>
        <span class="query-field-addon">渠道号</span>
        <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterActivityId"
          allow-clear
          placeholder="请输入活动ID"
        >
          <template #addonBefore>活动ID</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          @change="
            filterLoginAccount = String(filterLoginAccount || '')
              .trim()
              .toLowerCase()
          "
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <Select
        v-model:value="filterStatus"
       
        :options="[
          { label: '全部', value: -1 },
          { label: '未领取', value: 0 },
          { label: '已领取', value: 1 },
        ]"
      />
      <Space.Compact>
        <span class="query-field-addon">活动类型</span>
        <Select
          v-model:value="filterActivityType"
          allow-clear
         
          :options="typeFilterOptions"
          placeholder="请选择活动类型"
        />
      </Space.Compact>
      <Select
        v-model:value="filterVipLevel"
       
        :options="VIP_LEVEL_OPTIONS"
      />
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" precision="date" />
        </div>
        <div class="query-filter-actions">
          <Space>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
        <Button
          v-if="canExport"
          :loading="exportLoading"
          @click="handleExportClick"
        >
          导出 CSV
        </Button>
        <Button v-else disabled title="需要权限 13436">导出 CSV</Button>
      </Space>
        </div>
    </div>
  </div>
    <Grid>
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
  </div>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Result,
  Select,
  message,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';

import {
  exportRewardPointRecordApi,
  fetchRewardPointRecordApi,
} from '#/api/operationManage/reward-mall';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ChannelSelect from '#/components/global/channel-select.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatActivityType } from '#/utils/bonus-reward';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { formatOperationDateTime } from '#/utils/operation-status';
import {
  PLAYER_STATUS_OPTIONS,
  formatPlayerStatus,
} from '#/utils/player-status';
import { REWARD_POINT_RECORD_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import {
  REWARD_POINT_BONUS_CATEGORY_OPTIONS,
  REWARD_POINT_BONUS_TYPE_OPTIONS,
  REWARD_POINT_SEND_TYPE_OPTIONS,
  REWARD_VIP_FILTER_OPTIONS,
  formatRewardPointBonusCategory,
  formatRewardPointBonusType,
  formatRewardPointSendType,
  resolveLangField,
} from './reward-mall-shared';

defineOptions({ name: 'PointsRecordPanel' });

interface PointsRecordRow {
  ActivityType?: number | string;
  BonusCategory?: number | string;
  BonusTitle?: string;
  BonusType?: number;
  ChannelId?: number | string;
  LangText?: unknown;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  PlayerStatus?: number;
  Point?: number | string;
  SendType?: number;
  ApplyTime?: number | string;
  Username?: string;
  VipLevel?: number | string;
}

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canView = computed(() => checkPermission(13333));
const canExport = computed(() =>
  checkPermission(REWARD_POINT_RECORD_EXPORT_PAGE_ID),
);

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const exportLoading = ref(false);
const totalCount = ref(0);

/** 对齐旧站 pointsRecord：getBeforeDateTimestamp(1,false)～今天 23:59 */
const defaultRange = getTodayRangeSeconds();

const filterLoginAccount = ref('');
const filterPlayerStatus = ref<number | string>(-1);
const filterOrderId = ref('');
const filterBonusTitle = ref('');
const filterUsername = ref('');
const filterBonusType = ref<number | string>('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterPackageId = ref<number | string>('');
const filterVipLevels = ref<Array<number | string>>([]);
const filterBonusCategory = ref<number | string>(-1);
const filterSendType = ref<number | string>(-1);
const filterApplyRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);

function channelIdsParam() {
  return filterChannelIds.value.filter(Boolean).join(',');
}

function vipLevelsParam() {
  return filterVipLevels.value
    .filter((v) => v !== undefined && v !== null)
    .join(',');
}

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterApplyRange.value || [];
  return {
    ApplyTimeBegin: begin
      ? begin.startOf('day').unix()
      : defaultRange.BeginTime,
    ApplyTimeEnd: end ? end.endOf('day').unix() : defaultRange.EndTime,
    BonusCategory: filterBonusCategory.value,
    BonusTitle: filterBonusTitle.value.trim(),
    BonusType: filterBonusType.value,
    ChannelId: channelIdsParam(),
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    PlayerStatus: filterPlayerStatus.value,
    SendType: filterSendType.value,
    Username: filterUsername.value.trim(),
    VipLevel: vipLevelsParam(),
  };
}

function buildExportQuery() {
  const { Page: _page, PageSize: _size, ...rest } = buildQuery({
    currentPage: 1,
    pageSize: 20,
  });
  return rest;
}

function resolveBonusTitle(row: PointsRecordRow) {
  if (!row.LangText) {
    return row.BonusTitle || '-';
  }
  return resolveLangField(row.LangText, 'Name', row.BonusTitle || '-');
}

const gridOptions: VxeTableGridOptions<PointsRecordRow> = {
  columns: [
    {
      field: 'OrderId',
      minWidth: 170,
      showOverflow: 'tooltip',
      title: '订单号',
    },
    {
      field: 'LoginAccount',
      minWidth: 150,
      slots: { default: 'loginAccount' },
      title: '游戏账号(玩家状态)',
    },
    { field: 'PackageName', minWidth: 110, title: '所属产品' },
    { field: 'Username', minWidth: 110, slots: { default: 'username' }, title: '代理账号' },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    {
      field: 'RewardType',
      formatter: () => '积分',
      minWidth: 80,
      title: '奖励类型',
    },
    {
      field: 'BonusType',
      formatter: ({ cellValue }) => formatRewardPointBonusType(cellValue),
      minWidth: 120,
      title: '红利类型',
    },
    {
      field: 'BonusTitle',
      formatter: ({ row }) => resolveBonusTitle(row),
      minWidth: 140,
      showOverflow: 'tooltip',
      title: '红利标题',
    },
    {
      field: 'BonusCategory',
      formatter: ({ row }) =>
        formatRewardPointBonusCategory(
          row,
          formatActivityType(row.ActivityType),
        ),
      minWidth: 110,
      title: '活动分类',
    },
    {
      field: 'SendType',
      formatter: ({ cellValue }) => formatRewardPointSendType(cellValue),
      minWidth: 100,
      title: '发放方式',
    },
    { field: 'Point', minWidth: 90, title: '红利金额' },
    {
      field: 'ApplyTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '申请时间',
    },
    {
      field: 'status',
      formatter: () => '已领取',
      minWidth: 90,
      title: '状态',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRewardPointRecordApi(buildQuery(page));
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

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterPlayerStatus.value = -1;
  filterOrderId.value = '';
  filterBonusTitle.value = '';
  filterUsername.value = '';
  filterBonusType.value = '';
  filterChannelIds.value = [];
  filterPackageId.value = '';
  filterVipLevels.value = [];
  filterBonusCategory.value = -1;
  filterSendType.value = -1;
  filterApplyRange.value = [
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
  passPopupRef.value?.validate(REWARD_POINT_RECORD_EXPORT_PAGE_ID, {
    ...buildExportQuery(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportRewardPointRecordApi({
      ...buildExportQuery(),
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
  if (canView.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canView">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="玩家账号"
        style="width: 230px"
      >
        <template #addonBefore>玩家账号</template>
      </Input>
      <Select
        v-model:value="filterPlayerStatus"
        allow-clear
        class="w-28"
        :options="[{ label: '全部', value: -1 }, ...PLAYER_STATUS_OPTIONS]"
        placeholder="玩家状态"
      />
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单号"
        style="width: 230px"
      >
        <template #addonBefore>订单号</template>
      </Input>
      <Input
        v-model:value="filterBonusTitle"
        allow-clear
        placeholder="红利标题"
        style="width: 220px"
      >
        <template #addonBefore>红利标题</template>
      </Input>
      <Input
        v-model:value="filterUsername"
        allow-clear
        placeholder="代理账号"
        style="width: 220px"
      >
        <template #addonBefore>代理账号</template>
      </Input>
      <Select
        v-model:value="filterBonusType"
        allow-clear
        class="w-36"
        :options="REWARD_POINT_BONUS_TYPE_OPTIONS"
        placeholder="红利类型"
      />
      <ChannelSelect v-model:value="filterChannelIds" style="width: 200px" />
      <Select
        v-model:value="filterPackageId"
        allow-clear
        class="w-36"
        :options="
          packageOptions.map((item) => ({
            label: item.PackageName,
            value: item.PackageId,
          }))
        "
        placeholder="产品名称"
        show-search
      />
      <Select
        v-model:value="filterVipLevels"
        allow-clear
        class="w-40"
        mode="multiple"
        :max-tag-count="1"
        :options="REWARD_VIP_FILTER_OPTIONS.filter((item) => item.value !== -1)"
        placeholder="VIP等级"
      />
      <Select
        v-model:value="filterBonusCategory"
        allow-clear
        class="w-32"
        :options="REWARD_POINT_BONUS_CATEGORY_OPTIONS"
        placeholder="活动分类"
      />
      <Select
        v-model:value="filterSendType"
        allow-clear
        class="w-32"
        :options="REWARD_POINT_SEND_TYPE_OPTIONS"
        placeholder="发放方式"
      />
      <div class="flex items-center gap-1">
        <span class="text-xs text-gray-500">申请时间</span>
        <DatePicker.RangePicker v-model:value="filterApplyRange" />
      </div>
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button @click="handleReset">重置</Button>
      <Button
        v-if="canExport"
        :loading="exportLoading"
        type="primary"
        @click="handleExportClick"
      >
        导出
      </Button>
    </div>

    <Grid>
      <template #username="{ row }">
        <AgencyAccountLink
          :admin-id="resolveAgencyAdminId(row)"
          :username="row.Username"
        />
      </template>
      <template #loginAccount="{ row }">
        <div class="whitespace-pre-line">
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId"
          />
          <div class="text-xs text-gray-400">
            ({{ formatPlayerStatus(row.PlayerStatus) }})
          </div>
        </div>
      </template>
    </Grid>

    <PassPopup
      ref="passPopupRef"
      type="csv"
      @confirm="handleExport"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 13333 才能查看积分记录"
    title="无权限"
  />
</template>

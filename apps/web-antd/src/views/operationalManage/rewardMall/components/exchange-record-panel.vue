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
  Tag,
  message,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';

import {
  exportRewardExchangeRecordApi,
  fetchRewardExchangeRecordApi,
  fetchRewardProductTagListApi,
} from '#/api/operationManage/reward-mall';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import ChannelSelect from '#/components/global/channel-select.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { getTodayRangeSeconds } from '#/utils/date-range';
import { formatOperationDateTime } from '#/utils/operation-status';
import { formatPlayerStatus } from '#/utils/player-status';
import { REWARD_EXCHANGE_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import {
  REWARD_PRODUCT_TYPE_FILTER_OPTIONS,
  REWARD_VIP_FILTER_OPTIONS,
  REWARD_WATER_REQUIRE_OPTIONS,
  formatRewardExchangeStatus,
  formatRewardIsWater,
  getRewardExchangeStatusColor,
  resolveLangField,
} from './reward-mall-shared';

defineOptions({ name: 'ExchangeRecordPanel' });

interface ExchangeRecordRow {
  ChannelId?: number | string;
  ExchangePoints?: number | string;
  ExchangeStatus?: number;
  ExchangeTime?: number | string;
  IsWater?: number;
  LangText?: unknown;
  LoginAccount?: string;
  OrderId?: string;
  PackageName?: string;
  PlayerId?: number | string;
  PlayerStatus?: number;
  ProductId?: number | string;
  ProductTag?: number | string;
  ProductTagLangText?: unknown;
  ProductType?: number;
  RewardMulti?: number | string;
  VipLevel?: number | string;
}

const router = useRouter();
const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canView = computed(() => checkPermission(13331));
const canExport = computed(() =>
  checkPermission(REWARD_EXCHANGE_EXPORT_PAGE_ID),
);

const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const exportLoading = ref(false);
const totalCount = ref(0);
const productTagOptions = ref<Array<{ label: string; value: number | string }>>(
  [],
);

/** 对齐旧站 exchangeRecord：getBeforeDateTimestamp(1,false)～今天 23:59 */
const defaultRange = getTodayRangeSeconds();

const filterProductName = ref('');
const filterProductType = ref<number | string>('');
const filterExchangeRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const filterProductTag = ref<number | string>('');
const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterChannelIds = ref<Array<number | string>>([]);
const filterPackageId = ref<number | string>('');
const filterVipLevels = ref<Array<number | string>>([]);
const filterIsWater = ref<number | string>('');

async function loadProductTags() {
  try {
    const result = await fetchRewardProductTagListApi();
    productTagOptions.value = (result.Items || []).map((item) => ({
      label: resolveLangField(
        (item as { LangText?: unknown }).LangText,
        'Name',
        String((item as { Id?: unknown }).Id ?? ''),
      ),
      value: (item as { Id?: number | string }).Id ?? '',
    }));
  } catch {
    productTagOptions.value = [];
  }
}

function channelIdsParam() {
  return filterChannelIds.value.filter(Boolean).join(',');
}

function vipLevelsParam() {
  return filterVipLevels.value
    .filter((v) => v !== undefined && v !== null)
    .join(',');
}

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterExchangeRange.value || [];
  return {
    ChannelId: channelIdsParam(),
    ExchangeTimeBegin: begin
      ? begin.startOf('day').unix()
      : defaultRange.BeginTime,
    ExchangeTimeEnd: end ? end.endOf('day').unix() : defaultRange.EndTime,
    IsWater: filterIsWater.value,
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    ProductName: filterProductName.value.trim(),
    ProductTag: filterProductTag.value,
    ProductType: filterProductType.value,
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

function resolveProductName(row: ExchangeRecordRow) {
  return resolveLangField(row.LangText, 'Name', String(row.ProductId ?? '-'));
}

function resolveProductTagName(row: ExchangeRecordRow) {
  if (row.ProductTagLangText) {
    return resolveLangField(row.ProductTagLangText, 'Name');
  }
  return (
    productTagOptions.value.find(
      (item) => String(item.value) === String(row.ProductTag),
    )?.label || '-'
  );
}

const gridOptions: VxeTableGridOptions<ExchangeRecordRow> = {
  columns: [
    { type: 'seq', minWidth: 60, title: '序号' },
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
    { field: 'ChannelId', minWidth: 100, title: '所属渠道' },
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
      field: 'ProductType',
      formatter: ({ cellValue }) =>
        REWARD_PRODUCT_TYPE_FILTER_OPTIONS.find(
          (item) => item.value === Number(cellValue),
        )?.label || String(cellValue ?? '-'),
      minWidth: 100,
      title: '商品类型',
    },
    {
      field: 'ProductName',
      formatter: ({ row }) =>
        `${resolveProductName(row)}/${row.ProductId ?? '-'}`,
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '商品名称/商品ID',
    },
    {
      field: 'ProductTag',
      formatter: ({ row }) => resolveProductTagName(row),
      minWidth: 120,
      title: '商品页签',
    },
    {
      field: 'ExchangePoints',
      formatter: ({ cellValue }) => `${cellValue ?? 0} 积分`,
      minWidth: 100,
      title: '兑换要求',
    },
    {
      field: 'IsWater',
      formatter: ({ cellValue }) => formatRewardIsWater(cellValue),
      minWidth: 90,
      title: '流水要求',
    },
    { field: 'RewardMulti', minWidth: 100, title: '彩金流水倍数' },
    {
      field: 'ExchangeTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 170,
      title: '兑换时间',
    },
    {
      field: 'ExchangeStatus',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRewardExchangeRecordApi(buildQuery(page));
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
  filterProductName.value = '';
  filterProductType.value = '';
  filterExchangeRange.value = [
    dayjs.unix(defaultRange.BeginTime),
    dayjs.unix(defaultRange.EndTime),
  ];
  filterProductTag.value = '';
  filterOrderId.value = '';
  filterLoginAccount.value = '';
  filterChannelIds.value = [];
  filterPackageId.value = '';
  filterVipLevels.value = [];
  filterIsWater.value = '';
  gridApi.reload();
}

function handleExportClick() {
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(REWARD_EXCHANGE_EXPORT_PAGE_ID, {
    ...buildExportQuery(),
  });
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportRewardExchangeRecordApi({
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
  void loadProductTags();
  if (canView.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canView">
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <Input
        v-model:value="filterProductName"
        allow-clear
        placeholder="商品名称"
        style="width: 160px"
      />
      <Select
        v-model:value="filterProductType"
        allow-clear
        class="w-32"
        :options="REWARD_PRODUCT_TYPE_FILTER_OPTIONS"
        placeholder="商品类型"
      />
      <DatePicker.RangePicker
        v-model:value="filterExchangeRange"
        :placeholder="['兑换开始', '兑换结束']"
      />
      <Select
        v-model:value="filterProductTag"
        allow-clear
        class="w-32"
        :options="productTagOptions"
        placeholder="商品页签"
        show-search
      />
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单编号"
        style="width: 160px"
      />
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 150px"
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
        placeholder="所属产品"
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
        v-model:value="filterIsWater"
        allow-clear
        class="w-28"
        :options="REWARD_WATER_REQUIRE_OPTIONS"
        placeholder="流水要求"
      />
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
      <template #status="{ row }">
        <Tag :color="getRewardExchangeStatusColor(row.ExchangeStatus)">
          {{ formatRewardExchangeStatus(row.ExchangeStatus) }}
        </Tag>
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
    sub-title="需要权限 13331 才能查看兑换记录"
    title="无权限"
  />
</template>

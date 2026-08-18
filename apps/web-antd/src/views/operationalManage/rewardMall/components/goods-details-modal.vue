<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref, watch } from 'vue';

import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  exportRewardExchangeRecordApi,
  fetchRewardExchangeRecordApi,
} from '#/api/operationManage/reward-mall';
import ChannelSelect from '#/components/global/channel-select.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PlayerStatusTag from '#/components/global/player-status-tag.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { VIP_LEVEL_OPTIONS } from '#/utils/bonus-reward';
import { formatOperationDateTime } from '#/utils/operation-status';
import { REWARD_EXCHANGE_EXPORT_PAGE_ID } from '#/utils/security-page-ids';

import { resolveProductName } from './reward-goods-shared';

defineOptions({ name: 'GoodsDetailsModal' });

const props = defineProps<{
  product?: { Id: number | string; LangText?: unknown } | null;
}>();

const open = defineModel<boolean>('open', { default: false });

const { packageOptions } = useOperationOptions();
const passPopupRef = ref<InstanceType<typeof PassPopup>>();

const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterVipLevel = ref<Array<number | string>>([]);
const filterChannelIds = ref<Array<number | string>>([]);
const filterPackageId = ref<number | string>('');
const filterExchangeDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const filterRegDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();
const exportLoading = ref(false);
const totalCount = ref(0);

const title = ref('商品详情');

watch(
  () => props.product,
  (product) => {
    title.value = product
      ? `商品名称：${resolveProductName(product.LangText) || product.Id}`
      : '商品详情';
  },
);

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [exchangeBegin, exchangeEnd] = filterExchangeDateRange.value || [];
  const [regBegin, regEnd] = filterRegDateRange.value || [];
  return {
    // 与兑换记录列表一致：多选拼成逗号串，避免 qs 数组 brackets
    ChannelId: filterChannelIds.value.filter(Boolean).join(','),
    ExchangeTimeBegin: exchangeBegin ? exchangeBegin.unix() : '',
    ExchangeTimeEnd: exchangeEnd ? exchangeEnd.unix() : '',
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    OrderId: filterOrderId.value.trim(),
    PackageId: filterPackageId.value ?? '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    ProductId: props.product?.Id ?? '',
    RegisterTimeBegin: regBegin ? regBegin.unix() : '',
    RegisterTimeEnd: regEnd ? regEnd.unix() : '',
    VipLevel: filterVipLevel.value
      .filter((v) => v !== undefined && v !== null && v !== '')
      .join(','),
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
    { type: 'seq', minWidth: 60, title: '序号' },
    { field: 'OrderId', minWidth: 140, title: '订单号' },
    {
      field: 'LoginAccount',
      minWidth: 160,
      slots: { default: 'loginAccount' },
      title: '玩家账号(状态)',
    },
    { field: 'ChannelId', minWidth: 100, title: '所属渠道' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'VipLevel', minWidth: 90, title: 'VIP等级' },
    {
      field: 'PlayerRegisterTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as number),
      minWidth: 160,
      title: '注册时间',
    },
  ],
  height: 500,
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!props.product?.Id) {
          return { items: [], total: 0 };
        }
        const result = await fetchRewardExchangeRecordApi(buildQuery(page));
        const items = result.Items || [];
        totalCount.value = Number(result.Pagination?.MaxCount || items.length);
        return { items, total: totalCount.value };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

watch(open, (visible) => {
  if (visible) {
    handleReset();
  }
});

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterOrderId.value = '';
  filterLoginAccount.value = '';
  filterVipLevel.value = [];
  filterChannelIds.value = [];
  filterPackageId.value = '';
  filterExchangeDateRange.value = undefined;
  filterRegDateRange.value = undefined;
  gridApi.reload();
}

function handleExportClick() {
  if (totalCount.value < 1) {
    message.warning('暂无数据可导出');
    return;
  }
  passPopupRef.value?.validate(
    REWARD_EXCHANGE_EXPORT_PAGE_ID,
    buildExportQuery(),
  );
}

async function handleExport(payload: Record<string, unknown>) {
  exportLoading.value = true;
  try {
    const result = await exportRewardExchangeRecordApi({
      ...buildExportQuery(),
      ...payload,
    });
    if (result?.Id && Number(result.Status) === 0) {
      message.success('导出任务已创建，请前往导出管理下载');
      return;
    }
    message.error(String(result?.Remark || '导出失败'));
  } finally {
    exportLoading.value = false;
  }
}
</script>

<template>
  <Modal v-model:open="open" :footer="null" :title="title" width="92%">
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
              <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterExchangeDateRange" label="兑换时间" />
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterOrderId"
            allow-clear
            placeholder="请输入订单编号"
          >
            <template #addonBefore>订单编号</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterLoginAccount"
            allow-clear
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
        </div>
        <Space.Compact>
          <span class="query-field-addon">VIP等级</span>
          <Select
            v-model:value="filterVipLevel"
            allow-clear
           
            mode="multiple"
            :options="VIP_LEVEL_OPTIONS.filter((item) => item.value !== -1)"
            placeholder="请选择VIP等级"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">渠道号</span>
          <ChannelSelect v-model="filterChannelIds" placeholder="请输入渠道号" />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">所属产品</span>
          <Select
            v-model:value="filterPackageId"
            allow-clear
           
            :field-names="{ label: 'PackageName', value: 'PackageId' }"
            :options="packageOptions"
            placeholder="请选择所属产品"
          />
        </Space.Compact>
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterRegDateRange" label="注册时间" />
        </div>
        <div class="query-filter-actions">
          <Space>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
        </Space>
        <Button
        :loading="exportLoading"
        type="primary"
        @click="handleExportClick"
      >
        导出
      </Button>
        </div>
    </div>
  </div>

    <Grid>
      <template #loginAccount="{ row }">
        <div class="whitespace-pre-line">
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
          <div class="mt-1">
            <PlayerStatusTag
              :status="row.PlayerStatus as number | string | null"
              hide-normal
            />
          </div>
        </div>
      </template>
    </Grid>

    <PassPopup
      ref="passPopupRef"
      type="csv"
      @confirm="handleExport"
    />
  </Modal>
</template>

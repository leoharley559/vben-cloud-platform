<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerEasyRechargeItem } from '#/types/player-detail';

import { computed, onMounted, ref } from 'vue';

import { Button, DatePicker, Input, Result, Select, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchEasyRechargeListApi } from '#/api/operationManage/easy-recharge';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';
import {
  formatEasyRechargeStatus,
  getEasyRechargeStatusColor,
} from '#/utils/player-detail-maps';

defineOptions({ name: 'VoucherRechargeList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(12333));

const defaultRange = getYesterdayRangeSeconds();

const filterOrderId = ref('');
const filterGameOrderId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterExchangeCode = ref('');
const filterTradeOrderId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
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

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    DataSearchType: 0,
    DigitalDeliveryInfo: '',
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    ExchangeCode: filterExchangeCode.value,
    GameOrderId: filterGameOrderId.value,
    LoginAccount: filterLoginAccount.value,
    OrderId: filterOrderId.value,
    PackageId: filterPackageId.value,
    PayType: 212,
    TradeOrderId: filterTradeOrderId.value,
    VipLevel: -1,
  };
}

const gridOptions: VxeTableGridOptions<PlayerEasyRechargeItem> = {
  columns: [
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'GameOrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '游戏订单编号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'ExchangeCode',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '兑换码',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '充值金额',
    },
    {
      field: 'TradeOrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '买家订单号',
    },
    {
      field: 'DigitalDeliveryInfo',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '买家邮箱',
    },
    { field: 'CheckerName', minWidth: 120, title: '审核人' },
    {
      field: 'FinTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '审核时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchEasyRechargeListApi({
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

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

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
      <Input
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单编号"
        style="width: 200px"
      >
        <template #addonBefore>订单编号</template>
      </Input>
      <Input
        v-model:value="filterGameOrderId"
        allow-clear
        placeholder="游戏订单编号"
        style="width: 220px"
      >
        <template #addonBefore>游戏订单</template>
      </Input>
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 200px"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
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
      <Input
        v-model:value="filterExchangeCode"
        allow-clear
        placeholder="兑换码"
        style="width: 180px"
      >
        <template #addonBefore>兑换码</template>
      </Input>
      <Input
        v-model:value="filterTradeOrderId"
        allow-clear
        placeholder="买家订单号"
        style="width: 200px"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
    </div>

    <Grid>
      <template #status="{ row }">
        <Tag :color="getEasyRechargeStatusColor(row.Status)">
          {{ formatEasyRechargeStatus(row.Status) }}
        </Tag>
      </template>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="row.LoginAccount"
          :player-id="row.PlayerId"
        />
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12333 才能查看兑换码充值"
    title="无权限"
  />
</template>

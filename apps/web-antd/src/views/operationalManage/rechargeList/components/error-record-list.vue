<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import { Button, DatePicker, Input, Result, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchRechargeFailListApi } from '#/api/operationManage/recharge-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'RechargeErrorRecordList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(12641));

const defaultRange = getYesterdayRangeSeconds();
const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterGameOrderId = ref('');
const filterThirdOrderId = ref('');
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
    AmountType: 1,
    BeginTime: begin ? begin.startOf('day').unix() : defaultRange.BeginTime,
    DataSearchType: 0,
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    GameOrderId: filterGameOrderId.value,
    LoginAccount: filterLoginAccount.value,
    OrderId: filterOrderId.value,
    PackageId: filterPackageId.value,
    ThirdOrderId: filterThirdOrderId.value,
    TimeType: 1,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue as string),
      minWidth: 170,
      title: '创建时间',
    },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    {
      field: 'LoginAccount',
      minWidth: 140,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'RealName', minWidth: 100, title: '真实姓名' },
    { field: 'VipLevel', minWidth: 80, title: 'VIP' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'GameOrderId',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '游戏订单号',
    },
    {
      field: 'ThirdOrderId',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '三方订单号',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '申请金额',
    },
    {
      field: 'FailRemark',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '失败原因',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRechargeFailListApi({
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
        style="width: 260px"
      >
        <template #addonBefore>订单编号</template>
      </Input>
      <Input
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 260px"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
      <Input
        v-model:value="filterGameOrderId"
        allow-clear
        placeholder="游戏订单号"
        style="width: 260px"
      >
        <template #addonBefore>游戏订单号</template>
      </Input>
      <Input
        v-model:value="filterThirdOrderId"
        allow-clear
        placeholder="三方订单号"
        style="width: 260px"
      >
        <template #addonBefore>三方订单号</template>
      </Input>
      <Select
        v-model:value="filterPackageId"
        :options="
          packageOptions.map((item) => ({
            label: item.PackageName,
            value: item.PackageId,
          }))
        "
        allow-clear
        placeholder="所属产品"
        style="width: 160px"
      />
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
    </div>
    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
    </Grid>
  </div>
  <Result
    v-else
    status="403"
    sub-title="需要权限 12641 才能查看三方充值失败记录"
    title="无权限"
  />
</template>

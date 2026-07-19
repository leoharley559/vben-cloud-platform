<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WithdrawRevertedItem } from '#/types/withdraw-extra';

import { computed, onMounted, ref } from 'vue';

import { Button, DatePicker, Input, Result, Select, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchWithdrawRevertedListApi } from '#/api/operationManage/withdraw-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useOperationOptions } from '#/composables/use-operation-options';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'WithdrawThirdPartyRecord' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(13165));

const defaultRange = getYesterdayRangeSeconds();
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterOrderId = ref('');
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
    EndTime: end ? end.endOf('day').unix() : defaultRange.EndTime,
    LoginAccount: filterLoginAccount.value,
    OrderId: filterOrderId.value,
    PackageId: filterPackageId.value,
  };
}

const gridOptions: VxeTableGridOptions<WithdrawRevertedItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '冲正时间',
    },
    {
      field: 'OrderId',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '订单编号',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '冲正金额',
    },
    {
      field: 'Status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'HandlerName', minWidth: 120, title: '处理人' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchWithdrawRevertedListApi({
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
        v-model:value="filterOrderId"
        allow-clear
        placeholder="订单编号"
        style="width: 200px"
      >
        <template #addonBefore>订单编号</template>
      </Input>
      <DatePicker.RangePicker v-model:value="filterDateRange" />
      <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="row.LoginAccount"
          :player-id="row.PlayerId"
        />
      </template>
      <template #status="{ row }">
        <Tag>{{ Number(row.Status) === 1 ? '成功' : '处理中' }}</Tag>
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 13165 才能查看三方冲正记录"
    title="无权限"
  />
</template>

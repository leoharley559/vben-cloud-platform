<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchAppointmentWithdrawListApi } from '#/api/operationManage/activity';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityAppointmentRecordsPanel' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const canView = checkPermission(11912);

/** 对齐旧站 getBeforeDateStr(1)：默认今天 00:00:00～23:59:59 */
function defaultDayRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  return [dayjs().startOf('day'), dayjs().endOf('day')];
}

const filterOrderId = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const filterWithdrawOrderId = ref('');
const withdrawTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(
  defaultDayRange(),
);
const awardTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(
  defaultDayRange(),
);

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    // 游戏账号对齐旧站强制小写
    LoginAccount: String(filterLoginAccount.value || '')
      .trim()
      .toLowerCase(),
    OrderId: filterOrderId.value || '',
    PackageId: filterPackageId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    WithdrawOrderId: filterWithdrawOrderId.value || '',
    // 旧站取款时间字段为 BeginTime/EndTime（非 WithdrawBeginTime）
    ...buildUnixRangeQuery(withdrawTimeRange.value, 'BeginTime', 'EndTime'),
    ...buildUnixRangeQuery(
      awardTimeRange.value,
      'AwardBeginTime',
      'AwardEndTime',
    ),
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'OrderId', minWidth: 140, title: '订单号' },
    { field: 'LoginAccount', minWidth: 120, slots: { default: 'loginAccount' }, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '产品包' },
    { field: 'ChannelName', minWidth: 120, title: '渠道' },
    {
      field: 'WithdrawTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '取款时间',
    },
    { field: 'WithdrawOrderId', minWidth: 140, title: '取款订单号' },
    {
      field: 'WithdrawAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '取款金额',
    },
    { field: 'Hour', minWidth: 90, title: '预约时长(h)' },
    {
      field: 'Rate',
      formatter: ({ cellValue }) =>
        cellValue !== undefined ? `${cellValue}%` : '-',
      minWidth: 90,
      title: '加送比例',
    },
    {
      field: 'BonusAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '彩金',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!canView) {
          return { items: [], total: 0 };
        }
        const result = await fetchAppointmentWithdrawListApi(buildQuery(page));
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <div>
    <div v-if="!canView" class="py-8 text-center text-gray-400">
      无预约取款明细查看权限 (11912)
    </div>
    <template v-else>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterOrderId"
          allow-clear
          placeholder="订单号"
          style="width: 230px"
        >
          <template #addonBefore>订单号</template>
        </Input>
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="游戏账号"
          style="width: 240px"
          @change="
            filterLoginAccount = String(filterLoginAccount || '')
              .trim()
              .toLowerCase()
          "
        >
          <template #addonBefore>游戏账号</template>
        </Input>
        <Select
          v-model:value="filterPackageId"
          allow-clear
          class="w-40"
          :options="packageOptions"
          placeholder="产品包"
        />
        <Input
          v-model:value="filterWithdrawOrderId"
          allow-clear
          placeholder="取款订单号"
          style="width: 260px"
        >
          <template #addonBefore>取款订单号</template>
        </Input>
        <DatePicker.RangePicker
          v-model:value="withdrawTimeRange"
          :placeholder="['取款开始', '取款结束']"
        />
        <DatePicker.RangePicker
          v-model:value="awardTimeRange"
          :placeholder="['派奖开始', '派奖结束']"
        />
        <Button type="primary" @click="gridApi.reload()">查询</Button>
        <Button
          @click="
            () => {
              filterOrderId = '';
              filterLoginAccount = '';
              filterPackageId = undefined;
              filterWithdrawOrderId = '';
              withdrawTimeRange = defaultDayRange();
              awardTimeRange = defaultDayRange();
              gridApi.reload();
            }
          "
        >
          重置
        </Button>
      </div>
      <Grid>
        <template #loginAccount="{ row }">
          <PlayerAccountLink
            :login-account="String(row.LoginAccount || '')"
            :player-id="row.PlayerId as number | string | undefined"
          />
        </template>
      </Grid>
    </template>
  </div>
</template>

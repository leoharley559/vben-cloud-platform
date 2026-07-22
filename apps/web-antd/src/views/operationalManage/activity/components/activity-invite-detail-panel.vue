<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, DatePicker, Input, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchInviteActivityListApi } from '#/api/operationManage/activity';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityInviteDetailPanel' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const canView = checkPermission(10329);

/** 对齐旧站 RegisterTime 默认 getBeforeDateStr(1)：今天 */
function defaultDayRange(): [dayjs.Dayjs, dayjs.Dayjs] {
  return [dayjs().startOf('day'), dayjs().endOf('day')];
}

const filterReferenceLoginAccount = ref('');
const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const registerTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>(
  defaultDayRange(),
);
const awardTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    DataSearchType: 0,
    LoginAccount: String(filterLoginAccount.value || '')
      .trim()
      .toLowerCase(),
    PackageId: filterPackageId.value || '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    ReferenceLoginAccount: String(filterReferenceLoginAccount.value || '')
      .trim()
      .toLowerCase(),
    ...buildUnixRangeQuery(
      registerTimeRange.value,
      'RegisterTimeBegin',
      'RegisterTimeEnd',
    ),
    ...buildUnixRangeQuery(
      awardTimeRange.value,
      'AwardTimeBegin',
      'AwardTimeEnd',
    ),
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'LoginAccount', minWidth: 130, title: '游戏账号' },
    { field: 'PackageName', minWidth: 120, title: '产品包' },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    { field: 'Username', minWidth: 120, title: '上级代理' },
    { field: 'ChannelId', minWidth: 100, title: '渠道ID' },
    {
      field: 'ReferenceLoginAccount',
      minWidth: 130,
      title: '推荐人账号',
    },
    {
      field: 'RegisterTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '注册时间',
    },
    {
      field: 'FirstRechargeAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '首存金额',
    },
    {
      field: 'AwardTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '派奖时间',
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
        const result = await fetchInviteActivityListApi(buildQuery(page));
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
      无邀请明细查看权限 (10329)
    </div>
    <template v-else>
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <Input
          v-model:value="filterReferenceLoginAccount"
          allow-clear
          placeholder="推荐人账号"
          style="width: 160px"
        />
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="游戏账号"
          style="width: 160px"
        />
        <Select
          v-model:value="filterPackageId"
          allow-clear
          class="w-40"
          :options="packageOptions"
          placeholder="产品包"
        />
        <DatePicker.RangePicker
          v-model:value="registerTimeRange"
          :placeholder="['注册开始', '注册结束']"
          show-time
        />
        <DatePicker.RangePicker
          v-model:value="awardTimeRange"
          :placeholder="['派奖开始', '派奖结束']"
          show-time
        />
        <Button type="primary" @click="gridApi.reload()">查询</Button>
        <Button
          @click="
            () => {
              filterReferenceLoginAccount = '';
              filterLoginAccount = '';
              filterPackageId = undefined;
              registerTimeRange = defaultDayRange();
              awardTimeRange = undefined;
              gridApi.reload();
            }
          "
        >
          重置
        </Button>
      </div>
      <Grid />
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, Input, Select, Space } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchInviteFriendRewardsApi } from '#/api/operationManage/invite-friend-activity';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import {
  formatInviteRewardRole,
  formatInviteRewardStatus,
  INVITE_REWARD_ROLE_OPTIONS,
  INVITE_REWARD_STATUS_OPTIONS,
} from './activity-invite-shared';
import { buildUnixRangeQuery } from './activity-shared';

defineOptions({ name: 'ActivityInviteRewardsPanel' });

const filterPlayerId = ref<null | number>(null);
const filterAccount = ref('');
const filterInviterId = ref<null | number>(null);
const filterInviteeId = ref<null | number>(null);
const filterRole = ref<string>();
const filterRewardStatus = ref<number>();
const filterBusinessOrderId = ref('');
const createTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    Account: String(filterAccount.value || '').trim(),
    BusinessOrderId: filterBusinessOrderId.value || '',
    InviteeId: filterInviteeId.value ?? '',
    InviterId: filterInviterId.value ?? '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    PlayerId: filterPlayerId.value ?? '',
    RewardStatus: filterRewardStatus.value ?? '',
    Role: filterRole.value || '',
    ...buildUnixRangeQuery(createTimeRange.value, 'BeginTime', 'EndTime'),
  };
}

function resetFilters() {
  filterPlayerId.value = null;
  filterAccount.value = '';
  filterInviterId.value = null;
  filterInviteeId.value = null;
  filterRole.value = undefined;
  filterRewardStatus.value = undefined;
  filterBusinessOrderId.value = '';
  createTimeRange.value = undefined;
  gridApi.reload();
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { minWidth: 60, title: '序号', type: 'seq', width: 60 },
    {
      field: 'CreatedAt',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '创建时间',
    },
    { field: 'Account', minWidth: 130, title: '发放账号' },
    { field: 'VipLevel', minWidth: 80, title: 'VIP' },
    {
      field: 'Role',
      formatter: ({ cellValue }) =>
        formatInviteRewardRole(String(cellValue || '')),
      minWidth: 120,
      title: '发放角色',
    },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 100,
      title: '发放金额',
    },
    { field: 'WaterMultiple', minWidth: 90, title: '流水倍数' },
    {
      field: 'WaterAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 100,
      title: '流水金额',
    },
    {
      field: 'RewardStatus',
      formatter: ({ cellValue }) =>
        formatInviteRewardStatus(cellValue as number),
      minWidth: 100,
      title: '发奖状态',
    },
    {
      field: 'FailReason',
      minWidth: 140,
      showOverflow: true,
      title: '失败原因',
    },
    {
      field: 'RewardTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '发奖时间',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchInviteFriendRewardsApi(buildQuery(page));
        const items = result?.Items || [];
        return {
          items,
          total: Number(result?.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <!-- <InputNumber
        v-model:value="filterPlayerId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="获奖玩家ID"
      /> -->
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterAccount"
            allow-clear
            placeholder="请输入发放账号"
          >
            <template #addonBefore>发放账号</template>
          </Input>
        </div>
        <!-- <InputNumber
        v-model:value="filterInviterId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="邀请人ID"
      /> -->
        <!-- <InputNumber
        v-model:value="filterInviteeId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="被邀请人ID"
      /> -->
        <Space.Compact>
          <span class="query-field-addon">奖励角色</span>
          <Select
            v-model:value="filterRole"
            allow-clear
            :options="INVITE_REWARD_ROLE_OPTIONS"
            placeholder="请选择奖励角色"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">发奖状态</span>
          <Select
            v-model:value="filterRewardStatus"
            allow-clear
            :options="INVITE_REWARD_STATUS_OPTIONS"
            placeholder="请选择发奖状态"
          />
        </Space.Compact>
        <!-- <Input
        v-model:value="filterBusinessOrderId"
        allow-clear
        placeholder="业务单号"
      /> -->
        <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="createTimeRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
          <Button @click="resetFilters">重置</Button>
        </div>
      </div>
    </div>
    <div class="mb-2 text-xs text-gray-400">
      筛选时间提交为 Unix 秒；发奖状态 / 角色枚举与对接文档一致。
    </div>

    <Grid />
  </div>
</template>

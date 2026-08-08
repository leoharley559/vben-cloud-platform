<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Button, DatePicker, Input, InputNumber, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchInviteFriendRelationsApi } from '#/api/operationManage/invite-friend-activity';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';
import {
  INVITE_RELATION_STATUS_OPTIONS,
  INVITE_SOURCE_OPTIONS,
  formatInviteRelationStatus,
  formatInviteSource,
} from './activity-invite-shared';

defineOptions({ name: 'ActivityInviteRelationsPanel' });

const filterInviterId = ref<number | null>(null);
const filterInviteeId = ref<number | null>(null);
const filterInviteeAccount = ref('');
const filterSource = ref<string>();
const filterRewardStatus = ref<number>();
const filterBusinessOrderId = ref('');
const bindTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    BusinessOrderId: filterBusinessOrderId.value || '',
    InviteeAccount: String(filterInviteeAccount.value || '').trim(),
    InviteeId: filterInviteeId.value ?? '',
    InviterId: filterInviterId.value ?? '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    RewardStatus: filterRewardStatus.value ?? '',
    Source: filterSource.value || '',
    ...buildUnixRangeQuery(bindTimeRange.value, 'BeginTime', 'EndTime'),
  };
}

function resetFilters() {
  filterInviterId.value = null;
  filterInviteeId.value = null;
  filterInviteeAccount.value = '';
  filterSource.value = undefined;
  filterRewardStatus.value = undefined;
  filterBusinessOrderId.value = '';
  bindTimeRange.value = undefined;
  gridApi.reload();
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Id', minWidth: 80, title: 'ID' },
    { field: 'InviterId', minWidth: 100, title: '邀请人ID' },
    { field: 'InviteeId', minWidth: 100, title: '被邀请人ID' },
    { field: 'InviteeAccount', minWidth: 130, title: '被邀请人账号' },
    {
      field: 'Source',
      formatter: ({ cellValue }) => formatInviteSource(String(cellValue || '')),
      minWidth: 90,
      title: '来源',
    },
    {
      field: 'BindTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '绑定时间',
    },
    { field: 'RegisterIp', minWidth: 130, title: '注册IP' },
    {
      field: 'RegisterDeviceId',
      minWidth: 140,
      showOverflow: true,
      title: '注册设备',
    },
    {
      field: 'QualifiedTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '达标时间',
    },
    {
      field: 'TotalDepositAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '充值金额',
    },
    { field: 'InviterTierSeq', minWidth: 90, title: '阶梯序号' },
    {
      field: 'InviterReward',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '邀请人奖励',
    },
    {
      field: 'InviteeReward',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '被邀请人奖励',
    },
    {
      field: 'RewardStatus',
      formatter: ({ cellValue }) =>
        formatInviteRelationStatus(cellValue as number),
      minWidth: 160,
      title: '关系状态',
    },
    {
      field: 'RewardTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '发奖时间',
    },
    { field: 'BusinessOrderId', minWidth: 160, title: '业务单号' },
    {
      field: 'RiskReason',
      minWidth: 140,
      showOverflow: true,
      title: '风控原因',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchInviteFriendRelationsApi(buildQuery(page));
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <InputNumber
        v-model:value="filterInviterId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="邀请人玩家ID"
        style="width: 150px"
      />
      <InputNumber
        v-model:value="filterInviteeId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="被邀请人玩家ID"
        style="width: 160px"
      />
      <Input
        v-model:value="filterInviteeAccount"
        allow-clear
        placeholder="被邀请人账号"
        style="width: 180px"
      />
      <Select
        v-model:value="filterSource"
        allow-clear
        class="w-32"
        :options="INVITE_SOURCE_OPTIONS"
        placeholder="来源"
      />
      <Select
        v-model:value="filterRewardStatus"
        allow-clear
        class="w-52"
        :options="INVITE_RELATION_STATUS_OPTIONS"
        placeholder="关系状态"
      />
      <Input
        v-model:value="filterBusinessOrderId"
        allow-clear
        placeholder="业务单号"
        style="width: 180px"
      />
      <DatePicker.RangePicker
        v-model:value="bindTimeRange"
        :placeholder="['绑定开始 UTC', '绑定结束 UTC']"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
    </div>
    <div class="mb-2 text-xs text-gray-400">
      筛选时间提交为 Unix 秒；关系状态文案与对接文档一致。
    </div>
    <Grid />
  </div>
</template>

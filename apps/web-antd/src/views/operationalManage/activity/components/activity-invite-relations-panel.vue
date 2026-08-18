<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import {
  Button,
  Input,
  InputNumber,
  Select,
  Space,
} from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
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
  formatInviteRiskReason,
  formatInviteSource,
} from './activity-invite-shared';

defineOptions({ name: 'ActivityInviteRelationsPanel' });

const filterInviterId = ref<number | null>(null);
const filterInviterAccount = ref('');
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
    InviterAccount: String(filterInviterAccount.value || '').trim(),
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
  filterInviterAccount.value = '';
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
    { minWidth: 60, title: '序号', type: 'seq', width: 60 },
    { field: 'InviterAccount', minWidth: 130, title: '邀请人账号' },
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
      field: 'TotalDepositAmount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '充值金额',
    },
    {
      field: 'InviterTierSeq',
      formatter: ({ cellValue }) => {
        const seq = Number(cellValue);
        if (!seq || Number.isNaN(seq)) return '-';
        return `第${seq}档`;
      },
      minWidth: 100,
      title: '奖励阶梯',
    },
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
      field: 'QualifiedTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '达标时间',
    },
    {
      field: 'RewardTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '发奖时间',
    },
    {
      field: 'RewardStatus',
      formatter: ({ cellValue }) =>
        formatInviteRelationStatus(cellValue as number),
      minWidth: 160,
      title: '关系状态',
    },
    {
      field: 'RiskReason',
      formatter: ({ cellValue }) =>
        formatInviteRiskReason(cellValue as string | string[] | null),
      minWidth: 140,
      showOverflow: true,
      title: '风控原因',
    },
    { field: 'BusinessOrderId', minWidth: 160, title: '业务单号' },
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
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <!-- <InputNumber
        v-model:value="filterInviterId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="邀请人玩家ID"
      /> -->
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterInviterAccount"
          allow-clear
          placeholder="请输入邀请人账号"
        >
          <template #addonBefore>邀请人账号</template>
        </Input>
      </div>
      <!-- <InputNumber
        v-model:value="filterInviteeId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="被邀请人玩家ID"
      /> -->
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterInviteeAccount"
          allow-clear
          placeholder="请输入被邀请人账号"
        >
          <template #addonBefore>被邀请人账号</template>
        </Input>
      </div>
      <!-- <Select
        v-model:value="filterSource"
        allow-clear
       
        :options="INVITE_SOURCE_OPTIONS"
        placeholder="来源"
      /> -->
      <Space.Compact>
        <span class="query-field-addon">关系状态</span>
        <Select
          v-model:value="filterRewardStatus"
          allow-clear
         
          :options="INVITE_RELATION_STATUS_OPTIONS"
          placeholder="请选择关系状态"
        />
      </Space.Compact>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterBusinessOrderId"
          allow-clear
          placeholder="请输入业务单号"
        >
          <template #addonBefore>业务单号</template>
        </Input>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="bindTimeRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
        </div>
    </div>
  </div>
    <Grid />
  </div>
</template>

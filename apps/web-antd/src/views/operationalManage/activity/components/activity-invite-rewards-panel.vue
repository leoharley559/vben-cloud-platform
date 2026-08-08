<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import {
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Input,
  InputNumber,
  Select,
  Spin,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  fetchInviteFriendRewardDetailApi,
  fetchInviteFriendRewardsApi,
} from '#/api/operationManage/invite-friend-activity';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatOperationDateTime } from '#/utils/operation-status';

import { buildUnixRangeQuery } from './activity-shared';
import {
  INVITE_REWARD_ROLE_OPTIONS,
  INVITE_REWARD_STATUS_OPTIONS,
  formatInviteRewardRole,
  formatInviteRewardStatus,
} from './activity-invite-shared';

defineOptions({ name: 'ActivityInviteRewardsPanel' });

const filterPlayerId = ref<number | null>(null);
const filterAccount = ref('');
const filterInviterId = ref<number | null>(null);
const filterInviteeId = ref<number | null>(null);
const filterRole = ref<string>();
const filterRewardStatus = ref<number>();
const filterBusinessOrderId = ref('');
const createTimeRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<Record<string, unknown> | null>(null);

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

async function openDetail(row: Record<string, unknown>) {
  detailOpen.value = true;
  detail.value = row;
  detailLoading.value = true;
  try {
    const result = await fetchInviteFriendRewardDetailApi(String(row.Id));
    detail.value = (result || row) as Record<string, unknown>;
  } catch {
    detail.value = row;
  } finally {
    detailLoading.value = false;
  }
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Id', minWidth: 80, title: 'ID' },
    { field: 'PlayerId', minWidth: 100, title: '获奖玩家ID' },
    { field: 'Account', minWidth: 130, title: '获奖账号' },
    { field: 'VipLevel', minWidth: 80, title: 'VIP' },
    {
      field: 'Role',
      formatter: ({ cellValue }) =>
        formatInviteRewardRole(String(cellValue || '')),
      minWidth: 120,
      title: '奖励角色',
    },
    { field: 'InviterId', minWidth: 100, title: '邀请人ID' },
    { field: 'InviteeId', minWidth: 100, title: '被邀请人ID' },
    {
      field: 'Amount',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 100,
      title: '奖励金额',
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
      field: 'RewardTime',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '发奖时间',
    },
    { field: 'BusinessOrderId', minWidth: 160, title: '业务单号' },
    { field: 'WalletOrderId', minWidth: 140, title: '钱包单号' },
    {
      field: 'FailReason',
      minWidth: 140,
      showOverflow: true,
      title: '失败原因',
    },
    {
      field: 'CreatedAt',
      formatter: ({ cellValue }) =>
        formatOperationDateTime(cellValue as string),
      minWidth: 160,
      title: '创建时间',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 90,
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
    <div class="mb-4 flex flex-wrap items-end gap-2">
      <InputNumber
        v-model:value="filterPlayerId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="获奖玩家ID"
        style="width: 140px"
      />
      <Input
        v-model:value="filterAccount"
        allow-clear
        placeholder="获奖账号"
        style="width: 160px"
      />
      <InputNumber
        v-model:value="filterInviterId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="邀请人ID"
        style="width: 130px"
      />
      <InputNumber
        v-model:value="filterInviteeId"
        :controls="false"
        :min="1"
        :precision="0"
        placeholder="被邀请人ID"
        style="width: 140px"
      />
      <Select
        v-model:value="filterRole"
        allow-clear
        class="w-36"
        :options="INVITE_REWARD_ROLE_OPTIONS"
        placeholder="奖励角色"
      />
      <Select
        v-model:value="filterRewardStatus"
        allow-clear
        class="w-32"
        :options="INVITE_REWARD_STATUS_OPTIONS"
        placeholder="发奖状态"
      />
      <Input
        v-model:value="filterBusinessOrderId"
        allow-clear
        placeholder="业务单号"
        style="width: 180px"
      />
      <DatePicker.RangePicker
        v-model:value="createTimeRange"
        :placeholder="['创建开始 UTC', '创建结束 UTC']"
      />
      <Button type="primary" @click="gridApi.reload()">查询</Button>
      <Button @click="resetFilters">重置</Button>
    </div>
    <div class="mb-2 text-xs text-gray-400">
      筛选时间提交为 Unix 秒；发奖状态 / 角色枚举与对接文档一致。
    </div>

    <Grid>
      <template #action="{ row }">
        <Button size="small" type="link" @click="openDetail(row)">详情</Button>
      </template>
    </Grid>

    <Drawer
      :open="detailOpen"
      title="发奖详情"
      :width="520"
      @close="detailOpen = false"
    >
      <Spin :spinning="detailLoading">
        <Descriptions v-if="detail" bordered :column="1" size="small">
          <Descriptions.Item label="记录ID">
            {{ detail.Id }}
          </Descriptions.Item>
          <Descriptions.Item label="获奖玩家ID">
            {{ detail.PlayerId }}
          </Descriptions.Item>
          <Descriptions.Item label="获奖账号">
            {{ detail.Account || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="VIP">
            {{ detail.VipLevel ?? '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="奖励角色">
            {{ formatInviteRewardRole(String(detail.Role || '')) }}
          </Descriptions.Item>
          <Descriptions.Item label="邀请人ID">
            {{ detail.InviterId }}
          </Descriptions.Item>
          <Descriptions.Item label="被邀请人ID">
            {{ detail.InviteeId }}
          </Descriptions.Item>
          <Descriptions.Item label="奖励金额">
            {{ formatAmountFromCent(detail.Amount as number) }}
          </Descriptions.Item>
          <Descriptions.Item label="流水倍数">
            {{ detail.WaterMultiple ?? '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="流水金额">
            {{ formatAmountFromCent(detail.WaterAmount as number) }}
          </Descriptions.Item>
          <Descriptions.Item label="发奖状态">
            {{ formatInviteRewardStatus(detail.RewardStatus as number) }}
          </Descriptions.Item>
          <Descriptions.Item label="发奖时间">
            {{ formatOperationDateTime(detail.RewardTime as string) }}
          </Descriptions.Item>
          <Descriptions.Item label="业务单号">
            {{ detail.BusinessOrderId || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="钱包单号">
            {{ detail.WalletOrderId || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="失败原因">
            {{ detail.FailReason || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {{ formatOperationDateTime(detail.CreatedAt as string) }}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {{ formatOperationDateTime(detail.UpdatedAt as string) }}
          </Descriptions.Item>
          <Descriptions.Item label="事件类型">
            {{ detail.EventType || '-' }}
          </Descriptions.Item>
        </Descriptions>
      </Spin>
    </Drawer>
  </div>
</template>

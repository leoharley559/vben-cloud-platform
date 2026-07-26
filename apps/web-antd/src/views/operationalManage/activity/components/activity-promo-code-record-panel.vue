<script lang="ts" setup>
import type { OperationListConfig } from '../../components/operation-list-panel.vue';

import OperationListPanel from '../../components/operation-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { fetchPromoGiftRecordApi } from '#/api/operationManage/promotion-code';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'ActivityPromoCodeRecordPanel' });

const config: OperationListConfig = {
  columns: [
    { field: 'EventId', title: '活动ID', minWidth: 90 },
    { field: 'GiftCode', title: '优惠码', minWidth: 140 },
    { field: 'LoginAccount', title: '游戏账号', minWidth: 120, slot: 'loginAccount' },
    {
      field: 'CreateTime',
      formatter: (value) => formatOperationDateTime(value as string),
      title: '使用时间',
      minWidth: 160,
    },
  ],
  // 对齐旧站：领取时间 ClaimBeginTime/ClaimEndTime；getBeforeDateStr(1)≈今天
  dateFieldKeys: { begin: 'ClaimBeginTime', end: 'ClaimEndTime' },
  datePreset: 'today',
  fetchApi: fetchPromoGiftRecordApi,
  filters: ['login', 'date'],
};
</script>

<template>
  <OperationListPanel :config="config">
    <template #loginAccount="{ row }">
      <PlayerAccountLink
        :login-account="String(row.LoginAccount || '')"
        :player-id="row.PlayerId as number | string | undefined"
      />
    </template>
  </OperationListPanel>
</template>

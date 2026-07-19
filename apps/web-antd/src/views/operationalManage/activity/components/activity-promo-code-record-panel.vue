<script lang="ts" setup>
import type { OperationListConfig } from '../../components/operation-list-panel.vue';

import OperationListPanel from '../../components/operation-list-panel.vue';
import { fetchPromoGiftRecordApi } from '#/api/operationManage/promotion-code';
import { formatOperationDateTime } from '#/utils/operation-status';

defineOptions({ name: 'ActivityPromoCodeRecordPanel' });

const config: OperationListConfig = {
  columns: [
    { field: 'EventId', title: '活动ID', minWidth: 90 },
    { field: 'GiftCode', title: '优惠码', minWidth: 140 },
    { field: 'LoginAccount', title: '游戏账号', minWidth: 120 },
    {
      field: 'CreateTime',
      formatter: (value) => formatOperationDateTime(value as string),
      title: '使用时间',
      minWidth: 160,
    },
  ],
  dateFieldKeys: { begin: 'BeginTime', end: 'EndTime' },
  fetchApi: fetchPromoGiftRecordApi,
  filters: ['login', 'date'],
};
</script>

<template>
  <OperationListPanel :config="config" />
</template>

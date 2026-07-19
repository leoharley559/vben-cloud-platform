<script lang="ts" setup>
import { fetchWithdrawAgentListApi } from '#/api/netcash/agency-account-details';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

import NetcashGridPanel from '../../components/netcash-grid-panel.vue';
import type { NetcashGridConfig } from '../../components/netcash-grid-panel.vue';

const props = defineProps<{
  adminId: string;
}>();

const config: NetcashGridConfig = {
  columns: [
    {
      field: 'CreateTime',
      formatter: (value) => formatNetcashDateTime(value as string),
      title: '申请时间',
    },
    {
      field: 'Money',
      formatter: (value) => formatAmountFromCent(Number(value)),
      title: '提款金额',
    },
    { field: 'Status', title: '状态' },
    { field: 'BankAccount', title: '收款账号' },
  ],
  extraQuery: { AdminId: props.adminId },
  fetchApi: (query) => fetchWithdrawAgentListApi(query as never),
  filters: ['date'],
};
</script>

<template>
  <NetcashGridPanel :config="config" />
</template>

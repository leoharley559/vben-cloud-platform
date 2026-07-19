<script lang="ts" setup>
import { fetchLoginInfoListApi } from '#/api/netcash/agency-account-details';
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
      title: '登录时间',
    },
    { field: 'LoginIP', title: '登录IP' },
    { field: 'LoginDevice', title: '登录设备' },
    { field: 'LoginArea', title: '登录地区' },
  ],
  extraQuery: { AdminId: props.adminId },
  fetchApi: (query) => fetchLoginInfoListApi(query as never),
  filters: ['date'],
};
</script>

<template>
  <NetcashGridPanel :config="config" />
</template>

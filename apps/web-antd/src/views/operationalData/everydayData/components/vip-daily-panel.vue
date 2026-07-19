<script lang="ts" setup>
import { fetchVipDayReportApi } from '#/api/operationalData/everyday-data';

import DimensionDailyPanel from './dimension-daily-panel.vue';

defineOptions({ name: 'VipDailyPanel' });
</script>

<template>
  <DimensionDailyPanel :fetch-api="fetchVipDayReportApi" variant="vip" />
</template>

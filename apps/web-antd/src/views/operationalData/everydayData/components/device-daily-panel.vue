<script lang="ts" setup>
import { fetchDeviceDayReportApi } from '#/api/operationalData/everyday-data';

import DimensionDailyPanel from './dimension-daily-panel.vue';

defineOptions({ name: 'DeviceDailyPanel' });
</script>

<template>
  <DimensionDailyPanel :fetch-api="fetchDeviceDayReportApi" variant="device" />
</template>

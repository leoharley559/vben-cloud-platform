<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Result, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchInvalidUserApi } from '#/api/promotion/promote-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import type { InvalidUserData } from '#/types/promotion';
import { calcPercent } from '#/utils/promotion-data';

import PromoteDataSearch from './promote-data-search.vue';

defineOptions({ name: 'InvalidUserPanel' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10888));

const loading = ref(false);
const data = ref<InvalidUserData>({
  CountDeviceNum: 0,
  CountNum0: 0,
  CountNum1: 0,
  CountNum3: 0,
  CountRegNum: 0,
});

const columns = [
  { dataIndex: 'label', key: 'label', title: '' },
  { dataIndex: 'device', key: 'device', title: '新增设备' },
  { dataIndex: 'user', key: 'user', title: '新增用户' },
  { dataIndex: 'count0', key: 'count0', title: '计数0' },
  { dataIndex: 'count1', key: 'count1', title: '计数1' },
  { dataIndex: 'count3', key: 'count3', title: '计数3' },
];

const tableData = computed(() => [
  {
    count0: data.value.CountNum0,
    count1: data.value.CountNum1,
    count3: data.value.CountNum3,
    device: data.value.CountDeviceNum,
    key: 'num',
    label: '数量',
    user: data.value.CountRegNum,
  },
  {
    count0: calcPercent(data.value.CountNum0, data.value.CountRegNum),
    count1: calcPercent(data.value.CountNum1, data.value.CountRegNum),
    count3: calcPercent(data.value.CountNum3, data.value.CountRegNum),
    device: data.value.CountDeviceNum ? '100.0%' : '0.0%',
    key: 'rate',
    label: '占比',
    user: data.value.CountRegNum ? '100.0%' : '0.0%',
  },
]);

async function handleSearch(payload: {
  AdminIds: string;
  BeginTime: string;
  ChannelIds: Array<number | string>;
  EndTime: string;
}) {
  loading.value = true;
  try {
    const result = await fetchInvalidUserApi(payload);
    if (result.Items && Object.keys(result.Items).length) {
      data.value = result.Items;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!canViewPage.value) {
    return;
  }
  handleSearch({
    AdminIds: '',
    BeginTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    ChannelIds: [],
    EndTime: dayjs().format('YYYY-MM-DD'),
  });
});
</script>

<template>
  <div v-if="canViewPage">
    <PromoteDataSearch @search="handleSearch" />
    <Table
      bordered
      :columns="columns"
      :data-source="tableData"
      :loading="loading"
      :pagination="false"
      size="small"
    />
  </div>
  <Result v-else status="403" sub-title="无无效用户查看权限" title="403" />
</template>

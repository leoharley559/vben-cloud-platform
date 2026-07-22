<script lang="ts" setup>
import type { InvalidUserData } from '#/types/promotion';

import { computed, onMounted, ref } from 'vue';

import { Result, Table } from 'ant-design-vue';

import { fetchInvalidUserApi } from '#/api/promotion/promote-data';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { calcPercent } from '#/utils/promotion-data';

import PromoteDataSearch from './promote-data-search.vue';

defineOptions({ name: 'InvalidUserPanel' });

const { checkPermission } = useCloudPermission();
const canViewPage = computed(() => checkPermission(10_888));

const searchRef = ref<InstanceType<typeof PromoteDataSearch>>();
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

const emptyData: InvalidUserData = {
  CountDeviceNum: 0,
  CountNum0: 0,
  CountNum1: 0,
  CountNum3: 0,
  CountRegNum: 0,
};

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

async function handleSearch(payload?: {
  AdminIds: Array<number | string>;
  BeginTime: string;
  ChannelIds: Array<number | string>;
  EndTime: string;
}) {
  loading.value = true;
  try {
    const query = payload || searchRef.value?.buildPayload();
    if (!query) return;
    const result = await fetchInvalidUserApi(query);
    data.value =
      result.Items && Object.keys(result.Items).length > 0
        ? result.Items
        : { ...emptyData };
  } catch {
    data.value = { ...emptyData };
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!canViewPage.value) {
    return;
  }
  void handleSearch();
});
</script>

<template>
  <div v-if="canViewPage">
    <PromoteDataSearch ref="searchRef" @search="handleSearch" />
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

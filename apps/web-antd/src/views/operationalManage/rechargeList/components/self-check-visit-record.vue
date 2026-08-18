<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';

import { Button, Radio, Result, Spin, Table } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import dayjs from 'dayjs';

import { fetchSelfReviewStatisticsListApi } from '#/api/operationManage/recharge-extra';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';

import SelfCheckVisitDetails from './self-check-visit-details.vue';

defineOptions({ name: 'SelfCheckVisitRecord' });

const { checkPermission } = useCloudPermission();

const canDetails = computed(() => checkPermission(12_266));
const canStats = computed(() => checkPermission(12_267));
const canStatsTable = computed(() => checkPermission(12_270));

const pageType = ref<'details' | 'stats'>('details');

const defaultRange = getYesterdayRangeSeconds();
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const loading = ref(false);
const deviceList = ref<Record<string, unknown>[]>([]);
const userTypeList = ref<Record<string, unknown>[]>([]);
const vipList = ref<Record<string, unknown>[]>([]);
const loadError = ref('');
const statsLoaded = ref(false);

onMounted(() => {
  if (canDetails.value) {
    pageType.value = 'details';
  } else if (canStats.value) {
    pageType.value = 'stats';
  }
});

watch(pageType, (value) => {
  if (value === 'stats' && canStats.value && !statsLoaded.value) {
    void loadStats();
  }
});

async function loadStats() {
  if (!canStats.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const [begin, end] = filterDateRange.value || [];
    const result = await fetchSelfReviewStatisticsListApi({
      BeginTime: begin ? begin.unix() : '',
      EndTime: end ? end.unix() : '',
      Group: 'Cash',
      SubGroup: 'Recharge_Appeal_Click',
    });
    deviceList.value = result?.DeviceList || [];
    userTypeList.value = result?.UserTypeList || [];
    vipList.value = result?.VipList || [];
    statsLoaded.value = true;
  } catch (error) {
    deviceList.value = [];
    userTypeList.value = [];
    vipList.value = [];
    const err = error as { message?: string; status?: number };
    loadError.value =
      err?.message ||
      (err?.status ? `接口错误 ${err.status}` : '访问统计加载失败');
  } finally {
    loading.value = false;
  }
}

const deviceColumns = [
  { align: 'center' as const, dataIndex: 'Source', title: '访问页面' },
  { align: 'center' as const, dataIndex: 'TotalVisit', title: '总访问人数' },
  { align: 'center' as const, dataIndex: 'H5Visit', title: 'H5' },
  { align: 'center' as const, dataIndex: 'AppVisit', title: 'APP' },
];

const userTypeColumns = [
  { align: 'center' as const, dataIndex: 'Source', title: '访问页面' },
  { align: 'center' as const, dataIndex: 'TotalVisit', title: '总访问人数' },
];
</script>

<template>
  <div v-if="canDetails || canStats">
    <div class="mb-3">
      <Radio.Group v-model:value="pageType" button-style="solid">
        <Radio.Button v-if="canDetails" value="details">明细</Radio.Button>
        <Radio.Button v-if="canStats" value="stats">统计</Radio.Button>
      </Radio.Group>
    </div>

    <SelfCheckVisitDetails v-if="pageType === 'details' && canDetails" />

    <div v-else-if="pageType === 'stats' && canStats">
      <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
              <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Button :loading="loading" type="primary" @click="loadStats">
          查询
        </Button>
        </div>
    </div>
  </div>

      <div v-if="loadError" class="mb-4 text-sm text-red-500">
        {{ loadError }}
      </div>

      <Spin :spinning="loading">
        <template v-if="canStatsTable">
          <div class="mb-2 font-medium">设备分布</div>
          <Table
            :columns="deviceColumns"
            :data-source="deviceList"
            :pagination="false"
            bordered
            class="mb-6"
            row-key="Source"
            size="small"
          />

          <div class="mb-2 font-medium">用户类型分布</div>
          <Table
            :columns="userTypeColumns"
            :data-source="userTypeList"
            :pagination="false"
            bordered
            class="mb-6"
            row-key="Source"
            size="small"
          />

          <div class="mb-2 font-medium">会员等级分布</div>
          <Table
            :columns="userTypeColumns"
            :data-source="vipList"
            :pagination="false"
            bordered
            row-key="Source"
            size="small"
          />
        </template>
        <Result
          v-else
          status="403"
          sub-title="需要权限 12270 才能查看访问统计表格"
          title="无权限"
        />
      </Spin>
    </div>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12266 / 12267 才能查看访问记录"
    title="无权限"
  />
</template>

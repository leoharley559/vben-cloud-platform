<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, DatePicker, Spin, Table } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchTeamQueryListApi } from '#/api/promotion/team-query';
import { formatAmountFromCent } from '#/utils/format-amount';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileTeamHistory' });

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);
const dateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(7, 'day'),
  dayjs(),
]);

const columns = [
  { dataIndex: 'AdminId', key: 'admin', title: '账号' },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(Number(record.PayMoney || 0)),
    key: 'pay',
    title: '充值',
  },
  { dataIndex: 'RegNum', key: 'reg', title: '注册' },
];

async function loadData() {
  loading.value = true;
  try {
    const [begin, end] = dateRange.value;
    const result = await fetchTeamQueryListApi({
      BeginTime: begin.startOf('day').unix(),
      EndTime: end.endOf('day').unix(),
      Page: 1,
      PageSize: 50,
    });
    list.value = (result.Items || []) as Record<string, unknown>[];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Spin :spinning="loading">
    <MobileMvpTip />
    <DatePicker.RangePicker
      v-model:value="dateRange"
      class="mb-3 w-full"
      @change="loadData"
    />
    <Card size="small">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row, index) => String(row.AdminId || index)"
        size="small"
      />
    </Card>
  </Spin>
</template>

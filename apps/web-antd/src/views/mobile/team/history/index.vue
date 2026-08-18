<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Spin, Table } from 'ant-design-vue';

import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
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
    const [begin, end] = dateRange.value || [];
    const result = await fetchTeamQueryListApi({
      BeginTime: begin ? begin.unix() : '',
      EndTime: end ? end.unix() : '',
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
    <QueryDatetimeRangePicker v-model="dateRange" />
    <Card size="small">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.AdminId ?? row.Username ?? '')"
        size="small"
      />
    </Card>
  </Spin>
</template>

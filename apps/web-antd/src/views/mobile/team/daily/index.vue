<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Spin, Table } from 'ant-design-vue';

import { fetchTeamDailyByAdminApi } from '#/api/mobile';
import { formatAmountFromCent } from '#/utils/format-amount';

import MobileMvpTip from '../../components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileTeamDaily' });

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);

const columns = [
  { dataIndex: 'AdminId', key: 'admin', title: '账号', width: 80 },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      `${Number(record.SelfReg || 0) + Number(record.NextReg || 0)}/${Number(record.SelfPayMergerNum || 0) + Number(record.NextPayMergerNum || 0)}`,
    key: 'regPay',
    title: '注册/充值',
  },
  {
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      formatAmountFromCent(
        Number(record.SelfPayMergerMoney || 0) +
          Number(record.NextPayMergerMoney || 0),
      ),
    key: 'pay',
    title: '充值金额',
  },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchTeamDailyByAdminApi({
      Page: 1,
      PageSize: 50,
    });
    list.value = result.Items || [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Spin :spinning="loading">
    <MobileMvpTip />
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

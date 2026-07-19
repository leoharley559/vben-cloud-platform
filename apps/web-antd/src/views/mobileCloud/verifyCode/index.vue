<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Spin, Table } from 'ant-design-vue';

import { fetchMobileVerifyCodeListApi } from '#/api/memberManage/mobile-verify-code';

import MobileMvpTip from '../../mobile/components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileCloudVerifyCode' });

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);

const columns = [
  { dataIndex: 'PhoneNumber', key: 'phone', title: '手机号' },
  { dataIndex: 'VerifyCode', key: 'code', title: '验证码' },
  {
    dataIndex: 'Status',
    key: 'status',
    title: '状态',
  },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchMobileVerifyCodeListApi({
      Page: 1,
      PageSize: 30,
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
    <MobileMvpTip>生成验证码、白名单管理等待下一迭代迁移。</MobileMvpTip>
    <Card size="small">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        size="small"
      />
    </Card>
  </Spin>
</template>

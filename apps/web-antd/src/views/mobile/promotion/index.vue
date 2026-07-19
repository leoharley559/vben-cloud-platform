<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Spin, Table } from 'ant-design-vue';

import { fetchMobileChannelListApi } from '#/api/mobile';

import MobileMvpTip from '../components/mobile-mvp-tip.vue';
import PromotionDetail from './detail/index.vue';
import PromotionQrCode from './qrCode/index.vue';

defineOptions({ name: 'MobilePromotionPanel' });

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);
const selected = ref<Record<string, unknown>>();

const columns = [
  { dataIndex: 'ChannelName', key: 'name', title: '渠道' },
  { dataIndex: 'PackageName', key: 'package', title: '包名' },
  { dataIndex: 'PromoteUrl', ellipsis: true, key: 'url', title: '推广链接' },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchMobileChannelListApi({ Page: 1, PageSize: 20 });
    list.value = result.Items || [];
    selected.value = list.value[0];
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Spin :spinning="loading">
    <MobileMvpTip>二维码生成、包切换等待下一迭代迁移。</MobileMvpTip>
    <Card class="mb-3" size="small" title="推广渠道">
      <Table
        :columns="columns"
        :custom-row="(record) => ({ onClick: () => (selected = record) })"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.Id)"
        size="small"
      />
    </Card>
    <PromotionQrCode v-if="selected" :channel="selected" />
    <PromotionDetail v-if="selected" :channel="selected" class="mt-3" />
  </Spin>
</template>

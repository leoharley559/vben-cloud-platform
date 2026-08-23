<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Card, Input, Spin, Table } from 'ant-design-vue';

import { fetchPlayerListApi } from '#/api/operationManage/player';
import PlayerAccountLink from '#/components/global/player-account-link.vue';

import MobileMvpTip from '../../mobile/components/mobile-mvp-tip.vue';

defineOptions({ name: 'MobileCloudMember' });

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);
const keyword = ref('');

const columns = [
  { dataIndex: 'LoginAccount', key: 'account', title: '账号' },
  { dataIndex: 'PlayerName', key: 'name', title: '昵称' },
  { dataIndex: 'VipLevel', key: 'vip', title: 'VIP', width: 60 },
  { dataIndex: 'PackageName', key: 'package', title: '包名' },
];

async function loadData() {
  loading.value = true;
  try {
    const result = await fetchPlayerListApi({
      LoginAccount: keyword.value,
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
    <MobileMvpTip>会员标签、详情弹窗等待下一迭代迁移。</MobileMvpTip>
    <Input.Search
      v-model:value="keyword"
      allow-clear
      class="mb-3"
      placeholder="游戏账号"
      @search="loadData"
    />
    <Card size="small">
      <Table
        :columns="columns"
        :data-source="list"
        :pagination="false"
        :row-key="(row) => String(row.PlayerId || row.Id)"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <PlayerAccountLink
            v-if="column.key === 'account'"
            :login-account="String(record.LoginAccount || '')"
            :player-id="record.PlayerId"
          />
        </template>
      </Table>
    </Card>
  </Spin>
</template>

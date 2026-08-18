<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Input, message, Result, Select, Space } from 'ant-design-vue';

import { fetchPlayerListApi } from '#/api/operationManage/player';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';
import PlayerStreamingPanel from '#/views/operationalManage/playerDetails/components/player-streaming.vue';

defineOptions({ name: 'MemberStreamingInformation' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewPage = computed(() => checkPermission(12936));

const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');
const playerId = ref<number | string>('');
const searched = ref(false);
const searchLoading = ref(false);

async function handleSearch() {
  const account = filterLoginAccount.value.trim();
  if (!account) {
    message.warning('请输入游戏账号');
    return;
  }
  searchLoading.value = true;
  try {
    const result = await fetchPlayerListApi({
      LoginAccount: account,
      PackageId: filterPackageId.value,
      Page: 1,
      PageSize: 1,
    });
    const player = result.Items?.[0];
    if (!player?.PlayerId) {
      playerId.value = '';
      searched.value = true;
      message.warning('未找到对应玩家');
      return;
    }
    playerId.value = player.PlayerId;
    searched.value = true;
  } finally {
    searchLoading.value = false;
  }
}

function handleReset() {
  filterLoginAccount.value = '';
  filterPackageId.value = '';
  playerId.value = '';
  searched.value = false;
}
</script>

<template>
  <Page
    v-if="canViewPage"
    auto-content-height
    description="会员管理 · 流水信息查询"
    title="流水信息"
  >
    <Card>
      <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
              <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterLoginAccount"
            allow-clear
           
            @press-enter="handleSearch"
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
        </div>
        <div class="flex flex-col gap-1">
          <Space.Compact>
            <span class="query-field-addon">产品</span>
            <Select
              v-model:value="filterPackageId"
              allow-clear
             
              :options="
                packageOptions.map((item) => ({
                  label: item.PackageName,
                  value: item.PackageId,
                }))
              "
              placeholder="请选择产品"
            />
          </Space.Compact>
        </div>
        <div class="query-filter-actions query-filter-actions-single">
          <Space>
          <Button :loading="searchLoading" type="primary" @click="handleSearch"> 查询 </Button>
          <Button @click="handleReset">重置</Button>
        </Space>
        </div>
    </div>
  </div>

      <PlayerStreamingPanel v-if="playerId" :key="String(playerId)" :player-id="playerId" />
      <Result
        v-else-if="searched"
        status="warning"
        sub-title="请检查游戏账号与产品是否正确"
        title="未找到玩家"
      />
      <Result v-else status="info" sub-title="输入游戏账号后查询流水信息" title="请先查询玩家" />
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无流水信息查看权限" title="403" />
</template>

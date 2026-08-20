<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref, watch } from 'vue';

import { Button, Input, Modal, Select, Space } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchLeaderboardRecordApi } from '#/api/operationManage/leaderboard';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPlatformStore } from '#/store/cloud-platform';

import {
  formatLeaderboardScore,
  formatLeaderboardType,
} from './leaderboard-shared';

defineOptions({ name: 'LeaderboardRankingsModal' });

const props = defineProps<{
  activityId?: number | string;
  packages?: string;
}>();

const open = defineModel<boolean>('open', { default: false });

const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>();
const filterVipLevel = ref<number | string>(-1);

const packageOptions = computed(() => {
  const allPackages =
    useCloudPlatformStore().projectConfig?.RealPackageIdNameMap || [];
  const validIds = props.packages
    ? props.packages
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const source = validIds.length > 0
    ? allPackages.filter((item) => validIds.includes(String(item.PackageId)))
    : allPackages;
  return source.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  }));
});

function buildQuery(page: { currentPage: number; pageSize: number }) {
  return {
    ActivityId: props.activityId,
    LoginAccount: filterLoginAccount.value.trim().toLowerCase(),
    PackageId: filterPackageId.value ?? '',
    Page: page.currentPage,
    PageSize: page.pageSize,
    Sort: 'Ranking',
    Status: -1,
    VipLevel: filterVipLevel.value === -1 ? '' : filterVipLevel.value,
  };
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    { field: 'Ranking', minWidth: 80, title: '排名' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'ChannelId', minWidth: 100, title: '渠道号' },
    {
      field: 'LoginAccount',
      minWidth: 120,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    {
      field: 'VipLevel',
      formatter: ({ cellValue }) =>
        cellValue === undefined || cellValue === null || cellValue === ''
          ? '-'
          : `VIP ${cellValue}`,
      minWidth: 90,
      title: 'VIP等级',
    },
    {
      field: 'ActivityType',
      formatter: ({ cellValue }) => formatLeaderboardType(cellValue),
      minWidth: 110,
      title: '活动类型',
    },
    {
      field: 'Score',
      formatter: ({ row, cellValue }) =>
        formatLeaderboardScore(
          row.ActivityType as number | string | undefined,
          cellValue as number | string | undefined,
        ),
      minWidth: 110,
      title: '排行成绩',
    },
  ],
  height: 420,
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        if (!props.activityId || !open.value) {
          return { items: [], total: 0 };
        }
        const result = await fetchLeaderboardRecordApi(buildQuery(page));
        const items = result.Items || [];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

watch(
  () => [open.value, props.activityId],
  ([visible]) => {
    if (visible && props.activityId) {
      filterPackageId.value = packageOptions.value[0]?.value;
      gridApi.reload();
    }
  },
);
</script>

<template>
  <Modal
    v-model:open="open"
    :footer="null"
    destroy-on-close
    title="当前排行"
    width="960px"
  >
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
        <Space.Compact>
          <span class="query-field-addon">产品包</span>
          <Select
            v-model:value="filterPackageId"
            allow-clear
            :options="packageOptions"
            placeholder="请选择产品包"
          />
        </Space.Compact>
        <div class="flex flex-col gap-1">
          <Input
            v-model:value="filterLoginAccount"
            allow-clear
            placeholder="请输入游戏账号"
          >
            <template #addonBefore>游戏账号</template>
          </Input>
        </div>
        <Select
          v-model:value="filterVipLevel"
          :options="[
            { label: '全部', value: -1 },
            ...Array.from({ length: 16 }, (_, level) => ({
              label: `VIP${level}`,
              value: level,
            })),
          ]"
        />
        <div class="query-filter-actions query-filter-actions-single">
          <Button type="primary" @click="gridApi.reload()">查询</Button>
        </div>
      </div>
    </div>
    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
    </Grid>
  </Modal>
</template>

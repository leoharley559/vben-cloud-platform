<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref, watch } from 'vue';

import { Radio, Result } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerAiSearchRecordApi } from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import PlayerVisitRecordPanel from './player-visit-record.vue';

defineOptions({ name: 'PlayerProblemPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();

const canViewTab = computed(() => checkPermission(11865));
const canViewSearch = computed(() => checkPermission(12730));
const canViewVisit = computed(() => checkPermission(12736));

const activeTab = ref<'search' | 'visit'>('search');

function resolveDefaultTab() {
  if (canViewSearch.value) {
    activeTab.value = 'search';
  } else if (canViewVisit.value) {
    activeTab.value = 'visit';
  }
}

function formatDateTime(value?: number | string) {
  if (!value || Number(value) === 0) {
    return '-';
  }
  const num = Number(value);
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid()
    ? parsed.format('YYYY-MM-DD HH:mm:ss')
    : String(value);
}

const gridOptions: VxeTableGridOptions<Record<string, unknown>> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) =>
        formatDateTime(cellValue as string | number),
      minWidth: 170,
      title: '创建时间',
    },
    {
      field: 'Content',
      minWidth: 240,
      showOverflow: 'tooltip',
      title: '搜索内容',
    },
    {
      field: 'PlayerName',
      minWidth: 140,
      title: '玩家账号',
    },
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchPlayerAiSearchRecordApi({
          Page: page.currentPage,
          PageSize: page.pageSize,
          PlayerId: String(props.playerId),
        });

        return {
          items: result?.Items || [],
          total: result?.Pagination?.MaxCount || 0,
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function reloadSearch() {
  if (props.playerId && canViewSearch.value && activeTab.value === 'search') {
    gridApi.reload();
  }
}

watch(
  () => props.playerId,
  () => {
    reloadSearch();
  },
);

watch(activeTab, (tab) => {
  if (tab === 'search') {
    reloadSearch();
  }
});

onMounted(() => {
  resolveDefaultTab();
  reloadSearch();
});
</script>

<template>
  <div v-if="canViewTab">
    <div class="mb-3">
      <Radio.Group v-model:value="activeTab" button-style="solid">
        <Radio.Button v-if="canViewSearch" value="search">
          搜索记录
        </Radio.Button>
        <Radio.Button v-if="canViewVisit" value="visit">
          访问记录
        </Radio.Button>
      </Radio.Group>
    </div>

    <Grid v-if="activeTab === 'search' && canViewSearch" />

    <PlayerVisitRecordPanel
      v-else-if="activeTab === 'visit' && canViewVisit"
      :player-id="playerId"
    />

    <Result
      v-else-if="!canViewSearch && !canViewVisit"
      status="403"
      sub-title="需要权限 12730 或 12736 才能查看问题纪录"
      title="无权限"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 11865 才能查看问题纪录"
    title="无权限"
  />
</template>

<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SelfReviewVisitItem } from '#/types/operation-manage';

import { computed, onMounted, ref } from 'vue';

import { Button, Input, Result } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchSelfReviewVisitListApi } from '#/api/operationManage/recharge-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import QueryDatetimeRangePicker from '#/components/global/query-datetime-range-picker.vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { getYesterdayRangeSeconds } from '#/utils/date-range';

defineOptions({ name: 'SelfCheckVisitDetails' });

const { checkPermission } = useCloudPermission();

const canViewTable = computed(() => checkPermission(12_266));

const defaultRange = getYesterdayRangeSeconds();
const filterLoginAccount = ref('');
const filterPlayerId = ref('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs.unix(defaultRange.BeginTime),
  dayjs.unix(defaultRange.EndTime),
]);
const loadError = ref('');

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

function getQueryParams() {
  const [begin, end] = filterDateRange.value || [];
  return {
    AppType: '',
    BeginTime: begin ? begin.unix() : '',
    EndTime: end ? end.unix() : '',
    Group: 'Cash',
    LoginAccount: filterLoginAccount.value,
    PlayerId: filterPlayerId.value,
    SubGroup: 'Recharge_Appeal_Click',
    VipLevel: -1,
  };
}

const gridOptions: VxeTableGridOptions<SelfReviewVisitItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '访问时间',
    },
    { field: 'LoginAccount', minWidth: 130, slots: { default: 'loginAccount' }, title: '游戏账号' },
    { field: 'PlayerId', minWidth: 120, title: '玩家ID' },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'VipLevel', minWidth: 90, title: 'VIP等级' },
    { field: 'AppType', minWidth: 120, title: '访问设备' },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        loadError.value = '';
        try {
          const result = await fetchSelfReviewVisitListApi({
            ...getQueryParams(),
            Page: page.currentPage,
            PageSize: page.pageSize,
          });
          return {
            items: result?.Items || [],
            total: result?.Pagination?.MaxCount || 0,
          };
        } catch (error) {
          const err = error as { message?: string; status?: number };
          loadError.value =
            err?.message ||
            (err?.status ? `接口错误 ${err.status}` : '访问明细加载失败');
          return { items: [], total: 0 };
        }
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });
const loading = computed(() => gridApi.grid?.loading ?? false);

onMounted(() => {
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-4">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          @press-enter="gridApi.reload()"
          placeholder="请输入游戏账号"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterPlayerId"
          allow-clear
          @press-enter="gridApi.reload()"
          placeholder="请输入玩家ID"
        >
          <template #addonBefore>玩家ID</template>
        </Input>
      </div>
      <div class="query-filter-wide">
          <QueryDatetimeRangePicker v-model="filterDateRange" />
        </div>
        <div class="query-filter-actions">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
        查询
      </Button>
        </div>
    </div>
  </div>

    <div v-if="loadError" class="mb-4 text-sm text-red-500">
      {{ loadError }}
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId"
        />
      </template>
    </Grid>
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 12266 才能查看访问记录明细"
    title="无权限"
  />
</template>

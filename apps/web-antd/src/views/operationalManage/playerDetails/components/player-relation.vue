<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PlayerRelationItem } from '#/types/player-detail';

import { computed, onMounted, ref, watch } from 'vue';

import { Button, Radio, Select, Space, Tag, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { fetchPlayerRelationListApi } from '#/api/operationManage/player-detail-extra';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatAmountFromCent } from '#/utils/format-amount';
import { formatLoginPlatform } from '#/utils/player-login';

import PlayerRelationBlacklistModal from './player-relation-blacklist-modal.vue';

defineOptions({ name: 'PlayerRelationPanel' });

const props = defineProps<{
  playerId: number | string;
}>();

const { checkPermission } = useCloudPermission();
const canBlacklistDevice = computed(() => checkPermission(12107));
const canBlacklistIp = computed(() => checkPermission(12108));

const relationType = ref<1 | 2>(1);
const filterCreateTime = ref(dayjs().startOf('day').unix());

const blacklistOpen = ref(false);
const blacklistValue = ref('');

const TIME_PRESET_OPTIONS = [
  { label: '全部', value: dayjs('1949-10-01').startOf('day').unix() },
  { label: '今天', value: dayjs().startOf('day').unix() },
  { label: '一月', value: dayjs().subtract(30, 'day').startOf('day').unix() },
  { label: '三月', value: dayjs().subtract(90, 'day').startOf('day').unix() },
  { label: '半年', value: dayjs().subtract(180, 'day').startOf('day').unix() },
  { label: '一年', value: dayjs().subtract(365, 'day').startOf('day').unix() },
];

const idColumnTitle = computed(() =>
  relationType.value === 1 ? '设备号' : 'IP 地址',
);

const canShowBlacklistAction = computed(() =>
  relationType.value === 1 ? canBlacklistDevice.value : canBlacklistIp.value,
);

function getQueryParams() {
  return {
    CreateTime: filterCreateTime.value,
    PlayerId: String(props.playerId),
    Type: relationType.value,
  };
}

const gridOptions: VxeTableGridOptions<PlayerRelationItem> = {
  columns: [
    {
      field: 'DeviceId',
      formatter: ({ row }) =>
        relationType.value === 1 ? row.DeviceId || '-' : row.Ip || '-',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '设备号',
    },
    {
      field: 'DevicePlatform',
      formatter: ({ cellValue }) =>
        formatLoginPlatform(String(cellValue || '')),
      minWidth: 120,
      title: '设备类型',
    },
    {
      field: 'PlayerCount',
      minWidth: 100,
      title: '关联玩家',
    },
    {
      field: 'SumRecharge',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '总充值',
    },
    {
      field: 'SumWithdraw',
      formatter: ({ cellValue }) => formatAmountFromCent(cellValue),
      minWidth: 110,
      title: '总提现',
    },
    {
      field: 'LoginCount',
      minWidth: 100,
      title: '登录次数',
    },
    {
      field: 'IsBlacklist',
      minWidth: 100,
      slots: { default: 'blacklist' },
      title: '黑名单',
    },
    {
      field: 'action',
      minWidth: 120,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: {
    pageSize: 20,
  },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page, sort }) => {
        const sortField = sort?.field;
        const sortOrder = sort?.order;
        let sortParam = '';
        if (sortField && sortOrder) {
          sortParam = `${sortField} ${sortOrder === 'asc' ? 'asc' : 'desc'}`;
        }

        const result = await fetchPlayerRelationListApi({
          ...getQueryParams(),
          Page: page.currentPage,
          PageSize: page.pageSize,
          Sort: sortParam,
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

const loading = computed(() => gridApi.grid?.loading ?? false);

function updateIdColumnTitle() {
  const column = gridApi.grid?.getColumnByField('DeviceId');
  if (column) {
    column.title = idColumnTitle.value;
  }
}

function handleSearch() {
  updateIdColumnTitle();
  gridApi.reload();
}

function handleReset() {
  relationType.value = 1;
  filterCreateTime.value = dayjs().startOf('day').unix();
  updateIdColumnTitle();
  gridApi.reload();
}

function handleTypeChange() {
  updateIdColumnTitle();
  gridApi.reload();
}

function openBlacklist(row: PlayerRelationItem) {
  if (Number(row.IsBlacklist) === 1) {
    message.info('已在黑名单中');
    return;
  }
  const value =
    relationType.value === 1
      ? String(row.DeviceId || '')
      : String(row.Ip || '');
  if (!value) {
    message.warning('缺少设备号/IP，无法拉黑');
    return;
  }
  blacklistValue.value = value;
  blacklistOpen.value = true;
}

watch(
  () => props.playerId,
  () => {
    if (props.playerId) {
      gridApi.reload();
    }
  },
);

onMounted(() => {
  updateIdColumnTitle();
  if (props.playerId) {
    gridApi.reload();
  }
});
</script>

<template>
  <div>
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <div class="flex flex-col gap-1">
        <Space.Compact>
          <span class="query-field-addon">时间范围</span>
          <Select
            v-model:value="filterCreateTime"
            :options="TIME_PRESET_OPTIONS"
            placeholder="请选择时间范围"
          />
        </Space.Compact>
      </div>

      <Radio.Group v-model:value="relationType" @change="handleTypeChange">
        <Radio :value="1">设备统计</Radio>
        <Radio :value="2">IP 统计</Radio>
      </Radio.Group>
        <div class="query-filter-actions query-filter-actions-single">
          <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
      </Space>
        </div>
    </div>
  </div>

    <Grid>
      <template #blacklist="{ row }">
        <Tag :color="Number(row.IsBlacklist) === 1 ? 'error' : 'default'">
          {{ Number(row.IsBlacklist) === 1 ? '已拉黑' : '未拉黑' }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <Button
          v-if="canShowBlacklistAction && Number(row.IsBlacklist) !== 1"
          size="small"
          type="link"
          @click="openBlacklist(row)"
        >
          拉黑
        </Button>
        <span v-else-if="Number(row.IsBlacklist) === 1" class="text-gray-400">
          —
        </span>
      </template>
    </Grid>

    <PlayerRelationBlacklistModal
      v-model:open="blacklistOpen"
      :relation-type="relationType"
      :risk-value="blacklistValue"
      @success="gridApi.reload()"
    />
  </div>
</template>

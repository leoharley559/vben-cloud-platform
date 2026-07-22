<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, ref, watch } from 'vue';

import { Button, Input, Modal, Select, message } from 'ant-design-vue';

import {
  deletePlayerLevelMembersApi,
  fetchPlayerLevelMembersApi,
} from '#/api/operationManage/player-level';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';

defineOptions({ name: 'PlayerLevelMembersModal' });

interface MemberRow {
  ChannelId?: number | string;
  ChannelName?: string;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId: number | string;
}

const open = defineModel<boolean>('open', { default: false });
const props = defineProps<{
  levelId?: number | string | null;
  levelName?: string;
}>();
const emit = defineEmits<{ refreshed: [] }>();

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();
const canFilter = computed(() => checkPermission(12282));

const filterLoginAccount = ref('');
const filterPlayerIdsStr = ref('');
const filterChannelIds = ref('');
const filterPackageId = ref<number | string>('');
const selectedIds = ref<Array<number | string>>([]);
const deleting = ref(false);

const packageSelectOptions = computed(() => [
  { label: '全部', value: '' },
  ...packageOptions.value.map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  })),
]);

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const loginAccount = filterLoginAccount.value
    .trim()
    .toLowerCase()
    .replaceAll(/\s/g, '');
  return {
    ChannelId: filterChannelIds.value.trim() || undefined,
    Id: props.levelId,
    LoginAccount: loginAccount || undefined,
    PackageId:
      filterPackageId.value === undefined || filterPackageId.value === null
        ? ''
        : filterPackageId.value,
    Page: page.currentPage,
    PageSize: page.pageSize,
    PlayerId: filterPlayerIdsStr.value.trim() || undefined,
  };
}

const gridOptions: VxeTableGridOptions<MemberRow> = {
  columns: [
    { type: 'checkbox', width: 48 },
    {
      field: 'LoginAccount',
      minWidth: 140,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    { field: 'ChannelName', minWidth: 120, title: '渠道名称' },
    { field: 'ChannelId', minWidth: 90, title: '渠道号' },
    { field: 'PackageName', minWidth: 140, title: '包体名称' },
  ],
  height: 420,
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        if (!props.levelId) {
          return { items: [], total: 0 };
        }
        const result = await fetchPlayerLevelMembersApi(buildQuery(page));
        const items = (result.Items || []) as unknown as MemberRow[];
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: MemberRow[] }) => {
      selectedIds.value = records.map((row) => row.PlayerId);
    },
    checkboxChange: ({ records }: { records: MemberRow[] }) => {
      selectedIds.value = records.map((row) => row.PlayerId);
    },
  },
  gridOptions,
});

function resetFilters() {
  filterLoginAccount.value = '';
  filterPlayerIdsStr.value = '';
  filterChannelIds.value = '';
  filterPackageId.value = '';
  selectedIds.value = [];
}

function handleSearch() {
  selectedIds.value = [];
  gridApi.reload();
}

function handleDelete() {
  if (!props.levelId || !selectedIds.value.length) {
    return;
  }
  Modal.confirm({
    content: '确认批量删除所选所属会员？删除后会员将回到未分层。',
    title: '提示',
    onOk: async () => {
      deleting.value = true;
      try {
        const result = (await deletePlayerLevelMembersApi({
          Id: props.levelId!,
          PlayerIdsStr: selectedIds.value.join(','),
        })) as { failCount?: number; successCount?: number };
        message.success(
          `批量删除完成：成功 ${result?.successCount ?? '-'}，失败 ${result?.failCount ?? '-'}`,
        );
        selectedIds.value = [];
        await gridApi.reload();
        emit('refreshed');
      } finally {
        deleting.value = false;
      }
    },
  });
}

watch(open, (visible) => {
  if (!visible) {
    return;
  }
  resetFilters();
  gridApi.reload();
});
</script>

<template>
  <Modal
    v-model:open="open"
    :title="`所属会员${levelName ? ` - ${levelName}` : ''}`"
    width="900px"
    :footer="null"
    destroy-on-close
  >
    <div class="mb-3 flex flex-wrap items-end gap-2">
      <Input
        v-if="canFilter"
        v-model:value="filterLoginAccount"
        allow-clear
        placeholder="游戏账号"
        style="width: 160px"
        @press-enter="handleSearch"
      />
      <Input
        v-if="canFilter"
        v-model:value="filterPlayerIdsStr"
        allow-clear
        placeholder="玩家ID（逗号分隔）"
        style="width: 180px"
        @press-enter="handleSearch"
      />
      <Input
        v-if="canFilter"
        v-model:value="filterChannelIds"
        allow-clear
        placeholder="渠道号"
        style="width: 140px"
        @press-enter="handleSearch"
      />
      <Select
        v-model:value="filterPackageId"
        style="width: 160px"
        :options="packageSelectOptions"
      />
      <Button type="primary" @click="handleSearch">查询</Button>
      <Button
        danger
        :disabled="!selectedIds.length"
        :loading="deleting"
        @click="handleDelete"
      >
        删除所选
      </Button>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          v-if="row.LoginAccount"
          :login-account="String(row.LoginAccount)"
          :player-id="row.PlayerId"
        />
        <span v-else>-</span>
      </template>
    </Grid>
  </Modal>
</template>

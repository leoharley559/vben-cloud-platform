<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  message,
  Modal,
  Pagination,
  Space,
  Table,
} from 'ant-design-vue';

import {
  fetchGameDetailPlayersApi,
  fetchSubGamePlayersApi,
} from '#/api/dataClose/game-statement';
import {
  copyTableText,
  exportRowsToXlsx,
} from '#/views/dataClose/shared/report-utils';

defineOptions({ name: 'GameStatementPlayersModal' });

const props = defineProps<{
  open: boolean;
  param: Record<string, unknown>;
  /** game = 游戏详情人数；subGame = 子游戏人数 */
  source?: 'game' | 'subGame';
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const list = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const pager = reactive({ Page: 1, PageSize: 20 });

const visible = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const columns = [
  { title: '#', customRender: ({ index }: { index: number }) => index + 1, width: 60 },
  { dataIndex: 'LoginAccount', title: '游戏账号' },
  { dataIndex: 'PlayerId', title: '玩家ID' },
  { dataIndex: 'ChannelName', title: '渠道名称' },
  { dataIndex: 'ChannelId', title: '渠道号' },
  { dataIndex: 'PackageName', title: '产品名称' },
  { dataIndex: 'InviteSite', title: '邀请站点' },
];

async function loadList(isExp = false) {
  loading.value = true;
  try {
    const query = {
      ...props.param,
      ...pager,
      IsExp: isExp,
      ...(isExp ? { Page: 1, PageSize: 100_000 } : {}),
    };
    const fetcher =
      props.source === 'subGame'
        ? fetchSubGamePlayersApi
        : fetchGameDetailPlayersApi;
    const data = await fetcher(query);
    if (isExp) {
      return data.Items || [];
    }
    list.value = data.Items || [];
    total.value = data.Pagination?.MaxCount || 0;
    return [];
  } finally {
    loading.value = false;
  }
}

async function handleExport() {
  const rows = await loadList(true);
  if (rows.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }
  await exportRowsToXlsx(
    rows,
    ['游戏账号', '玩家ID', '渠道名称', '渠道号', '产品名称', '邀请站点'],
    '投注人数',
    (row) => [
      row.LoginAccount,
      row.PlayerId,
      row.ChannelName,
      row.ChannelId,
      row.PackageName,
      row.InviteSite,
    ],
  );
}

async function handleCopy() {
  if (list.value.length === 0) {
    message.warning('暂无数据可复制');
    return;
  }
  await copyTableText(
    ['游戏账号', '玩家ID', '渠道名称', '渠道号', '产品名称', '邀请站点'],
    list.value.map((row) => [
      String(row.LoginAccount ?? ''),
      String(row.PlayerId ?? ''),
      String(row.ChannelName ?? ''),
      String(row.ChannelId ?? ''),
      String(row.PackageName ?? ''),
      String(row.InviteSite ?? ''),
    ]),
  );
  message.success('已复制');
}

watch(
  () => [props.open, props.param] as const,
  ([open]) => {
    if (!open) return;
    pager.Page = 1;
    void loadList();
  },
  { deep: true },
);
</script>

<template>
  <Modal
    v-model:open="visible"
    title="投注人数详情"
    width="900px"
    :footer="null"
    destroy-on-close
  >
    <div class="mb-3 flex justify-end">
      <Space>
        <Button @click="handleCopy">复制</Button>
        <Button type="primary" @click="handleExport">导出 Excel</Button>
      </Space>
    </div>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      bordered
      row-key="PlayerId"
      size="small"
    />
    <div class="mt-3 flex justify-end">
      <Pagination
        v-model:current="pager.Page"
        v-model:page-size="pager.PageSize"
        :total="total"
        show-size-changer
        @change="() => loadList()"
      />
    </div>
  </Modal>
</template>

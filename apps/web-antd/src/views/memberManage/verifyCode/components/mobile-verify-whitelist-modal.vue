<script lang="ts" setup>
import type { MobileVerifyWhitelistItem } from '#/types/mobile-verify-code';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
} from 'ant-design-vue';

import {
  addMobileVerifyWhitelistApi,
  deleteMobileVerifyWhitelistApi,
  fetchMobileVerifyWhitelistApi,
} from '#/api/memberManage/mobile-verify-code';
import { queryPlayerByAccountApi } from '#/api/operationManage/player';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useOperationOptions } from '#/composables/use-operation-options';

defineOptions({ name: 'MobileVerifyWhitelistModal' });

const open = defineModel<boolean>('open', { default: false });

const { packageOptions } = useOperationOptions();

const loading = ref(false);
const adding = ref(false);
const list = ref<MobileVerifyWhitelistItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const filterAccount = ref('');
const filterPackageId = ref<number | string>('');
const filterChannelId = ref('');
const addAccount = ref('');
const addPackageId = ref<number | string>('');

const packageSelectOptions = computed(() =>
  packageOptions.value.filter((item) => item.PackageId !== ''),
);

const selectedRowKeys = ref<Array<number | string>>([]);

function normalizeAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
}

function onSelectChange(keys: Array<number | string>) {
  selectedRowKeys.value = keys;
}

watch(open, (value) => {
  if (value) {
    page.value = 1;
    filterAccount.value = '';
    filterPackageId.value = '';
    filterChannelId.value = '';
    addAccount.value = '';
    addPackageId.value = packageSelectOptions.value[0]?.PackageId ?? '';
    selectedRowKeys.value = [];
    loadList();
  }
});

async function loadList() {
  loading.value = true;
  try {
    const result = await fetchMobileVerifyWhitelistApi({
      Account: normalizeAccount(filterAccount.value) || undefined,
      // 对齐旧站：无产品时不传 PackageId
      ...(filterPackageId.value === '' || filterPackageId.value === undefined
        ? {}
        : { PackageId: filterPackageId.value }),
      ...(filterChannelId.value.trim()
        ? { ChannelId: filterChannelId.value.trim() }
        : {}),
      Page: page.value,
      PageSize: pageSize.value,
    });
    list.value = result?.Items || [];
    total.value = result?.Pagination?.MaxCount || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  loadList();
}

function handleReset() {
  filterAccount.value = '';
  filterPackageId.value = '';
  filterChannelId.value = '';
  page.value = 1;
  loadList();
}

async function handleAdd() {
  if (!addAccount.value || !addPackageId.value) {
    message.warning('请填写账号并选择产品');
    return;
  }
  const pkg = packageSelectOptions.value.find(
    (item) => item.PackageId === addPackageId.value,
  );
  adding.value = true;
  try {
    const account = normalizeAccount(addAccount.value);
    const matched = await queryPlayerByAccountApi({
      LoginAccount: account,
      PackageName: pkg?.PackageName || '',
    });
    const player = matched?.Items?.[0];
    if (!player?.PlayerId) {
      message.warning('未找到玩家');
      return;
    }
    if (Number(player.DataFlag) === 1) {
      message.warning('测试账号不可操作');
      return;
    }
    await addMobileVerifyWhitelistApi({
      Account: account,
      PackageId: addPackageId.value,
      PlayerId: player.PlayerId,
    });
    message.success('添加成功');
    addAccount.value = '';
    loadList();
  } finally {
    adding.value = false;
  }
}

function handleDelete(playerId?: number | string, account?: string) {
  const isBatch = !playerId;
  const playerIds = isBatch
    ? selectedRowKeys.value.join(',')
    : String(playerId);
  if (!playerIds) {
    message.warning('请选择要删除的记录');
    return;
  }
  Modal.confirm({
    content: isBatch
      ? `确认批量删除选中的 ${selectedRowKeys.value.length} 条白名单？`
      : `确认删除账号 ${account || ''} 的白名单？`,
    title: '删除确认',
    onOk: async () => {
      await deleteMobileVerifyWhitelistApi({ PlayerIds: playerIds });
      message.success('删除成功');
      selectedRowKeys.value = [];
      loadList();
    },
  });
}

function handleTableChange(pagination: {
  current?: number;
  pageSize?: number;
}) {
  page.value = pagination.current || 1;
  pageSize.value = pagination.pageSize || 20;
  loadList();
}
</script>

<template>
  <Modal
    v-model:open="open"
    :footer="null"
    destroy-on-close
    title="手机验证码白名单"
    width="860px"
  >
    <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
            <Input
        v-model:value="filterAccount"
        allow-clear
        placeholder="请输入游戏账号"
      >
        <template #addonBefore>游戏账号</template>
      </Input>
      <Space.Compact>
        <span class="query-field-addon">所属产品</span>
        <Select
          v-model:value="filterPackageId"
          :field-names="{ label: 'PackageName', value: 'PackageId' }"
          :options="[
            { PackageId: '', PackageName: '全部' },
            ...packageSelectOptions,
          ]"
          show-search
          placeholder="请选择所属产品"
        />
      </Space.Compact>
      <Input
        v-model:value="filterChannelId"
        allow-clear
        placeholder="请输入渠道ID"
      >
        <template #addonBefore>渠道ID</template>
      </Input>
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

    <div class="mb-4 rounded border p-3">
      <div class="mb-2 font-medium">新增白名单</div>
      <div class="ops-query-scope mb-3">
    <div class="ops-query-filters">
              <Input
          v-model:value="addAccount"
          allow-clear
          placeholder="请输入游戏账号"
        />
        <Space.Compact>
          <span class="query-field-addon">所属产品</span>
          <Select
            v-model:value="addPackageId"
            :field-names="{ label: 'PackageName', value: 'PackageId' }"
            :options="packageSelectOptions"
            show-search
            placeholder="请选择所属产品"
          />
        </Space.Compact>
        <Button :loading="adding" type="primary" @click="handleAdd">
          添加
        </Button>
      
    </div>
  </div>
    </div>

    <div class="mb-2 text-right">
      <Button
        danger
        :disabled="!selectedRowKeys.length"
        @click="handleDelete()"
      >
        批量删除
      </Button>
    </div>

    <Table
      :columns="[
        { dataIndex: 'Account', key: 'account', title: '游戏账号' },
        { dataIndex: 'PackageName', key: 'package', title: '所属产品' },
        { dataIndex: 'ChannelId', key: 'channel', title: '渠道 ID' },
        { key: 'actions', title: '操作', width: 90 },
      ]"
      :data-source="list"
      :loading="loading"
      :pagination="{
        current: page,
        pageSize,
        showSizeChanger: true,
        total,
      }"
      :row-key="(row) => String(row.PlayerId)"
      :row-selection="{
        selectedRowKeys,
        onChange: onSelectChange,
      }"
      bordered
      size="small"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <PlayerAccountLink
          v-if="column.key === 'account'"
          :login-account="String(record.Account || '')"
          :player-id="record.PlayerId"
        />
        <template v-else-if="column.key === 'actions'">
          <Button
            danger
            size="small"
            type="link"
            @click="handleDelete(record.PlayerId, record.Account)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
  </Modal>
</template>

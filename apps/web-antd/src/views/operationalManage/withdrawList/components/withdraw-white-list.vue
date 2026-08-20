<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WithdrawWhiteItem } from '#/types/withdraw-extra';

import { computed, onMounted, ref } from 'vue';

import { Button, Input, message, Modal, Result, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWithdrawWhiteApi,
  fetchWithdrawWhiteListApi,
} from '#/api/operationManage/withdraw-extra';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useOperationOptions } from '#/composables/use-operation-options';

import WithdrawWhiteFormModal from './withdraw-white-form-modal.vue';

defineOptions({ name: 'WithdrawWhiteList' });

const { checkPermission } = useCloudPermission();
const { packageOptions } = useOperationOptions();

const canViewTable = computed(() => checkPermission(10_366));
const canCreate = computed(() => checkPermission(10_367));
const canEdit = computed(() => checkPermission(10_368));
const canDelete = computed(() => checkPermission(10_369));

const formOpen = ref(false);
const formMode = ref<'create' | 'update'>('create');
const formRow = ref<null | WithdrawWhiteItem>(null);

const filterLoginAccount = ref('');
const filterPackageId = ref<number | string>('');

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

const gridOptions: VxeTableGridOptions<WithdrawWhiteItem> = {
  columns: [
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '添加时间',
    },
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'PlayerId', minWidth: 100, title: '玩家ID' },
    { field: 'Username', minWidth: 120, title: '操作人员' },
    { field: 'Remark', minWidth: 160, showOverflow: 'tooltip', title: '备注' },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 90,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    autoLoad: false,
    ajax: {
      query: async ({ page }) => {
        const result = await fetchWithdrawWhiteListApi({
          LoginAccount: filterLoginAccount.value,
          PackageId: filterPackageId.value,
          Page: page.currentPage,
          PageSize: page.pageSize,
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

function openCreate() {
  formMode.value = 'create';
  formRow.value = null;
  formOpen.value = true;
}

function openEdit(row: WithdrawWhiteItem) {
  formMode.value = 'update';
  formRow.value = row;
  formOpen.value = true;
}

function handleDelete(row: WithdrawWhiteItem) {
  if (!row.Id) {
    return;
  }
  Modal.confirm({
    content: `确认删除白名单账号 ${row.LoginAccount || ''}？`,
    onOk: async () => {
      await deleteWithdrawWhiteApi(row.Id!);
      message.success('删除成功');
      gridApi.reload();
    },
    title: '删除白名单',
  });
}

onMounted(() => {
  filterPackageId.value =
    packageOptions.value.find((item) => item.PackageId)?.PackageId ?? '';
  if (canViewTable.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <div v-if="canViewTable">
    <div class="ops-query-scope mb-3">
      <div class="ops-query-filters">
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
          v-model:value="filterPackageId"
          :options="
            packageOptions
              .filter((item) => item.PackageId !== '')
              .map((item) => ({
                label: item.PackageName,
                value: item.PackageId,
              }))
          "
        />
        <div class="query-filter-actions query-filter-actions-single">
          <Button :loading="loading" type="primary" @click="gridApi.reload()">
            查询
          </Button>
        </div>
      </div>
    </div>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="row.LoginAccount"
          :player-id="row.PlayerId"
        />
      </template>
      <template #actions="{ row }">
        <Button v-if="canEdit" size="small" type="link" @click="openEdit(row)">
          编辑
        </Button>
        <Button
          v-if="canDelete"
          danger
          size="small"
          type="link"
          @click="handleDelete(row)"
        >
          删除
        </Button>
      </template>
    </Grid>

    <WithdrawWhiteFormModal
      v-model:open="formOpen"
      :mode="formMode"
      :row="formRow"
      @success="gridApi.reload()"
    />
  </div>

  <Result
    v-else
    status="403"
    sub-title="需要权限 10366 才能查看提现白名单"
    title="无权限"
  />
</template>

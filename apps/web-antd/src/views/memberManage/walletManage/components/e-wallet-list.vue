<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { EWalletListItem } from '#/types/e-wallet';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Select,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteEWalletApi,
  fetchEWalletListApi,
} from '#/api/memberManage/e-wallet';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { E_WALLET_PAY_TYPES, formatEWalletPayType } from '#/types/e-wallet';

import EWalletFormModal from './e-wallet-form-modal.vue';

defineOptions({ name: 'EWalletList' });

/** 与旧站 GoogleCode page-id=9 一致 */
const E_WALLET_SECURITY_PAGE_ID = 9;

const { checkPermission } = useCloudPermission();

const canView = computed(() => checkPermission(12945));
const canAdd = computed(() => checkPermission(12946));
const canEdit = computed(() => checkPermission(12947));
const canDelete = computed(() => checkPermission(12948));

const defaultBegin = dayjs().subtract(1, 'month').startOf('day');
const defaultEnd = dayjs().endOf('day');

const filterLoginAccount = ref('');
const filterAccountNum = ref('');
const filterPayType = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>([
  defaultBegin,
  defaultEnd,
]);

const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const editingRow = ref<EWalletListItem | null>(null);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const deletingRow = ref<EWalletListItem | null>(null);
const deleteAddBlacklist = ref(false);
const deleting = ref(false);

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

function getQueryParams(extra?: { Page?: number; PageSize?: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    AccountNum: filterAccountNum.value.trim() || undefined,
    BeginTime: begin ? begin.startOf('day').unix() : '',
    EndTime: end ? end.endOf('day').unix() : '',
    LoginAccount: filterLoginAccount.value.trim() || undefined,
    PayType: filterPayType.value === '' ? undefined : filterPayType.value,
    ...extra,
  };
}

const gridOptions: VxeTableGridOptions<EWalletListItem> = {
  columns: [
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    {
      field: 'PayType',
      formatter: ({ cellValue }) => formatEWalletPayType(Number(cellValue)),
      minWidth: 110,
      title: '钱包类型',
    },
    { field: 'Account', minWidth: 160, title: '钱包账号' },
    { field: 'Name', minWidth: 120, title: '账户名称' },
    {
      field: 'CreateTime',
      formatter: ({ cellValue }) => formatDateTime(cellValue),
      minWidth: 170,
      title: '添加时间',
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 120,
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
        const result = await fetchEWalletListApi({
          ...getQueryParams(),
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

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterLoginAccount.value = '';
  filterAccountNum.value = '';
  filterPayType.value = '';
  filterDateRange.value = [defaultBegin, defaultEnd];
  gridApi.reload();
}

function openCreate() {
  formMode.value = 'create';
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: EWalletListItem) {
  formMode.value = 'edit';
  editingRow.value = row;
  formOpen.value = true;
}

function openDelete(row: EWalletListItem) {
  deletingRow.value = row;
  deleteAddBlacklist.value = false;
  passPopupRef.value?.prompt(E_WALLET_SECURITY_PAGE_ID);
}

async function confirmDelete(extra: Record<string, unknown> = {}) {
  if (!deletingRow.value?.Id) {
    return;
  }
  deleting.value = true;
  try {
    await deleteEWalletApi(deletingRow.value.Id, {
      IsBlack: deleteAddBlacklist.value,
      ...(extra.ValidCode ? { ValidCode: String(extra.ValidCode) } : {}),
    });
    message.success('删除成功');
    deletingRow.value = null;
    gridApi.reload();
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  if (canView.value) {
    gridApi.reload();
  }
});
</script>

<template>
  <OpsListPanel v-if="canView">
    <template #filters>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="请输入"
          style="width: 240px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>游戏账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <Input
          v-model:value="filterAccountNum"
          allow-clear
          placeholder="请输入"
          style="width: 240px"
          @press-enter="handleSearch"
        >
          <template #addonBefore>钱包账号</template>
        </Input>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">钱包类型</span>
        <Select
          v-model:value="filterPayType"
          :options="[{ label: '全部', value: '' }, ...E_WALLET_PAY_TYPES]"
          style="width: 140px"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">添加时间</span>
        <DatePicker.RangePicker v-model:value="filterDateRange" />
      </div>
      <Space>
        <Button :loading="loading" type="primary" @click="handleSearch">
          查询
        </Button>
        <Button @click="handleReset">重置</Button>
        <Button v-if="canAdd" type="primary" @click="openCreate">
          新增电子钱包
        </Button>
      </Space>
    </template>

    <Grid>
      <template #loginAccount="{ row }">
        <PlayerAccountLink
          :login-account="String(row.LoginAccount || '')"
          :player-id="row.PlayerId as number | string | undefined"
        />
      </template>
      <template #actions="{ row }">
        <Space>
          <Button
            v-if="canEdit"
            size="small"
            type="link"
            @click="openEdit(row)"
          >
            编辑
          </Button>
          <Button
            v-if="canDelete"
            danger
            size="small"
            type="link"
            @click="openDelete(row)"
          >
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <EWalletFormModal
      v-model:open="formOpen"
      :mode="formMode"
      :row="editingRow"
      @success="gridApi.reload()"
    />

    <PassPopup
      ref="passPopupRef"
      prompt-msg="确认删除该电子钱包记录？"
      title="删除电子钱包"
      @confirm="confirmDelete"
    >
      <template #extra>
        <Checkbox v-model:checked="deleteAddBlacklist" class="mt-3">
          删除并加入黑名单
        </Checkbox>
      </template>
    </PassPopup>
  </OpsListPanel>
</template>

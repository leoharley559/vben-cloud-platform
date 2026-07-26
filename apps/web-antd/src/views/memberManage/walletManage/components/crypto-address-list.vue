<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CryptoAddressListItem } from '#/types/crypto-address';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Space,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteCryptoAddressApi,
  fetchCryptoAddressListApi,
} from '#/api/memberManage/crypto-address';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import OpsListPanel from '#/components/global/ops-list-panel.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import PassPopup from '#/components/security/pass-popup.vue';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { formatCryptoConfigType } from '#/types/crypto-address';

import CryptoAddressFormModal from './crypto-address-form-modal.vue';

defineOptions({ name: 'CryptoAddressList' });

/** 与旧站 GoogleCode page-id=18 一致 */
const CRYPTO_SECURITY_PAGE_ID = 18;

const { checkPermission } = useCloudPermission();

const canView = computed(() => checkPermission(11474));
const canAdd = computed(() => checkPermission(11476));
const canEdit = computed(() => checkPermission(11475));
const canDelete = computed(() => checkPermission(11477));

const filterLoginAccount = ref('');
const filterDigitalAddress = ref('');
/** 对齐旧站：首屏/重置不传日期（listQuery BeginTime/EndTime 为空） */
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs]>();

const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const editingRow = ref<CryptoAddressListItem | null>(null);
const passPopupRef = ref<InstanceType<typeof PassPopup>>();
const deletingRow = ref<CryptoAddressListItem | null>(null);
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

function normalizeLoginAccount(value: string) {
  return value.toLowerCase().replaceAll(/\s/g, '');
}

function getQueryParams(extra?: { Page?: number; PageSize?: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    // 对齐旧站首屏/重置：空日期不传 BeginTime/EndTime
    BeginTime: begin ? begin.startOf('day').unix() : undefined,
    DigitalAddress: filterDigitalAddress.value.trim() || undefined,
    EndTime: end ? end.endOf('day').unix() : undefined,
    LoginAccount: normalizeLoginAccount(filterLoginAccount.value) || undefined,
    ...extra,
  };
}

const gridOptions: VxeTableGridOptions<CryptoAddressListItem> = {
  columns: [
    {
      field: 'LoginAccount',
      minWidth: 130,
      slots: { default: 'loginAccount' },
      title: '游戏账号',
    },
    { field: 'PackageName', minWidth: 120, title: '所属产品' },
    { field: 'DigitalType', minWidth: 90, title: '币种' },
    {
      field: 'DigitalConfigType',
      formatter: ({ cellValue }) => formatCryptoConfigType(Number(cellValue)),
      minWidth: 110,
      title: '虚拟币名称',
    },
    { field: 'DigitalAddress', minWidth: 200, title: '虚拟币地址' },
    { field: 'DigitalAlias', minWidth: 120, title: '虚拟币别名' },
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
        const result = await fetchCryptoAddressListApi({
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
  filterDigitalAddress.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

function openCreate() {
  formMode.value = 'create';
  editingRow.value = null;
  formOpen.value = true;
}

function openEdit(row: CryptoAddressListItem) {
  formMode.value = 'edit';
  editingRow.value = row;
  formOpen.value = true;
}

function openDelete(row: CryptoAddressListItem) {
  deletingRow.value = row;
  deleteAddBlacklist.value = false;
  passPopupRef.value?.prompt(CRYPTO_SECURITY_PAGE_ID);
}

async function confirmDelete(extra: Record<string, unknown> = {}) {
  if (!deletingRow.value?.Id) {
    return;
  }
  deleting.value = true;
  try {
    await deleteCryptoAddressApi(deletingRow.value.Id, {
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
        <span class="text-xs text-gray-500">游戏账号</span>
        <Input
          v-model:value="filterLoginAccount"
          allow-clear
          placeholder="请输入"
          style="width: 160px"
          @press-enter="handleSearch"
        />
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-xs text-gray-500">虚拟币地址</span>
        <Input
          v-model:value="filterDigitalAddress"
          allow-clear
          placeholder="请输入"
          style="width: 200px"
          @press-enter="handleSearch"
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
          新增地址
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

    <CryptoAddressFormModal
      v-model:open="formOpen"
      :mode="formMode"
      :row="editingRow"
      @success="gridApi.reload()"
    />

    <PassPopup
      ref="passPopupRef"
      prompt-msg="确认删除该虚拟币地址？"
      title="删除虚拟币地址"
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
